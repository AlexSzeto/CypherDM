import { html } from 'htm/preact'
import { useReducer, useRef, useEffect, useCallback } from 'preact/hooks'
import { forwardRef, useImperativeHandle } from 'preact/compat'
import { styled } from '../goober-setup.mjs'
import { currentTheme } from '../theme.mjs'

const Wrapper = styled('div')`
  display: grid;
  overflow: ${(props) => props.overflow || 'hidden'};
`
Wrapper.className = 'transition-viewer'

const Slot = styled('div')`
  grid-area: 1 / 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`
Slot.className = 'transition-viewer-slot'

const initialState = {
  currentEl: null,
  transitionalEl: null,
  isTransitioning: false,
}

function reduce(state, action) {
  switch (action.type) {
    case 'show':
      return { ...state, currentEl: action.el }
    case 'start':
      return { ...state, transitionalEl: action.el, isTransitioning: true }
    case 'swap':
      return { ...state, transitionalEl: action.el }
    case 'commit':
      return {
        currentEl: action.el,
        transitionalEl: null,
        isTransitioning: false,
      }
    default:
      return state
  }
}

/**
 * TransitionViewer — renders one visual element at a time; transitions between
 * elements by fading the current one out while the next is already visible beneath.
 *
 * @param {Object}  props
 * @param {string}  [props.overflow='hidden']  CSS overflow on the wrapper
 * @param {number}  [props.transitionMs]       Fade duration ms; defaults to theme.transitions.slow
 * @param {...*}    props.rest                 Spread onto root div (width, height, style, class, etc.)
 *
 * Ref handle:
 *   transitionTo(vnode: VNode | null)
 *     - No current element: shows immediately, no animation.
 *     - Not transitioning: stacks new element below current, begins fade-out of current.
 *     - Already transitioning: swaps the transitional element; current continues its fade.
 */
export const TransitionViewer = forwardRef(function TransitionViewer(
  { overflow = 'hidden', transitionMs, ...rest },
  ref,
) {
  const ms =
    transitionMs ??
    Math.round(parseFloat(currentTheme.value.transitions.slow) * 1000)

  const [{ currentEl, transitionalEl, isTransitioning }, dispatch] = useReducer(
    reduce,
    initialState,
  )

  // Refs mirror state for stale-closure-safe reads inside setTimeout.
  const currentElRef = useRef(null)
  const isTransitioningRef = useRef(false)
  const transitionalElRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    },
    [],
  )

  const transitionTo = useCallback(
    (newEl) => {
      if (currentElRef.current === null) {
        currentElRef.current = newEl
        dispatch({ type: 'show', el: newEl })
        return
      }
      if (isTransitioningRef.current) {
        // Mid-transition: swap target only; current element continues its fade.
        transitionalElRef.current = newEl
        dispatch({ type: 'swap', el: newEl })
        return
      }
      transitionalElRef.current = newEl
      isTransitioningRef.current = true
      dispatch({ type: 'start', el: newEl })
      timerRef.current = setTimeout(() => {
        const committed = transitionalElRef.current
        currentElRef.current = committed
        isTransitioningRef.current = false
        transitionalElRef.current = null
        dispatch({ type: 'commit', el: committed })
        timerRef.current = null
      }, ms)
    },
    [ms],
  )

  useImperativeHandle(ref, () => ({ transitionTo }), [transitionTo])

  return html`
    <${Wrapper} overflow=${overflow} ...${rest}>
      ${
        transitionalEl !== null
          ? html`
        <${Slot} style=${{ zIndex: 0 }}>
          ${transitionalEl}
        </${Slot}>
      `
          : null
      }
      ${
        currentEl !== null
          ? html`
        <${Slot} style=${{
          zIndex: 1,
          opacity: isTransitioning ? 0 : 1,
          transition: isTransitioning ? `opacity ${ms}ms ease-out` : undefined,
          pointerEvents: isTransitioning ? 'none' : undefined,
        }}>
          ${currentEl}
        </${Slot}>
      `
          : null
      }
    </${Wrapper}>
  `
})
