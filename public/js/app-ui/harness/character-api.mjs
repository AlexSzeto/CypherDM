/**
 * Character API client.
 *
 * The single place the browser talks to `/api/characters`. Every surface that
 * edits a character goes through here, so the offline queue story has one
 * place to change: `patchCharacter`'s signature is the contract, its internals
 * are not.
 */
import { log } from '../../custom-ui/logger.mjs'

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
    log('harness', 'error', `Request to ${url} failed: ${error}`)
    throw error
  }

  if (!response.ok) {
    const body = await response.text()
    log(
      'harness',
      'error',
      `${options.method ?? 'GET'} ${url} → ${response.status}: ${body}`,
    )
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
 * Apply field-level patches to a character.
 *
 * @param {string} id
 * @param {Array<{ path: string, value: * }>} patches
 * @param {string} actor - who is writing; echoed back by the server
 * @returns {Promise<Object>} the updated record
 */
export async function patchCharacter(id, patches, actor) {
  const body = await request(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, patches }),
  })
  return body.record
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteCharacter(id) {
  await request(`${BASE}/${id}`, { method: 'DELETE' })
}
