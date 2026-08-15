import { log } from './logger.mjs'
// Utility functions for common operations

/**
 * Configuration for fetch with retry functionality
 */
const DEFAULT_FETCH_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
  retryDelayMultiplier: 2, // exponential backoff
  timeout: 30000, // 30 seconds
  showUserFeedback: true,
}

/**
 * Enhanced fetch with retry mechanism, timeout, and error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} config - Configuration for retry logic
 * @returns {Promise<Response>} - Enhanced fetch response
 */
export async function fetchWithRetry(url, options = {}, config = {}) {
  const finalConfig = { ...DEFAULT_FETCH_CONFIG, ...config }
  let lastError = null

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Show loading feedback for user
      if (
        finalConfig.showUserFeedback &&
        attempt === 0 &&
        window.showInfoToast
      ) {
        window.showInfoToast('Loading data...', 2000)
      }

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        finalConfig.timeout,
      )

      // Make the fetch request
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      // Clear timeout if request completes
      clearTimeout(timeoutId)

      // Check if response is ok
      if (!response.ok) {
        throw new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response,
        )
      }

      // Success - clear any error feedback
      return response
    } catch (error) {
      lastError = error
      log('util', 'error', `${`Fetch attempt ${attempt + 1} failed:`} ${error}`)

      // Don't retry for certain errors
      if (error.name === 'AbortError') {
        throw new FetchError(
          'Request timeout - please try again',
          408,
          null,
          error,
        )
      }

      if (
        error instanceof FetchError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        // Don't retry client errors (except 408 timeout)
        throw error
      }

      // If this is the last attempt, throw the error
      if (attempt === finalConfig.maxRetries) {
        break
      }

      // Wait before retrying (exponential backoff)
      const delay =
        finalConfig.retryDelay *
        Math.pow(finalConfig.retryDelayMultiplier, attempt)
      log(
        'util',
        'info',
        `Retrying in ${delay}ms... (attempt ${attempt + 2}/${finalConfig.maxRetries + 1})`,
      )

      // Show retry feedback to user
      if (finalConfig.showUserFeedback && window.showInfoToast) {
        window.showInfoToast(
          `Retrying request... (${attempt + 2}/${finalConfig.maxRetries + 1})`,
          delay,
        )
      }

      await sleep(delay)
    }
  }

  // All retries failed
  const errorMessage = getUserFriendlyErrorMessage(lastError)
  if (finalConfig.showUserFeedback && window.showErrorToast) {
    window.showErrorToast(errorMessage)
  }

  throw new FetchError(errorMessage, lastError?.status || 0, null, lastError)
}

/**
 * Enhanced fetch for JSON data with built-in error handling and retry
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} config - Configuration for retry logic
 * @returns {Promise<any>} - Parsed JSON data
 */
export async function fetchJson(url, options = {}, config = {}) {
  try {
    const response = await fetchWithRetry(url, options, config)
    const data = await response.json()

    // Show success feedback if configured
    if (config.showSuccessFeedback && window.showSuccessToast) {
      window.showSuccessToast(
        config.successMessage || 'Data loaded successfully',
      )
    }

    return data
  } catch (error) {
    if (error instanceof SyntaxError) {
      // JSON parsing error
      const message = 'Invalid response format received'
      if (config.showUserFeedback && window.showErrorToast) {
        window.showErrorToast(message)
      }
      throw new FetchError(message, 0, null, error)
    }
    throw error
  }
}

/**
 * Custom error class for fetch operations
 */
export class FetchError extends Error {
  constructor(message, status = 0, response = null, originalError = null) {
    super(message)
    this.name = 'FetchError'
    this.status = status
    this.response = response
    this.originalError = originalError
  }
}

/**
 * Convert technical errors into user-friendly messages
 * @param {Error} error - The error to convert
 * @returns {string} - User-friendly error message
 */
