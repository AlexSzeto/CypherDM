/**
 * Character API client.
 *
 * The single place the browser talks to `/api/characters`. Reads go straight
 * out; writes go through the per-character patch queue, so a dropout queues
 * them locally and replays them in order rather than losing them.
 */
import { log } from '../custom-ui/logger.mjs'
import { getCharacterQueue } from './sync/character-queue.mjs'
import { PermanentSendError } from './sync/patch-queue.mjs'

const BASE = '/api/characters'

/**
 * Issue a request and parse its JSON body, logging and rethrowing failures.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Object|null>} parsed body, or null for an empty response
 */
async function request(url, options = {}) {
  let response
  try {
    response = await fetch(url, options)
  } catch (error) {
    // A transport failure is a dropout, not a fault: the queue retries it and
    // the save indicator reports it, so this is a warning, not an error.
    log('characters', 'warn', `Request to ${url} failed: ${error}`)
    throw error
  }

  if (!response.ok) {
    const body = await response.text()
    log(
      'characters',
      'error',
      `${options.method ?? 'GET'} ${url} → ${response.status}: ${body}`,
    )
    // A 4xx will never succeed on retry — a bad path, or a character that is
    // gone. A 5xx might, so it stays an ordinary failure the queue retries.
    if (response.status >= 400 && response.status < 500) {
      throw new PermanentSendError(
        `${response.status} ${body}`,
        response.status,
      )
    }
    throw new Error(`${response.status} ${body}`)
  }

  if (response.status === 204) return null
  return response.json()
}

/** @returns {Promise<Object[]>} every character record */
export async function listCharacters() {
  const body = await request(BASE)
  return body.characters
}

/**
 * @param {string} id
 * @returns {Promise<Object>} the character record
 */
export async function getCharacter(id) {
  const body = await request(`${BASE}/${id}`)
  return body.record
}

/**
 * @param {string} [name]
 * @returns {Promise<Object>} the created record
 */
export async function createCharacter(name = '') {
  const body = await request(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return body.record
}

/**
 * Send one batch of patches immediately. Called by the patch queue only —
 * every other caller goes through `patchCharacter`, which queues.
 *
 * @param {string} id
 * @param {Array<{ path: string, value: * }>} patches
 * @param {string} actor
 * @param {number} clientSeq
 * @returns {Promise<Object>} the updated record
 */
export async function patchCharacterBatch(id, patches, actor, clientSeq) {
  const body = await request(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, clientSeq, patches }),
  })
  return body.record
}

/**
 * Queue field-level patches for a character.
 *
 * The returned promise settles when the write actually lands on the server —
 * which, during a dropout, may be a minute after the edit was made. It rejects
 * only on a permanent failure; a transport failure leaves it pending while the
 * queue retries.
 *
 * @param {string} id
 * @param {Array<{ path: string, value: * }>} patches
 * @param {string} actor - who is writing; echoed back by the server
 * @returns {Promise<Object>} the updated record
 */
export async function patchCharacter(id, patches, actor) {
  return getCharacterQueue(id).enqueue(patches, { actor })
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteCharacter(id) {
  await request(`${BASE}/${id}`, { method: 'DELETE' })
}

/**
 * Append a row to one of a character's lists.
 *
 * Structural list operations go straight out rather than through the patch
 * queue: a queue that reordered an add against a row patch would address a row
 * the server has not created yet.
 *
 * @param {string} id
 * @param {string} listName
 * @param {Object} seed
 * @param {string} actor
 * @returns {Promise<{ record: Object, item: Object }>}
 */
export async function addListItem(id, listName, seed, actor) {
  return request(`${BASE}/${id}/${listName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, seed }),
  })
}

/**
 * Send one batch of row patches immediately. Called by the patch queue only.
 *
 * @param {string} id
 * @param {string} listName
 * @param {string} uid
 * @param {Array<{ path: string, value: * }>} patches
 * @param {string} actor
 * @param {number} clientSeq
 * @returns {Promise<Object>} the updated record
 */
export async function patchListItemBatch(
  id,
  listName,
  uid,
  patches,
  actor,
  clientSeq,
) {
  const body = await request(`${BASE}/${id}/${listName}/${uid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, clientSeq, patches }),
  })
  return body.record
}

/**
 * Patch one row of a list, addressed by its server-assigned uid.
 *
 * Row patches ride the same queue as record patches, so they keep their order
 * relative to everything else the player is doing. The row is identified by
 * the batch's context rather than by the patch path, which is why two rows
 * both patching `name` never coalesce into each other.
 *
 * @param {string} id
 * @param {string} listName
 * @param {string} uid
 * @param {Array<{ path: string, value: * }>} patches
 * @param {string} actor
 * @returns {Promise<Object>} the updated record
 */
export async function patchListItem(id, listName, uid, patches, actor) {
  return getCharacterQueue(id).enqueue(patches, { actor, listName, uid })
}

/**
 * Remove one row, addressed by uid. Structural, so it bypasses the queue for
 * the same reason `addListItem` does.
 *
 * @param {string} id
 * @param {string} listName
 * @param {string} uid
 * @param {string} actor
 * @returns {Promise<Object>} the updated record
 */
export async function removeListItem(id, listName, uid, actor) {
  const body = await request(`${BASE}/${id}/${listName}/${uid}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor }),
  })
  return body.record
}
