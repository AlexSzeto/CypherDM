/**
 * select.mjs – Fully custom single-value dropdown.
 *
 * Replaces the themed native <select> with a portal-anchored popover list that
 * matches MultiSelect's visual approach. Fires `onChange({ target: { value } })`
 * to preserve the existing caller API.
 */
import { html } from 'htm/preact'
import { useState, useCallback, useEffect, useContext } from 'preact/hooks'
import { createPortal } from 'preact/compat'
import { styled } from '../goober-setup.mjs'
import { currentTheme } from '../theme.mjs'
import { getWidthScaleStyle, getHeightScaleStyle } from '../util.mjs'
import { Icon } from '../layout/icon.mjs'
import { Button } from './button.mjs'
import { TooltipContext } from '../overlays/tooltip.mjs'

// ============================================================================
// Styled Components
// ============================================================================

const FormGroup = styled('div')`
  display: flex;
  flex-direction: column;
  width: ${(props) => props.width};
  flex: ${(props) => props.flex};
`
FormGroup.className = 'form-group'

const Label = styled('label')`
  margin-bottom: 5px;
  color: ${(props) => props.color};
  font-size: ${(props) => props.fontSize};
  font-weight: ${(props) => props.fontWeight};
`
Label.className = 'label'

const TriggerButton = styled('button')`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: ${(props) => props.height};
  padding: ${(props) => props.padding};
  background-color: ${(props) => props.backgroundColor};
  border: ${(props) => props.border};
  border-radius: 6px;
  color: ${(props) => props.color};
  font-family: ${(props) => props.fontFamily};
  font-size: ${(props) => props.fontSize};
  cursor: pointer;
  text-align: left;
  transition: ${(props) => props.transition};
  box-sizing: border-box;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${(props) => props.focusColor};
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`
TriggerButton.className = 'select-trigger'

const TriggerText = styled('span')`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${(props) => (props.placeholder ? props.placeholderColor : props.textColor)};
`
TriggerText.className = 'select-trigger-text'

const Popover = styled('div')`
  position: fixed;
  z-index: 9999;
  background-color: ${(props) => props.bgColor};
  border: 2px solid ${(props) => props.borderColor};
  border-radius: ${(props) => props.borderRadius};
  box-shadow: ${(props) => props.shadow};
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 280px;
  overflow-y: auto;
`
Popover.className = 'select-popover'

const OptionRow = styled('div')`
  display: flex;
  align-items: center;
  padding: 6px 8px;
  min-height: 32px;
  border-radius: 4px;
  cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
  user-select: none;
  font-family: ${(props) => props.fontFamily};
  font-size: ${(props) => props.fontSize};
  color: ${(props) => props.color};
  background-color: ${(props) => (props.selected ? props.selectedBg : 'transparent')};
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};

  &:hover {
    background-color: ${(props) => props.hoverBg};
  }
`
OptionRow.className = 'select-option-row'

const ErrorMessage = styled('span')`
  margin-top: 4px;
  color: ${(props) => props.color};
  font-size: ${(props) => props.fontSize};
`
ErrorMessage.className = 'error-message'

// ============================================================================
// Component
// ============================================================================

/**
 * Select – fully custom single-value dropdown.
 *
 * @param {Object}  props
 * @param {string}  [props.label]
 * @param {Array<{label: string, value: any, disabled?: boolean, tooltip?: string}>} [props.options=[]] – `disabled` greys out and inertizes an individual option while keeping it in the list
 * @param {string}  [props.error]
 * @param {string}  [props.id]
 * @param {'normal'|'compact'|'full'} [props.widthScale='normal']
 * @param {'normal'|'compact'} [props.heightScale='normal']
 * @param {boolean} [props.disabled=false]
 * @param {*}       [props.value]
 * @param {Function} [props.onChange] – fires `(e) => e.target.value` (backward compat)
 * @param {string}  [props.tooltip]   – tooltip shown on hover (via TooltipContext)
 * @param {Object}  [props.buttonProps] – optional icon button: { icon, color?, disabled?, onClick, title?, loading? }
 */
