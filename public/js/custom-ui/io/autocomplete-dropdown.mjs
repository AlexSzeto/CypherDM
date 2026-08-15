/**
 * autocomplete-dropdown.mjs – Stateless autocomplete dropdown component.
 *
 * Renders a positioned `DropdownList` with `DropdownItem` rows (including
 * match highlighting via `MatchMark`) or a `DropdownEmpty` row when there
 * are no results. Item selection fires on `mousedown` (not `click`) so the
 * surrounding editor does not lose focus before the confirm is processed.
 *
 * @module custom-ui/io/autocomplete-dropdown
 */
import { html } from 'htm/preact'
import { useEffect } from 'preact/hooks'
import {
  DropdownList,
  DropdownItem,
  DropdownEmpty,
  MatchMark,
} from './autocomplete-dropdown-styles.mjs'

/**
 * AutocompleteDropdown – stateless dropdown driven by `dropdownState`.
 *
 * @param {Object}   props
 * @param {{ visible: boolean, items: string[], index: number, left: number, top: number, query: string }} props.dropdownState
 * @param {Function} props.onItemClick  – (item: string) => void; fired on mousedown
 */
export function AutocompleteDropdown({ dropdownState, onItemClick }) {
  const { visible, items, index, left, top, query } = dropdownState

  useEffect(() => {
    if (!visible || index < 0) return
    document
      .getElementById(`ac-dropdown-item-${index}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [visible, index])

  if (!visible) return null

  return html`
    <${DropdownList} style=${{ left: `${left}px`, top: `${top}px` }}>
      ${
        items.length === 0
          ? html`<${DropdownEmpty}>No matches</${DropdownEmpty}>`
          : items.map((item, i) => {
              const q = query
              const matchIdx = q
                ? item.toLowerCase().indexOf(q.toLowerCase())
                : -1
              const content =
                matchIdx >= 0
                  ? html`${item.slice(0, matchIdx)}<${MatchMark}>${item.slice(matchIdx, matchIdx + q.length)}</${MatchMark}>${item.slice(matchIdx + q.length)}`
                  : item
              return html`
              <${DropdownItem}
                key=${item}
                id=${`ac-dropdown-item-${i}`}
                active=${i === index}
                onMouseDown=${(e) => {
                  e.preventDefault()
                  onItemClick(item)
                }}
              >${content}</${DropdownItem}>
            `
            })
      }
    </${DropdownList}>
  `
}
