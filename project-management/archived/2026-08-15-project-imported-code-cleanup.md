# Project Imported Code Cleanup

Completed 2026-08-15 · branch `project-imported-code-cleanup`

## Goal

CypherDM's scaffold was lifted wholesale from AnyTale, so it shipped with working machinery built for a media-generation app rather than a tabletop companion. This feature swept the repo so that everything remaining either serves the Cypher System design spec or is a genuinely general-purpose primitive — a developer reading any file finds code that belongs, and no future story is written against a subsystem nobody intends to keep.

## What shipped

- **Story** — Port Data Versioning And Sanitization Infrastructure: brought the schema sanitizer, version registry, and migration runner into `server/core/` from the previous project, scrubbed of its domains, with `config` registered as the first real domain and migrated automatically on server startup.
- **Story** — Remove Orphaned SSE System: deleted the imported per-task SSE client (`public/js/app-ui/sse-manager.mjs`, zero importers) and its rules section, clearing the way for a persistent-channel design built against the actual sync spec instead of task-progress assumptions.
- **Ticket** — Remove Leftover Server Rules: dropped the child-process output-tap rule (nothing here spawns a managed process), repurposed the `STORAGE_DIR` doc comment for in-game assets, and trimmed two stale `.gitignore` lines.
- **Ticket** — Retire The custom-ui Library Sync: removed the `pull`/`push` npm scripts that could destructively mirror the shared `custom-ui/` library against its central repo, and documented the freeze in `client.md`.
- **Ticket** — Audit Vendored Front-End Libraries: removed the stale `@tarekraafat/autocomplete.js` manifest entry and the unused `favloader` library (script tag, vendored file, manifest entry), leaving the manifest matching what `public/index.html` actually loads.

## Notable decisions

### `custom-ui/` is out of scope, permanently

`public/js/custom-ui/` is not imported cruft — it's a shared component library mirrored against a central repo (`F:\CustomUI\custom-ui\`) via `lib-sync.mjs`. Both sync directions are destructive mirrors, so pruning or editing it locally and pushing would delete components out from under every other consumer. Unused components under `custom-ui/` (media viewer, global audio player, navigator, progress banner/context) are normal for a library and must never be treated as cleanup targets — this boundary governs every future story too, not just this one.

The sync mechanism itself was retired rather than fixed: judged too fragile to keep and too low-value to scrub now. `lib-sync.mjs` and its `config.json` are left in place as dead code (deleting them would mean editing `custom-ui/`); a future library system will supply a proper reset. One known consequence: commit `840576a` had already edited seven files under `custom-ui/` before this freeze, and those edits are now unreachable by sync in either direction — they persist locally and diverge from the central library, acceptable for now but worth reconciling when the library system arrives.

### SSE was deleted outright, not adapted

The imported SSE manager implemented per-task ephemeral subscriptions with terminal-event teardown and a 2-minute inactivity timeout. The design spec needs the opposite shape — one long-lived session channel per client that never terminates and multiplexes event types (§4.1 player→DM sync, §4.2 targeted DM→player pushes). Adapting the per-task teardown semantics into a persistent channel would have meant rewriting every method, so the file was removed and the rules section deleted rather than kept as forward-looking guidance — no SSE guidance carries forward, so the future sync channel gets designed fresh against the spec. Two implementation details worth recovering from history if that channel is ever built (see `client.md` at commit `840576a`): the heartbeat must be a named SSE event, not a comment (comments never surface to `EventSource` in JS); and `readyState === CONNECTING` in `onerror` must not tear down the subscription — only `CLOSED` should.

### Server rules were made true by porting, not by stripping

The original plan was to strip every server rule referencing a missing `server/core/` module and rebuild it with the first persistence story. That was reversed once the user supplied the previous project's `data-versions.mjs`, `migrator.mjs`, and `sanitizer.mjs` in `scratch/` — porting was cheaper than a round trip through fiction-then-truth. The sanitizer ported unchanged (domain-neutral, only dependency is `ajv`, which had been an unused production dependency all along). The migrator was ~85% reusable but needed a Windows drive-letter path fix, dependency injection for testability, and two functions dropped (`migrateDataObject`, `getLowestMigrationVersion`) that exist only to support in-memory migration of an externally-supplied bundle — a feature CypherDM doesn't have. Both ported test files were unusable as-is and rewritten from scratch: the old `data-versions.test.mjs` asserted on the previous project's domains, and the old `migrator.test.mjs` re-implemented the migrator inline rather than testing the real module, so its cases would have passed even with the module deleted.

`config` was registered as the first data domain specifically so the port would be exercised against real data on first server start, not just fixtures.

### `server/storage/` was repurposed, not removed

It now holds in-game assets (character portraits, on-screen media) instead of generated media. `STORAGE_DIR` and its `.gitignore` entry both stay as-is; only the doc comment changed.

## Deferred / descoped

- **Agent-skill sync scripts** (`scripts/sync-codex-skills.mjs`, `scripts/sync-antigravity-skills.mjs`) — generic agent tooling, not AnyTale-specific. Kept, untouched.
- **`custom-ui/` content scrub** — deliberately never attempted; see the boundary decision above.
- **`boxicons` and `@preact/signals`** — considered for removal during the vendored-library audit but kept: `boxicons` is a live dependency of `custom-ui/layout/icon.mjs`'s theme-driven icon rendering despite looking unused from `app.mjs`, and `@preact/signals` is standard scaffolding wired into the importmap that the first stateful feature is likely to reach for.
