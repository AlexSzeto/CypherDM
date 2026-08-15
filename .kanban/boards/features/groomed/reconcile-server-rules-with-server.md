---
version: 1
id: 'reconcile-server-rules-with-server'
boardId: 'features'
status: 'groomed'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-15T07:35:45.480Z'
modified: '2026-08-15T07:42:10.000Z'
completedAt: null
labels: ['story']
attachments: []
order: 'a1'
metadata:
  feature: 'project-imported-code-cleanup'
---

# Reconcile Server Rules With The Actual Server

## Goal

Bring `.claude/rules/server.md` and the two card-writing skills back in line with the server that actually exists, so no future story is written against infrastructure that was never copied into this project. The removals that are temporary say so in the rules themselves.

## Tasks

### Phase 1 — Rules describe only modules that exist

- [ ] Complete initial implementation
  - In `.claude/rules/server.md` under `## 5. Data Management` → `- **Persistence**:`, delete these four bullets, which all mandate `server/core/data-versions.mjs` or `server/core/migrator.mjs` — neither file exists: `**Migrations must be idempotent and guarded.**`, `**Migrations that need to surface something to the user log through server/core/logger.mjs,**`, `**After bumping currentVersion, restart the server before anything else writes that domain's file.**`, and `**New data files must be stamped with the current version on creation.**`
  - In the same `- **Persistence**:` list, keep `**Flat-file per domain**` and `**Manual edit backup requirement**` (both describe `server/database/`, which exists and is created on startup by `server/server.mjs`) and keep `Primary data storage is **JSON files**` and `**Do not use a SQL database**`.
  - In `.claude/rules/server.md` under `- **Configuration**:`, delete the `**Config migrations must seed values from config.default.json first.**` bullet — it presumes a `scripts/migrate/config/` chain that does not exist. Keep the three bullets above it describing `config.json` and `config.default.json`, which `server/core/config.mjs` genuinely implements.
  - In `.claude/rules/server.md` under `### Design Patterns`, delete the `- **Child-process output**:` bullet entirely. It mandates `attachOutputTap` and `createErrorSink` from `server/core/process-output-tap.mjs` (missing) to supervise a spawned external generation process. CypherDM spawns no such process, so this one is removed permanently rather than deferred.
  - In `.claude/rules/server.md` under `- **Schemas**:`, delete the two bullets that reference `server/core/sanitizer.mjs` (missing): the `The core sanitizer (server/core/sanitizer.mjs) exports sanitize(...)` bullet and the `Each feature domain must have a co-located sanitizer.mjs` bullet. Keep the three surviving bullets — the two describing `server/resource/schemas/` (the directory exists) and the `All POST/PUT router endpoints must call validate(...)` bullet, rewritten to require request-body validation without naming the missing module.
  - Add a short subsection to `.claude/rules/server.md` at the end of `## 5. Data Management`, headed `### Deferred: data versioning and sanitization`, stating that the migration, versioning, and sanitizer rules were removed because `server/core/data-versions.mjs`, `migrator.mjs`, and `sanitizer.mjs` do not exist yet; that the story introducing character persistence is expected to build them and restore the corresponding rules; and that the omission is deliberate rather than an oversight. This is the one addition in the story — everything else is deletion.

### Phase 2 — Card-writing skills stop requiring missing infrastructure

- [ ] Complete initial implementation
  - In `.claude/skills/groom-story/SKILL.md`, delete the entire `## Data Migration Tasks` section — from the `## Data Migration Tasks` heading through the paragraph ending `a bare top-level array can't carry .version.`, immediately before the `## Rules` heading. It requires every schema-changing story to add a migration script and bump `currentVersion` in a file that does not exist, which would block the first character-persistence story.
  - In `.claude/skills/create-ticket/SKILL.md`, delete the entire `### Data migration tasks` section — from that heading through the paragraph ending `never mistaken for version 0 on the next restart.`, immediately before the `### Writing the file` heading.
  - In `server/core/paths.mjs`, change the JSDoc on `STORAGE_DIR` from `/** Path to \`server/storage/\` (generated media) */` to describe in-game assets — character portraits and other material displayed on screen. Keep the export and its value unchanged; nothing imports it yet, and it is being repurposed rather than retired.
  - In `.gitignore`, remove the `server/temp/`, `runtime/`, and `scripts/migrate/backups/` lines. Do **not** remove `server/storage/` — that directory is repurposed (see the `paths.mjs` task above) and must stay ignored. Leave `server/logs/`, `server/database/`, `server/config.json`, `node_modules/`, `.codex`, `.agents`, `.kanban-serve.log`, `scratch/`, and `reference/` untouched.
  - Run `npx vitest run` and confirm the suite still passes at 75 tests across 4 files. Only a doc comment changed in server code, so a change in count means something unintended was edited.
  - Review and update affected living docs: `.claude/rules/server.md`, `.claude/rules/planning.md`

## Implementation Details

### The mismatch being fixed

`.claude/rules/server.md` references four `server/core/` modules that do not exist in this repository:

| Referenced module                    | Status  |
| ------------------------------------ | ------- |
| `server/core/data-versions.mjs`      | missing |
| `server/core/migrator.mjs`           | missing |
| `server/core/sanitizer.mjs`          | missing |
| `server/core/process-output-tap.mjs` | missing |

`server/core/` actually contains only `config.mjs`, `config.test.mjs`, `index.mjs`, `logger.mjs`, and `paths.mjs`.

### Why most of this comes back later

The versioning and migration discipline is sound and will be needed almost immediately: §3 of `docs/cypher-system-design-spec.md` makes the character object the first thing CypherDM persists. Stripping these rules is not a rejection of the pattern — it is refusing to let the rules describe fiction in the interim, and refusing to block the next story on a file that isn't there. The `### Deferred` subsection added in Phase 1 is what keeps that intent legible; without it, a later reader would reasonably conclude the project had decided against data versioning.

The child-process output-tap rule is the exception: it is removed permanently, not deferred. It exists to drain stdout/stderr from a long-lived spawned generation process so its death is diagnosable. CypherDM spawns no managed child process, and nothing in the design spec implies it will.

### `server/storage/` is repurposed, not removed

`server/core/paths.mjs` currently documents `STORAGE_DIR` as "generated media" — an artifact of the source project. The directory is being kept and re-aimed at in-game assets: character portraits and other material shown on screen. Both the export and the `.gitignore` entry stay. Note that `server/server.mjs` only creates `DATABASE_DIR` and `LOGS_DIR` on startup; whichever story first writes an asset is responsible for creating `STORAGE_DIR`, and that is out of scope here.

### `.gitignore` entries and why one survives

| Entry                      | Action | Reason                                                                        |
| -------------------------- | ------ | ----------------------------------------------------------------------------- |
| `server/storage/`          | keep   | repurposed for in-game assets                                                 |
| `server/temp/`             | remove | scratch space for the old project's media pipeline                            |
| `runtime/`                 | remove | old project's runtime layout; nothing here writes to it                       |
| `scripts/migrate/backups/` | remove | written by the migrator, which does not exist; restore when the migrator does |

### Scope boundary

This story edits only `.claude/rules/server.md`, the two skill files, `server/core/paths.mjs` (one doc comment), and `.gitignore`. It does not create any of the missing modules — building them is the job of the story that introduces character persistence.
