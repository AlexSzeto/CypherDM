/**
 * content-editable-pill-input.mjs – Reusable contenteditable pill input base.
 *
 * Renders a `contenteditable` div where confirmed entries become dismissible
 * pill spans. A custom autocomplete dropdown appears while the user is typing.
 * The inner contenteditable DOM is managed imperatively (via a ref) so Preact
 * re-renders never clobber the cursor position.
 *
 * @module custom-ui/io/content-editable-pill-input
 */
import { html } from 'htm/preact'
import { useEffect, useRef, useState, useContext } from 'preact/hooks'
import { styled } from '../goober-setup.mjs'
import { currentTheme } from '../theme.mjs'
import { Button } from './button.mjs'
import { TooltipContext } from '../overlays/tooltip.mjs'
import { useAutocomplete } from './use-autocomplete.mjs'
import { AutocompleteDropdown } from './autocomplete-dropdown.mjs'

// ── Styled shell (Preact-managed) ─────────────────────────────────────────────

const FormGroup = styled('div')`
  display: flex;
  flex-direction: column;
  width: 100%;
`
FormGroup.className = 'cepi-form-group'

const StyledLabel = styled('label')`
  margin-bottom: 4px;
  color: ${() => currentTheme.value.colors.text.secondary};
  font-size: ${() => currentTheme.value.typography.fontSize.medium};
  font-weight: ${() => currentTheme.value.typography.fontWeight.medium};
`
StyledLabel.className = 'cepi-label'

const EditorOuter = styled('div')`
  position: relative;
  width: 100%;
  min-height: 44px;
  padding: 6px 8px;
  border-radius: 6px;
  border: ${() => currentTheme.value.border.width}
    ${() => currentTheme.value.border.style}
    ${() => currentTheme.value.colors.border.primary};
  background-color: ${() => currentTheme.value.colors.background.tertiary};
  color: ${() => currentTheme.value.colors.text.primary};
  font-size: ${() => currentTheme.value.typography.fontSize.medium};
  font-family: ${() => currentTheme.value.typography.fontFamily};
  line-height: 1.6;
  word-break: break-word;
  cursor: text;
  box-sizing: border-box;
  transition: ${() => currentTheme.value.transitions.fast};
`
EditorOuter.className = 'cepi-editor-outer'

// ── Imperative DOM helpers (module-level, pure) ───────────────────────────────

/** Return the last child if it is a text node, else null. */
function getTrailingTextNode(container) {
  const last = container.lastChild
  return last && last.nodeType === Node.TEXT_NODE ? last : null
}

/** Ensure the container ends with a text node; return it. */
function ensureTrailingTextNode(container) {
  const last = container.lastChild
  if (last && last.nodeType === Node.TEXT_NODE) return last
  const tn = document.createTextNode('')
  container.appendChild(tn)
  return tn
}

/** Get the uncommitted trailing text (what the user is currently typing). */
function getTrailingText(container) {
  return getTrailingTextNode(container)?.textContent ?? ''
}

/** Set the trailing text node content. */
function setTrailingText(container, text) {
  ensureTrailingTextNode(container).textContent = text
}

/**
 * Extract the values array from the current DOM.
 * Pill values come from data-value; BR elements become '\n'.
 * Trailing text nodes (uncommitted input) are intentionally ignored.
 *
 * @param {HTMLElement} container
 * @returns {string[]}
 */
export function readValues(container) {
  const out = []
  for (const n of container.childNodes) {
    if (n.nodeType === Node.ELEMENT_NODE && n.hasAttribute('data-pill')) {
      out.push(n.getAttribute('data-value'))
    } else if (n.nodeName === 'BR') {
      out.push('\n')
    }
    // Text nodes = uncommitted input — excluded from the values array
  }
  return out
}

/**
 * Create an icon DOM element for use inside imperative pill buttons.
 * Uses Material Symbol (project default) or falls back to plain × text.
 *
 * @param {string} iconName – maps through the project icon map (e.g. 'x' → 'close')
 * @param {string} size     – CSS font-size (e.g. '14px')
 * @param {string} color    – CSS color value
 * @returns {HTMLElement}
 */
