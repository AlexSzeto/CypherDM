const HIDE_LOG_SOURCES = ['slot-resolver']

/**
 * @param {string} source
 * @param {'info'|'warn'|'error'} level
 * @param {string} message
 */
export function log(source, level, message) {
  if (level === 'info') {
    if (HIDE_LOG_SOURCES.includes(source)) return
    console.log(`[${source}] ${message}`)
  } else if (level === 'warn') {
    console.warn(`[${source}] ${message}`)
  } else if (level === 'error') {
    console.error(`[${source}] ${message}`)
  }
}
