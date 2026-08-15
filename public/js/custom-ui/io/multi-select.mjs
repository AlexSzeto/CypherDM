/**
 * MultiSelect – button that opens an anchored popover checklist.
 *
 * The popover is rendered into a portal at document.body so it escapes any
 * overflow:hidden ancestors.  Anchor coordinates are captured from the
 * trigger button's getBoundingClientRect() on each click — no ref on a
 * styled component is needed.
 *
 * @module custom-ui/io/multi-select
 */
import { html } from 'htm/preact'
import { useState, useEffect, useCallback, useContext } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { styled } from '../goober-setup.mjs'
import { currentTheme } from '../theme.mjs'
import { Label } from '../themed-base.mjs'
import { Icon } from '../layout/icon.mjs'
import { Button } from './button.mjs'
import { Checkbox } from './checkbox.mjs'
import { TooltipContext } from '../overlays/tooltip.mjs'

// ============================================================================
// Styled Components
// ============================================================================

const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: ${(props) => props.width};
  flex: ${(props) => props.flex};
`
Wrapper.className = 'multi-select-wrapper'

const TriggerButton = styled('button')`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 44px;
  padding: 0 12px;
  background-color: ${(props) => props.theme.colors.background.tertiary};
  border: 2px solid ${(props) => props.theme.colors.border.primary};
  border-radius: 6px;
  color: ${(props) => props.theme.colors.text.primary};
  font-family: ${(props) => props.theme.typography.fontFamily};
  font-size: ${(props) => props.theme.typography.fontSize.medium};
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: ${(props) => props.theme.colors.border.focus};
    background-color: ${(props) => props.theme.colors.background.hover};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${(props) => props.theme.colors.border.focus};
  }
`
TriggerButton.className = 'multi-select-trigger'

const TriggerText = styled('span')`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${(props) => (props.empty ? props.theme.colors.text.placeholder : props.theme.colors.text.primary)};
`
TriggerText.className = 'multi-select-trigger-text'

const Popover = styled('div')`
  position: fixed;
  z-index: 9999;
  background-color: ${(props) => props.theme.colors.background.card};
  border: 2px solid ${(props) => props.theme.colors.border.secondary};
  border-radius: ${(props) => props.theme.spacing.small.borderRadius};
  box-shadow: ${(props) => props.theme.shadow.elevated};
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 280px;
  overflow-y: auto;
`
Popover.className = 'multi-select-popover'

const OptionRow = styled('div')`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;

  &:hover {
    background-color: ${(props) => props.theme.colors.background.hover};
  }
`
OptionRow.className = 'multi-select-option-row'

const OptionLabel = styled('span')`
  font-family: ${(props) => props.theme.typography.fontFamily};
  font-size: ${(props) => props.theme.typography.fontSize.medium};
  color: ${(props) => props.theme.colors.text.primary};
