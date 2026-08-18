---
version: 1
id: 'character-list-items'
boardId: 'features'
status: 'planned'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-18T05:28:38Z'
modified: '2026-08-18T05:29:11.447Z'
completedAt: null
labels: ['story']
attachments: []
order: 'a0VV'
metadata:
  feature: 'character-data-and-sync'
---

# Character List Items and Identifiers

## Goal

The list-shaped parts of a character — skills, abilities, attacks, equipment, cyphers — can be added, edited, and removed, and survive a restart. Rows are addressed by a server-assigned identifier, so editing one row while another is added or removed never rewrites the wrong row.

## Notes

- Every list item gets a server-assigned `uid` on insert. Patches address items by uid, never by array index.
- The client seeds a new row with a local id and reconciles when the real uid returns; this rides on the queue from [[offline-patch-queue]].
- Adds list add/update/remove operations to the character API and exercises them from the harness page built in [[character-record-api]].
