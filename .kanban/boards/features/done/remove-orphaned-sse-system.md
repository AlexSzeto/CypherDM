---
version: 1
id: 'remove-orphaned-sse-system'
status: 'done'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-15T07:35:45.480Z'
modified: '2026-08-15T08:24:16.185Z'
completedAt: null
labels:
  - 'story'
attachments:
  - 'remove-orphaned-sse-system.log'
order: 'Zz'
metadata:
  feature: 'project-imported-code-cleanup'
---

# Remove Orphaned SSE System

## Goal

Delete the imported SSE client and the rules section describing it, so nothing in the repo suggests CypherDM already has a real-time mechanism. The first story that needs live sync starts from the design spec rather than from machinery shaped for a different problem.

## Tasks

### Phase 1 — SSE client and its rules section removed

- [x] Complete initial implementation
  - Delete `public/js/app-ui/sse-manager.mjs` in its entirety. It exports a single `sseManager` singleton and has zero importers anywhere in `public/js/` — verified by searching for the string `sse-manager` across `public/js/**/*.mjs`, which returns no matches.
  - Create `public/js/app-ui/.gitkeep` so the now-empty `app-ui/` directory survives a git clone. `.claude/rules/client.md` still directs app-specific components there, and its rules reference `app-ui/forms.mjs`, `app-ui/themed-base.mjs` (`AppHeader`), and `app-ui/hamburger-menu.mjs` as destinations for future work.
  - Delete the entire `## Task Progress SSE Patterns` section from `.claude/rules/client.md` — the heading, its `### SSEManager event coalescing` subheading, and all five bullets beneath it. The section runs from the `## Task Progress SSE Patterns` line to the line immediately before `## Save/Revert Pattern (settings and persistent records)`. Leave the `## Logging` section above it and the `## Save/Revert Pattern` section below it untouched.
  - Run `npx vitest run` and confirm the full suite still passes at 75 tests across 4 files. No test imports `sse-manager.mjs`, so the count should be unchanged; if it drops, something else was removed by mistake.
  - Confirm the app still loads: run `npm start`, open `http://localhost:5000`, and check the browser console is free of module-resolution errors. `public/js/app.mjs` does not import `sse-manager.mjs`, so this is a regression check rather than an expected change.
  - Review and update affected living docs: `.claude/rules/client.md`

## Implementation Details

### Why the file is deleted rather than adapted

`sse-manager.mjs` implements **per-task ephemeral subscriptions**:

- `subscribe(taskId, callbacks, timeoutMs)` opens one `EventSource` per task at `/progress/${taskId}`.
- `_dispatch` tears the subscription down on any terminal event — `complete`, `error`, or `cancelled` each call `unsubscribe`.
- `_startTimeout` fires `onError` after 2 minutes of inactivity and unsubscribes.
- `fetchActiveTasks()` calls `/generation/tasks/active`.

`docs/cypher-system-design-spec.md` needs the opposite shape. §4.1 requires a player's edits to reflect on the DM dashboard instantly, and §4.2 requires the DM to push targeted events to one player (GM Intrusion, loot distribution). That calls for one long-lived session channel per connected client that never terminates and multiplexes event types — a channel that sits idle for ten minutes between rolls is healthy, not timed out. Adapting per-task teardown semantics into a persistent channel would mean rewriting every method, so the file is removed and the sync channel is designed fresh when a story calls for it.

### The system has no server half

Deleting this one file removes the entire SSE system. There is nothing to remove server-side:

- `server/server.mjs` mounts no feature routers; it serves static files from `public/`, a `/*.html` → `/*` canonical redirect, and `GET /status`.
- `server/features/` contains only `.gitkeep`.
- Neither `/progress/:taskId` nor `/generation/tasks/active` exists anywhere in `server/`.

### Knowledge being deliberately given up

The rules section is removed rather than rewritten as forward-looking guidance. That was a deliberate call during feature grooming: no SSE guidance is carried forward, so the future sync channel is designed against the spec instead of inheriting task-progress assumptions. Two hard-won details are lost from the docs, and are recorded here so a future implementer can recover them from git history (`.claude/rules/client.md` at commit `840576a`) rather than rediscovering them:

1. **The heartbeat must be a named SSE event.** `event: heartbeat` sent every 30s, not an SSE comment — comments never surface to `EventSource` in JavaScript, so a comment-based keepalive cannot reset a client-side inactivity timer.
2. **`readyState === CONNECTING` in `onerror` must not kill the subscription.** That state means the browser is auto-reconnecting. Tearing down there permanently loses the completion for any callback that has no `onError` handler. Only `readyState === CLOSED` should clean up.

### Out of scope — do not touch

`public/js/custom-ui/msg/progress-banner.mjs` and `public/js/custom-ui/msg/progress-context.mjs` are shared-library files. `public/js/custom-ui/` mirrors a central repository at `F:\CustomUI\custom-ui\`, so its contents are not this project's to prune. Both files stay exactly as they are, unused, and neither is edited nor deleted by this story. `test.vitest.mjs` render entries for them likewise stay.
