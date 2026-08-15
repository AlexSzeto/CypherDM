---
version: 1
id: 'port-data-versioning-infrastructure'
boardId: 'features'
status: 'in-progress'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-15T07:55:00.000Z'
modified: '2026-08-15T08:06:28.366Z'
completedAt: null
labels: ['story']
attachments: []
order: 'a0V'
metadata:
  feature: 'project-imported-code-cleanup'
---

# Port Data Versioning And Sanitization Infrastructure

## Goal

Bring the schema sanitizer, version registry, and migration runner into `server/core/` from the previous project's copies in `scratch/`, scrubbed of that project's domains and wired to `config` as the first registered domain. When this lands, the data-management rules in `server.md` describe modules that exist, and `ajv` stops being an unused dependency.

## Tasks

### Phase 1 — Sanitizer available and tested

- [x] Complete initial implementation
  - Copy `scratch/sanitizer.mjs` to `server/core/sanitizer.mjs` unchanged except for the logging fix below. It has no coupling to the previous project — it imports only `ajv` and exports `sanitize(data, schema)` (recursive default-filling) and `validate(data, schema)` (permissive Ajv check returning `{ valid, errors }`).
  - In the copied `server/core/sanitizer.mjs`, replace both `console.warn` calls (one in `sanitizeWithRoot`'s unknown-field loop, one in `validate`'s error loop) with `log('sanitizer', 'warn', ...)`, importing `log` from `./logger.mjs`. `.claude/rules/server.md` forbids direct `console.*` calls. Preserve the `STRICT_VALIDATION_WARNINGS` export and the fact that both loops are gated behind it.
  - Copy `scratch/sanitizer.test.mjs` to `server/core/sanitizer.test.mjs` unchanged. Its `flatSchema` and `nestedSchema` fixtures are declared inline and reference no project domain. It covers 14 cases across four groups: flat default-filling, nested `$ref` resolution, arrays of objects, and `validate`.
  - Run `npx vitest run` and confirm the `server` project picks up the new test file and all 14 sanitizer cases pass. Suite total should rise from 75 to 89.

### Phase 2 — Version registry and migrator ported and unit-tested

- [x] Complete initial implementation
  - Add `BACKUP_DIR` to `server/core/paths.mjs`, resolving to `scripts/migrate/backups/` under `PROJECT_ROOT` — i.e. `path.join(PROJECT_ROOT, 'scripts', 'migrate', 'backups')`. `migrator.mjs` imports it for `writeBackup`. Note that `.gitignore` already ignores this directory and must keep doing so.
  - Copy `scratch/data-versions.mjs` to `server/core/data-versions.mjs`, then replace the `DATA_DOMAINS` object wholesale. The old registry lists eight domains from the previous project (`anytale-data`, `media-data`, `brew-data`, `sound-sources`, `workflows`, `tales-data`, `model-registry`, `config`); the new one has exactly one entry: `config: { currentVersion: 1, filePath: CONFIG_PATH }`. Drop the now-unused `DATABASE_DIR`, `WORKFLOWS_PATH`, and `RESOURCE_DIR` imports — `WORKFLOWS_PATH` does not exist in this project's `paths.mjs` and would be an import error. Keep `getCurrentVersion(domain)` as-is.
  - Delete `getLowestMigrationVersion` from `server/core/data-versions.mjs`, and delete `migrateDataObject` from `server/core/migrator.mjs`. Both exist solely to migrate an in-memory bundle during an import feature that CypherDM does not have and that `docs/cypher-system-design-spec.md` does not describe. Removing them also removes the only reason `data-versions.mjs` needs `fs`, `path`, and `pathToFileURL`. See "Dropped on purpose" below for how to restore them.
  - Copy `scratch/migrator.mjs` to `server/core/migrator.mjs`, keeping `readDataFile`, `loadMigrations`, `buildChain`, `runChain`, `writeBackup`, `migrateDomain`, and `migrateAll`. Replace all three `console.log` calls in `migrateDomain` with `log('migrate', 'info', ...)`, importing `log` from `./logger.mjs`.
  - Fix the migrations-directory resolution in `loadMigrations`. The source computes it as `path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))` — a Windows drive-letter hack that fails on a lowercase drive letter and mangles any path containing a space, because URL percent-encoding is never decoded. Replace it with `path.dirname(fileURLToPath(import.meta.url))`, importing `fileURLToPath` from `node:url`. This is the exact bug class `.claude/rules/server.md` warns about in its standalone-scripts rule.
  - Make `migrateAll` and `migrateDomain` testable by injecting paths rather than hardcoding them. `migrateAll` should accept an optional options object — `migrateAll({ domains = DATA_DOMAINS, backupDir = BACKUP_DIR, migrationsRoot } = {})` — and thread those values through `migrateDomain`, `writeBackup`, and `loadMigrations`, defaulting to today's real values when omitted so `migrateAll()` with no arguments behaves exactly as before. This is required for Phase 3's tests and is the reason the previous project's migrator test had to re-implement the module instead of calling it.
  - Create the directory `scripts/migrate/config/` and add `scripts/migrate/config/0-to-1.mjs` exporting `fromVersion = 0`, `toVersion = 1`, and a `migrate(data)` that returns `data` unchanged. Its only job is to let an existing unversioned `config.json` reach v1 so it gets stamped. It is trivially idempotent: it adds no field and remaps no value, so a second run is a no-op. Do not set `data.version` inside it — `runChain` stamps that.
  - Write `server/core/data-versions.test.mjs` from scratch — do not port `scratch/data-versions.test.mjs`, which asserts on `anytale-data` and `tales-data`. Assert that `getCurrentVersion('config')` returns `DATA_DOMAINS.config.currentVersion`, and that `getCurrentVersion('not-a-real-domain')` returns `0`.
  - Run `npx vitest run` and confirm it passes. Phase 3 adds the migrator's own tests.

