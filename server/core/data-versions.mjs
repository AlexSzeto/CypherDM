/**
 * Data domain registry.
 *
 * Maps each tracked data domain to its expected current version and file path.
 * When a migration is added for a domain, bump its `currentVersion` here
 * alongside the migration script in `scripts/migrate/<domain>/`.
 *
 * Domains with no "version" field in their data file are treated as version 0.
 */
import path from 'path'

import { CONFIG_PATH, DATABASE_DIR } from './paths.mjs'

export const DATA_DOMAINS = {
  config: { currentVersion: 1, filePath: CONFIG_PATH },
  characters: {
    currentVersion: 1,
    filePath: path.join(DATABASE_DIR, 'characters-data.json'),
  },
}

/**
 * Get the current expected schema version for a domain.
 * @param {string} domain
 * @returns {number}
 */
export function getCurrentVersion(domain) {
  return DATA_DOMAINS[domain]?.currentVersion ?? 0
}
