/**
 * Data domain registry.
 *
 * Maps each tracked data domain to its expected current version and file path.
 * When a migration is added for a domain, bump its `currentVersion` here
 * alongside the migration script in `scripts/migrate/<domain>/`.
 *
 * Domains with no "version" field in their data file are treated as version 0.
 */
import { CONFIG_PATH } from './paths.mjs'

export const DATA_DOMAINS = {
  config: { currentVersion: 1, filePath: CONFIG_PATH },
}

/**
 * Get the current expected schema version for a domain.
 * @param {string} domain
 * @returns {number}
 */
export function getCurrentVersion(domain) {
  return DATA_DOMAINS[domain]?.currentVersion ?? 0
}
