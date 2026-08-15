/**
 * pill.mjs – Shared pill component with four usage patterns.
 *
 * All variants share the same pill-shaped container (border-radius: 9999px).
 * Color themes: primary | secondary | warning | success | danger.
 *
 * Variants:
 *   Static          – text only (no extra props beyond color/disabled/children)
 *   Dismiss         – text + × dismiss button on the LEFT  (`onDismiss` prop)
 *   Interactive icon – text + a separately clickable icon  (`icon` + `onIconClick`)
 *   Template toggle  – `{{slot}}` substrings in children become cycling spans
 *                      (`options` + `onTemplateChange`); combinable with dismiss/icon
 *
 * @module custom-ui/io/pill
 *
 * @example <caption>Static</caption>
 * <${Pill} color="primary">hello</${Pill}>
 *
 * @example <caption>Dismiss (× on left)</caption>
 * <${Pill} color="primary" onDismiss=${() => remove()}>hello</${Pill}>
 *
 * @example <caption>Interactive icon (right side)</caption>
 * <${Pill} color="secondary" icon="play" iconSide="right" onIconClick=${toggle}>
 *   Background Music
 * </${Pill}>
 *
 * @example <caption>Template toggle</caption>
 * <${Pill}
 *   color="primary"
 *   options=${['outer upper body','inner upper body','head']}
 *   onTemplateChange=${v => setValue(v)}
 *   onDismiss=${() => remove()}
 * >{'{{outer upper body}}'}</${Pill}>
 */
import { html } from 'htm/preact'
import { useCallback, useState } from 'preact/hooks'
import { styled } from '../goober-setup.mjs'
import { currentTheme } from '../theme.mjs'
import { Icon } from '../layout/icon.mjs'
import { getWidthScaleStyle, hexToRgba } from '../util.mjs'

// ── Constants ─────────────────────────────────────────────────────────────────

const SLOT_REGEX = /\{\{(.+?)\}\}/g

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Split a string on `{{slot}}` tokens into alternating text/slot parts. */
function parseTemplate(str) {
  const parts = []
  let lastIndex = 0
  SLOT_REGEX.lastIndex = 0
  let match
  while ((match = SLOT_REGEX.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: str.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'slot', slot: match[1] })
    lastIndex = SLOT_REGEX.lastIndex
  }
  if (lastIndex < str.length) {
    parts.push({ type: 'text', text: str.slice(lastIndex) })
  }
  return parts
}

/**
 * Resolve the background, text and border tokens for a given color + disabled state.
 * @param {'primary'|'secondary'|'warning'|'success'|'danger'} color
 * @param {object} t - current theme
 * @param {boolean} disabled
 * @param {'filled'|'outlined'} variant
 */
function resolveColors(color, t, disabled, variant = 'filled') {
  if (disabled) {
    return {
      bg: variant === 'outlined' ? 'transparent' : t.colors.background.disabled,
      text: t.colors.text.disabled,
      border: t.colors.border.secondary,
    }
  }
  if (variant === 'outlined') {
    return {
      bg: 'transparent',
      text: t.colors.text.primary,
      border: t.colors.border.primary,
    }
  }
  const c = t.colors[color] || t.colors.primary
  return {
    bg: c.background,
    text: c.text || '#ffffff',
    border: c.border || t.colors.border.primary,
  }
}

// ── Styled shell ──────────────────────────────────────────────────────────────

/**
 * Outer container — pill shape with overflow clip so inner hover highlights are
 * rounded at the edges without needing per-button radius calculations.
 */
const PillContainer = styled('span')`
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  overflow: hidden;
  border: 1px solid ${(props) => props.borderColor};
  background-color: ${(props) => props.bg};
  min-height: 24px;
  font-size: ${() => currentTheme.value.typography.fontSize.small};
  font-family: ${() => currentTheme.value.typography.fontFamily};
  font-weight: ${() => currentTheme.value.typography.fontWeight.medium};
  white-space: nowrap;
  vertical-align: middle;
  user-select: none;
  line-height: 1;
  box-sizing: border-box;
  cursor: ${(props) => (props.clickable ? 'pointer' : undefined)};
  transition:
    filter ${() => currentTheme.value.transitions.fast},
    background-color ${() => currentTheme.value.transitions.fast};
  &:hover {
    filter: ${(props) => (props.clickable && props.variant !== 'outlined' ? 'brightness(1.2)' : undefined)};
    background-color: ${(props) => (props.clickable && props.variant === 'outlined' ? 'rgba(0,0,0,0.06)' : undefined)};
  }
`
PillContainer.className = 'pill-container'

