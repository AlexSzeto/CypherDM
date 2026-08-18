/**
 * Character domain sanitizer.
 *
 * Wraps the core schema-driven `sanitize()` with this domain's unknown-field
 * policy: unknown keys are dropped silently. The character record is the
 * shape every later feature writes into, so an unrecognised key is far more
 * likely to be a stale client than a value worth preserving.
 */
import fs from 'fs'
import path from 'path'

import { RESOURCE_DIR } from '../../core/paths.mjs'
import { sanitize } from '../../core/sanitizer.mjs'

const schemaPath = path.join(RESOURCE_DIR, 'schemas', 'characters.schema.json')

/** The parsed characters data-file schema (draft-07). */
export const charactersSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))

/** The character record sub-schema, with definitions attached so `$ref` resolves. */
export const characterSchema = {
  ...charactersSchema.definitions.character,
  definitions: charactersSchema.definitions,
}

/**
 * The list-shaped fields of a character. This doubles as the allowlist for
 * every list endpoint: a `listName` outside it must never reach a property
 * lookup on the record.
 */
export const LIST_NAMES = [
  'skills',
  'abilities',
  'attacks',
  'cyphers',
  'equipment',
]

/**
 * The item sub-schema for one list, with definitions attached so `$ref`
 * resolves inside it.
 * @param {string} listName
 * @returns {Object|null} the item schema, or null for an unknown list
 */
export function listItemSchema(listName) {
  if (!LIST_NAMES.includes(listName)) return null
  const ref = characterSchema.properties[listName]?.items?.$ref
  if (!ref) return null
  const definition =
    charactersSchema.definitions[ref.slice(ref.lastIndexOf('/') + 1)]
  return { ...definition, definitions: charactersSchema.definitions }
}

/**
 * Fill defaults on one list row and drop unknown keys.
 * @param {string} listName
 * @param {Object} row
 * @returns {Object} the same object, mutated
 */
export function sanitizeListItem(listName, row) {
  const schema = listItemSchema(listName)
  if (!schema) return row
  sanitize(row, schema)
  dropUnknownKeys(row, schema)
  return row
}

/**
 * Drop keys not declared in a schema's `properties`.
 * @param {Object} record
 * @param {Object} schema
 */
function dropUnknownKeys(record, schema) {
  const known = Object.keys(schema.properties || {})
  for (const key of Object.keys(record)) {
    if (!known.includes(key)) delete record[key]
  }
}

/**
 * Fill defaults on a single character record and drop unknown top-level keys.
 * @param {Object} record
 * @returns {Object} the same object, mutated
 */
export function sanitizeCharacter(record) {
  sanitize(record, characterSchema)
  dropUnknownKeys(record, characterSchema)
  return record
}

/**
 * Fill defaults across a whole characters data file.
 * @param {Object} data
 * @returns {Object} the same object, mutated
 */
export function sanitizeCharactersData(data) {
  sanitize(data, charactersSchema)
  dropUnknownKeys(data, charactersSchema)
  for (const record of data.characters) sanitizeCharacter(record)
  return data
}
