import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setDatabaseDir, readData } from './repository.mjs'
import {
  CharacterError,
  createCharacter,
  deleteCharacter,
  getCharacter,
  listCharacters,
  patchCharacter,
} from './service.mjs'

let tempDir

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cypher-characters-'))
  setDatabaseDir(tempDir)
})

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true })
})

describe('createCharacter', () => {
  it('fills every schema default and assigns a uuid id', () => {
    const record = createCharacter({ name: 'Sora' })

    expect(record.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
    expect(record.name).toBe('Sora')
    expect(record.tier).toBe(1)
    expect(record.pools.might).toEqual({ max: 0, current: 0, edge: 0 })
    expect(record.recovery.used).toEqual([false, false, false, false])
    expect(record.skills).toEqual([])
    expect(record.currency).toEqual({ amount: 0 })
    expect(record.advancement.extraEffort).toBe(false)
  })

  it('stamps the data file with the current domain version', () => {
    createCharacter()
    expect(readData().version).toBe(1)
  })

  it('persists across reads', () => {
    const created = createCharacter({ name: 'Vess' })
    expect(listCharacters()).toHaveLength(1)
    expect(getCharacter(created.id).name).toBe('Vess')
  })
})

describe('patchCharacter', () => {
  it('changes only the patched field', () => {
    const { id } = createCharacter({ name: 'Sora' })
    const { record, applied } = patchCharacter(id, {
      actor: 'test',
      patches: [{ path: 'pools.might.current', value: 9 }],
    })

    expect(applied).toEqual(['pools.might.current'])
    expect(record.pools.might.current).toBe(9)
    expect(record.pools.might.max).toBe(0)
    expect(record.pools.speed.current).toBe(0)
    expect(record.name).toBe('Sora')
  })

  it('lets the last write to a repeated path win', () => {
    const { id } = createCharacter()
    const { record } = patchCharacter(id, {
      actor: 'test',
      patches: [
        { path: 'xp', value: 3 },
        { path: 'xp', value: 7 },
      ],
    })
    expect(record.xp).toBe(7)
  })

  it('accepts the recovery array as a whole', () => {
    const { id } = createCharacter()
    const { record } = patchCharacter(id, {
      actor: 'test',
      patches: [{ path: 'recovery.used', value: [true, false, false, false] }],
    })
    expect(record.recovery.used).toEqual([true, false, false, false])
  })

  it('rejects an unknown path', () => {
    const { id } = createCharacter()
    expect(() =>
      patchCharacter(id, {
        actor: 'test',
        patches: [{ path: 'pools.might.currrent', value: 9 }],
      }),
    ).toThrow(/Unknown patch path/)
  })

  it('rejects a list row addressed by index', () => {
    const { id } = createCharacter()
    expect(() =>
      patchCharacter(id, {
        actor: 'test',
        patches: [{ path: 'skills.0.name', value: 'Climbing' }],
      }),
    ).toThrow(/addresses a list row by index/)
  })

  it('rejects a wholesale write to a list of records', () => {
    const { id } = createCharacter()
    expect(() =>
      patchCharacter(id, {
        actor: 'test',
        patches: [{ path: 'skills', value: [{ name: 'Climbing' }] }],
      }),
    ).toThrow(/cannot be patched wholesale/)
  })

  it('rejects a prototype-polluting path and leaves prototypes clean', () => {
    const { id } = createCharacter()
    expect(() =>
      patchCharacter(id, {
        actor: 'test',
        patches: [{ path: '__proto__.polluted', value: 'yes' }],
      }),
    ).toThrow(/Illegal patch path segment/)
    expect({}.polluted).toBeUndefined()
  })

  it('rejects a value of the wrong type', () => {
    const { id } = createCharacter()
    expect(() =>
      patchCharacter(id, {
        actor: 'test',
        patches: [{ path: 'tier', value: 'two' }],
      }),
    ).toThrow(/must be of type number/)
  })

  it('writes nothing when one patch in a batch is invalid', () => {
    const { id } = createCharacter()
    expect(() =>
      patchCharacter(id, {
        actor: 'test',
        patches: [
          { path: 'xp', value: 4 },
          { path: 'nope', value: 1 },
        ],
      }),
    ).toThrow(CharacterError)
    expect(getCharacter(id).xp).toBe(0)
  })
})

describe('deleteCharacter', () => {
  it('removes the record and reports not-found on a second delete', () => {
    const { id } = createCharacter()
    deleteCharacter(id)
    expect(listCharacters()).toHaveLength(0)
    expect(() => deleteCharacter(id)).toThrow(CharacterError)
    expect(() => getCharacter(id)).toThrow(/No character with id/)
  })
})