### Phase 3 — Migrations run on startup and config is versioned

- [x] Complete initial implementation
  - Write `server/core/migrator.test.mjs` from scratch. Do **not** port `scratch/migrator.test.mjs`: its `describe('migrator')` block imports `./migrator.mjs`, discards the import, and re-implements the whole algorithm inline against temp directories, so its eight tests pass even if the module is deleted. Use the Phase 2 injection points to point the real `migrateAll` at an `fs.mkdtempSync` directory instead. Cover: no-op when `data.version` already equals the target; no-op when the file has no `version` field and the target is 0; a single-step migration writing the new version; a multi-step chain applying in order; a throw naming "Please update the server to the latest version" when data version exceeds target; a throw naming "No migration path found" on a chain gap; a backup file created before migrating; and the original file restored plus a throw naming "Original data restored from backup" when a step throws.
  - Add `server/resource/schemas/config.schema.json` — a JSON Schema draft-07 document for the config object with `serverPort` (`type: 'number'`, `default: 5000`) and `version` (`type: 'number'`). `.claude/rules/server.md` requires a schema file for every persisted domain, and this gives `sanitize()` its first real caller.
  - In `server/core/config.mjs`'s `loadConfig()`, call `sanitize(parsed, configSchema)` on the parsed config before returning it, importing the schema with `fs.readFileSync` + `JSON.parse` from `RESOURCE_DIR`. This fills any missing field from the schema default rather than relying on `config.default.json` having been copied.
  - Add `"version": 1` to `server/config.default.json` alongside `"serverPort": 5000`, so a freshly created `config.json` starts at the current version rather than being read as 0 on the next restart.
  - In `server/server.mjs`, call `await migrateAll()` inside the bootstrap section **before** `loadConfig()`, so config is migrated to v1 before it is read. Wrap it in the existing try/catch pattern: on failure, `log('server', 'error', ...)` and `process.exit(1)` — `.claude/rules/server.md` states an unresolvable version mismatch must prevent the server from starting.
  - Verify end to end against real data. Confirm `server/config.json` currently reads `{ "serverPort": 5000 }` with no `version` field, run `npm start`, then confirm three things: the log shows a backup line and a `v0 → v1` migration line; `server/config.json` now contains `"version": 1` with `serverPort` preserved; and a timestamped backup of the v0 file exists in `scripts/migrate/backups/`. Restart once more and confirm the migration does not re-run.
  - Run `npx vitest run` and confirm the full suite passes.
  - Review and update affected living docs: `.claude/rules/server.md`