function getUserFriendlyErrorMessage(error) {
  if (!error) return 'An unknown error occurred'

  if (error.name === 'AbortError') {
    return 'Request timed out. Please check your connection and try again.'
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Unable to connect to server. Please check your internet connection.'
  }

  if (error instanceof FetchError) {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.'
      case 401:
        return 'Authentication required. Please refresh the page and try again.'
      case 403:
        return 'Access denied. You do not have permission to access this resource.'
      case 404:
        return 'The requested resource was not found.'
      case 408:
        return 'Request timeout. Please try again.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
        return 'Server error. Please try again later.'
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.'
      default:
        return error.message || 'An error occurred while fetching data.'
    }
  }

  return error.message || 'An unexpected error occurred.'
}

/**
 * Utility function to sleep/wait for a specified duration
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Send text to the clipboard with fallback support for older browsers
 * @param {string} text - Text to copy to clipboard
 * @param {string} [successMessage] - Optional message to show on success
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function sendToClipboard(text, successMessage = null) {
  if (!text) {
    log('util', 'warn', 'No content provided to copy to clipboard')
    return false
  }

  try {
    // Try modern clipboard API first
    await navigator.clipboard.writeText(text)
    log('util', 'info', `Successfully copied to clipboard: ${text}`)

    // Show success message if provided
    if (successMessage && window.showToast) {
      window.showToast(successMessage)
    }

    return true
  } catch (error) {
    log(
      'util',
      'error',
      `Modern clipboard API failed, trying fallback: ${error}`,
    )

    // Fallback for older browsers
    return fallbackCopyToClipboard(text, successMessage)
  }
}

/**
 * Fallback copy method for older browsers using document.execCommand
 * @param {string} text - Text to copy
 * @param {string} [successMessage] - Optional message to show on success
 * @returns {boolean} - True if successful, false otherwise
 */
function fallbackCopyToClipboard(text, successMessage = null) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    if (successful) {
      log('util', 'info', 'Fallback copy successful')

      // Show success message if provided
      if (successMessage && window.showToast) {
        window.showToast(successMessage)
      }

      return true
    } else {
      log('util', 'error', 'Fallback copy failed')
      return false
    }
  } catch (error) {
    log('util', 'error', `Fallback copy failed: ${error}`)
    return false
  } finally {
    document.body.removeChild(textArea)
  }
}

/**
 * Parse URL query parameters
 * @param {string} param - The parameter name to retrieve
 * @returns {string|null} - The parameter value or null if not found
 */
export function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(param)
}

/**
 * Extract a human-readable name from a filename
 * Handles various case formats: camelCase, PascalCase, snake_case, kebab-case, and "Title Case With Spaces"
 * @param {string} filename - The filename to parse (with or without extension)
 * @returns {string|null} - The extracted name in title case with spaces, or null if extraction fails
 */
export function extractNameFromFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return null
  }

  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')

  // If the name is empty after removing extension, return null
  if (!nameWithoutExt) {
    return null
  }

  let words = []

  // Check if it's snake_case or kebab-case (contains _ or -)
  if (nameWithoutExt.includes('_') || nameWithoutExt.includes('-')) {
    // Split by underscores and hyphens
    words = nameWithoutExt.split(/[_-]+/)
  }
  // Check if it's already space-separated
  else if (nameWithoutExt.includes(' ')) {
    words = nameWithoutExt.split(/\s+/)
  }
  // Otherwise, assume it's camelCase or PascalCase
  else {
    // Split on capital letters, keeping the capital with the following word
    // This regex matches: capital letter preceded by lowercase, OR capital letter followed by lowercase and preceded by another capital
    words = nameWithoutExt.split(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/)
  }

  // Filter out empty strings and convert each word to title case
  words = words
    .filter((word) => word && word.trim())
    .map((word) => {
      word = word.trim().toLowerCase()
      return word.charAt(0).toUpperCase() + word.slice(1)
    })

  // If no valid words were extracted, return null
  if (words.length === 0) {
    return null
  }

  // Join words with spaces
  return words.join(' ')
}

