/**
 * Character HTTP endpoints.
 *
 * Routes extract parameters, validate the request body, and call the service.
 * No domain logic lives here.
 */
import express from 'express'

import { validate } from '../../core/sanitizer.mjs'
import {
  addListItem,
  CharacterError,
  createCharacter,
  deleteCharacter,
  getCharacter,
  listCharacters,
  patchCharacter,
  patchListItem,
  removeListItem,
} from './service.mjs'

/** Request body schema for `POST /`. */
export const createRequestSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    name: { type: 'string' },
  },
}

/** Request body schema for `PATCH /:id`. */
export const patchRequestSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['actor', 'patches'],
  properties: {
    actor: { type: 'string', minLength: 1 },
    clientSeq: { type: 'number' },
    patches: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string', minLength: 1 },
          value: {},
        },
      },
    },
  },
}

/** Request body schema for `POST /:id/:listName`. */
export const addListItemRequestSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['actor'],
  properties: {
    actor: { type: 'string', minLength: 1 },
    seed: { type: 'object' },
  },
}

/** Request body schema for `DELETE /:id/:listName/:uid`. */
export const removeListItemRequestSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['actor'],
  properties: {
    actor: { type: 'string', minLength: 1 },
  },
}

/**
 * Send a `CharacterError` as its status, or rethrow anything unexpected.
 * @param {import('express').Response} res
 * @param {Error} error
 */
function sendError(res, error) {
  if (error instanceof CharacterError) {
    return res.status(error.status).json({
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    })
  }
  throw error
}

export const router = express.Router()

router.get('/', (req, res) => {
  res.json({ characters: listCharacters() })
})

router.post('/', (req, res) => {
  const body = req.body ?? {}
  const { valid, errors } = validate(body, createRequestSchema)
  if (!valid) {
    return res.status(400).json({ error: 'Invalid request', details: errors })
  }
  res.status(201).json({ record: createCharacter({ name: body.name }) })
})

router.get('/:id', (req, res) => {
  try {
    res.json({ record: getCharacter(req.params.id) })
  } catch (error) {
    sendError(res, error)
  }
})

router.patch('/:id', (req, res) => {
  const body = req.body ?? {}
  const { valid, errors } = validate(body, patchRequestSchema)
  if (!valid) {
    return res.status(400).json({ error: 'Invalid request', details: errors })
  }

  try {
    const { record, applied } = patchCharacter(req.params.id, body)
    res.json({
      record,
      applied,
      actor: body.actor,
      ...(body.clientSeq === undefined ? {} : { clientSeq: body.clientSeq }),
    })
  } catch (error) {
    sendError(res, error)
  }
})

router.post('/:id/:listName', (req, res) => {
  const body = req.body ?? {}
  const { valid, errors } = validate(body, addListItemRequestSchema)
  if (!valid) {
    return res.status(400).json({ error: 'Invalid request', details: errors })
  }

  try {
    const { record, item } = addListItem(
      req.params.id,
      req.params.listName,
      body.seed ?? {},
      body.actor,
    )
    res.status(201).json({ record, item })
  } catch (error) {
    sendError(res, error)
  }
})

router.patch('/:id/:listName/:uid', (req, res) => {
  const body = req.body ?? {}
  const { valid, errors } = validate(body, patchRequestSchema)
  if (!valid) {
    return res.status(400).json({ error: 'Invalid request', details: errors })
  }

  try {
    const { record, applied } = patchListItem(
      req.params.id,
      req.params.listName,
      req.params.uid,
      body,
    )
    res.json({
      record,
      applied,
      actor: body.actor,
      ...(body.clientSeq === undefined ? {} : { clientSeq: body.clientSeq }),
    })
  } catch (error) {
    sendError(res, error)
  }
})

// Answers with the record rather than 204: the client needs the surviving rows
// to re-render, and a follow-up GET would race a concurrent write.
router.delete('/:id/:listName/:uid', (req, res) => {
  const body = req.body ?? {}
  const { valid, errors } = validate(body, removeListItemRequestSchema)
  if (!valid) {
    return res.status(400).json({ error: 'Invalid request', details: errors })
  }

  try {
    const { record } = removeListItem(
      req.params.id,
      req.params.listName,
      req.params.uid,
      body.actor,
    )
    res.json({ record })
  } catch (error) {
    sendError(res, error)
  }
})

router.delete('/:id', (req, res) => {
  try {
    deleteCharacter(req.params.id)
    res.status(204).end()
  } catch (error) {
    sendError(res, error)
  }
})

export default router
