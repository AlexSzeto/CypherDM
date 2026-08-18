/**
 * Ordered, retrying patch queue.
 *
 * On a table network the failure that matters is a dropout, not latency: a
 * phone wanders out of range mid-session and comes back a minute later. The
 * player keeps editing throughout, so writes are held locally and replayed in
 * the order they were made — two writes to the same pool must land in the
 * order the player made them, or last-write-wins settles on the wrong value.
 *
 * The queue is transport-agnostic: it is handed a `send` function and knows
 * nothing about characters or HTTP.
 */
import { log } from '../../custom-ui/logger.mjs'

/**
 * Two contexts match when they are the same value or carry the same actor.
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
function sameContext(a, b) {
  if (a === b) return true
  return Boolean(a && b && a.actor === b.actor)
}

/** Backoff schedule in milliseconds; the last delay repeats indefinitely. */
export const DEFAULT_RETRY_DELAYS = [500, 1000, 2000, 5000, 10000, 30000]

/** @typedef {'saved'|'saving'|'notSaving'} SyncState */

/**
 * A permanent failure — the batch is bad and will never succeed. Thrown (or
 * rejected) by `send` to tell the queue to drop the batch instead of retrying.
 */
export class PermanentSendError extends Error {
  /**
   * @param {string} message
   * @param {number} [status]
   */
  constructor(message, status) {
    super(message)
    this.name = 'PermanentSendError'
    this.status = status
  }
}

/**
 * Create a FIFO patch queue.
 *
 * @param {Object} options
 * @param {(batch: { clientSeq: number, patches: Array<{path: string, value: *}> }) => Promise<*>} options.send
 *   Sends one batch. Reject with a `PermanentSendError` for a failure that
 *   retrying cannot fix; reject with anything else to have the batch retried.
 * @param {(status: { state: SyncState, pending: number }) => void} [options.onStateChange]
 * @param {number[]} [options.retryDelays]
 * @param {(fn: Function, ms: number) => *} [options.setTimeoutFn] - injectable for tests
 * @returns {Object} the queue
 */
export function createPatchQueue({
  send,
  onStateChange,
  retryDelays = DEFAULT_RETRY_DELAYS,
  setTimeoutFn = setTimeout,
}) {
  /** @type {Array<{clientSeq: number, patches: Array, resolve: Function, reject: Function, sent: boolean}>} */
  const pending = []
  let nextSeq = 1
  let inFlight = false
  let failureCount = 0
  let state = /** @type {SyncState} */ ('saved')
  let retryTimer = null

  function publish(next) {
    state = next
    onStateChange?.({ state, pending: pending.length })
  }

  function deriveIdleState() {
    if (pending.length === 0) return failureCount > 0 ? 'notSaving' : 'saved'
    return failureCount > 0 ? 'notSaving' : 'saving'
  }

  function scheduleRetry() {
    const delay =
      retryDelays[Math.min(failureCount - 1, retryDelays.length - 1)]
    retryTimer = setTimeoutFn(() => {
      retryTimer = null
      pump()
    }, delay)
  }

  async function pump() {
    if (inFlight || retryTimer !== null) return
    const entry = pending[0]
    if (!entry) {
      publish(failureCount > 0 ? 'notSaving' : 'saved')
      return
    }

    inFlight = true
    entry.sent = true
    publish(failureCount > 0 ? 'notSaving' : 'saving')

    try {
      const result = await send({
        clientSeq: entry.clientSeq,
        patches: entry.patches,
        context: entry.context,
      })
      pending.shift()
      failureCount = 0
      entry.resolve(result)
      publish(pending.length > 0 ? 'saving' : 'saved')
    } catch (error) {
      if (error instanceof PermanentSendError) {
        // A bad path or a deleted character. Retrying forever would wedge the
        // queue and the indicator would keep promising a write that can never
        // land, so the batch is dropped and the queue moves on.
        pending.shift()
        failureCount = 0
        entry.reject(error)
        log(
          'sync',
          'error',
          `Dropping unsendable patch batch: ${error.message}`,
        )
      } else {
        entry.sent = false
        failureCount += 1
        log(
          'sync',
          'warn',
          `Patch batch ${entry.clientSeq} failed (attempt ${failureCount}): ${error}`,
        )
        publish('notSaving')
        inFlight = false
        scheduleRetry()
        return
      }
    }

    inFlight = false
    pump()
  }

  return {
    /**
     * Queue patches for sending.
     *
     * Patches to a path already waiting in an un-sent batch replace that entry
     * rather than appending a second one, so holding a key down does not queue
     * fifty writes of the same field. Ordering between different paths is
     * untouched, and a batch already in flight is never mutated.
     *
     * Coalescing is confined to batches sharing the same `context`, so a write
     * made by one actor is never folded into another's.
     *
     * @param {Array<{path: string, value: *}>} patches
     * @param {*} [context] - opaque, passed through to `send`
     * @returns {Promise<*>} resolves with the send result for this batch
     */
    enqueue(patches, context = null) {
      const coalescible = (entry) =>
        !entry.sent && sameContext(entry.context, context)

      for (const entry of pending) {
        if (!coalescible(entry)) continue
        for (const patch of patches) {
          const existing = entry.patches.find((p) => p.path === patch.path)
          if (existing) existing.value = patch.value
        }
      }

      const remaining = patches.filter(
        (patch) =>
          !pending.some(
            (entry) =>
              coalescible(entry) &&
              entry.patches.some((p) => p.path === patch.path),
          ),
      )

      if (remaining.length === 0) {
        // Fully coalesced into an existing batch; resolve when that one lands.
        const carrier = pending.find(
          (entry) =>
            coalescible(entry) &&
            entry.patches.some((p) => p.path === patches[0].path),
        )
        return carrier ? carrier.promise : Promise.resolve(null)
      }

      let resolve
      let reject
      const promise = new Promise((res, rej) => {
        resolve = res
        reject = rej
      })
      const entry = {
        clientSeq: nextSeq++,
        patches: remaining,
        context,
        resolve,
        reject,
        promise,
        sent: false,
      }
      pending.push(entry)
      publish(deriveIdleState())
      pump()
      return promise
    },

    /** Abandon the current backoff wait and retry immediately. */
    flushNow() {
      if (retryTimer !== null) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      pump()
    },

    /** @returns {{ state: SyncState, pending: number }} */
    getStatus() {
      return { state, pending: pending.length }
    },
  }
}
