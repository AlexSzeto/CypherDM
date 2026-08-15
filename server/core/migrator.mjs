/**
 * Data migration runner.
 *
 * On server startup, checks each registered domain's data version against its
 * expected current version. Runs chained migration scripts as needed, backing
 * up data before any changes and restoring on failure.
 *
 * Migration scripts live at: scripts/migrate/<domain>/<N>-to-<M>.mjs
 * Each exports: fromVersion (number), toVersion (number), migrate(data) → data
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { DATA_DOMAINS } from './data-versions.mjs'
import { log } from './logger.mjs'
import { BACKUP_DIR } from './paths.mjs'

const defaultMigrationsRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'scripts',
  'migrate',
)

/**
 * Load and parse a JSON data file. Returns parsed object.
 * @param {string} filePath
 * @returns {Object}
 */
function readDataFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

/**
 * Discover all migration scripts for a domain and return them sorted.
 * @param {string} domain
 * @param {string} [migrationsRoot]
 * @returns {Promise<Array<{fromVersion: number, toVersion: number, migrate: Function}>>}
 */
async function loadMigrations(domain, migrationsRoot = defaultMigrationsRoot) {
  const migrationsDir = path.join(migrationsRoot, domain)

  if (!fs.existsSync(migrationsDir)) return []

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => /^\d+-to-\d+\.mjs$/.test(f))
  const migrations = []

  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(migrationsDir, file)).href)
    migrations.push({
      fromVersion: mod.fromVersion,
      toVersion: mod.toVersion,
      migrate: mod.migrate,
    })
  }

  return migrations
}

/**
 * Build an ordered migration chain from startVersion to targetVersion.
 * Throws if no complete chain exists.
 * @param {Array} migrations
 * @param {number} startVersion
 * @param {number} targetVersion
 * @param {string} domain
 * @returns {Array}
 */
function buildChain(migrations, startVersion, targetVersion, domain) {
  const chain = []
  let current = startVersion

  while (current < targetVersion) {
    const step = migrations.find((m) => m.fromVersion === current)
    if (!step) {
      throw new Error(
        `[${domain}] No migration path found from version ${startVersion} to ${targetVersion}. ` +
          `Missing script(s) in scripts/migrate/${domain}/ (stuck at v${current})`,
      )
    }
    chain.push(step)
    current = step.toVersion
  }

  return chain
}

/**
 * Apply an ordered migration chain to a data object, stamping `.version`
 * after each step.
 * @param {Object} data
 * @param {Array<{fromVersion:number, toVersion:number, migrate:Function}>} chain
 * @param {{ beforeStep?: (step: Object) => void, afterStep?: (migrated: Object, step: Object) => void }} [callbacks]
 * @returns {Object} migrated data
 */
function runChain(data, chain, { beforeStep, afterStep } = {}) {
  let migrated = data
  for (const step of chain) {
    beforeStep?.(step)
    migrated = step.migrate(migrated)
    migrated.version = step.toVersion
    afterStep?.(migrated, step)
  }
  return migrated
}

/**
 * Write a timestamped backup of a data file to BACKUP_DIR.
 * @param {string} domain
 * @param {number} version
 * @param {string} filePath
 * @param {string} [backupDir]
 * @returns {string} backup file path
 */
function writeBackup(domain, version, filePath, backupDir = BACKUP_DIR) {
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)
  const backupPath = path.join(
    backupDir,
    `${domain}-v${version}-${timestamp}.json`,
  )
  fs.copyFileSync(filePath, backupPath)
  return backupPath
}

/**
 * Run migrations for a single domain.
 * @param {string} domain
 * @param {{ currentVersion: number, filePath: string }} domainConfig
 * @param {{ backupDir?: string, migrationsRoot?: string }} [options]
 */
export async function migrateDomain(
  domain,
  { currentVersion, filePath },
  { backupDir = BACKUP_DIR, migrationsRoot = defaultMigrationsRoot } = {},
) {
  if (!fs.existsSync(filePath)) return

  const data = readDataFile(filePath)
  const dataVersion = typeof data.version === 'number' ? data.version : 0

  if (dataVersion === currentVersion) return

  if (dataVersion > currentVersion) {
    throw new Error(
      `[${domain}] Data is at version ${dataVersion} but server expects ${currentVersion}. ` +
        `Please update the server to the latest version.`,
    )
  }

  // dataVersion < currentVersion — migration needed
  const migrations = await loadMigrations(domain, migrationsRoot)
  const chain = buildChain(migrations, dataVersion, currentVersion, domain)

  const backupPath = writeBackup(domain, dataVersion, filePath, backupDir)
  log(
    'migrate',
    'info',
    `[${domain}] Backing up v${dataVersion} → ${backupPath}`,
  )

  let migrated = data
  try {
    migrated = runChain(data, chain, {
      beforeStep: (step) =>
        log(
          'migrate',
          'info',
          `[${domain}] Migrating v${step.fromVersion} → v${step.toVersion}`,
        ),
      afterStep: (result) => {
        migrated = result
      },
    })
    fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2), 'utf8')
    log(
      'migrate',
      'info',
      `[${domain}] Migration complete (now at v${currentVersion})`,
    )
  } catch (err) {
    fs.copyFileSync(backupPath, filePath)
    throw new Error(
      `[${domain}] Migration from v${migrated.version ?? dataVersion} failed: ${err.message}. ` +
        `Original data restored from backup.`,
    )
  }
}

/**
 * Run migrations for all registered domains. Called on server startup.
 * Throws on any version mismatch that cannot be resolved — prevents server from starting.
 * @param {{ domains?: Object, backupDir?: string, migrationsRoot?: string }} [options]
 */
export async function migrateAll({
  domains = DATA_DOMAINS,
  backupDir = BACKUP_DIR,
  migrationsRoot = defaultMigrationsRoot,
} = {}) {
  for (const [domain, domainConfig] of Object.entries(domains)) {
    await migrateDomain(domain, domainConfig, { backupDir, migrationsRoot })
  }
}
