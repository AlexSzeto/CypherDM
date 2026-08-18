/**
 * Per-character patch queues.
 *
 * Every write to a character goes through the queue for that character's id,
 * so writes replay in order after a dropout and one place owns the sync state
 * the save indicator renders.
 */
import { patchCharacterBatch } from '../character-api.mjs'
import { createPatchQueue } from './patch-queue.mjs'

const ACTOR_FALLBACK = 'client'

/** @type {Map<string, { queue: Object, listeners: Set<Function>, status: Object }>} */
const queues = new Map()

let onlineListenerAttached = false

/**
 * Flush every queue when the device comes back online, rather than leaving
 * each one to sit out the rest of its backoff.
 */
function attachOnlineListener() {
  if (onlineListenerAttached || typeof window === 'undefined') return
  window.addEventListener('online', () => {
    for (const entry of queues.values()) entry.queue.flushNow()
  })
  onlineListenerAttached = true
}

/**
 * Get (or create) the queue for a character.
 * @param {string} id
 * @returns {Object} the queue
 */
export function getCharacterQueue(id) {
  const existing = queues.get(id)
  if (existing) return existing.queue

  const entry = {
    queue: null,
    listeners: new Set(),
    status: { state: 'saved', pending: 0 },
  }

  entry.queue = createPatchQueue({
    // The actor travels with each batch rather than with the queue: a queue
    // may be created by whichever surface subscribes to its state first, which
    // is not necessarily the surface doing the writing.
    //
    // `patchCharacterBatch` throws a PermanentSendError on a 4xx, which is
    // the queue's signal to drop the batch rather than retry it forever.
    send: ({ clientSeq, patches, context }) =>
      patchCharacterBatch(
        id,
        patches,
        context?.actor ?? ACTOR_FALLBACK,
        clientSeq,
      ),
    onStateChange: (status) => {
      entry.status = status
      for (const listener of entry.listeners) listener(status)
    },
  })

  queues.set(id, entry)
  attachOnlineListener()
  return entry.queue
}

/**
 * Subscribe to a character's sync state.
 * @param {string} id
 * @param {(status: { state: string, pending: number }) => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeSyncState(id, listener) {
  getCharacterQueue(id)
  const entry = queues.get(id)
  entry.listeners.add(listener)
  listener(entry.status)
  return () => entry.listeners.delete(listener)
}

/**
 * @param {string} id
 * @returns {{ state: string, pending: number }} the character's current sync state
 */
export function getSyncState(id) {
  return queues.get(id)?.status ?? { state: 'saved', pending: 0 }
}

/** Drop every queue. Test-only. */
export function resetCharacterQueues() {
  queues.clear()
}
