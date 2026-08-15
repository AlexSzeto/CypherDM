---
version: 1
id: 'retire-custom-ui-library-sync'
boardId: 'features'
status: 'planned'
priority: 'medium'
assignee: null
dueDate: null
created: '2026-08-15T07:35:45.480Z'
modified: '2026-08-15T07:38:31.187Z'
completedAt: null
labels: ['polish']
attachments: []
order: 'a0VV'
metadata:
  feature: 'project-imported-code-cleanup'
---

# Retire The custom-ui Library Sync

## Goal

Take the `custom-ui` push/pull sync out of reach and document why, so nobody runs a destructive mirror against the shared library by accident. The sync stays broken-by-design until a better library system replaces it.

## Notes

**What the sync does today.** `public/js/custom-ui/lib-sync.mjs` mirrors `public/js/custom-ui/` against a central repository at `F:\CustomUI\custom-ui\` (set in `public/js/custom-ui/config.json`). It is exposed through two npm scripts in `package.json`: `"pull": "node public/js/custom-ui/lib-sync.mjs pull"` and `"push": "node public/js/custom-ui/lib-sync.mjs push"`. The central repo exists on this machine and is shared with other projects.

**Why it is dangerous.** Both directions are destructive mirrors, per the module's own header comment. `push` overwrites the central repo and **deletes** files present there but absent locally — so a local prune propagates outward to every other consumer. `pull` hard-resets the local directory and deletes local files absent upstream — so it silently reverts any local edit to `custom-ui/`. Commit `840576a` on the `initial-project-cleanup` branch edited seven `custom-ui` files (comments and demo data); a `pull` would erase that work and a `push` would export it to other projects. Neither is wanted.

**The decision.** Remove the `pull` and `push` entries from `package.json` and document the freeze. Do **not** delete `lib-sync.mjs` or `config.json` — both live inside `custom-ui/`, which this feature treats as out of scope for edits. They stay as dead code that has no invocation path.

**Where to document.** `.claude/rules/client.md` is the right home, near the existing `custom-ui/` vs `app-ui/` file-structure guidance. State plainly: `custom-ui/` is shared-library code mirrored from a central repo; `lib-sync.mjs` must never be run in either direction; the npm scripts were removed for this reason; and a future library system will supply the proper way to reset and re-sync the folder. Also state the consequence that follows for CypherDM day to day — `custom-ui/` components are not this project's to prune, so unused components there are simply unused and must not be treated as cleanup targets.

**Verification.** `npm run pull` and `npm run push` should both fail as unknown scripts. `npx vitest run` must stay green.
