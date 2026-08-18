/**
 * Save indicator.
 *
 * Persistent, never a toast: a participant must be able to look at any
 * character surface at any moment and see whether their edits are actually
 * reaching the server. A stale reassurance is worse than a visible failure,
 * so the failing state names how many changes are still waiting.
 */
import { html } from 'htm/preact'
import { useEffect, useState } from 'preact/hooks'

import { styled } from '../../custom-ui/goober-setup.mjs'
import { Icon } from '../../custom-ui/layout/icon.mjs'
import { currentTheme } from '../../custom-ui/theme.mjs'
import { subscribeSyncState } from './character-queue.mjs'

const Indicator = styled('span')`
  display: inline-flex;
  align-items: center;
  gap: ${(props) => props.gap};
  color: ${(props) => props.color};
  font-size: ${(props) => props.fontSize};
  font-weight: ${(props) => props.fontWeight};
  white-space: nowrap;
`
Indicator.className = 'save-indicator'

/**
 * Describe a sync state for display.
 * @param {{ state: string, pending: number }} status
 * @param {Object} theme
 * @returns {{ icon: string, label: string, color: string }}
 */
function describe({ state, pending }, theme) {
  switch (state) {
    case 'saving':
      return {
        icon: 'refresh',
        label: 'Saving…',
        color: theme.colors.text.secondary,
      }
    case 'notSaving':
      return {
        icon: 'warning',
        label: `Not saving — ${pending} ${pending === 1 ? 'change' : 'changes'} waiting`,
        color: theme.colors.danger.background,
      }
    default:
      return {
        icon: 'check',
        label: 'Saved',
        color: theme.colors.success.background,
      }
  }
}

/**
 * @param {Object} props
 * @param {string} props.characterId - the character whose queue to report on
 * @returns {preact.VNode}
 */
export function SaveIndicator({ characterId }) {
  const [theme, setTheme] = useState(currentTheme.value)
  const [status, setStatus] = useState({ state: 'saved', pending: 0 })

  useEffect(() => currentTheme.subscribe(setTheme), [])
  useEffect(() => subscribeSyncState(characterId, setStatus), [characterId])

  const { icon, label, color } = describe(status, theme)

  return html`
    <${Indicator}
      role="status"
      gap=${theme.spacing.small.gap}
      color=${color}
      fontSize=${theme.typography.fontSize.small}
      fontWeight=${theme.typography.fontWeight.medium}
    >
      <${Icon} name=${icon} size="16px" color=${color} />
      ${label}
    <//>
  `
}
