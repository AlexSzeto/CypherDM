import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { patchCharacter } from '../character-api.mjs'
import {
  getSyncState,
  resetCharacterQueues,
  subscribeSyncState,
} from './character-queue.mjs'

/** Resolve after pending promise callbacks have run. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(() => {
  resetCharacterQueues()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options) => ({
      ok: true,
      status: 200,
      json: async () => ({
        record: { id: 'char-1', ...JSON.parse(options.body) },
      }),
      text: async () => '',
    })),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetCharacterQueues()
})

describe('character queue', () => {
  it('resolves patchCharacter with the record the server returned', async () => {
    const record = await patchCharacter(
      'char-1',
      [{ path: 'name', value: 'Sora' }],
      'harness',
    )

    expect(record.actor).toBe('harness')
    expect(record.clientSeq).toBe(1)
    expect(record.patches).toEqual([{ path: 'name', value: 'Sora' }])
  })

  it('reports saved once the write lands', async () => {
    const seen = []
    subscribeSyncState('char-1', ({ state }) => seen.push(state))

    await patchCharacter('char-1', [{ path: 'xp', value: 2 }], 'harness')
    await tick()

    expect(seen[0]).toBe('saved')
    expect(seen).toContain('saving')
    expect(getSyncState('char-1')).toEqual({ state: 'saved', pending: 0 })
  })

  it('reports notSaving with a pending count while the server is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    patchCharacter('char-1', [{ path: 'name', value: 'a' }], 'harness')
    patchCharacter('char-1', [{ path: 'xp', value: 1 }], 'harness')
    await tick()

    expect(getSyncState('char-1')).toEqual({ state: 'notSaving', pending: 2 })
  })
})