export function Select({
  label,
  options = [],
  error,
  id,
  widthScale = 'normal',
  heightScale = 'normal',
  disabled = false,
  value,
  onChange,
  tooltip = null,
  buttonProps,
  ...rest
}) {
  const theme = currentTheme.value
  const tooltipCtx = useContext(TooltipContext)
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(null)

  const { width, flex } = getWidthScaleStyle(widthScale)
  const { height, padding } = getHeightScaleStyle(heightScale)

  const selectedOption = options.find((o) => o.value === value)
  const displayLabel = selectedOption?.label ?? ''

  const handleTriggerClick = useCallback(
    (e) => {
      if (disabled) return
      const rect = e.currentTarget.getBoundingClientRect()
      setAnchor({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        triggerTop: rect.top,
      })
      setOpen((prev) => !prev)
    },
    [disabled],
  )

  const handleSelect = useCallback(
    (optValue) => {
      onChange?.({ target: { value: optValue } })
      setOpen(false)
    },
    [onChange],
  )

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handleDown = (e) => {
      if (
        !e.target.closest('[data-select-popover]') &&
        !e.target.closest('[data-select-trigger]')
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

  const tooltipHandlers =
    tooltip && tooltipCtx
      ? {
          onMouseEnter: (e) => tooltipCtx.show(tooltip, e.clientX, e.clientY),
          onMouseLeave: () => tooltipCtx.hide(),
        }
      : {}

  let popoverStyle = {}
  if (anchor) {
    const ESTIMATED_HEIGHT = Math.min(options.length * 36 + 16, 280)
    const spaceBelow = window.innerHeight - anchor.top
    popoverStyle =
      spaceBelow < ESTIMATED_HEIGHT && anchor.triggerTop > ESTIMATED_HEIGHT
        ? {
            top: anchor.triggerTop - ESTIMATED_HEIGHT - 4 + 'px',
            left: anchor.left + 'px',
            minWidth: anchor.width + 'px',
          }
        : {
            top: anchor.top + 'px',
            left: anchor.left + 'px',
            minWidth: anchor.width + 'px',
          }
  }

  const popover =
    open && anchor
      ? createPortal(
          html`
    <${Popover}
      data-select-popover
      bgColor=${theme.colors.background.card}
      borderColor=${theme.colors.border.secondary}
      borderRadius=${theme.spacing.small.borderRadius}
      shadow=${theme.shadow.elevated}
      style=${popoverStyle}
      onMouseDown=${(e) => e.stopPropagation()}
    >
      ${options.map(
        (opt) => html`
        <${OptionRow}
          key=${opt.value}
          fontFamily=${theme.typography.fontFamily}
          fontSize=${theme.typography.fontSize.medium}
          color=${opt.disabled ? theme.colors.text.disabled : theme.colors.text.primary}
          selected=${opt.value === value}
          selectedBg=${theme.colors.primary.background}
          hoverBg=${opt.disabled ? 'transparent' : theme.colors.background.hover}
          disabled=${opt.disabled}
          onClick=${() => !opt.disabled && handleSelect(opt.value)}
          onMouseEnter=${opt.tooltip ? (e) => tooltipCtx?.show(opt.tooltip, e.clientX, e.clientY) : undefined}
          onMouseLeave=${opt.tooltip ? () => tooltipCtx?.hide() : undefined}
        >${opt.label}</${OptionRow}>
      `,
      )}
    </${Popover}>
  `,
          document.body,
        )
      : null

  const mergedButtonDisabled = buttonProps
    ? buttonProps.disabled || disabled
    : undefined

  return html`
    <${FormGroup} width=${width} flex=${flex}>
      ${
        label
          ? html`
        <${Label}
          for=${id}
          color=${theme.colors.text.secondary}
          fontSize=${theme.typography.fontSize.medium}
          fontWeight=${theme.typography.fontWeight.medium}
        >${label}</${Label}>
      `
          : ''
      }
      <${TriggerButton}
        id=${id}
        type="button"
        data-select-trigger
        disabled=${disabled}
        height=${height}
        padding=${padding}
        border=${`2px ${theme.border.style} ${error ? theme.colors.danger.border : theme.colors.border.primary}`}
        backgroundColor=${theme.colors.background.tertiary}
        color=${theme.colors.text.primary}
        fontFamily=${theme.typography.fontFamily}
        fontSize=${theme.typography.fontSize.medium}
        transition=${`border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast}`}
        focusColor=${error ? theme.colors.danger.border : theme.colors.primary.border}
        onClick=${handleTriggerClick}
        ...${tooltipHandlers}
        ...${rest}
      >
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
                  onClick=${(e) => {
                    e.stopPropagation()
                    buttonProps.onClick?.(e)
                  }}
                />
              `
            : null
        }
        <${TriggerText}
          placeholder=${!selectedOption}
          placeholderColor=${theme.colors.text.placeholder}
          textColor=${theme.colors.text.primary}
        >${displayLabel || ' '}</${TriggerText}>
        <${Icon} name="chevron-down" size="16px" color=${theme.colors.text.secondary} />
      </${TriggerButton}>
      ${popover}
      ${
        error
          ? html`
        <${ErrorMessage}
          color=${theme.colors.danger.background}
          fontSize=${theme.typography.fontSize.small}
        >${error}</${ErrorMessage}>
      `
          : ''
      }
    </${FormGroup}>
  `
}
