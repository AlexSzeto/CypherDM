/**
 * Character domain logic.
 *
 * Every write in the application lands here as a field-level patch carrying an
 * actor tag. Whole-record writes are deliberately absent: the GM writes into
 * player sheets while the player is editing them, so a stale whole-record
 * write would silently erase the other party's change. Field granularity
 * means the cost of a collision is one field, which is what makes
 * last-write-wins an acceptable conflict rule.
 */
import { randomUUID } from 'crypto'

import { validate } from '../../core/sanitizer.mjs'
import { log } from '../../core/logger.mjs'
import { readData, writeData } from './repository.mjs'
import {
  characterSchema,
  LIST_NAMES,
  listItemSchema,
  sanitizeCharacter,
  sanitizeListItem,
} from './sanitizer.mjs'

/** Path segments that are never legal, regardless of the schema. */
const FORBIDDEN_SEGMENTS = ['__proto__', 'constructor', 'prototype']

/**
 * An error carrying the HTTP status the router should answer with.
 */
export class CharacterError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {Object[]|null} [details]
   */
  constructor(status, message, details = null) {
    super(message)
    this.name = 'CharacterError'
    this.status = status
    this.details = details
  }
}

/**
 * Resolve a `$ref` (or pass a schema through unchanged).
 * @param {Object} schema
 * @returns {Object}
 */
function deref(schema, root = characterSchema) {
  if (!schema || typeof schema !== 'object') return schema
  if (!schema.$ref) return schema
  const parts = schema.$ref.slice(2).split('/')
  let resolved = root
  for (const part of parts) resolved = resolved?.[part]
  return resolved ?? schema
}

/**
 * Walk a dot path against the character schema and return the schema node it
 * addresses, throwing a `CharacterError` describing why a path is not legal.
 *
 * A path addresses a scalar leaf, a scalar array, or a whole object — never a
 * row inside a list. Rows are addressed by uid, which arrives with the
 * list-item story; until then an index path is rejected outright rather than
 * quietly writing to whatever currently sits at that position.
 *
 * @param {string} path
 * @param {Object} [root] - schema to resolve against; the character record by
 *   default, or a list item's schema when patching a row
 * @returns {Object} the schema node the path addresses
 */
export function resolvePathSchema(path, root = characterSchema) {
  if (typeof path !== 'string' || path.length === 0) {
    throw new CharacterError(400, 'Patch path must be a non-empty string')
  }

  const segments = path.split('.')
  let node = root

  for (const segment of segments) {
    if (FORBIDDEN_SEGMENTS.includes(segment)) {
      throw new CharacterError(400, `Illegal patch path segment: ${segment}`)
    }
    if (/^\d+$/.test(segment)) {
      throw new CharacterError(
        400,
        `Patch path "${path}" addresses a list row by index. List rows are ` +
          `addressed by uid through the list endpoints, which do not exist yet.`,
      )
    }

    node = deref(node, root)
    const next = node?.properties?.[segment]
    if (!next) {
      throw new CharacterError(400, `Unknown patch path: ${path}`)
    }
    node = next
  }

  return deref(node, root)
}

/**
 * Check a patch value against the schema node its path resolved to.
 * @param {string} path
 * @param {Object} schema
 * @param {*} value
 */
function assertValueMatches(path, schema, value) {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type]

  const matches = types.some((type) => {
    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
      case 'integer':
        return typeof value === 'number' && Number.isFinite(value)
      case 'boolean':
        return typeof value === 'boolean'
      case 'null':
        return value === null
      case 'array':
        return Array.isArray(value)
      case 'object':
        return (
          value !== null && typeof value === 'object' && !Array.isArray(value)
        )
      default:
        return false
    }
  })

  if (!matches) {
    throw new CharacterError(
      400,
      `Patch value for "${path}" must be of type ${types.join(' | ')}`,
    )
  }

  // A list of objects can only be reshaped through the list endpoints.
  if (Array.isArray(value)) {
    const itemSchema = deref(schema.items)
    if (itemSchema?.properties) {
      throw new CharacterError(
        400,
        `"${path}" is a list of records and cannot be patched wholesale.`,
      )
    }
  }
}

/**
 * Write a value at a dot path on a record. The path is assumed already
 * validated by `resolvePathSchema`.
 * @param {Object} record
 * @param {string} path
 * @param {*} value
 */
function writeAtPath(record, path, value) {
  const segments = path.split('.')
  const last = segments.pop()
  let target = record
  for (const segment of segments) {
    if (target[segment] === undefined || target[segment] === null) {
      target[segment] = {}
    }
    target = target[segment]
  }
  target[last] = value
}

/** @returns {Object[]} every character record */
export function listCharacters() {
  return readData().characters
}

/**
 * @param {string} id
 * @returns {Object} the character record
 * @throws {CharacterError} 404 when no such character exists
 */
export function getCharacter(id) {
  const record = readData().characters.find((c) => c.id === id)
  if (!record) throw new CharacterError(404, `No character with id ${id}`)
  return record
}

/**
 * Create a character. Every field the caller does not supply is filled from
 * the schema defaults, so a new record is always complete.
 * @param {{ name?: string }} [seed]
 * @returns {Object} the created record
 */
export function createCharacter({ name = '' } = {}) {
  const data = readData()
  const now = new Date().toISOString()
  const record = sanitizeCharacter({
    id: randomUUID(),
    name,
    createdAt: now,
    modifiedAt: now,
  })

  data.characters.push(record)
  writeData(data)
  log('characters', 'info', `Created character ${record.id}`)
  return record
}

