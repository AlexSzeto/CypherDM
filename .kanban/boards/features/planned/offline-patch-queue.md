---
version: 1
id: 'offline-patch-queue'
boardId: 'features'
status: 'planned'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-18T05:28:38Z'
modified: '2026-08-18T05:29:11.399Z'
completedAt: null
labels: ['story']
attachments: []
order: 'a0V'
metadata:
  feature: 'character-data-and-sync'
---

# Offline Patch Queue and Save Indicator

## Goal

A client editing a character carries a save indicator that tells the truth. Edits made while the server is unreachable queue locally and replay in order once it returns, and the indicator says "saving", "saved", or "not saving" honestly rather than reassuring falsely.

## Notes

- Client-side sync module: FIFO queue with a per-device client sequence number, single in-flight request, ordered replay on reconnect, retry with backoff.
- Every patch carries an actor tag so a later feature can skip notifying the originator of their own change.
- The save indicator is a persistent surface element, not a toast — it must be present on every character surface built later.
- Verified on the harness page from [[character-record-api]]: type with the server stopped, restart it, confirm ordered replay and an honest indicator throughout.
