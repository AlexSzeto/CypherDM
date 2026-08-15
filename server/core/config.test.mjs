import { describe, test, expect } from 'vitest'
import fs from 'fs'
import { loadConfig, getConfig } from './config.mjs'
import { CONFIG_PATH, DEFAULT_CONFIG_PATH } from './paths.mjs'

describe('config loader', () => {
  test('config.default.json declares the project port', () => {
    const defaults = JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, 'utf8'))
    expect(defaults.serverPort).toBe(5000)
  })

  test('loadConfig creates config.json from defaults and exposes it', () => {
    const config = loadConfig()
    expect(fs.existsSync(CONFIG_PATH)).toBe(true)
    expect(config.serverPort).toBeTypeOf('number')
    expect(getConfig()).toBe(config)
  })
})
