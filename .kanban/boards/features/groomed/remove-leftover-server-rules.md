---
version: 1
id: 'remove-leftover-server-rules'
boardId: 'features'
status: 'groomed'
priority: 'medium'
assignee: null
dueDate: null
created: '2026-08-15T07:35:45.480Z'
modified: '2026-08-15T07:55:00.000Z'
completedAt: null
labels: ['polish']
attachments: []
order: 'a1'
metadata:
  feature: 'project-imported-code-cleanup'
---

# Remove Leftover Server Rules

## Goal

Clear the last few server-side rules and paths that describe the previous project rather than this one, so `server.md` and `paths.mjs` reflect what CypherDM actually does.

## Tasks

### Phase 1 — Leftover server rules and paths cleared

- [ ] Complete initial implementation
  - In `.claude/rules/server.md` under `### Design Patterns`, delete the `- **Child-process output**:` bullet in its entirety. It mandates `attachOutputTap` and `createErrorSink` from `server/core/process-output-tap.mjs` (a file that does not exist) in order to supervise a long-lived spawned external process. CypherDM spawns no managed child process and the design spec implies none, so this rule is removed permanently rather than deferred. Leave the four surrounding bullets — `**Service Layer**`, `**Repository Pattern**`, `**Dependency Injection**`, and `**Logging**` — untouched.
  - In `server/core/paths.mjs`, change the JSDoc above `STORAGE_DIR` from `/** Path to \`server/storage/\` (generated media) */` to describe in-game assets — character portraits and other material displayed on screen. Keep the export name and its value (`path.join(SERVER_DIR, 'storage')`) exactly as they are. Nothing imports it yet; the directory is being repurposed, not retired.
  - In `.gitignore`, remove exactly two lines: `server/temp/` and `runtime/`. Both are runtime directories from the previous project's media pipeline and nothing in this repo reads or writes them.
  - Do **not** remove `server/storage/` from `.gitignore` — it is repurposed for in-game assets (see the `paths.mjs` task above). Do **not** remove `scripts/migrate/backups/` — the ported migrator writes backups there (see `port-data-versioning-infrastructure.md`). Leave `node_modules/`, `server/logs/`, `server/database/`, `server/config.json`, `.codex`, `.agents`, `.kanban-serve.log`, `scratch/`, and `reference/` untouched.
  - Run `npx vitest run` and confirm the suite still passes at 75 tests across 4 files. Only a doc comment changed in server code, so any change in the count means something unintended was edited.
  - Review and update affected living docs: `.claude/rules/server.md`

## Implementation Details

### What this card used to be, and why it shrank

This card was originally `reconcile-server-rules-with-server.md`, and it stripped every rule in `server.md` that referenced a missing `server/core/` module — the migration, versioning, and sanitizer mandates — plus the matching `Data Migration Tasks` sections in `groom-story` and `create-ticket`. It also added a `### Deferred` subsection explaining that the removals were temporary.

All of that is now cancelled. The decision changed from _strip the rules and rebuild them with the first persistence story_ to _port the missing modules now_, which makes those rules true instead of fictional. See `port-data-versioning-infrastructure.md`. What remained here is the one rule that is **not** coming back plus two unrelated path cleanups, so the card was renamed, downgraded from `story` to `polish`, and reduced from two phases to one.

Rules that were on this card and are now explicitly **out of scope** — leave every one of them exactly as it is:

- `**Migrations must be idempotent and guarded.**`
- `**Migrations that need to surface something to the user log through server/core/logger.mjs,**`
- `**After bumping currentVersion, restart the server before anything else writes that domain's file.**`
- `**New data files must be stamped with the current version on creation.**`
- `**Config migrations must seed values from config.default.json first.**`
- The two `- **Schemas**:` bullets referencing `server/core/sanitizer.mjs`
- `## Data Migration Tasks` in `.claude/skills/groom-story/SKILL.md`
- `### Data migration tasks` in `.claude/skills/create-ticket/SKILL.md`

### Why the output-tap rule is different

Every other removed rule described infrastructure this project genuinely wants and will build. The child-process rule describes supervising a spawned external generation process — draining its stdout/stderr through a tap so that a crash is diagnosable rather than silent. There is no such process in CypherDM and nothing in `docs/cypher-system-design-spec.md` introduces one. It is the only rule on this branch removed with no expectation of return.

### `.gitignore` disposition

| Entry                      | Action | Reason                                              |
| -------------------------- | ------ | --------------------------------------------------- |
| `server/storage/`          | keep   | repurposed for in-game assets                       |
| `scripts/migrate/backups/` | keep   | the ported migrator writes timestamped backups here |
| `server/temp/`             | remove | previous project's media-pipeline scratch space     |
| `runtime/`                 | remove | previous project's runtime layout; unused here      |

### Ordering note

This card has no dependency on `port-data-versioning-infrastructure.md` and can be implemented before or after it. The only overlap is the `scripts/migrate/backups/` `.gitignore` line, which this card leaves alone in either ordering.
