---
version: 1
id: 'retire-custom-ui-library-sync'
boardId: 'features'
status: 'groomed'
priority: 'medium'
assignee: null
dueDate: null
created: '2026-08-15T07:35:45.480Z'
modified: '2026-08-15T07:42:10.000Z'
completedAt: null
labels: ['polish']
attachments: []
order: 'a2'
metadata:
  feature: 'project-imported-code-cleanup'
---

# Retire The custom-ui Library Sync

## Goal

Take the `custom-ui` push/pull sync out of reach and document why, so nobody runs a destructive mirror against the shared library by accident. The sync stays unreachable by design until a better library system replaces it.

## Tasks

### Phase 1 — Sync unreachable and the freeze documented

- [ ] Complete initial implementation
  - In `package.json`, delete the `"pull"` and `"push"` entries from `scripts` — currently `"pull": "node public/js/custom-ui/lib-sync.mjs pull"` (line 12) and `"push": "node public/js/custom-ui/lib-sync.mjs push"` (line 13). Leave every other script entry unchanged, including `"libs"`, `"sync:codex-skills"`, and `"sync:antigravity-skills"`.
  - Do **not** delete or edit `public/js/custom-ui/lib-sync.mjs` or `public/js/custom-ui/config.json`. Both live inside `custom-ui/`, which this feature treats as out of scope for edits. They remain as dead code with no invocation path.
  - Add a subsection to `.claude/rules/client.md` headed `### The custom-ui library is shared and frozen`, placed immediately after the `- **File Structure**:` bullet list under `## Frontend Architecture` (the list whose first item is `**Reusable Components**: Place generic, reusable UI components in public/js/custom-ui/`). Content requirements are listed under "What the documentation must say" below.
  - Verify the scripts are gone: `npm run pull` and `npm run push` must each fail with npm's missing-script error. Confirm `npm run libs` still resolves, to prove no unrelated script entry was damaged.
  - Run `npx vitest run` and confirm the suite still passes at 75 tests across 4 files. No source file changes in this story, so the count must be unchanged.
  - Review and update affected living docs: `.claude/rules/client.md`

## Implementation Details

### What the sync does today

`public/js/custom-ui/lib-sync.mjs` mirrors the `public/js/custom-ui/` directory against a central repository whose path is read from `public/js/custom-ui/config.json`:

```json
{ "centralRepo": "F:\\CustomUI\\custom-ui\\" }
```

That repository exists on this machine and is shared with other projects. The module is exposed through two npm scripts, which are the only way it is ever invoked.

### Why it is dangerous

Both directions are destructive mirrors, per the module's own header comment:

- **`push`** overwrites the central repo with local content and **deletes** files present upstream but absent locally. A local prune therefore propagates outward to every other consumer of the library.
- **`pull`** overwrites the local directory with upstream content and **deletes** local files absent upstream. It is a hard reset that silently reverts any local edit to `custom-ui/`.

This is not hypothetical for this repo. Commit `840576a` (merged to `main` via PR #1) edited seven files under `public/js/custom-ui/` — comment and demo-data changes made during the AnyTale naming scrub. A `pull` would erase that work; a `push` would export it into other projects. Neither outcome is wanted, so both commands are removed rather than one of them being made safe.

### What the documentation must say

The new `.claude/rules/client.md` subsection needs to carry four points. Wording is the implementer's choice; all four must be present:

1. `public/js/custom-ui/` is shared-library code mirrored from a central repository — it is not owned by this project.
2. `lib-sync.mjs` must never be run in either direction, because both `push` and `pull` are destructive mirrors. State the specific consequence of each.
3. The `pull` and `push` npm scripts were removed for exactly this reason; their absence is deliberate, not an oversight.
4. The day-to-day consequence: unused components under `custom-ui/` are normal for a shared library and must **never** be treated as cleanup targets. Components are added to and removed from `custom-ui/` only through the (future) library system, never by editing this repo.

Also note that a future library system will supply the proper way to reset and re-sync the folder, so a reader who wants the sync back knows it is planned rather than forbidden forever.

### Why `lib-sync.mjs` itself survives

Deleting it would mean editing `custom-ui/`, which is precisely the boundary this story exists to protect. With the npm scripts gone it has no invocation path, so leaving it costs nothing. The future library system will decide its fate along with the rest of the directory.
