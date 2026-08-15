---
version: 1
id: 'project-imported-code-cleanup'
boardId: 'features'
status: 'in-progress'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-15T07:15:48.679Z'
modified: '2026-08-15T07:38:31.068Z'
completedAt: null
labels: ['feature']
attachments: []
order: 'a0'
---

# Project Imported Code Cleanup

## Goal

CypherDM's scaffold was lifted wholesale from AnyTale, so it ships with working machinery built for a media-generation app rather than a tabletop companion. When this branch merges, everything remaining in the repo either serves the Cypher System design spec or is a genuinely general-purpose primitive — a developer reading any file finds code that belongs, and no future story is written against a subsystem nobody intends to keep.

## Stories

- [ ] `remove-orphaned-sse-system.md` — Remove Orphaned SSE System
- [ ] `reconcile-server-rules-with-server.md` — Reconcile Server Rules With The Actual Server
- [ ] `retire-custom-ui-library-sync.md` — Retire The custom-ui Library Sync
- [ ] `audit-vendored-frontend-libraries.md` — Audit Vendored Front-End Libraries

## Tickets

## Notes

Scoped by the user as: dismantle or repurpose the SSE system, then sweep the rest of the project for other imported code that does not fit.

The prose-level scrub of AnyTale naming across `.claude/rules/`, the skills, and demo data already landed on the `initial-project-cleanup` branch (commit `840576a`). This feature is the code-level follow-up, not a repeat of it.

## Scoping decisions (grooming, 2026-08-15)

**`public/js/custom-ui/` is out of scope, and this is the single most important boundary in the feature.** It is not imported cruft — it is a shared component library mirrored against a central repo at `F:\CustomUI\custom-ui\` via `lib-sync.mjs`, and both sync directions are destructive mirrors. Pruning it locally and pushing would delete components from every other consumer. So `custom-ui/media/`, `global-audio-player.mjs`, `nav/navigator.mjs`, `msg/progress-banner.mjs`, and `msg/progress-context.mjs` all stay untouched, unused. The corollary matters for every future story too: unused components under `custom-ui/` are normal for a library and must never be treated as cleanup targets. Recorded in `retire-custom-ui-library-sync.md`.

**The sync mechanism itself is retired rather than fixed.** The user judged it too fragile to keep and too low-value to scrub now. The `pull`/`push` npm scripts are removed and the freeze is documented; `lib-sync.mjs` and its `config.json` are left in place as dead code, since editing them would mean editing `custom-ui/`. A future library system will supply a proper reset.

**SSE is deleted outright, along with its rules section.** The design spec needs one long-lived session channel per client (§4.1 player→DM sync, §4.2 targeted DM→player pushes); the imported manager is per-task ephemeral subscriptions with terminal-event teardown and an inactivity timeout. Wrong shape, and half-missing — there is no server side at all. Considered and rejected: transforming it in place (that is the sync feature, not cleanup) and keeping the rules section as forward-looking guidance (the user preferred no guidance over guidance inherited from the wrong problem). The heartbeat and `readyState === CONNECTING` details are preserved in the story card so they survive the deletion.

**Server rules are stripped to what exists, temporarily.** `server.md` mandates four `server/core/` modules that were never copied (`data-versions`, `migrator`, `sanitizer`, `process-output-tap`), and `groom-story`/`create-ticket` require a migration script for any persisted-data change — which would block the very first character-persistence story. The migration discipline returns with the story that introduces persistence; the child-process output-tap rule does not return at all, having existed to supervise a spawned generation process.

**`server/storage/` is repurposed, not removed** — in-game assets (character portraits, on-screen media) rather than generated media. `STORAGE_DIR` and the `.gitignore` entry both stay.

### Descoped

- **Agent-skill sync scripts** (`scripts/sync-codex-skills.mjs`, `scripts/sync-antigravity-skills.mjs`) — generic agent tooling, not AnyTale-specific. Kept.
- **`custom-ui/` content scrub** — deliberately not done; see the boundary note above.

### Known consequence to revisit

Commit `840576a` edited seven files under `custom-ui/`. Those edits are unreachable by the (now removed) sync in either direction, so they simply persist locally and diverge from the central library. Acceptable for now; the future library system should reconcile it.
