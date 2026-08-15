---
version: 1
id: 'reconcile-server-rules-with-server'
boardId: 'features'
status: 'planned'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-15T07:35:45.480Z'
modified: '2026-08-15T07:38:31.146Z'
completedAt: null
labels: ['story']
attachments: []
order: 'a0V'
metadata:
  feature: 'project-imported-code-cleanup'
---

# Reconcile Server Rules With The Actual Server

## Goal

Bring `.claude/rules/server.md` and the two card-writing skills back in line with the server that actually exists, so no future story is written against infrastructure that was never copied into this project.

## Notes

**The mismatch.** `server.md` references four `server/core/` modules that do not exist: `data-versions.mjs`, `migrator.mjs`, `sanitizer.mjs`, and `process-output-tap.mjs`. `server/core/` contains only `config.mjs`, `config.test.mjs`, `index.mjs`, `logger.mjs`, and `paths.mjs`. `groom-story` and `create-ticket` go further and _require_ every story that changes persisted data to add a `scripts/migrate/<domain>/<N>-to-<M>.mjs` script and bump `currentVersion` in `data-versions.mjs` — so the first story that persists character data hits a wall on a file that isn't there.

**This removal is temporary by design, and the card must say so.** The versioning/migration discipline is sound and will be needed almost immediately: §3 of `docs/cypher-system-design-spec.md` makes character state the first thing CypherDM persists. Stripping the rules is not a rejection of the pattern — it is refusing to let the rules describe fiction in the interim. The story that introduces character persistence is expected to build `data-versions.mjs`, `migrator.mjs`, and `sanitizer.mjs` and restore the corresponding rules alongside them. Say this in the rules themselves, not only here, so the next reader knows the omission is deliberate rather than an oversight.

**The child-process rule is different — it is not coming back.** `server.md`'s `attachOutputTap` / `createErrorSink` guidance exists to supervise a spawned external generation process. CypherDM spawns no such process. Remove it outright rather than marking it deferred.

**`STORAGE_DIR` is being repurposed, not deleted.** `server/core/paths.mjs` exports `STORAGE_DIR` documented as "generated media". The user has designated `server/storage/` for in-game assets instead — character portraits and other material shown on screen. Update the JSDoc to describe that purpose. Keep the export, keep the directory, and keep `server/storage/` in `.gitignore`.

**`.gitignore` pruning — one entry must survive.** Remove `server/temp/`, `runtime/`, and `scripts/migrate/backups/`. Do **not** remove `server/storage/` (repurposed, see above). Note that `scripts/migrate/backups/` will need restoring when the migrator is built; it is being dropped now only because nothing writes there yet.

**Scope boundary.** The schema/sanitizer rules under `## 5. Data Management` describe `server/resource/schemas/` and co-located `sanitizer.mjs` files. `server/resource/schemas/` exists (empty, `.gitkeep`), so decide per-rule whether each is aspirational-but-harmless or actively misleading; the test is whether a story author would be blocked or sent to a missing file.

**Verification.** `npx vitest run` must stay green (`server/core/config.test.mjs` is the only server test). No code behaviour changes here beyond the `paths.mjs` doc comment.
