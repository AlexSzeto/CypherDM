import { html } from 'htm/preact'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resetCharacterQueues } from '../sync/character-queue.mjs'
import { CharacterLists } from './character-lists.mjs'

const UID = 'skill-uid-1'

/** A character record carrying one skill row. */
function makeRecord(skills = []) {
  return {
    id: 'char-1',
    skills,
    abilities: [],
    attacks: [],
    cyphers: [],
    equipment: [],
  }
}

let fetchMock

beforeEach(() => {
  resetCharacterQueues()
  fetchMock = vi.fn(async (url, options = {}) => ({
    ok: true,
    status: options.method === 'POST' ? 201 : 200,
    json: async () => ({
      record: makeRecord([
        { uid: UID, name: 'Climbing', proficiency: 'trained' },
      ]),
      item: { uid: UID, name: '', proficiency: 'trained' },
    }),
    text: async () => '',
  }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  resetCharacterQueues()
})

/** @returns {Array} the fetch calls matching a method */
function callsWithMethod(method) {
  return fetchMock.mock.calls.filter(
    ([, options]) => options?.method === method,
  )
}

describe('CharacterLists', () => {
  it('adds a row through the list endpoint rather than a record patch', async () => {
    render(
      html`<${CharacterLists} record=${makeRecord()} onRecord=${() => {}} />`,
    )

    // DynamicList's add control is an icon button in the list root; the five
    // roots render in the order declared by LISTS, so index 0 is Skills.
    const skillsList = document.querySelectorAll('.dynamic-list-root')[0]
    fireEvent.click(skillsList.querySelector('button'))

    await waitFor(() => expect(callsWithMethod('POST')).toHaveLength(1))
    const [url, options] = callsWithMethod('POST')[0]
    expect(url).toBe('/api/characters/char-1/skills')
    expect(JSON.parse(options.body).actor).toBe('harness')
  })

  it('patches a row by uid, never by index', async () => {
    render(
      html`<${CharacterLists}
        record=${makeRecord([{ uid: UID, name: 'Climbing' }])}
        onRecord=${() => {}}
      />`,
    )

    const nameInput = document.querySelector(`#row-skills-${UID}-name`)
    expect(nameInput.value).toBe('Climbing')

    fireEvent.input(nameInput, { target: { value: 'Diving' } })
    fireEvent.focusOut(nameInput)

    await waitFor(() => expect(callsWithMethod('PATCH')).toHaveLength(1))
    const [url, options] = callsWithMethod('PATCH')[0]
    expect(url).toBe(`/api/characters/char-1/skills/${UID}`)
    expect(JSON.parse(options.body).patches).toEqual([
      { path: 'name', value: 'Diving' },
    ])
  })
})
