import { describe, it, expect } from 'vitest'
import { sanitize, validate } from './sanitizer.mjs'

const flatSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['uid'],
  properties: {
    uid: { type: 'string' },
    name: { type: 'string', default: '' },
    count: { type: 'number', default: 0 },
    active: { type: 'boolean', default: false },
    tags: { type: 'array', items: { type: 'string' }, default: [] },
  },
}

const nestedSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['uid'],
  $defs: {
    Inner: {
      type: 'object',
      properties: {
        value: { type: 'string', default: 'default-value' },
        num: { type: 'number', default: 42 },
      },
    },
    Item: {
      type: 'object',
      properties: {
        label: { type: 'string', default: '' },
        score: { type: 'number', default: 0 },
      },
    },
  },
  properties: {
    uid: { type: 'string' },
    inner: { $ref: '#/$defs/Inner' },
    items: {
      type: 'array',
      items: { $ref: '#/$defs/Item' },
      default: [],
    },
    meta: {
      type: 'object',
      properties: {
        note: { type: 'string', default: '' },
      },
    },
  },
}

describe('sanitize — flat object', () => {
  it('fills missing fields with defaults', () => {
    const data = { uid: 'abc' }
    sanitize(data, flatSchema)
    expect(data.name).toBe('')
    expect(data.count).toBe(0)
    expect(data.active).toBe(false)
    expect(data.tags).toEqual([])
  })

  it('does not overwrite present fields', () => {
    const data = { uid: 'abc', name: 'hello', count: 5 }
    sanitize(data, flatSchema)
    expect(data.name).toBe('hello')
    expect(data.count).toBe(5)
  })

  it('does not strip unknown fields', () => {
    const data = { uid: 'abc', unknown: 'kept' }
    sanitize(data, flatSchema)
    expect(data.unknown).toBe('kept')
  })

  it('default arrays are independent copies', () => {
    const a = { uid: 'a' }
    const b = { uid: 'b' }
    sanitize(a, flatSchema)
    sanitize(b, flatSchema)
    a.tags.push('x')
    expect(b.tags).toEqual([])
  })
})

describe('sanitize — deeply nested objects', () => {
  it('fills defaults in nested $ref object', () => {
    const data = { uid: 'x', inner: {} }
    sanitize(data, nestedSchema)
    expect(data.inner.value).toBe('default-value')
    expect(data.inner.num).toBe(42)
  })

  it('fills defaults in inline nested object', () => {
    const data = { uid: 'x', meta: {} }
    sanitize(data, nestedSchema)
    expect(data.meta.note).toBe('')
  })

  it('does not mutate nested object when field is absent (no default at parent level)', () => {
    const data = { uid: 'x' }
    sanitize(data, nestedSchema)
    // inner has no default, so it should remain absent
    expect(data.inner).toBeUndefined()
  })
})

describe('sanitize — arrays of objects', () => {
  it('fills defaults in existing array items', () => {
    const data = { uid: 'x', items: [{ label: 'a' }, {}] }
    sanitize(data, nestedSchema)
    expect(data.items[0].score).toBe(0)
    expect(data.items[1].label).toBe('')
    expect(data.items[1].score).toBe(0)
  })

  it('fills default empty array when field is missing', () => {
    const data = { uid: 'x' }
    sanitize(data, nestedSchema)
    expect(data.items).toEqual([])
  })

  it('does not touch items of a present non-empty array that already has defaults', () => {
    const item = { label: 'existing', score: 99 }
    const data = { uid: 'x', items: [item] }
    sanitize(data, nestedSchema)
    expect(data.items[0].label).toBe('existing')
    expect(data.items[0].score).toBe(99)
  })
})

describe('validate', () => {
  it('returns valid:true for a passing input', () => {
    const result = validate({ uid: 'abc', name: 'hi' }, flatSchema)
    expect(result.valid).toBe(true)
    expect(result.errors).toBeNull()
  })

  it('returns valid:false and errors for a missing required field', () => {
    const result = validate({ name: 'hi' }, flatSchema)
    expect(result.valid).toBe(false)
    expect(Array.isArray(result.errors)).toBe(true)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].params.missingProperty).toBe('uid')
  })

  it('returns valid:false for wrong type', () => {
    const result = validate({ uid: 123 }, flatSchema)
    expect(result.valid).toBe(false)
    expect(result.errors).not.toBeNull()
  })

  it('does not strip unknown fields (permissive)', () => {
    const data = { uid: 'abc', extra: 'field' }
    const result = validate(data, flatSchema)
    expect(result.valid).toBe(true)
    expect(data.extra).toBe('field')
  })
})
