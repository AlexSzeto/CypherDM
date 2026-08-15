---
version: 1
id: 'remove-orphaned-sse-system'
boardId: 'features'
status: 'planned'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-15T07:35:45.480Z'
modified: '2026-08-15T07:38:31.106Z'
completedAt: null
labels: ['story']
attachments: []
order: 'a0'
metadata:
  feature: 'project-imported-code-cleanup'
---

# Remove Orphaned SSE System

## Goal

Delete the imported SSE client and the rules section describing it, so nothing in the repo suggests CypherDM already has a real-time mechanism. The first story that needs live sync should start from the design spec, not from machinery shaped for a different problem.

## Notes

**The system is already only half present.** `public/js/app-ui/sse-manager.mjs` is the entire SSE implementation in this repo — there is no server counterpart. `server/server.mjs` mounts no routers and serves only `/status` plus static files, and `server/features/` is an empty `.gitkeep`. The manager calls two endpoints that do not exist here: `/progress/:taskId` (in `subscribe`) and `/generation/tasks/active` (in `fetchActiveTasks`). Nothing imports `sse-manager.mjs` either. Deleting it removes the whole system; there is nothing to chase server-side.

**Why replace rather than adapt.** The manager is built around per-task ephemeral subscriptions: one `EventSource` per `taskId`, terminal events (`complete`/`error`/`cancelled`) tearing the subscription down in `_dispatch`, and a 2-minute inactivity timeout that fires `onError`. What the design spec needs is the opposite shape — one long-lived session channel per client that never terminates, broadcasting character-state changes to the DM dashboard (§4.1) and pushing targeted events to a specific player (§4.2 GM Intrusions, loot). A sync channel that idles quietly between rolls is healthy, not timed out.

**`app-ui/` becomes empty.** `sse-manager.mjs` is currently the only file in `public/js/app-ui/`. Leave the directory in place with a `.gitkeep` — `client.md` still directs app-specific components there, and several rules reference `app-ui/` paths (`forms.mjs`, `themed-base.mjs`'s `AppHeader`, `hamburger-menu.mjs`) as the destination for future work.

**Rules section goes too.** Remove the `## Task Progress SSE Patterns` section from `.claude/rules/client.md` in the same change — it documents only the deleted file plus `custom-ui`'s progress components. Decided deliberately: no SSE guidance is carried forward, so the future sync channel is designed against the spec rather than inheriting task-progress assumptions. The two hard-won details being given up are the named-heartbeat pattern (`event: heartbeat`, not an SSE comment, since comments never reach EventSource JS) and the rule that an `onerror` with `readyState === CONNECTING` must not kill a subscription. Both are recorded here so they are recoverable from git history if the sync story wants them.

**Out of scope.** `custom-ui/msg/progress-banner.mjs` and `custom-ui/msg/progress-context.mjs` are shared-library files (see the feature card's note on `F:\CustomUI\custom-ui\`) and stay exactly as they are, unused. Do not delete them and do not edit them.

**Verification.** `npx vitest run` must stay green. No current test imports `sse-manager.mjs`, so the suite should be unaffected; confirm rather than assume.
