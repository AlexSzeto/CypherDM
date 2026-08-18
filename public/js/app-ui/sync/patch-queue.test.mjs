import { describe, expect, it, vi } from 'vitest'

import { createPatchQueue, PermanentSendError } from './patch-queue.mjs'

/** Run all pending microtasks. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

/**
 * A `setTimeout` replacement that records the requested delay and fires when
 * the test says so, so backoff can be exercised without real waiting.
 */
function makeManualTimer() {
  const scheduled = []
  const requested = []
  const setTimeoutFn = (fn, ms) => {
    const handle = { fn, ms }
    scheduled.push(handle)
    requested.push(ms)
    return handle
  }
  return {
    setTimeoutFn,
    delays: () => requested,
    async fireNext() {
      const next = scheduled.shift()
      next.fn()
      await tick()
    },
  }
}

describe('createPatchQueue', () => {
  it('sends batches in order with increasing client sequence numbers', async () => {
    const seen = []
    const queue = createPatchQueue({
      send: async (batch) => {
        seen.push(batch)
        return { ok: true }
      },
    })

    queue.enqueue([{ path: 'name', value: 'a' }])
    queue.enqueue([{ path: 'xp', value: 1 }])
    queue.enqueue([{ path: 'tier', value: 2 }])
    await tick()

    expect(seen.map((b) => b.clientSeq)).toEqual([1, 2, 3])
    expect(seen.map((b) => b.patches[0].path)).toEqual(['name', 'xp', 'tier'])
  })

  it('holds later patches behind a failing one and replays them in order', async () => {
    const timer = makeManualTimer()
    const attempts = []
    let failNext = true

    const queue = createPatchQueue({
      setTimeoutFn: timer.setTimeoutFn,
      send: async (batch) => {
        attempts.push(batch.patches[0].path)
        if (failNext) {
          failNext = false
          throw new Error('network down')
        }
        return { ok: true }
      },
    })

    queue.enqueue([{ path: 'name', value: 'a' }])
    queue.enqueue([{ path: 'xp', value: 1 }])
    await tick()

    // The first batch failed; the second must not have overtaken it.
    expect(attempts).toEqual(['name'])
    expect(queue.getStatus()).toEqual({ state: 'notSaving', pending: 2 })

    await timer.fireNext()
    await tick()

    expect(attempts).toEqual(['name', 'name', 'xp'])
    expect(queue.getStatus()).toEqual({ state: 'saved', pending: 0 })
  })

  it('backs off on repeated failures using the retry schedule', async () => {
    const timer = makeManualTimer()
    const queue = createPatchQueue({
      setTimeoutFn: timer.setTimeoutFn,
      retryDelays: [10, 20, 40],
      send: async () => {
        throw new Error('still down')
      },
    })

    queue.enqueue([{ path: 'name', value: 'a' }])
    await tick()
    await timer.fireNext()
    await timer.fireNext()

    expect(timer.delays().slice(0, 3)).toEqual([10, 20, 40])
  })

  it('drops a permanently rejected batch and carries on with the next', async () => {
    const seen = []
    const queue = createPatchQueue({
      send: async (batch) => {
        seen.push(batch.patches[0].path)
        if (batch.patches[0].path === 'bad') {
          throw new PermanentSendError('400 Unknown patch path', 400)
        }
        return { ok: true }
      },
    })

    const rejected = queue.enqueue([{ path: 'bad', value: 1 }])
    const accepted = queue.enqueue([{ path: 'xp', value: 2 }])

    await expect(rejected).rejects.toThrow(/Unknown patch path/)
    await expect(accepted).resolves.toEqual({ ok: true })
    expect(seen).toEqual(['bad', 'xp'])
    expect(queue.getStatus()).toEqual({ state: 'saved', pending: 0 })
  })

  it('coalesces repeated writes to the same path while they are unsent', async () => {
    const timer = makeManualTimer()
    const seen = []
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })

    const queue = createPatchQueue({
      setTimeoutFn: timer.setTimeoutFn,
      send: async (batch) => {
        seen.push(batch.patches.map((p) => `${p.path}=${p.value}`))
        await gate
        return { ok: true }
      },
    })

    // The first batch is in flight and must not be mutated; the next three
    // writes to `name` collapse into a single waiting batch.
    queue.enqueue([{ path: 'xp', value: 0 }])
    await tick()
    queue.enqueue([{ path: 'name', value: 'a' }])
    queue.enqueue([{ path: 'name', value: 'ab' }])
    queue.enqueue([{ path: 'name', value: 'abc' }])
    expect(queue.getStatus().pending).toBe(2)

    release()
    await tick()
    await tick()

    expect(seen).toEqual([['xp=0'], ['name=abc']])
  })

  it('reports saving, then notSaving, then saved across a failure and recovery', async () => {
    const timer = makeManualTimer()
    const states = []
    let failNext = true

    const queue = createPatchQueue({
      setTimeoutFn: timer.setTimeoutFn,
      onStateChange: ({ state }) => {
        if (states[states.length - 1] !== state) states.push(state)
      },
      send: async () => {
        if (failNext) {
          failNext = false
          throw new Error('network down')
        }
        return { ok: true }
      },
    })

    queue.enqueue([{ path: 'name', value: 'a' }])
    await tick()
    await timer.fireNext()

    // The queue stays `notSaving` through the retry itself: a retry in flight
    // is not evidence the write is landing, and the indicator must not soften
    // until it actually has.
    expect(states).toEqual(['saving', 'notSaving', 'saved'])
  })

  it('flushNow abandons the backoff wait and retries immediately', async () => {
    const timer = makeManualTimer()
    let attempts = 0

    const queue = createPatchQueue({
      setTimeoutFn: timer.setTimeoutFn,
      send: async () => {
        attempts += 1
        if (attempts === 1) throw new Error('network down')
        return { ok: true }
      },
    })

    queue.enqueue([{ path: 'name', value: 'a' }])
    await tick()
    expect(attempts).toBe(1)

    queue.flushNow()
    await tick()

    expect(attempts).toBe(2)
    expect(queue.getStatus().state).toBe('saved')
  })
})
