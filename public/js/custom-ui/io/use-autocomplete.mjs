/**
 * use-autocomplete.mjs – Reusable autocomplete hook.
 *
 * Manages dropdown state (visibility, filtered items, keyboard index, position)
 * and exposes stable refs for show/close/keydown so callers can wire them into
 * `useEffect([])` closures without stale-closure issues.
 *
 * @module custom-ui/io/use-autocomplete
 */
import { useState, useRef } from 'preact/hooks'

/**
 * @param {Object}   options
 * @param {string[]} options.suggestions          – Full candidate list; hook filters internally
 * @param {Function} options.getAnchorRect        – () => DOMRect | null; used for dropdown position
 * @param {Function} options.onConfirm            – (item: string) => void; called on confirm
 * @param {number}   [options.maxResults=20]      – Cap on filtered results shown
 * @param {boolean}  [options.showEmptyOnNoResults=true]
 *   When true (default): show the "No matches" empty row when query matches nothing.
 *   When false: close the dropdown instead.
 *
 * @returns {{
 *   dropdownState: { visible: boolean, items: string[], index: number, left: number, top: number, query: string },
 *   showDropdownRef: { current: (text: string) => void },
 *   closeDropdownRef: { current: () => void },
 *   handleDropdownKeyDownRef: { current: (e: KeyboardEvent) => boolean },
 *   handleDropdownClick: (item: string) => void,
 * }}
 */
export function useAutocomplete({
  suggestions,
  getAnchorRect,
  onConfirm,
  maxResults = 20,
  showEmptyOnNoResults = true,
}) {
  const [dropdownState, setDropdownState] = useState({
    visible: false,
    items: [],
    index: -1,
    left: 0,
    top: 0,
    query: '',
  })

  // Always-current inner refs — let ref-body closures read latest props without deps
  const suggestionsRef = useRef(suggestions)
  suggestionsRef.current = suggestions

  const getAnchorRectRef = useRef(getAnchorRect)
  getAnchorRectRef.current = getAnchorRect

  const onConfirmRef = useRef(onConfirm)
  onConfirmRef.current = onConfirm

  const maxResultsRef = useRef(maxResults)
  maxResultsRef.current = maxResults

  const showEmptyOnNoResultsRef = useRef(showEmptyOnNoResults)
  showEmptyOnNoResultsRef.current = showEmptyOnNoResults

  // Mirror of dropdownState for synchronous reads inside the stable refs
  const dropdownStateRef = useRef(dropdownState)
  dropdownStateRef.current = dropdownState

  // ── Stable function refs ────────────────────────────────────────────────────

  /** closeDropdownRef.current() — hides the dropdown. */
  const closeDropdownRef = useRef(() => {
    setDropdownState((s) => ({ ...s, visible: false, items: [], index: -1 }))
  })

  /**
   * showDropdownRef.current(text) — filters suggestions against `text` and
   * opens the dropdown. If text is empty, closes instead. If no results and
   * showEmptyOnNoResults is false, closes instead.
   */
  const showDropdownRef = useRef((text) => {
    const trimmed = (text || '').trim()
    if (!trimmed) {
      closeDropdownRef.current()
      return
    }
    const lower = trimmed.toLowerCase()
    const filtered = (suggestionsRef.current || [])
      .filter((s) => s.toLowerCase().includes(lower))
      .slice(0, maxResultsRef.current)

    if (filtered.length === 0 && !showEmptyOnNoResultsRef.current) {
      closeDropdownRef.current()
      return
    }

    const rect = getAnchorRectRef.current?.() ?? null
    setDropdownState({
      visible: true,
      items: filtered,
      index: -1,
      left: rect ? rect.left : 0,
      top: rect ? rect.bottom + 2 : 0,
      query: trimmed,
    })
  })

  /**
   * handleDropdownKeyDownRef.current(e) — handles keyboard navigation.
   * Returns true when the event was consumed, false otherwise.
   *
   * | Key       | Condition                   | Action                                         |
   * |-----------|-----------------------------|------------------------------------------------|
   * | ArrowDown | dropdown visible            | preventDefault, increment index (capped)        |
   * | ArrowUp   | dropdown visible            | preventDefault, decrement index (floor 0)       |
   * | Escape    | dropdown visible            | preventDefault, close                           |
   * | Tab       | visible + items exist       | preventDefault, confirm highlighted/first item  |
   * | Enter     | visible + index >= 0        | preventDefault, confirm items[index]            |
   */
  const handleDropdownKeyDownRef = useRef((e) => {
    const ds = dropdownStateRef.current
    if (!ds.visible) return false

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setDropdownState((s) => ({
          ...s,
          index: Math.min(s.index + 1, s.items.length - 1),
        }))
        return true

      case 'ArrowUp':
        e.preventDefault()
        setDropdownState((s) => ({ ...s, index: Math.max(s.index - 1, 0) }))
        return true

      case 'Escape':
        e.preventDefault()
        closeDropdownRef.current()
        return true

      case 'Tab':
        if (ds.items.length > 0) {
          e.preventDefault()
          const item = ds.index >= 0 ? ds.items[ds.index] : ds.items[0]
          onConfirmRef.current?.(item)
          closeDropdownRef.current()
          return true
        }
        return false

      case 'Enter':
        if (ds.index >= 0) {
          e.preventDefault()
          onConfirmRef.current?.(ds.items[ds.index])
          closeDropdownRef.current()
          return true
        }
        return false

      default:
        return false
    }
  })

  // ── Dropdown item click (not via ref — can be a regular callback) ────────────

  /** handleDropdownClick(item) — confirm item and close. */
  function handleDropdownClick(item) {
    onConfirmRef.current?.(item)
    closeDropdownRef.current()
  }

  return {
    dropdownState,
    showDropdownRef,
    closeDropdownRef,
    handleDropdownKeyDownRef,
    handleDropdownClick,
  }
}