/** Middle content zone — text colour and horizontal padding only; background comes from PillContainer. */
const PillContentArea = styled('span')`
  display: flex;
  align-items: center;
  gap: 3px;
  padding: ${(props) => props.padding || '0 8px'};
  color: ${(props) => props.textColor};
`
PillContentArea.className = 'pill-content'

/**
 * Clickable icon zone (dismiss × or interactive icon).
 * Floats as a rounded internal button — transparent background lets the
 * PillContainer bg show through; hover adds a white glow like SlotToken.
 */
const PillIconBtn = styled('button')`
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  padding: 2px;
  border: none;
  border-radius: 9999px;
  background-color: transparent;
  cursor: pointer;
  line-height: 1;
  transition: background-color ${() => currentTheme.value.transitions.fast};

  &:hover:not(:disabled) {
    background-color: ${(props) => (props.outlined ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.22)')};
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    cursor: default;
  }
`
PillIconBtn.className = 'pill-icon-btn'

// ── SlotToken ─────────────────────────────────────────────────────────────────

/**
 * SlotToken – a single `{{slot}}` cycling button inside a template pill.
 * Owns its own hover state so multiple tokens per pill are independent.
 *
 * When `tokenBg` / `tokenText` are provided (solid color override, e.g. for
 * outlined pills), hover uses filter:brightness instead of a bg-color swap.
 */
