import express from 'express'
import fs from 'fs'
import os from 'os'
import path from 'path'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setDatabaseDir } from './repository.mjs'
import { router } from './router.mjs'

let app
let tempDir

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cypher-characters-router-'))
  setDatabaseDir(tempDir)

  app = express()
  app.use(express.json())
  app.use('/api/characters', router)
})

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true })
})

describe('characters router', () => {
  it('creates, reads, and lists a character', async () => {
    const created = await request(app)
      .post('/api/characters')
      .send({ name: 'Sora' })
      .expect(201)

    const { id } = created.body.record
    expect(created.body.record.name).toBe('Sora')

    const read = await request(app).get(`/api/characters/${id}`).expect(200)
    expect(read.body.record.id).toBe(id)

    const list = await request(app).get('/api/characters').expect(200)
    expect(list.body.characters).toHaveLength(1)
  })

  it('applies a patch and echoes the actor and client sequence', async () => {
    const created = await request(app).post('/api/characters').send({})
    const { id } = created.body.record

    const patched = await request(app)
      .patch(`/api/characters/${id}`)
      .send({
        actor: 'harness',
        clientSeq: 7,
        patches: [{ path: 'pools.speed.current', value: 4 }],
      })
      .expect(200)

    expect(patched.body.record.pools.speed.current).toBe(4)
    expect(patched.body.applied).toEqual(['pools.speed.current'])
    expect(patched.body.actor).toBe('harness')
    expect(patched.body.clientSeq).toBe(7)
  })

  it('answers 400 with details on a malformed patch body', async () => {
    const created = await request(app).post('/api/characters').send({})
    const { id } = created.body.record

    const response = await request(app)
      .patch(`/api/characters/${id}`)
      .send({ patches: [] })
      .expect(400)

    expect(response.body.error).toBe('Invalid request')
    expect(response.body.details.length).toBeGreaterThan(0)
  })

  it('answers 400 on an unknown patch path', async () => {
    const created = await request(app).post('/api/characters').send({})
    const { id } = created.body.record

    const response = await request(app)
      .patch(`/api/characters/${id}`)
      .send({ actor: 'harness', patches: [{ path: 'nope', value: 1 }] })
      .expect(400)

    expect(response.body.error).toMatch(/Unknown patch path/)
  })

  it('answers 404 for an unknown id', async () => {
    await request(app).get('/api/characters/does-not-exist').expect(404)
  })

  it('deletes a character', async () => {
    const created = await request(app).post('/api/characters').send({})
    const { id } = created.body.record

    await request(app).delete(`/api/characters/${id}`).expect(204)
    await request(app).get(`/api/characters/${id}`).expect(404)
  })
})

describe('list item routes', () => {
  /** @returns {Promise<string>} the id of a freshly created character */
  async function createId() {
    const created = await request(app).post('/api/characters').send({})
    return created.body.record.id
  }

  it('adds, patches, and removes a row by uid', async () => {
    const id = await createId()

    const added = await request(app)
      .post(`/api/characters/${id}/skills`)
      .send({ actor: 'harness', seed: { name: 'Climbing' } })
      .expect(201)

    const { uid } = added.body.item
    expect(uid).toBeTruthy()
    expect(added.body.record.skills).toHaveLength(1)

    const patched = await request(app)
      .patch(`/api/characters/${id}/skills/${uid}`)
      .send({ actor: 'harness', patches: [{ path: 'name', value: 'Diving' }] })
      .expect(200)
    expect(patched.body.record.skills[0].name).toBe('Diving')

    const removed = await request(app)
      .delete(`/api/characters/${id}/skills/${uid}`)
      .send({ actor: 'harness' })
      .expect(200)
    expect(removed.body.record.skills).toHaveLength(0)

    await request(app)
      .delete(`/api/characters/${id}/skills/${uid}`)
      .send({ actor: 'harness' })
      .expect(404)
  })

  it('answers 404 for an unknown list name', async () => {
    const id = await createId()
    await request(app)
      .post(`/api/characters/${id}/nonsense`)
      .send({ actor: 'harness' })
      .expect(404)
  })

  it('answers 400 when the add body has no actor', async () => {
    const id = await createId()
    const response = await request(app)
      .post(`/api/characters/${id}/skills`)
      .send({})
      .expect(400)
    expect(response.body.details.length).toBeGreaterThan(0)
  })
})