`
OptionLabel.className = 'multi-select-option-label'

// ============================================================================
// Component
// ============================================================================

/**
 * MultiSelect – Button that opens a popover checklist below (or above, if near viewport bottom).
 *
 * @param {Object}                          props
 * @param {{ label: string, value: string }[]} props.options - Available options as `{ label, value }` objects.
 * @param {string[]}                        props.value     - Currently selected values (matches `option.value`).
 * @param {Function}                        props.onChange  - `(values: string[]) => void`
 * @param {string}                          [props.label]   - Label displayed above the button.
 * @param {string}                          [props.placeholder] - Shown when nothing is selected (default: "Select…").
 * @param {string}                          [props.widthScale]  - 'full' → flex:1 + 100% width; default → inline.
 * @param {Object}                          [props.buttonProps] - optional icon button inside trigger: { icon, color?, disabled?, onClick, title?, loading? }
 *
 * @example
 * html`
 *   <${MultiSelect}
 *     label="Time Signatures"
 *     options=${[{ label: '2/4', value: '2' }, { label: '3/4', value: '3' }, { label: '4/4', value: '4' }, { label: '6/8', value: '6' }]}
 *     value=${genre.timeSignatures}
 *     onChange=${(sigs) => setField('timeSignatures', sigs)}
 *   />
 * `
 */
export function MultiSelect({
  options = [],
  value = [],
  onChange,
  label,
  placeholder = 'Select…',
  widthScale,
  buttonProps,
}) {
  const theme = currentTheme.value
  const tooltipCtx = useContext(TooltipContext)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(null) // { top, left, width, triggerBottom, triggerTop }

  const handleTriggerClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchor({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      triggerTop: rect.top,
    })
    setOpen((prev) => !prev)
  }, [])

  const handleToggle = useCallback(
    (optionValue, e) => {
      e.stopPropagation()
      const next = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue]
      onChange(next)
    },
    [value, onChange],
  )

  const close = useCallback(() => setOpen(false), [])

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    const handleDown = (e) => {
      if (
        !e.target.closest('[data-multiselect-popover]') &&
        !e.target.closest('[data-multiselect-trigger]')
      ) {
        close()
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, close])

  const displayText =
    value.length === 0
      ? placeholder
      : value
          .map((v) => options.find((o) => o.value === v)?.label ?? v)
          .join(', ')

  const width = widthScale === 'full' ? '100%' : undefined
  const flex = widthScale === 'full' ? '1' : undefined

  // Determine popover position: show above trigger if not enough space below
  let popoverStyle = {}
  if (anchor) {
    const ESTIMATED_HEIGHT = Math.min(options.length * 34 + 16, 280)
    const spaceBelow = window.innerHeight - anchor.top
    if (spaceBelow < ESTIMATED_HEIGHT && anchor.triggerTop > ESTIMATED_HEIGHT) {
      popoverStyle = {
        top: anchor.triggerTop - ESTIMATED_HEIGHT - 4 + 'px',
        left: anchor.left + 'px',
        minWidth: anchor.width + 'px',
      }
    } else {
      popoverStyle = {
        top: anchor.top + 'px',
        left: anchor.left + 'px',
        minWidth: anchor.width + 'px',
      }
    }
  }

  const popover =
    open && anchor
      ? createPortal(
          html`
      <${Popover}
        theme=${theme}
        data-multiselect-popover
        style=${popoverStyle}
        onMouseDown=${(e) => e.stopPropagation()}
      >
        ${options.map(
          (option) => html`
          <${OptionRow}
            key=${option.value}
            theme=${theme}
            onClick=${(e) => handleToggle(option.value, e)}
            onMouseEnter=${option.tooltip ? (e) => tooltipCtx?.show(option.tooltip, e.clientX, e.clientY) : undefined}
            onMouseLeave=${option.tooltip ? () => tooltipCtx?.hide() : undefined}
          >
            <${Checkbox}
              checked=${value.includes(option.value)}
              onChange=${() => {}}
            />
            <${OptionLabel} theme=${theme}>${option.label}</${OptionLabel}>
          </${OptionRow}>
        `,
        )}
      </${Popover}>
    `,
          document.body,
        )
      : null

  return html`
    <${Wrapper} width=${width} flex=${flex}>
      ${label && html`<${Label}>${label}</${Label}>`}
      <${TriggerButton}
        theme=${theme}
        type="button"
        data-multiselect-trigger
        onClick=${handleTriggerClick}
      >
        ${
          buttonProps
            ? html`
                <${Button}
                  variant="medium-icon"
                  icon=${buttonProps.icon}
                  color=${buttonProps.color}
                  disabled=${buttonProps.disabled}
                  loading=${buttonProps.loading}
                  title=${buttonProps.title}
                  onClick=${(e) => {
                    e.stopPropagation()
                    buttonProps.onClick?.(e)
                  }}
                />
              `
            : null
        }
        <${TriggerText} theme=${theme} empty=${value.length === 0}>
          ${displayText}
        </${TriggerText}>
        <${Icon} name="chevron-down" size="16px" color=${theme.colors.text.secondary} />
      </${TriggerButton}>
      ${popover}
    </${Wrapper}>
  `
}