function createIconEl(iconName, size, color) {
  const t = currentTheme.value
  // Material Symbol names for the icons we use in pills
  const MATERIAL_MAP = { x: 'close' }
  if (
    (t.iconSystem || 'material-symbols') === 'material-symbols' &&
    MATERIAL_MAP[iconName]
  ) {
    const span = document.createElement('span')
    span.className = 'material-symbols-outlined'
    Object.assign(span.style, {
      fontSize: size,
      color,
      lineHeight: '1',
      display: 'inline-flex',
      alignItems: 'center',
      flexShrink: '0',
      userSelect: 'none',
    })
    span.textContent = MATERIAL_MAP[iconName]
    return span
  }
  // Fallback: plain × text
  const span = document.createElement('span')
  span.textContent = '×'
  Object.assign(span.style, {
    fontSize: size,
    color,
    lineHeight: '1',
    flexShrink: '0',
  })
  return span
}

/**
 * Create a pill DOM element matching the Preact `Pill` component's dismiss variant.
 * Event delegation on the container handles dismiss clicks; no per-element
 * listeners are attached here.
 *
 * @param {string}   value
 * @param {Function} [renderPill]  – (value: string) => HTMLElement | null
 * @param {boolean}  [clickable]   – show pointer cursor + hover brightness when true
 * @param {boolean}  [disabled]    – use disabled colour scheme; suppress hover/pointer
 */
function createPillElement(
  value,
  renderPill,
  clickable = false,
  disabled = false,
) {
  // Allow the caller to supply a fully custom element (e.g. template pills)
  if (renderPill) {
    const el = renderPill(value)
    if (el instanceof HTMLElement) {
      el.setAttribute('contenteditable', 'false')
      el.setAttribute('data-pill', '')
      // Respect data-value already set by renderPill (allows value transformation like {{}} expansion)
      if (!el.hasAttribute('data-value')) el.setAttribute('data-value', value)
      // handleClick delegates onPillClick to any [data-pill] body (outside
      // dismiss/slot-cycling zones), so custom-rendered pills need the same
      // pointer cursor + hover feedback plain pills get below.
      if (clickable && !disabled) {
        el.style.cursor = 'pointer'
        el.style.transition = el.style.transition
          ? `${el.style.transition}, filter ${currentTheme.value.transitions.fast}`
          : `filter ${currentTheme.value.transitions.fast}`
        el.addEventListener('mouseenter', () => {
          el.style.filter = 'brightness(1.2)'
        })
        el.addEventListener('mouseleave', () => {
          el.style.filter = ''
        })
      }
      return el
    }
  }

  const t = currentTheme.value
  // Disabled pills use muted background/text/border; active pills use primary colours.
  const bg = disabled
    ? t.colors.background.disabled
    : t.colors.primary.background
  const text = disabled ? t.colors.text.disabled : t.colors.primary.text
  const border = disabled
    ? t.colors.border.secondary
    : t.colors.primary.border || t.colors.border.primary

  // Outer container — mirrors PillContainer
  const pill = document.createElement('span')
  pill.setAttribute('contenteditable', 'false')
  pill.setAttribute('data-pill', '')
  pill.setAttribute('data-value', value)
  Object.assign(pill.style, {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '24px',
    borderRadius: '9999px',
    overflow: 'hidden',
    border: `1px solid ${border}`,
    backgroundColor: bg,
    fontSize: t.typography.fontSize.small,
    fontFamily: t.typography.fontFamily,
    fontWeight: t.typography.fontWeight.medium,
    userSelect: 'none',
    verticalAlign: 'middle',
    margin: '2px 2px',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    lineHeight: '1',
    flexShrink: '0',
  })

  // Dismiss button — mirrors PillIconBtn (transparent bg, rounded hover glow, × on the LEFT)
  const dismissBtn = document.createElement('button')
  dismissBtn.setAttribute('data-pill-dismiss', '')
  dismissBtn.setAttribute('type', 'button')
  dismissBtn.setAttribute('tabindex', '-1')
  dismissBtn.setAttribute('contenteditable', 'false')
  Object.assign(dismissBtn.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px',
    marginLeft: '4px',
    border: 'none',
    borderRadius: '9999px',
    backgroundColor: 'transparent',
    color: text,
    cursor: disabled ? 'default' : 'pointer',
    lineHeight: '1',
    transition: disabled ? undefined : `background-color ${t.transitions.fast}`,
    flexShrink: '0',
  })
  if (!disabled) {
    dismissBtn.addEventListener('mouseenter', () => {
      dismissBtn.style.backgroundColor = 'rgba(255,255,255,0.22)'
    })
    dismissBtn.addEventListener('mouseleave', () => {
      dismissBtn.style.backgroundColor = 'transparent'
    })
  }
  dismissBtn.appendChild(createIconEl('x', '14px', text))

  // Content area — mirrors PillContentArea (transparent bg, left pad reduced since dismiss is left)
  const contentArea = document.createElement('span')
  Object.assign(contentArea.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '0 8px 0 4px',
    backgroundColor: 'transparent',
    color: text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  })
  contentArea.textContent = value

  if (clickable && !disabled) {
    pill.style.cursor = 'pointer'
    pill.style.transition = `filter ${t.transitions.fast}`
    pill.addEventListener('mouseenter', () => {
      pill.style.filter = 'brightness(1.2)'
    })
    pill.addEventListener('mouseleave', () => {
      pill.style.filter = ''
    })
  }

  pill.appendChild(dismissBtn)
  pill.appendChild(contentArea)
  return pill
}