/**
 * Suppresses the default browser context menu on an element and calls a custom handler.
 *
 * @param {HTMLElement} element - The element to attach the context menu listener to
 * @param {Function} handler - Callback function called when right-click occurs
 *                             Receives object with { x, y, event } properties
 * @returns {Function} Cleanup function to remove the listener
 *
 * @example
 * const textarea = document.getElementById('my-textarea');
 * const cleanup = suppressContextMenu(textarea, ({ x, y, event }) => {
 *   console.log(`Right-clicked at position: ${x}, ${y}`);
 *   // Show custom menu at cursor position
 *   showCustomMenu(x, y);
 * });
 *
 * // Later, to remove the listener:
 * cleanup();
 */
export function suppressContextMenu(element, handler) {
  const listener = (event) => {
    event.preventDefault()
    handler({ x: event.clientX, y: event.clientY, event })
  }

  element.addEventListener('contextmenu', listener)

  return () => element.removeEventListener('contextmenu', listener)
}

/**
 * PageTitleManager - Manages dynamic page title updates
 */
export class PageTitleManager {
  constructor(defaultTitle = '') {
    this.defaultTitle = defaultTitle
    this.currentTitle = defaultTitle
  }

  /**
   * Update page title with custom text
   * @param {string} title - The title text to display
   */
  update(title) {
    if (!title) return
    this.currentTitle = `${title} - ${this.defaultTitle}`
    document.title = this.currentTitle
  }

  /**
   * Reset page title to default
   */
  reset() {
    this.currentTitle = this.defaultTitle
    document.title = this.defaultTitle
  }

  /**
   * Get the current title
   * @returns {string}
   */
  getTitle() {
    return this.currentTitle
  }
}

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

/**
 * Set a cookie value
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Days until expiration (default: 365)
 */
export function setCookie(name, value, days = 365) {
  if (typeof document === 'undefined') return
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  document.cookie = `${name}=${value};${expires};path=/`
}

/**
 * Returns CSS width/flex styles for a widthScale enum value.
 * @param {'auto'|'square'|'normal'|'compact'|'full'} widthScale
 * @returns {{ width: string, flex?: string }}
 */
export function getWidthScaleStyle(widthScale, height) {
  if (widthScale === 'square') return { width: height ?? '200px' }
  if (widthScale === 'full') return { width: '100%', flex: '1 0 0' }
  if (widthScale === 'compact') return { width: '80px' }
  if (widthScale === 'wide') return { width: '400px' }
  if (widthScale === 'normal') return { width: '160px' }
  return { width: '200px' } // 'auto' (default)
}

/**
 * Returns CSS height style for a heightScale enum value.
 * @param {'normal'|'compact'} heightScale
 * @returns {{ height: string }}
 */
export function getHeightScaleStyle(heightScale) {
  if (heightScale === 'compact') return { height: '34px', padding: '4px 6px' }
  return { height: '44px', padding: '8px 12px' } // 'normal' (default)
}

// Cached hidden mirror div reused across calls (avoids DOM churn on every
// keystroke while typing in a textarea-based autocomplete field).
let _caretMirrorDiv = null

// Text-affecting CSS properties copied from the textarea onto the mirror div
// so that text wraps identically in both, keeping the caret marker's
// measured position accurate.
const MIRROR_STYLE_PROPS = [
  'boxSizing',
  'width',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'padding',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'whiteSpace',
  'wordWrap',
  'overflowWrap',
  'textAlign',
]

/**
 * Compute the viewport-relative bounding rect of the caret inside a plain
 * `<textarea>` element, using the classic "mirror div" technique: a hidden
 * div is styled to match the textarea's text-affecting CSS, filled with the
 * textarea's value up to the caret with a marker `<span>` inserted at the
 * caret offset, then the marker's measured position is translated into
 * viewport coordinates via the textarea's own bounding rect.
 *
 * Returns a plain object (not a real DOMRect) with `.left`, `.top`,
 * `.right`, and `.bottom` in viewport coordinates — the minimal shape that
 * `useAutocomplete`'s `getAnchorRect` callers need (they read `.left` and
 * `.bottom`).
 *
 * @param {HTMLTextAreaElement} textarea
 * @returns {{ left: number, top: number, right: number, bottom: number }|null}
 */
