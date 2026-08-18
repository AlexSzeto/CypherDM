---
version: 1
id: 'live-sync-and-notifications'
boardId: 'features'
status: 'backlog'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-18T04:47:40Z'
modified: '2026-08-18T04:47:40Z'
completedAt: null
labels: ['feature']
attachments: []
order: 'a6'
---

# Live Sync and Notifications

## Goal

Changes made on one device appear on every other device that cares, immediately, with a toast telling the recipient what happened. From this branch on, every surface in the app is live by default.

## Stories

## Tickets

## Notes

Depends on character-editor-lists. Blocks the entire GM side.

Delivers the server event bus and its SSE endpoint, client subscription with reconnect, in-memory connection state, and the **app-level toast host** (app-level because the GM page unmounts whenever a character sheet is opened).

**Actor tags become visible here.** The originator of a change is never notified of their own edit, and a recipient can be told the change came from the GM.

**Notification altitude:** toasts report at the highest semantic level available, and the constituent field changes that implement them are suppressed. Ability use emits one report, not the pool change beneath it. This is a rule about suppression where a higher-level report exists, not an obligation to invent one: Effort deliberately has no semantic report, and its bare field change stands alone. Never emitted for reordering, which is mechanically meaningless, or for notes, which are private.

**Connection state is never persisted.** It is derived live from the SSE connection and exists only in memory.

This branch also completes the **disabled-claimed-seat state** on the home page deferred from app-shell-and-home-page, since that is the first point at which the app knows who is connected.