/**
 * Rebuild the contenteditable content entirely from a values array.
 * A text node is placed before every pill/BR and at the end so the caret
 * can be positioned anywhere between elements, not just at the tail.
 */
function buildDOM(
  container,
  values,
  renderPill,
  clickable = false,
  disabled = false,
) {
  container.innerHTML = ''
  container.appendChild(document.createTextNode(''))
  for (const v of values) {
    if (v === '\n') {
      container.appendChild(document.createElement('br'))
    } else {
      container.appendChild(
        createPillElement(v, renderPill, clickable, disabled),
      )
    }
    container.appendChild(document.createTextNode(''))
  }
}

/** Move the caret to the end of the container. */
function moveCursorToEnd(container) {
  try {
    const range = document.createRange()
    range.selectNodeContents(container)
    range.collapse(false)
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }
  } catch {
    /* non-browser env (vitest/jsdom) */
  }
}

/** Get the bounding rect of the current caret (for dropdown positioning). */
function getCaretRect() {
  try {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    return sel.getRangeAt(0).getBoundingClientRect()
  } catch {
    return null
  }
}

/**
 * Return the text node the caret is in (or adjacent to), as long as it is a
 * direct child of container.
 *
 * Two representations of "cursor between pills" are normalised here:
 *   a) startContainer is the text node itself (startOffset is the char position)
 *   b) startContainer is `container` at some child-index (cursor between two
 *      contenteditable=false siblings) — we resolve to the nearest child text node
 */
function getCaretTextNode(container) {
  try {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const { startContainer, startOffset } = sel.getRangeAt(0)
    if (
      startContainer.nodeType === Node.TEXT_NODE &&
      startContainer.parentNode === container
    ) {
      return startContainer
    }
    if (startContainer === container) {
      // Cursor is between childNodes[startOffset-1] and childNodes[startOffset].
      // Prefer the text node immediately before the cursor; fall back to the one after.
      const before = container.childNodes[startOffset - 1]
      if (before?.nodeType === Node.TEXT_NODE) return before
      const after = container.childNodes[startOffset]
      if (after?.nodeType === Node.TEXT_NODE) return after
    }
    return null
  } catch {
    return null
  }
}

/**
 * Return the sibling node immediately after the caret — but only when the
 * caret is at the end of a text node (i.e. forward-delete would skip to the next node).
 * Returns null when the cursor is mid-text or state is unavailable.
 */
function getNodeAfterCaret(container) {
  try {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0)
    if (!range.collapsed) return null
    const { startContainer, startOffset } = range
    if (startContainer.nodeType === Node.TEXT_NODE) {
      return startOffset === startContainer.textContent.length
        ? startContainer.nextSibling || null
        : null
    }
    if (startContainer === container) {
      return container.childNodes[startOffset] || null
    }
    return null
  } catch {
    return null
  }
}

/**
 * Return the sibling node immediately before the caret — but only when the
 * caret is at offset 0 of a text node (i.e. normal backspace would do nothing).
 * Returns null when the cursor is mid-text or state is unavailable.
 */
