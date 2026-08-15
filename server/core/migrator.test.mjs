import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { migrateAll } from './migrator.mjs'

describe('migrator', () => {
  let tempDir
  let migrationsRoot
  let backupDir

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'migrator-test-'))
    migrationsRoot = path.join(tempDir, 'migrations')
    backupDir = path.join(tempDir, 'backups')
  })

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  test('no-op when data.version already equals the target', async () => {
    const filePath = path.join(tempDir, 'test.json')
    fs.writeFileSync(
      filePath,
      JSON.stringify({ version: 2, name: 'test' }),
      'utf8',
    )
    const domains = {
      testDomain: { currentVersion: 2, filePath },
    }
    await migrateAll({ domains, backupDir, migrationsRoot })
    const result = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    expect(result).toEqual({ version: 2, name: 'test' })
    expect(fs.existsSync(backupDir)).toBe(false)
  })

  test('no-op when the file has no version field and the target is 0', async () => {
    const filePath = path.join(tempDir, 'test.json')
    fs.writeFileSync(filePath, JSON.stringify({ name: 'unversioned' }), 'utf8')
    const domains = {
      testDomain: { currentVersion: 0, filePath },
    }
    await migrateAll({ domains, backupDir, migrationsRoot })
    const result = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    expect(result).toEqual({ name: 'unversioned' })
    expect(fs.existsSync(backupDir)).toBe(false)
  })

  test('a single-step migration writing the new version', async () => {
    const domainDir = path.join(migrationsRoot, 'testDomain')
    fs.mkdirSync(domainDir, { recursive: true })
    fs.writeFileSync(
      path.join(domainDir, '0-to-1.mjs'),
      [
        'export const fromVersion = 0',
        'export const toVersion = 1',
        'export function migrate(data) {',
        '  return { ...data, transformed: true }',
        '}',
      ].join('\n'),
      'utf8',
    )
    const filePath = path.join(tempDir, 'test.json')
    fs.writeFileSync(filePath, JSON.stringify({ count: 1 }), 'utf8')
    const domains = {
      testDomain: { currentVersion: 1, filePath },
    }
    await migrateAll({ domains, backupDir, migrationsRoot })
    const result = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    expect(result).toEqual({ count: 1, transformed: true, version: 1 })
  })

  test('a multi-step chain applying in order', async () => {
    const domainDir = path.join(migrationsRoot, 'testDomain')
    fs.mkdirSync(domainDir, { recursive: true })
    fs.writeFileSync(
      path.join(domainDir, '0-to-1.mjs'),
      [
        'export const fromVersion = 0',
        'export const toVersion = 1',
        'export function migrate(data) {',
        '  const log = data.log ?? []',
        '  return { ...data, log: [...log, "v1"] }',
        '}',
      ].join('\n'),
      'utf8',
    )
    fs.writeFileSync(
      path.join(domainDir, '1-to-2.mjs'),
      [
        'export const fromVersion = 1',
        'export const toVersion = 2',
        'export function migrate(data) {',
        '  return { ...data, log: [...data.log, "v2"] }',
        '}',
      ].join('\n'),
      'utf8',
    )
    const filePath = path.join(tempDir, 'test.json')
    fs.writeFileSync(filePath, JSON.stringify({ log: ['v0'] }), 'utf8')
    const domains = {
      testDomain: { currentVersion: 2, filePath },
    }
    await migrateAll({ domains, backupDir, migrationsRoot })
    const result = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    expect(result).toEqual({ log: ['v0', 'v1', 'v2'], version: 2 })
  })

  test('a throw naming "Please update the server to the latest version" when data version exceeds target', async () => {
    const filePath = path.join(tempDir, 'test.json')
    fs.writeFileSync(filePath, JSON.stringify({ version: 5 }), 'utf8')
    const domains = {
      testDomain: { currentVersion: 2, filePath },
    }
    await expect(
      migrateAll({ domains, backupDir, migrationsRoot }),
    ).rejects.toThrow('Please update the server to the latest version')
  })

  test('a throw naming "No migration path found" on a chain gap', async () => {
    const domainDir = path.join(migrationsRoot, 'testDomain')
    fs.mkdirSync(domainDir, { recursive: true })
    fs.writeFileSync(
      path.join(domainDir, '0-to-1.mjs'),
      [
        'export const fromVersion = 0',
        'export const toVersion = 1',
        'export function migrate(data) { return data }',
      ].join('\n'),
      'utf8',
    )
    const filePath = path.join(tempDir, 'test.json')
    fs.writeFileSync(filePath, JSON.stringify({ version: 0 }), 'utf8')
    const domains = {
      testDomain: { currentVersion: 2, filePath },
    }
    await expect(
      migrateAll({ domains, backupDir, migrationsRoot }),
    ).rejects.toThrow('No migration path found')
  })

  test('a backup file created before migrating', async () => {
    const domainDir = path.join(migrationsRoot, 'testDomain')
    fs.mkdirSync(domainDir, { recursive: true })
    fs.writeFileSync(
      path.join(domainDir, '0-to-1.mjs'),
      [
        'export const fromVersion = 0',
        'export const toVersion = 1',
        'export function migrate(data) {',
        '  return { ...data, migrated: true }',
        '}',
      ].join('\n'),
      'utf8',
    )
    const filePath = path.join(tempDir, 'test.json')
    const initialData = { foo: 'bar', version: 0 }
    fs.writeFileSync(filePath, JSON.stringify(initialData), 'utf8')
    const domains = {
      testDomain: { currentVersion: 1, filePath },
    }
    await migrateAll({ domains, backupDir, migrationsRoot })
    expect(fs.existsSync(backupDir)).toBe(true)
    const backupFiles = fs.readdirSync(backupDir)
    expect(backupFiles.length).toBe(1)
    expect(backupFiles[0]).toMatch(/^testDomain-v0-.*\.json$/)
    const backupContent = JSON.parse(
      fs.readFileSync(path.join(backupDir, backupFiles[0]), 'utf8'),
    )
    expect(backupContent).toEqual(initialData)
  })

  test('the original file restored plus a throw naming "Original data restored from backup" when a step throws', async () => {
    const domainDir = path.join(migrationsRoot, 'testDomain')
    fs.mkdirSync(domainDir, { recursive: true })
    fs.writeFileSync(
      path.join(domainDir, '0-to-1.mjs'),
      [
        'export const fromVersion = 0',
        'export const toVersion = 1',
        'export function migrate(data) {',
        '  throw new Error("step failed")',
        '}',
      ].join('\n'),
      'utf8',
    )
    const filePath = path.join(tempDir, 'test.json')
    const initialData = { safe: true, version: 0 }
    fs.writeFileSync(filePath, JSON.stringify(initialData), 'utf8')
    const domains = {
      testDomain: { currentVersion: 1, filePath },
    }
    await expect(
      migrateAll({ domains, backupDir, migrationsRoot }),
    ).rejects.toThrow('Original data restored from backup')
    const restoredData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    expect(restoredData).toEqual(initialData)
  })
})