export function getTextareaCaretRect(textarea) {
  try {
    if (!textarea) return null

    if (!_caretMirrorDiv) {
      _caretMirrorDiv = document.createElement('div')
      _caretMirrorDiv.style.position = 'absolute'
      _caretMirrorDiv.style.visibility = 'hidden'
      _caretMirrorDiv.style.whiteSpace = 'pre-wrap'
      _caretMirrorDiv.style.wordWrap = 'break-word'
      _caretMirrorDiv.style.top = '-9999px'
      _caretMirrorDiv.style.left = '-9999px'
      document.body.appendChild(_caretMirrorDiv)
    }

    const mirror = _caretMirrorDiv
    const computed = window.getComputedStyle(textarea)
    for (const prop of MIRROR_STYLE_PROPS) {
      mirror.style[prop] = computed[prop]
    }

    const caretPos = textarea.selectionStart ?? 0
    const value = textarea.value ?? ''
    const before = value.slice(0, caretPos)
    const after = value.slice(caretPos)

    mirror.textContent = ''
    mirror.appendChild(document.createTextNode(before))
    const marker = document.createElement('span')
    marker.textContent = '​' // zero-width space
    mirror.appendChild(marker)
    mirror.appendChild(document.createTextNode(after))

    const mirrorRect = mirror.getBoundingClientRect()
    const markerRect = marker.getBoundingClientRect()
    const textareaRect = textarea.getBoundingClientRect()

    // Offset of the marker relative to the mirror's own box, then applied
    // to the textarea's viewport position (accounting for scroll so the
    // rect tracks the caret even when the textarea content has scrolled).
    const offsetLeft = markerRect.left - mirrorRect.left
    const offsetTop = markerRect.top - mirrorRect.top
    const markerHeight =
      markerRect.height || parseFloat(computed.lineHeight) || 16

    const left = textareaRect.left + offsetLeft - textarea.scrollLeft
    const top = textareaRect.top + offsetTop - textarea.scrollTop
    const bottom = top + markerHeight

    return { left, top, right: left, bottom }
  } catch {
    return null
  }
}

/**
 * Generate a random UUID v4 string.
 *
 * `crypto.randomUUID()` only exists in secure contexts (https / localhost),
 * so this falls back to `crypto.getRandomValues` when the app is served over
 * plain HTTP on a LAN address. Always use this instead of calling
 * `crypto.randomUUID()` directly.
 *
 * @returns {string} – e.g. '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
 */
export function uuid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  return [...b]
    .map(
      (v, i) =>
        ([4, 6, 8, 10].includes(i) ? '-' : '') +
        v.toString(16).padStart(2, '0'),
    )
    .join('')
}

/**
 * Convert a hex colour string to an `rgba(r,g,b,alpha)` CSS value.
 * Supports 3-digit (#rgb) and 6-digit (#rrggbb) hex. Falls back to the
 * original string unchanged if the format is not recognised (e.g. named
 * colours or rgb() values) so callers never receive a broken style.
 *
 * @param {string} hex   – CSS colour, e.g. '#ffffff' or '#fff'
 * @param {number} alpha – Opacity in the range 0–1
 * @returns {string}     – e.g. 'rgba(255,255,255,0.5)'
 */
export function hexToRgba(hex, alpha) {
  const m6 = (hex || '').match(/^#([0-9a-f]{6})$/i)
  if (m6) {
    const r = parseInt(m6[1].slice(0, 2), 16)
    const g = parseInt(m6[1].slice(2, 4), 16)
    const b = parseInt(m6[1].slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }
  const m3 = (hex || '').match(/^#([0-9a-f]{3})$/i)
  if (m3) {
    const r = parseInt(m3[1][0].repeat(2), 16)
    const g = parseInt(m3[1][1].repeat(2), 16)
    const b = parseInt(m3[1][2].repeat(2), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }
  return hex // unrecognised format — pass through unchanged
}