function getNodeBeforeCaret(container) {
  try {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0)
    if (!range.collapsed) return null
    const { startContainer, startOffset } = range
    if (startContainer.nodeType === Node.TEXT_NODE) {
      return startOffset === 0 ? startContainer.previousSibling || null : null
    }
    if (startContainer === container) {
      return startOffset > 0
        ? container.childNodes[startOffset - 1] || null
        : null
    }
    return null
  } catch {
    return null
  }
}

/** Place the caret at a specific offset within a node. */
function setCursorAt(node, offset) {
  try {
    const range = document.createRange()
    range.setStart(node, offset)
    range.collapse(true)
    const sel = window.getSelection()
    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }
  } catch {
    /* jsdom */
  }
}

/** Move the caret to the end of a text node. */
function moveCursorToEndOf(node) {
  try {
    setCursorAt(
      node,
      node.nodeType === Node.TEXT_NODE ? node.textContent.length : 0,
    )
  } catch {
    /* jsdom */
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * ContentEditablePillInput – contenteditable pill editor with autocomplete.
 *
 * @param {Object}    props
 * @param {string[]}  props.values             – Controlled pill array; '\n' encodes a line break
 * @param {Function}  props.onValuesChange     – (values: string[]) => void
 * @param {string[]}  [props.suggestions=[]]   – Autocomplete candidates
 * @param {string}    [props.label]            – Label text above the editor
 * @param {string}    [props.placeholder='']   – Hint when the editor is empty
 * @param {boolean}   [props.disabled=false]
 * @param {boolean}   [props.multiline=false]  – Enter inserts a '\n' line break
 * @param {number}    [props.fixedHeight]      – Fixed height in px; enables scroll overflow
 * @param {number}    [props.minHeight]        – Min-height in px for the outer shell; ignored when fixedHeight is set
 * @param {Function}  [props.renderPill]       – (value: string) => HTMLElement | null
 * @param {Function}  [props.onContainerReady] – (el: HTMLElement) => void  fired after mount
 * @param {Function}  [props.onPillClick]      – (value: string) => void; fires when pill body is clicked (not dismiss/slot)
 * @param {Function}  [props.getPillTooltip]   – (value: string) => string | null; returns tooltip text for a pill on hover
 * @param {Object}    [props.buttonProps]          – optional icon button rendered top-right inside the editor
 *   { icon: string, color?: string, disabled?: boolean, onClick: () => void, title?: string, loading?: boolean }
 * @param {Object}    [props.secondaryButtonProps] – optional second icon button at top: 40px; right: 4px (same shape as buttonProps)
 *
 * @example
 * <${ContentEditablePillInput}
 *   label="Tags"
 *   values=${myTags}
 *   onValuesChange=${setMyTags}
 *   suggestions=${allTags}
 *   placeholder="Type to add tags..."
 *   multiline
 * />
 */
export function ContentEditablePillInput({
  values = [],
  onValuesChange,
  suggestions = [],
  label,
  placeholder = '',
  disabled = false,
  multiline = false,
  fixedHeight,
  minHeight,
  renderPill,
  onContainerReady,
  onPillClick,
  getPillTooltip,
  buttonProps,
  secondaryButtonProps,
  ...rest
}) {
  const containerRef = useRef(null)
  const isFocusedRef = useRef(false)

  // Always-current refs — safe to read from inside the `useEffect([])` closure
  const onValuesChangeRef = useRef(onValuesChange)
  const suggestionsRef = useRef(suggestions)
  const renderPillRef = useRef(renderPill)
  const disabledRef = useRef(disabled)
  const multilineRef = useRef(multiline)
  const onPillClickRef = useRef(onPillClick)
  onValuesChangeRef.current = onValuesChange
  suggestionsRef.current = suggestions
  renderPillRef.current = renderPill
  disabledRef.current = disabled
  multilineRef.current = multiline
  onPillClickRef.current = onPillClick

  const tooltipCtx = useContext(TooltipContext)
  const tooltipCtxRef = useRef(null)
  const getPillTooltipRef = useRef(getPillTooltip)
  tooltipCtxRef.current = tooltipCtx
  getPillTooltipRef.current = getPillTooltip

  // Placeholder visibility
  const [showPlaceholder, setShowPlaceholder] = useState(values.length === 0)
  const setShowPlaceholderRef = useRef(setShowPlaceholder)
  setShowPlaceholderRef.current = setShowPlaceholder

  // Bridge: set inside useEffect([]) so the hook's onConfirm callback can call
  // the imperative confirmText + caret repositioning logic.
  const onConfirmRef = useRef(null)

  const {
    dropdownState,
    showDropdownRef,
    closeDropdownRef,
    handleDropdownKeyDownRef,
    handleDropdownClick,
  } = useAutocomplete({
    suggestions,
    getAnchorRect: getCaretRect,
    onConfirm: (item) => onConfirmRef.current?.(item),
    maxResults: 20,
    showEmptyOnNoResults: true,
  })

  // ── Mount: build initial DOM + wire all imperative event listeners ──────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    buildDOM(
      container,
      values,
      renderPillRef.current,
      !!onPillClickRef.current,
      disabledRef.current,
    )
    setShowPlaceholderRef.current(values.length === 0)
    if (onContainerReady) onContainerReady(container)

    // ── Internal scoped helpers ──

    function updatePlaceholder() {
      const hasPills = [...container.childNodes].some(
        (n) => n.nodeType === Node.ELEMENT_NODE && n.hasAttribute('data-pill'),
      )
      const hasText = [...container.childNodes].some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0,
      )
      setShowPlaceholderRef.current(!hasPills && !hasText)
    }

    function confirmText(text, textNode) {
      const trimmed = text.trim()
      if (!trimmed) return false
      const activeNode = textNode || getTrailingTextNode(container)
      if (!activeNode || activeNode.parentNode !== container) return false
      const pill = createPillElement(
        trimmed,
        renderPillRef.current,
        !!onPillClickRef.current,
        disabledRef.current,
      )
      // Ensure a text node exists before the new pill for cursor positioning
      if (
        !activeNode.previousSibling ||
        activeNode.previousSibling.nodeType !== Node.TEXT_NODE
      ) {
        container.insertBefore(document.createTextNode(''), activeNode)
      }
      container.insertBefore(pill, activeNode)
      activeNode.textContent = ''
      closeDropdownRef.current()
      onValuesChangeRef.current?.(readValues(container))
      updatePlaceholder()
      return true
    }

    // Wire the hook's onConfirm callback to the imperative confirm + caret logic
    onConfirmRef.current = (item) => {
      const caretNode = getCaretTextNode(container)
      confirmText(item, caretNode || undefined)
      const curr = caretNode || getTrailingTextNode(container)
      if (curr) moveCursorToEndOf(curr)
      container.focus()
    }

    // ── DOM event handlers ──

    function handleInput() {
      if (disabledRef.current) return
      const caretNode = getCaretTextNode(container)
      const text = caretNode
        ? caretNode.textContent
        : getTrailingText(container)

      // Auto-confirm when the user types a comma
      const commaIdx = text.indexOf(',')
      if (commaIdx !== -1) {
        const before = text.slice(0, commaIdx)
        const after = text.slice(commaIdx + 1).replace(/^\s+/, '')
        const activeNode = caretNode || getTrailingTextNode(container)
        if (before.trim()) confirmText(before, activeNode)
        // confirmText cleared activeNode; put the post-comma text back in it
        if (activeNode) activeNode.textContent = after
        if (activeNode) {
          if (after) moveCursorToEndOf(activeNode)
          else setCursorAt(activeNode, 0)
        }
        showDropdownRef.current(after)
        return
      }

      showDropdownRef.current(text)
      updatePlaceholder()
    }

    function handleKeyDown(e) {
      if (disabledRef.current) return
      // Delegate to the autocomplete hook first; if it handles the key, stop here.
      if (handleDropdownKeyDownRef.current(e)) return

      const ds = dropdownState

      switch (e.key) {
        case 'Tab': {
          e.preventDefault()
          const caretNode = getCaretTextNode(container)
          const text = caretNode
            ? caretNode.textContent
            : getTrailingText(container)
          // Tab: prefer highlighted dropdown item → first dropdown item → verbatim text
          const target =
            ds.visible && ds.items.length > 0 && ds.index >= 0
              ? ds.items[ds.index]
              : ds.visible && ds.items.length > 0
                ? ds.items[0]
                : text
          if (target.trim()) {
            confirmText(target, caretNode || undefined)
            const curr = caretNode || getTrailingTextNode(container)
            if (curr) moveCursorToEndOf(curr)
          }
          break
        }

        case 'Enter': {
          e.preventDefault()
          if (multilineRef.current) {
            const caretNode = getCaretTextNode(container)
            if (caretNode) {
              // Split the text node at the cursor and insert a BR between the two halves.
              // When the browser represents the position as container-level offset (common
              // between contenteditable=false pills), the cursor is logically at the end of
              // the resolved text node, so fall back to its full length.
              const offset = (() => {
                try {
                  const range = window.getSelection().getRangeAt(0)
                  return range.startContainer === caretNode
                    ? range.startOffset
                    : caretNode.textContent.length
                } catch {
                  return 0
                }
              })()
              const afterText = caretNode.textContent.slice(offset)
              caretNode.textContent = caretNode.textContent.slice(0, offset)
              const br = document.createElement('br')
              const newTextNode = document.createTextNode(afterText)
              caretNode.parentNode.insertBefore(br, caretNode.nextSibling)
              caretNode.parentNode.insertBefore(newTextNode, br.nextSibling)
              setCursorAt(newTextNode, 0)
            } else {
              const trailing = ensureTrailingTextNode(container)
              container.insertBefore(document.createElement('br'), trailing)
              setCursorAt(trailing, 0)
            }
            closeDropdownRef.current()
            onValuesChangeRef.current?.(readValues(container))
          } else if (ds.visible && ds.index >= 0) {
            // Non-multiline: Enter selects the highlighted dropdown item
            const caretNode = getCaretTextNode(container)
            confirmText(ds.items[ds.index], caretNode || undefined)
            const curr = caretNode || getTrailingTextNode(container)
            if (curr) moveCursorToEndOf(curr)
          }
          break
        }

        case 'ArrowDown':
          if (ds.visible) {
            e.preventDefault()
            // handled by hook when dropdown is visible; fallback for safety
          }
          break

        case 'ArrowUp':
          if (ds.visible) {
            e.preventDefault()
            // handled by hook when dropdown is visible; fallback for safety
          }
          break

        case 'Escape':
          if (ds.visible) {
            e.preventDefault()
            closeDropdownRef.current()
          }
          break

        case 'Backspace': {
          // Walk backwards past empty structural text nodes to find the nearest pill or BR.
          // If the cursor is mid-text (offset > 0), getNodeBeforeCaret returns null and
          // the browser handles normal character deletion without interference.
          let before = getNodeBeforeCaret(container)
          while (
            before &&
            before.nodeType === Node.TEXT_NODE &&
            !before.textContent
          ) {
            before = before.previousSibling
          }
          if (
            before &&
            (before.hasAttribute?.('data-pill') || before.nodeName === 'BR')
          ) {
            e.preventDefault()
            container.removeChild(before)
            onValuesChangeRef.current?.(readValues(container))
            updatePlaceholder()
          }
          break
        }

        case 'Delete': {
          // When the cursor is at the end of a line and the next meaningful node is a BR,
          // erase only the BR (joining the two lines) rather than letting the browser
          // consume the first pill of the next line. If the next node is regular text,
          // fall through to default browser forward-delete.
          let after = getNodeAfterCaret(container)
          while (
            after &&
            after.nodeType === Node.TEXT_NODE &&
            !after.textContent
          ) {
            after = after.nextSibling
          }
          if (after && after.nodeName === 'BR') {
            e.preventDefault()
            container.removeChild(after)
            onValuesChangeRef.current?.(readValues(container))
            updatePlaceholder()
          }
          // Otherwise let the browser delete the next character normally.
          break
        }
      }
    }

    function handleMouseDown(e) {
      // Dismiss pill via event delegation (mousedown so focus doesn't shift first)
      const dismissBtn = e.target.closest?.('[data-pill-dismiss]')
      if (dismissBtn && !disabledRef.current) {
        e.preventDefault()
        const pill = dismissBtn.closest('[data-pill]')
        if (pill && pill.parentNode === container) {
          container.removeChild(pill)
          ensureTrailingTextNode(container)
          moveCursorToEnd(container)
          onValuesChangeRef.current?.(readValues(container))
          updatePlaceholder()
        }
      }
    }

    function handleClick(e) {
      if (!onPillClickRef.current) return
      if (e.ctrlKey || e.metaKey) return
      const pillEl = e.target.closest?.('[data-pill]')
      if (!pillEl) return
      if (e.target.closest?.('[data-pill-dismiss]')) return
      if (e.target.closest?.('[data-slot-cycling]')) return
      onPillClickRef.current(pillEl.getAttribute('data-value') ?? '')
    }

    function handleFocus() {
      isFocusedRef.current = true
      setShowPlaceholderRef.current(false)
    }

    function handleBlur() {
      isFocusedRef.current = false
      // Confirm any uncommitted text in any text node (left to right)
      for (const n of [...container.childNodes]) {
        if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) {
          confirmText(n.textContent.trim(), n)
        }
      }
      closeDropdownRef.current()
      updatePlaceholder()
    }

    function handlePaste(e) {
      if (disabledRef.current) return
      e.preventDefault()
      const text =
        (e.clipboardData || window.clipboardData)?.getData('text/plain') ?? ''
      if (!text) return
      const caretNode = getCaretTextNode(container)
      const activeNode = caretNode || getTrailingTextNode(container)
      // Split on comma/newline; all-but-last become pills at the caret position
      const parts = text
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
      if (parts.length === 0) return
      for (let i = 0; i < parts.length - 1; i++)
        confirmText(parts[i], activeNode)
      const last = parts[parts.length - 1]
      if (last && activeNode) {
        activeNode.textContent = last
        moveCursorToEndOf(activeNode)
        showDropdownRef.current(last)
      }
    }

    // Every path must end in an explicit show or hide: mouseleave does not
    // bubble and is bound to the container, so moving pill→pill (or onto the
    // gap between pills) fires no leave event. A bare early return would leave
    // the previous pill's tooltip on screen, misattributed to the pill now
    // under the cursor.
    function handlePillMouseOver(e) {
      const pill = e.target.closest?.('[data-pill]')
      if (!pill) {
        tooltipCtxRef.current?.hide()
        return
      }
      const val = pill.getAttribute('data-value')
      const text = getPillTooltipRef.current?.(val)
      if (text) tooltipCtxRef.current?.show(text, e.clientX, e.clientY, pill)
      else tooltipCtxRef.current?.hide()
    }

    function handlePillMouseLeave() {
      tooltipCtxRef.current?.hide()
    }

    container.addEventListener('input', handleInput)
    container.addEventListener('keydown', handleKeyDown)
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('click', handleClick)
    container.addEventListener('focus', handleFocus)
    container.addEventListener('blur', handleBlur)
    container.addEventListener('paste', handlePaste)
    container.addEventListener('mouseover', handlePillMouseOver)
    container.addEventListener('mouseleave', handlePillMouseLeave)

    return () => {
      container.removeEventListener('input', handleInput)
      container.removeEventListener('keydown', handleKeyDown)
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('click', handleClick)
      container.removeEventListener('focus', handleFocus)
      container.removeEventListener('blur', handleBlur)
      container.removeEventListener('paste', handlePaste)
      container.removeEventListener('mouseover', handlePillMouseOver)
      container.removeEventListener('mouseleave', handlePillMouseLeave)
    }
  }, []) // intentional: mount/unmount only

  // ── Sync values prop → DOM when not focused ────────────────────────────────
  const lastSyncedRef = useRef(null)
  useEffect(() => {
    const container = containerRef.current
    if (!container || isFocusedRef.current) return
    if (JSON.stringify(values) === JSON.stringify(lastSyncedRef.current)) return
    lastSyncedRef.current = [...values]
    buildDOM(
      container,
      values,
      renderPillRef.current,
      !!onPillClickRef.current,
      disabledRef.current,
    )
    setShowPlaceholder(values.length === 0)
  }, [values]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────
  const t = currentTheme.value
  const outerStyle = {
    ...(fixedHeight != null
      ? {
          height: `${fixedHeight}px`,
          minHeight: `${fixedHeight}px`,
          maxHeight: `${fixedHeight}px`,
          overflowY: 'auto',
        }
      : {}),
    // Multiline: lay the shell out as a column so the contenteditable div can
    // grow to fill the full shell height, making the entire area click-to-focus.
    ...(multiline ? { display: 'flex', flexDirection: 'column' } : {}),
    // secondaryButtonProps sits at top:40px and needs ~80px to stay inside the border;
    // the caller-supplied minHeight can only raise that floor, never lower it.
    ...(fixedHeight == null && (minHeight != null || secondaryButtonProps)
      ? {
          minHeight: `${Math.max(minHeight ?? 0, secondaryButtonProps ? 80 : 0)}px`,
        }
      : {}),
    // Disabled: swap to muted background/border colours (reuse Button disabled tokens)
    ...(disabled
      ? {
          backgroundColor: t.colors.background.disabled,
          borderColor: t.colors.border.secondary,
          cursor: 'default',
        }
      : {}),
  }

  // With both buttons present, right-pad to ~88px so text/pills don't flow under either.
  const bothButtons = buttonProps && secondaryButtonProps
  const buttonPaddingRight = bothButtons
    ? '88px'
    : buttonProps || secondaryButtonProps
      ? '44px'
      : undefined
  const placeholderRight = bothButtons
    ? '96px'
    : buttonProps || secondaryButtonProps
      ? '52px'
      : '8px'
  const mergedButtonDisabled = buttonProps
    ? buttonProps.disabled || disabled
    : undefined
  const mergedSecondaryDisabled = secondaryButtonProps
    ? secondaryButtonProps.disabled || disabled
    : undefined

  return html`
    <${FormGroup}>
      ${label ? html`<${StyledLabel}>${label}</${StyledLabel}>` : null}
      <${EditorOuter} style=${outerStyle}>
        ${
          showPlaceholder && placeholder
            ? html`
                <span
                  style=${{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    right: placeholderRight,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    color: disabled
                      ? t.colors.text.disabled
                      : t.colors.text.placeholder,
                    fontSize: t.typography.fontSize.medium,
                    fontFamily: t.typography.fontFamily,
                    lineHeight: '1.6',
                  }}
                  >${placeholder}</span
                >
              `
            : null
        }
        <div
          ref=${containerRef}
          contenteditable=${disabled ? 'false' : 'true'}
          spellcheck="false"
          ...${rest}
          style=${{
            ...(rest.style || {}),
            outline: 'none',
            minHeight: fixedHeight ? `${fixedHeight - 16}px` : '28px',
            // In multiline mode the shell is a flex column; grow to fill its full
            // height so empty space below the text/pills still focuses the editor.
            ...(multiline ? { flexGrow: 1 } : {}),
            // No opacity reduction — the outer container's disabled colours carry
            // the visual weight; inner opacity would double-dim pills.
            color: disabled ? t.colors.text.disabled : undefined,
            ...(buttonPaddingRight !== undefined
              ? { paddingRight: buttonPaddingRight }
              : {}),
          }}
        ></div>
        ${
          buttonProps
            ? html`
                <${Button}
                  variant="medium-icon"
                  icon=${buttonProps.icon}
                  color=${buttonProps.color}
                  disabled=${mergedButtonDisabled}
                  loading=${buttonProps.loading}
                  title=${buttonProps.title}
                  onClick=${buttonProps.onClick}
                  style=${{ position: 'absolute', top: '4px', right: '4px' }}
                />
              `
            : null
        }
        ${
          secondaryButtonProps
            ? html`
                <${Button}
                  variant="medium-icon"
                  icon=${secondaryButtonProps.icon}
                  color=${secondaryButtonProps.color}
                  disabled=${mergedSecondaryDisabled}
                  loading=${secondaryButtonProps.loading}
                  title=${secondaryButtonProps.title}
                  onClick=${secondaryButtonProps.onClick}
                  style=${{ position: 'absolute', top: '40px', right: '4px' }}
                />
              `
            : null
        }
      </${EditorOuter}>
      <${AutocompleteDropdown} dropdownState=${dropdownState} onItemClick=${handleDropdownClick} />
    </${FormGroup}>
  `
}
