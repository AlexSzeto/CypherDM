import { html } from 'htm/preact'
import { cleanup, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { patchCharacter } from '../character-api.mjs'
import { resetCharacterQueues } from './character-queue.mjs'
import { SaveIndicator } from './save-indicator.mjs'

beforeEach(() => {
  resetCharacterQueues()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  resetCharacterQueues()
})

describe('SaveIndicator', () => {
  it('starts saved, shows saving in flight, and returns to saved', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        await gate
        return {
          ok: true,
          status: 200,
          json: async () => ({ record: { id: 'char-1' } }),
          text: async () => '',
        }
      }),
    )

    render(html`<${SaveIndicator} characterId="char-1" />`)
    expect(screen.getByRole('status').textContent).toContain('Saved')

    patchCharacter('char-1', [{ path: 'name', value: 'Sora' }], 'harness')
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain('Saving'),
    )

    release()
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain('Saved'),
    )
  })

  it('reports the pending count while the server is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    render(html`<${SaveIndicator} characterId="char-2" />`)
    patchCharacter('char-2', [{ path: 'name', value: 'a' }], 'harness')
    patchCharacter('char-2', [{ path: 'xp', value: 1 }], 'harness')

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        'Not saving — 2 changes waiting',
      ),
    )
  })
})
