#!/usr/bin/env node
/**
 * Usage: node scripts/move-feature.mjs <filename> <from-lane> <to-lane> [--rename <new-filename>]
 *
 * Moves a feature card from one kanban lane to another:
 *   .kanban/boards/features/<from-lane>/<filename>
 *   → .kanban/boards/features/<to-lane>/<new-filename>
 *
 * Frontmatter fields updated automatically:
 *   - status   → <to-lane>
 *   - modified → current timestamp
 *   - order    → end of destination lane (computed from existing cards)
 *   - id       → new basename (only when --rename is used)
 *
 * Also handles:
 *   - Attachment files in <lane>/attachments/ (renamed when --rename is used)
 *   - Card-state JSON in .kanban/card-state/ (renamed + id updated when --rename is used)
 *   - .kanban/.active-card.json (updated when --rename targets the active card)
 *
 * If the destination file already exists (e.g. content was pre-written by an
 * agent), only the source file is deleted — the existing destination is kept.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const VALID_LANES = [
  'backlog',
  'planned',
  'groomed',
  'in-progress',
  'done',
  'abandoned',
]

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BOARDS = path.join(ROOT, '.kanban', 'boards', 'features')
const KANBAN = path.join(ROOT, '.kanban')

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)

let renameTarget = null
const renameIdx = args.indexOf('--rename')
if (renameIdx !== -1) {
  renameTarget = args[renameIdx + 1]
  if (!renameTarget || renameTarget.startsWith('--')) {
    console.error('--rename requires a filename argument')
    process.exit(1)
  }
  args.splice(renameIdx, 2)
}

const [filename, fromLane, toLane] = args

if (!filename || !fromLane || !toLane) {
  console.error(
    'Usage: node scripts/move-feature.mjs <filename> <from-lane> <to-lane> [--rename <new-filename>]',
  )
  console.error(`Valid lanes: ${VALID_LANES.join(', ')}`)
  process.exit(1)
}

if (!VALID_LANES.includes(fromLane)) {
  console.error(
    `Unknown from-lane "${fromLane}". Valid lanes: ${VALID_LANES.join(', ')}`,
  )
  process.exit(1)
}

if (!VALID_LANES.includes(toLane)) {
  console.error(
    `Unknown to-lane "${toLane}". Valid lanes: ${VALID_LANES.join(', ')}`,
  )
  process.exit(1)
}

if (fromLane === toLane) {
  console.error(
    `from-lane and to-lane are the same ("${fromLane}") — nothing to do.`,
  )
  process.exit(1)
}

const destFilename = renameTarget ?? filename
const srcBasename = filename.replace(/\.md$/, '')
const destBasename = destFilename.replace(/\.md$/, '')

const sourcePath = path.join(BOARDS, fromLane, filename)
const destDir = path.join(BOARDS, toLane)
const destPath = path.join(destDir, destFilename)

if (!fs.existsSync(sourcePath)) {
  console.error(`Not found: ${sourcePath}`)
  process.exit(1)
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true })
}

// ---------------------------------------------------------------------------
// Move card file
// ---------------------------------------------------------------------------

const destExists = fs.existsSync(destPath)

if (!destExists) {
  const newOrder = computeEndOrder(destDir)
  let raw = fs.readFileSync(sourcePath, 'utf8')

  raw = replaceFrontmatterField(raw, 'status', toLane)
  raw = replaceFrontmatterField(raw, 'modified', new Date().toISOString())
  raw = replaceFrontmatterField(raw, 'order', newOrder)
  if (renameTarget) {
    raw = replaceFrontmatterField(raw, 'id', destBasename)
  }

  fs.writeFileSync(destPath, raw, 'utf8')
}

fs.unlinkSync(sourcePath)

// ---------------------------------------------------------------------------
// Move attachment file (rename-aware)
// ---------------------------------------------------------------------------

const srcAttachment = path.join(
  BOARDS,
  fromLane,
  'attachments',
  `${srcBasename}.log`,
)
if (fs.existsSync(srcAttachment)) {
  const destAttachmentDir = path.join(destDir, 'attachments')
  if (!fs.existsSync(destAttachmentDir)) {
    fs.mkdirSync(destAttachmentDir, { recursive: true })
  }
  const destAttachment = path.join(destAttachmentDir, `${destBasename}.log`)
  fs.copyFileSync(srcAttachment, destAttachment)
  fs.unlinkSync(srcAttachment)
}

// ---------------------------------------------------------------------------
// Rename card-state JSON files (only when --rename is used)
// ---------------------------------------------------------------------------

if (renameTarget) {
  const cardStateRoot = path.join(KANBAN, 'card-state')

  if (fs.existsSync(cardStateRoot)) {
    for (const actorId of fs.readdirSync(cardStateRoot)) {
      const boardStateDir = path.join(cardStateRoot, actorId, 'features')
      const oldStatePath = path.join(boardStateDir, `${srcBasename}.json`)
      const newStatePath = path.join(boardStateDir, `${destBasename}.json`)

      if (!fs.existsSync(oldStatePath)) continue

      const stateJson = JSON.parse(fs.readFileSync(oldStatePath, 'utf8'))
      stateJson.cardId = destBasename
      fs.writeFileSync(newStatePath, JSON.stringify(stateJson, null, 2), 'utf8')
      fs.unlinkSync(oldStatePath)
    }
  }

  // Update .active-card.json if it references the old card id
  const activeCardPath = path.join(KANBAN, '.active-card.json')
  if (fs.existsSync(activeCardPath)) {
    const active = JSON.parse(fs.readFileSync(activeCardPath, 'utf8'))
    if (active.cardId === srcBasename && active.boardId === 'features') {
      active.cardId = destBasename
      active.updatedAt = new Date().toISOString()
      fs.writeFileSync(activeCardPath, JSON.stringify(active, null, 2), 'utf8')
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (destExists) {
  const renameNote = renameTarget
    ? ' (--rename ignored — destination already existed)'
    : ''
  console.log(
    `Removed source .kanban/boards/features/${fromLane}/${filename} (destination already existed — content preserved)${renameNote}.`,
  )
} else {
  const renameNote = renameTarget ? ` (renamed to ${destFilename})` : ''
  console.log(
    `Moved .kanban/boards/features/${fromLane}/${filename} → .kanban/boards/features/${toLane}/${destFilename}${renameNote}`,
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Replace a frontmatter `key: 'value'` or `key: "value"` line's value,
 * preserving whichever quote character the file already used.
 * Returns the original string unchanged if the key isn't found.
 */
function replaceFrontmatterField(raw, key, newValue) {
  return raw.replace(
    new RegExp(`^(${key}:\\s*)(['"])[^'"]*\\2`, 'm'),
    (_match, prefix, quote) => `${prefix}${quote}${newValue}${quote}`,
  )
}

/**
 * Compute an order value that sorts after all existing cards in destDir.
 * Reads order fields from every .md file in the directory and appends 'V'
 * (a mid-range character in the fractional-index alphabet) to the maximum,
 * producing a value that is strictly greater than any current order.
 */
function computeEndOrder(dir) {
  if (!fs.existsSync(dir)) return 'a0'

  const orders = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .flatMap((f) => {
      try {
        const content = fs.readFileSync(path.join(dir, f), 'utf8')
        const match = content.match(/^order:\s*['"]([^'"]*)['"]/m)
        return match ? [match[1]] : []
      } catch {
        return []
      }
    })

  if (orders.length === 0) return 'a0'

  const max = [...orders].sort().at(-1)
  // Appending 'V' produces a string that starts with `max`, making it
  // lexicographically greater — safe regardless of the fractional-index scheme.
  return max + 'V'
}
