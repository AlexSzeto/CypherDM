/**
 * autocomplete-dropdown-styles.mjs – Goober styled components for the custom
 * autocomplete dropdown used by ContentEditablePillInput (and any future
 * contenteditable-based inputs).
 *
 * Extracted from content-editable-pill-input.mjs so that dropdown presentation
 * can be iterated independently of the input logic. Replaces the old
 * autoComplete.js `injectAutocompleteStyles` approach entirely.
 *
 * Improvements over the old injected stylesheet:
 *   ✓ box-shadow via theme.shadow.elevated
 *   ✓ border-bottom item separators (removed on :last-child)
 *   ✓ themed custom scrollbar (webkit + Firefox scrollbar-width)
 *   ✓ "no results" row via DropdownEmpty
 *   ✓ border-radius from spacing.medium.borderRadius (theme token)
 *   ✓ no border-right on items (was a visual bug in the old stylesheet)
 *   ✓ compact item padding (6px 12px, not the old bloated 16px)
 *   ✓ narrow min-width (180px, not old 400px)
 *
 * @module custom-ui/io/autocomplete-dropdown-styles
 */
import { styled } from '../goober-setup.mjs'
import { currentTheme } from '../theme.mjs'

// ── Dropdown list container ───────────────────────────────────────────────────

/**
 * DropdownList – the `<ul>` positioned below the typing cursor.
 * Fixed-position so it escapes scroll/stacking-context ancestors.
 */
export const DropdownList = styled('ul')`
  position: fixed;
  z-index: 20000;
  margin: 0;
  padding: 4px 0;
  list-style: none;

  background-color: ${() => currentTheme.value.colors.background.primary};
  border: ${() => currentTheme.value.border.width}
    ${() => currentTheme.value.border.style}
    ${() => currentTheme.value.colors.border.primary};
  border-radius: ${() => currentTheme.value.spacing.medium.borderRadius};
  box-shadow: ${() => currentTheme.value.shadow?.elevated ?? '0 4px 12px rgba(0,0,0,0.15)'};

  max-height: 220px;
  overflow-y: auto;
  min-width: 180px;

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: ${() => `${currentTheme.value.colors.scrollbar.thumb} ${currentTheme.value.colors.scrollbar.track}`};

  /* WebKit */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: ${() => currentTheme.value.colors.scrollbar.track};
    border-radius: ${() => currentTheme.value.spacing.small.borderRadius};
  }
  &::-webkit-scrollbar-thumb {
    background: ${() => currentTheme.value.colors.scrollbar.thumb};
    border-radius: ${() => currentTheme.value.spacing.small.borderRadius};
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${() => currentTheme.value.colors.scrollbar.thumbHover};
  }
`
DropdownList.className = 'ac-dropdown-list'

// ── Dropdown items ────────────────────────────────────────────────────────────

/**
 * DropdownItem – a selectable suggestion row.
 * Active state (keyboard-navigated) and hover use the same hover colour;
 * match highlighting (mark) is handled separately pending the autocomplete
 * discussion.
 */
export const DropdownItem = styled('li')`
  padding: 6px 12px;
  cursor: pointer;
  font-size: ${() => currentTheme.value.typography.fontSize.medium};
  font-family: ${() => currentTheme.value.typography.fontFamily};
  color: ${() => currentTheme.value.colors.text.primary};
  background-color: ${(props) =>
    props.active ? currentTheme.value.colors.background.hover : 'transparent'};
  border-bottom: ${() => `${currentTheme.value.border.width} ${currentTheme.value.border.style} ${currentTheme.value.colors.border.secondary}`};
  transition: background-color ${() => currentTheme.value.transitions.fast};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${() => currentTheme.value.colors.background.hover};
  }
`
DropdownItem.className = 'ac-dropdown-item'

/**
 * MatchMark – highlights the portion of a dropdown item that matches the query.
 * Primary background + inverse text (primary.text) so it stands out clearly.
 */
export const MatchMark = styled('mark')`
  background-color: ${() => currentTheme.value.colors.primary.background};
  color: ${() => currentTheme.value.colors.primary.text};
  border-radius: 2px;
  font-style: normal;
`
MatchMark.className = 'ac-match-mark'

/**
 * DropdownEmpty – shown when the user has typed text but no suggestions match.
 * Non-interactive; uses muted italic text to distinguish from real results.
 */
export const DropdownEmpty = styled('li')`
  padding: 6px 12px;
  font-size: ${() => currentTheme.value.typography.fontSize.medium};
  font-family: ${() => currentTheme.value.typography.fontFamily};
  color: ${() => currentTheme.value.colors.text.muted};
  font-style: italic;
  cursor: default;
  user-select: none;
`
DropdownEmpty.className = 'ac-dropdown-empty'
