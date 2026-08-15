/**
 * Regression test for the DynamicList identity-keying fix.
 *
 * Bug: item wrapper divs were keyed by array *index*, so when the items array
 * reordered (drag reorder, add, delete-from-middle, or a "Load" multi-select
 * that inserts new items), Preact reused the same component instance for a
 * given slot instead of the item now occupying it. Any renderItem callback
 * that seeds local edit state via `useState(item.value)` (a one-time
 * initializer) would then keep showing/saving the previous occupant's
 * unsaved state under the new item's identity.
 *
 * This test renders a DynamicList with a tiny stateful "form" component (the
 * same shape as the real bug-prone renderItem callbacks, e.g. SfxCard) and
 * verifies that inserting a new item before an existing unsaved item does not
 * bleed the unsaved item's typed content onto the new item, and that the
 * unsaved item's typed content stays attached to it.
 */
import { describe, test, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/preact'
import { useState } from 'preact/hooks'
import { html } from 'htm/preact'
import { DynamicList } from './dynamic-list.mjs'

afterEach(() => cleanup())

// Mirrors the bug-prone pattern in SfxCard/GenreCard/HandyPresetForm: local
// state seeded once from a prop via useState's lazy initializer.
function TestItemForm({ item }) {
  const [value, setValue] = useState(item.text)
  const testId = `input-${item._localId ?? item.uid}`
  return html`
    <input
      data-testid=${testId}
      value=${value}
      onInput=${(e) => setValue(e.target.value)}
    />
  `
}

describe('DynamicList identity keying', () => {
  test('typed content follows item identity, not slot position, across reorders/inserts', () => {
    const initialItems = [
      { uid: 'a', text: 'Item A' },
      { uid: 'b', text: 'Item B' },
      { _localId: 'local-c', text: '' },
    ]

    const { getByTestId, rerender } = render(html`
      <${DynamicList}
        items=${initialItems}
        renderItem=${(item) => html`<${TestItemForm} item=${item} />`}
        createItem=${() => ({})}
        onChange=${() => {}}
      />
    `)

    // Type into the unsaved item's input.
    const localCInput = getByTestId('input-local-c')
    fireEvent.input(localCInput, { target: { value: 'typed by user' } })
    expect(getByTestId('input-local-c').value).toBe('typed by user')

    // Simulate a "Load" that inserts a newly-loaded item before the unsaved one.
    const nextItems = [
      { uid: 'a', text: 'Item A' },
      { uid: 'b', text: 'Item B' },
      { uid: 'd', text: 'Item D' },
      { _localId: 'local-c', text: '' },
    ]

    rerender(html`
      <${DynamicList}
        items=${nextItems}
        renderItem=${(item) => html`<${TestItemForm} item=${item} />`}
        createItem=${() => ({})}
        onChange=${() => {}}
      />
    `)

    // The unsaved item's typed content must still be attached to it, not to
    // whatever now occupies its old array slot.
    expect(getByTestId('input-local-c').value).toBe('typed by user')

    // The newly-inserted item must show its own untouched initial value, not
    // the leftover state from the previous occupant of that slot.
    expect(getByTestId('input-d').value).toBe('Item D')

    // Sanity check: unrelated items are unaffected.
    expect(getByTestId('input-a').value).toBe('Item A')
    expect(getByTestId('input-b').value).toBe('Item B')
  })
})
