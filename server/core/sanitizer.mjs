import Ajv from 'ajv'
import { log } from './logger.mjs'

export const STRICT_VALIDATION_WARNINGS = false

const ajv = new Ajv({ allErrors: true, useDefaults: false })

function resolveSchema(schema, rootSchema) {
  if (!schema || typeof schema !== 'object') return schema

  if ('$ref' in schema) {
    const refPath = schema.$ref
    if (!refPath.startsWith('#/')) return schema
    const parts = refPath.slice(2).split('/')
    let resolved = rootSchema
    for (const part of parts) {
      if (!resolved || typeof resolved !== 'object') return schema
      resolved = resolved[part]
    }
    return resolved || schema
  }

  if (Array.isArray(schema.allOf) && schema.allOf.length === 1) {
    const base = resolveSchema(schema.allOf[0], rootSchema)
    return 'default' in schema ? { ...base, default: schema.default } : base
  }

  return schema
}

function sanitizeWithRoot(data, schema, rootSchema) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data

  const resolved = resolveSchema(schema, rootSchema)
  const properties = resolved.properties || {}

  for (const [key, rawPropSchema] of Object.entries(properties)) {
    const propSchema = resolveSchema(rawPropSchema, rootSchema)

    if (data[key] === undefined && 'default' in propSchema) {
      data[key] = JSON.parse(JSON.stringify(propSchema.default))
    }

    const val = data[key]
    if (val !== null && val !== undefined) {
      const rawType = propSchema.type
      const type = Array.isArray(rawType)
        ? rawType.find((t) => t !== 'null')
        : rawType

      if (type === 'object' || propSchema.properties) {
        sanitizeWithRoot(val, propSchema, rootSchema)
      } else if (type === 'array' && propSchema.items && Array.isArray(val)) {
        const itemSchema = resolveSchema(propSchema.items, rootSchema)
        if (itemSchema.properties || itemSchema.type === 'object') {
          for (const item of val) {
            sanitizeWithRoot(item, itemSchema, rootSchema)
          }
        }
      }
    }
  }

  if (STRICT_VALIDATION_WARNINGS) {
    for (const key of Object.keys(data)) {
      if (!(key in properties)) {
        log('sanitizer', 'warn', `Unknown field "${key}"`)
      }
    }
  }

  return data
}

export function sanitize(data, schema) {
  return sanitizeWithRoot(data, schema, schema)
}

export function validate(data, schema) {
  const isValid = ajv.validate(schema, data)
  const errors = ajv.errors ? [...ajv.errors] : null

  if (STRICT_VALIDATION_WARNINGS && errors) {
    for (const err of errors) {
      log(
        'sanitizer',
        'warn',
        `Validation warning: ${err.message} at "${err.instancePath}"`,
      )
    }
  }

  return { valid: isValid, errors }
}
