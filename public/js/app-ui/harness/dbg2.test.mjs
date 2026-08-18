import { html } from 'htm/preact'
import { render, screen, waitFor } from '@testing-library/preact'
import { expect, it, vi, beforeEach } from 'vitest'
import { CharacterEditor } from './character-editor.mjs'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        record: {
          id: 'c',
          name: 'S',
          pools: { might: {}, speed: {}, intellect: {} },
          currency: {},
          notes: '',
          modifiedAt: 'x',
        },
      }),
      text: async () => '',
    })),
  )
})

it('has one back button after load', async () => {
  render(html`<${CharacterEditor} id="c" onBack=${() => {}} />`)
  await waitFor(() => expect(screen.getByLabelText('Name')).toBeTruthy())
  const backs = [...document.querySelectorAll('button')].filter((b) =>
    b.textContent.includes('Back to roster'),
  )
  console.log('back buttons:', backs.length)
  expect(backs.length).toBe(1)
})