/**
 * Apply field-level patches to a character.
 *
 * Patches apply in array order and the last write to a repeated path wins.
 * There is no rejection on conflict and no merge interface — the blast radius
 * of a collision is a single field.
 *
 * @param {string} id
 * @param {{ actor: string, patches: Array<{ path: string, value: * }> }} request
 * @returns {{ record: Object, applied: string[] }}
 */
export function patchCharacter(id, { actor, patches }) {
  const data = readData()
  const record = data.characters.find((c) => c.id === id)
  if (!record) throw new CharacterError(404, `No character with id ${id}`)

  // Validate every patch before writing any of them, so a bad path in the
  // middle of a batch cannot leave the record half-updated.
  for (const patch of patches) {
    const schema = resolvePathSchema(patch.path)
    assertValueMatches(patch.path, schema, patch.value)
  }

  const applied = []
  for (const patch of patches) {
    writeAtPath(record, patch.path, patch.value)
    applied.push(patch.path)
  }
  record.modifiedAt = new Date().toISOString()

  const { valid, errors } = validate(record, characterSchema)
  if (!valid) {
    throw new CharacterError(400, 'Patch produced an invalid character', errors)
  }

  writeData(data)
  log(
    'characters',
    'info',
    `Patched character ${id} by ${actor}: ${applied.join(', ')}`,
  )
  return { record, applied }
}

/**
 * Delete a character record.
 *
 * Cleanup of GM-side references (roster entry, intrusion participants,
 * `giftedTo` pointers) belongs to the features that introduce those records;
 * none of them exist yet.
 *
 * @param {string} id
 * @throws {CharacterError} 404 when no such character exists
 */
export function deleteCharacter(id) {
  const data = readData()
  const index = data.characters.findIndex((c) => c.id === id)
  if (index === -1) throw new CharacterError(404, `No character with id ${id}`)
  data.characters.splice(index, 1)
  writeData(data)
  log('characters', 'info', `Deleted character ${id}`)
}

/**
 * Resolve a character and one of its lists, rejecting an unknown list name
 * before it can reach a property lookup on the record.
 * @param {Object} data
 * @param {string} id
 * @param {string} listName
 * @returns {{ record: Object, list: Object[] }}
 */
function resolveList(data, id, listName) {
  const record = data.characters.find((c) => c.id === id)
  if (!record) throw new CharacterError(404, `No character with id ${id}`)
  if (!LIST_NAMES.includes(listName)) {
    throw new CharacterError(404, `No such list: ${listName}`)
  }
  return { record, list: record[listName] }
}

/**
 * Find a row by uid.
 * @param {Object[]} list
 * @param {string} listName
 * @param {string} uid
 * @returns {number} the row's index
 */
function requireRowIndex(list, listName, uid) {
  const index = list.findIndex((row) => row.uid === uid)
  if (index === -1) {
    throw new CharacterError(404, `No ${listName} row with uid ${uid}`)
  }
  return index
}

/**
 * Append a row to one of a character's lists.
 *
 * The uid is assigned here, by the server, because a row must be addressable
 * by something no concurrent insert or delete can invalidate — an index would
 * silently redirect another party's edit onto a different row.
 *
 * @param {string} id
 * @param {string} listName
 * @param {Object} [seed] - initial field values; unknown keys are dropped
 * @param {string} [actor]
 * @returns {{ record: Object, item: Object }}
 */
export function addListItem(id, listName, seed = {}, actor = 'unknown') {
  const data = readData()
  const { record, list } = resolveList(data, id, listName)

  const item = sanitizeListItem(listName, { ...seed, uid: randomUUID() })
  list.push(item)
  record.modifiedAt = new Date().toISOString()
  writeData(data)
  log('characters', 'info', `Added ${listName} row ${item.uid} by ${actor}`)
  return { record, item }
}

/**
 * Apply field-level patches to one row, addressed by uid.
 *
 * @param {string} id
 * @param {string} listName
 * @param {string} uid
 * @param {{ actor: string, patches: Array<{ path: string, value: * }> }} request
 * @returns {{ record: Object, applied: string[] }}
 */
export function patchListItem(id, listName, uid, { actor, patches }) {
  const data = readData()
  const { record, list } = resolveList(data, id, listName)
  const row = list[requireRowIndex(list, listName, uid)]
  const itemSchema = listItemSchema(listName)

  for (const patch of patches) {
    if (patch.path === 'uid' || patch.path.startsWith('uid.')) {
      throw new CharacterError(400, 'A row uid cannot be patched')
    }
    const schema = resolvePathSchema(patch.path, itemSchema)
    assertValueMatches(patch.path, schema, patch.value)
  }

  const applied = []
  for (const patch of patches) {
    writeAtPath(row, patch.path, patch.value)
    applied.push(patch.path)
  }
  record.modifiedAt = new Date().toISOString()

  const { valid, errors } = validate(record, characterSchema)
  if (!valid) {
    throw new CharacterError(400, 'Patch produced an invalid character', errors)
  }

  writeData(data)
  log(
    'characters',
    'info',
    `Patched ${listName} row ${uid} by ${actor}: ${applied.join(', ')}`,
  )
  return { record, applied }
}

/**
 * Remove one row, addressed by uid.
 *
 * @param {string} id
 * @param {string} listName
 * @param {string} uid
 * @param {string} [actor]
 * @returns {{ record: Object }}
 */
export function removeListItem(id, listName, uid, actor = 'unknown') {
  const data = readData()
  const { record, list } = resolveList(data, id, listName)
  list.splice(requireRowIndex(list, listName, uid), 1)
  record.modifiedAt = new Date().toISOString()
  writeData(data)
  log('characters', 'info', `Removed ${listName} row ${uid} by ${actor}`)
  return { record }
}
