---
version: 1
id: 'character-record-api'
boardId: 'features'
status: 'planned'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-18T05:28:38Z'
modified: '2026-08-18T05:29:11.354Z'
completedAt: null
labels: ['story']
attachments: []
order: 'a0'
metadata:
  feature: 'character-data-and-sync'
---

# Character Record API

## Goal

A character lives on the server and survives a restart. A participant can create a character, see it in a list, open it, change a scalar field, reload the page, and find the change still there — proved through a throwaway harness page that exercises the API directly.

## Notes

- Establishes the `characters` feature domain: router, service, repository, sanitizer, JSON Schema, and a versioned flat-file in `server/database/`.
- Endpoints: list, create, read, delete, and a **field-level patch** carrying an actor tag. Last-write-wins per field path; no rejection, no merge.
- Scalar and object fields only. List items and their server-assigned uids are [[character-list-items]].
- The harness page is deliberately throwaway UI — it is the visible end of this story, not a design deliverable. It must still be reachable from the home page while it exists, per the navigation rule.
- Currency stores an amount only; the display name comes from GM config, which does not exist yet. Fall back to "currency".
