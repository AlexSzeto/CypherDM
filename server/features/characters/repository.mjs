/**
 * Character data access.
 *
 * Owns `server/database/characters-data.json` — the single flat file holding
 * every character record. Nothing outside this domain reads or writes it.
 */
import fs from 'fs'
import path from 'path'

import { DATABASE_DIR } from '../../core/paths.mjs'
import { getCurrentVersion } from '../../core/data-versions.mjs'
import { sanitizeCharactersData } from './sanitizer.mjs'

const FILE_NAME = 'characters-data.json'

// Overridable so tests can point the domain at a temp directory.
let databaseDir = DATABASE_DIR

/**
 * Point the repository at a different database directory. Test-only.
 * @param {string} dir
 */
export function setDatabaseDir(dir) {
  databaseDir = dir
}

/** @returns {string} absolute path to the characters data file */
export function getDataFilePath() {
  return path.join(databaseDir, FILE_NAME)
}

/**
 * Read the whole characters data file, sanitized.
 * A missing file reads as an empty, current-version collection rather than an
 * error — a fresh install has no data yet.
 * @returns {{ version: number, characters: Object[] }}
 */
export function readData() {
  const filePath = getDataFilePath()
  if (!fs.existsSync(filePath)) {
    return { version: getCurrentVersion('characters'), characters: [] }
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  return sanitizeCharactersData(parsed)
}

/**
 * Write the whole characters data file.
 *
 * This is the domain's only write path, so it is where the version stamp
 * belongs: a file created here (rather than by the startup migrator) must
 * still carry its version, or the next restart reads it as version 0 and
 * replays the migration chain against already-current data.
 *
 * The write goes to a sibling `.tmp` first and is renamed into place, so a
 * crash mid-write cannot leave a truncated data file behind.
 *
 * @param {{ version?: number, characters: Object[] }} data
 * @returns {{ version: number, characters: Object[] }} the data as written
 */
export function writeData(data) {
  const filePath = getDataFilePath()
  const tmpPath = `${filePath}.tmp`
  data.version = getCurrentVersion('characters')

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8')
  fs.renameSync(tmpPath, filePath)
  return data
}
