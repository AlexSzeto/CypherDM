export const fromVersion = 0
export const toVersion = 1

/**
 * @param {Object} data - Parsed JSON data (do not set data.version)
 * @returns {Object} The migrated data object
 */
export function migrate(data) {
  return data
}