## Implementation Details

### Source files

All six source files are in `scratch/` and are the previous project's working copies. `scratch/` is gitignored, so nothing there is committed; these are references to copy from, not files to move.

| Source                           | Destination                      | Disposition                                           |
| -------------------------------- | -------------------------------- | ----------------------------------------------------- |
| `scratch/sanitizer.mjs`          | `server/core/sanitizer.mjs`      | copy; swap 2 `console.warn` for `log()`               |
| `scratch/sanitizer.test.mjs`     | `server/core/sanitizer.test.mjs` | copy verbatim                                         |
| `scratch/data-versions.mjs`      | `server/core/data-versions.mjs`  | copy; replace `DATA_DOMAINS`; drop one function       |
| `scratch/data-versions.test.mjs` | —                                | **do not port** — rewrite (asserts on old domains)    |
| `scratch/migrator.mjs`           | `server/core/migrator.mjs`       | copy; `log()`, path fix, injection, drop one export   |
| `scratch/migrator.test.mjs`      | —                                | **do not port** — rewrite (tests a re-implementation) |

### Migration script contract

Scripts live at `scripts/migrate/<domain>/<N>-to-<M>.mjs` and export a fixed interface. `runChain` stamps `data.version = step.toVersion` after each step, so a migration must never set it itself:

```js
export const fromVersion = 0
export const toVersion = 1

/**
 * @param {Object} data - Parsed JSON data (do not set data.version)
 * @returns {Object} The migrated data object
 */
export function migrate(data) {
  return data
}
```

### Why `config` is the first domain

The registry needs at least one real entry or nothing exercises the migrator. `server/config.json` is the only data file that exists today — `server/database/` is empty — and it is a JSON object, so it can carry a `.version` property. Registering it means the port is proven against real data on the first server start rather than only against test fixtures. When character persistence arrives, that story adds its own domain entry beside `config`.

### Dropped on purpose

`migrateDataObject` (in `migrator.mjs`) and `getLowestMigrationVersion` (in `data-versions.mjs`) are being left behind — roughly 50 lines plus their tests. They exist to migrate an in-memory data object up to the current version without touching disk, which the previous project used when importing an externally-supplied bundle. CypherDM has no import feature and the design spec describes none. If one is added later, both functions are recoverable verbatim from `scratch/migrator.mjs` and `scratch/data-versions.mjs`, and `migrateDataObject` is written against `runChain` and `buildChain`, which this port keeps — so restoring it is a copy, not a rewrite.

Note that `.claude/rules/server.md` and `.claude/skills/groom-story/SKILL.md` both mention in-memory migration of externally-supplied bundles when explaining why migrations must be idempotent. That reasoning stays valid regardless — idempotence is required by the startup chain too — so leave the wording alone rather than editing it to match this omission.

### Behavioural change to expect on first run

`server/config.json` is gitignored and user-local. After Phase 3, the first server start rewrites it to add `"version": 1`. That is the migrator working as designed, and a timestamped backup of the pre-migration file is written to `scripts/migrate/backups/` beforehand — but it is a real modification to a file the user may have hand-edited, so verify the `serverPort` value survives.

### What the port preserves that a rewrite would likely miss

- **Backup-then-restore on failure.** `migrateDomain` copies the file before migrating and, on any thrown step, restores it and re-throws with the version it failed at.
- **Downgrade detection.** Data newer than the server's expected version throws a distinct error telling the user to update the server, rather than attempting a nonsensical migration.
- **Chain-gap detection.** `buildChain` names the exact version it is stuck at and the directory the missing script belongs in.
- **`$ref` and single-entry `allOf` resolution** in the sanitizer, so nested schema defaults fill correctly.
- **Deep-copied schema defaults.** `sanitize` does `JSON.parse(JSON.stringify(default))`, so two records filled from the same schema do not share one array or object instance. `sanitizer.test.mjs` asserts this explicitly.
