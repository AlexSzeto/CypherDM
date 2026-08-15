import { describe, test, expect } from 'vitest'
import { DATA_DOMAINS, getCurrentVersion } from './data-versions.mjs'

describe('data-versions', () => {
  test('getCurrentVersion returns currentVersion for registered domain', () => {
    expect(getCurrentVersion('config')).toBe(DATA_DOMAINS.config.currentVersion)
  })

  test('getCurrentVersion returns 0 for unknown domain', () => {
    expect(getCurrentVersion('not-a-real-domain')).toBe(0)
  })
})
