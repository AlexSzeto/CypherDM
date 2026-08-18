import { html } from 'htm/preact'
import { fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CharacterEditor } from './character-editor.mjs'

/** A minimal but complete character record, as the API returns it. */
function makeRecord(overrides = {}) {
  return {
    id: 'char-1',
    name: 'Sora',
    color: '#888888',
    descriptor: '',
    type: '',
    focus: '',
    tier: 1,
    pools: {
      might: { max: 0, current: 0, edge: 0 },
      speed: { max: 0, current: 0, edge: 0 },
      intellect: { max: 0, current: 0, edge: 0 },
    },
    effortLimit: 1,
    xp: 0,
    recovery: { bonus: 0, used: [false, false, false, false] },
    skills: [],
    abilities: [],
    attacks: [],
    armor: { name: '', points: 0, description: '', speedPenalty: 0 },
    cypherLimit: 2,
    cyphers: [],
    equipment: [],
    currency: { amount: 0 },
    notes: '',
    advancement: {},
    createdAt: '2026-08-18T00:00:00.000Z',
    modifiedAt: '2026-08-18T00:00:00.000Z',
    ...overrides,
  }
}

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method ?? 'GET'
    const record =
      method === 'PATCH'
        ? makeRecord({ ...JSON.parse(options.body).patches[0].valueAsRecord })
        : makeRecord()
    return {
      ok: true,
      status: 200,
      json: async () => ({ record }),
      text: async () => '',
    }
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CharacterEditor', () => {
  it('renders the loaded record into its fields', async () => {
    render(html`<${CharacterEditor} id="char-1" onBack=${() => {}} />`)

    await waitFor(() => {
      expect(screen.getByLabelText('Name').value).toBe('Sora')
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/characters/char-1', {})
  })

  it('patches only the changed field when a text field is blurred', async () => {
    render(html`<${CharacterEditor} id="char-1" onBack=${() => {}} />`)
    await waitFor(() => expect(screen.getByLabelText('Name')).toBeTruthy())

    const nameInput = screen.getByLabelText('Name')
    fireEvent.input(nameInput, { target: { value: 'Vess' } })
    // Preact maps onBlur onto the focusout event, which is what a real
    // browser fires when the field loses focus.
    fireEvent.focusOut(nameInput)

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        ([, options]) => options?.method === 'PATCH',
      )
      expect(patchCall).toBeTruthy()
      const body = JSON.parse(patchCall[1].body)
      expect(body.actor).toBe('harness')
      expect(body.patches).toEqual([{ path: 'name', value: 'Vess' }])
    })
  })
})