function SlotToken({ slot, canCycle, textColor, tokenBg, tokenText, onCycle }) {
  const [hovered, setHovered] = useState(false)
  const t = currentTheme.value

  const solidToken = !!tokenBg
  const bg = solidToken
    ? tokenBg
    : hovered && canCycle
      ? 'rgba(255,255,255,0.35)'
      : 'rgba(255,255,255,0.22)'
  const borderBase = tokenText || textColor

  return html`<span
    style=${{
      backgroundColor: bg,
      border: `1px solid ${hexToRgba(borderBase, 0.25)}`,
      borderRadius: '9999px',
      padding: '2px 6px',
      cursor: canCycle ? 'pointer' : 'default',
      fontWeight: t.typography.fontWeight.bold,
      transition: solidToken
        ? `filter ${t.transitions.fast}`
        : `background-color ${t.transitions.fast}`,
      filter:
        solidToken && hovered && canCycle ? 'brightness(1.15)' : undefined,
      color: tokenText || undefined,
    }}
    onMouseEnter=${canCycle ? () => setHovered(true) : undefined}
    onMouseLeave=${canCycle ? () => setHovered(false) : undefined}
    onClick=${
      canCycle
        ? (e) => {
            e.stopPropagation()
            onCycle(slot)
          }
        : undefined
    }
    title=${canCycle ? `Click to cycle (${slot})` : slot}
    >${slot}</span
  >`
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Pill – shared pill component.
 *
 * @param {Object}   props
 * @param {'primary'|'secondary'|'warning'|'success'|'danger'} [props.color='primary']
 * @param {boolean}  [props.disabled=false]
 * @param {Function} [props.onDismiss]          – enables × button on the LEFT
 * @param {string}   [props.icon]               – icon name for interactive icon button
 * @param {'left'|'right'} [props.iconSide='left']
 * @param {Function} [props.onIconClick]        – makes the icon button clickable
 * @param {string}   [props.iconColor]          – override icon color (defaults to pill text color)
 * @param {string[]} [props.options]            – cycling options for `{{slot}}` tokens
 * @param {Function} [props.onTemplateChange]   – (newChildren: string) => void
 * @param {Function} [props.onClick]            – (value: string) => void; makes the whole pill body clickable
 * @param {string}   [props.value]              – value passed to onClick; falls back to children if plain string
 * @param {'filled'|'outlined'} [props.variant='filled'] – visual style; outlined = transparent bg + border.primary + text.primary; the `color` prop still tints slot tokens in outlined mode
 * @param {preact.ComponentChildren} props.children
 */
export function Pill({
  color = 'primary',
  disabled = false,
  onDismiss,
  icon,
  iconSide = 'left',
  onIconClick,
  iconColor,
  options,
  onTemplateChange,
  onClick,
  value,
  variant = 'filled',
  widthScale,
  children,
  ...rest
}) {
  const t = currentTheme.value
  const colors = resolveColors(color, t, disabled, variant)
  const isOutlined = variant === 'outlined'

  // For outlined pills, compute the filled color set so slot tokens can still
  // render in the assigned color while the pill shell stays neutral.
  const tokenColors =
    isOutlined && !disabled ? resolveColors(color, t, false, 'filled') : null

  // ── Template slot cycling ───────────────────────────────────────────────────
  const handleSlotCycle = useCallback(
    (currentSlot) => {
      if (disabled || !options?.length || typeof children !== 'string') return
      const idx = options.indexOf(currentSlot)
      const next = options[(idx + 1) % options.length]
      const newChildren = children.replace(
        new RegExp(`\\{\\{${escapeRegex(currentSlot)}\\}\\}`, 'g'),
        `{{${next}}}`,
      )
      onTemplateChange?.(newChildren)
    },
    [disabled, options, children, onTemplateChange],
  )

  // Parse children for {{slot}} tokens whenever children is a string
  const isStringChildren = typeof children === 'string'
  const hasSlots = isStringChildren && SLOT_REGEX.test(children)
  const contentParts = hasSlots
    ? ((SLOT_REGEX.lastIndex = 0), parseTemplate(children))
    : null
  const canCycle = hasSlots && options?.length > 0 && !disabled

  const hasIconLeft = icon && (iconSide === 'left' || !iconSide)
  const hasIconRight = icon && iconSide === 'right'

  const resolvedIconColor = iconColor || colors.text

  // ── Icon button renderer ────────────────────────────────────────────────────
  function renderIconBtn(side) {
    return html`
      <${PillIconBtn}
        type="button"
        tabindex="-1"
        disabled=${disabled || !onIconClick}
        outlined=${isOutlined}
        style=${{ [side === 'right' ? 'marginRight' : 'marginLeft']: '4px' }}
        onClick=${(e) => {
          e.stopPropagation()
          if (!disabled) onIconClick?.()
        }}
        title=${icon}
      >
        <${Icon} name=${icon} size="14px" color=${resolvedIconColor} />
      <//>
    `
  }

  // ── Content ─────────────────────────────────────────────────────────────────
  function renderContent() {
    if (!hasSlots) {
      // Plain text or non-string children
      return children
    }
    // Template: render text parts normally and slot parts as cycling tokens
    return contentParts.map((p) => {
      if (p.type === 'text') return p.text
      return html`<${SlotToken}
        key=${p.slot}
        slot=${p.slot}
        canCycle=${canCycle}
        textColor=${colors.text}
        tokenBg=${tokenColors?.bg}
        tokenText=${tokenColors?.text}
        onCycle=${handleSlotCycle}
      />`
    })
  }

  const widthStyle =
    widthScale != null ? getWidthScaleStyle(widthScale) : undefined
  const isClickable = !!(onClick && !disabled)

  const handlePillClick = isClickable
    ? (e) => {
        onClick(value ?? (typeof children === 'string' ? children : ''))
      }
    : undefined

  return html`
    <${PillContainer}
      borderColor=${colors.border}
      bg=${colors.bg}
      clickable=${isClickable}
      variant=${variant}
      style=${widthStyle}
      onClick=${handlePillClick}
      ...${rest}
    >
      ${
        onDismiss &&
        html`
          <${PillIconBtn}
            type="button"
            tabindex="-1"
            disabled=${disabled}
            outlined=${isOutlined}
            data-pill-dismiss=""
            style=${{ marginLeft: '4px' }}
            onClick=${(e) => {
              e.stopPropagation()
              if (!disabled) onDismiss()
            }}
            title="Remove"
          >
            <${Icon} name="x" size="14px" color=${colors.text} />
          <//>
        `
      }
      ${hasIconLeft && renderIconBtn('left')}

      <${PillContentArea}
        textColor=${colors.text}
        padding=${`0 ${hasIconRight ? '4px' : '8px'} 0 ${onDismiss || hasIconLeft ? '4px' : '8px'}`}
      >
        ${renderContent()}
      <//>

      ${hasIconRight && renderIconBtn('right')}
    <//>
  `
}
