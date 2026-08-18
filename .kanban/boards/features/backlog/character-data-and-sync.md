---
version: 1
id: 'character-data-and-sync'
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
order: 'a0'
---

# Character Data and Sync

## Goal

A character record that lives on the server and saves itself as the player types. When this merges, a character can be created, read, patched field by field, and deleted through the API, and any client editing one carries a save indicator that tells the truth — including when the network drops, where changes queue locally and replay in order once the connection returns.

## Stories

## Tickets

## Notes

First branch; depends on nothing. Every later feature depends on it.

**Sync contract decided up front:**

- Writes are **field-level patches**, each carrying an **actor tag**, so nobody is notified of their own change and a player can be told a change came from the GM.
- Conflict rule is **last-write-wins per field path**. No rejection, no merge UI: the blast radius of a collision is one field, which is why field-level patches were chosen over whole-object writes.
- Each device keeps a **FIFO queue with a client sequence number**; on reconnect it replays in order.
- **Operations that write to two character records are server-side commands, not patches.** Giving an item and resolving an intrusion each land as one atomic call. Those endpoints ship with the features that need them (play-mode-equipment, gm-intrusions); this branch establishes the pattern only.
- **Every list item gets a server-assigned uid on insert** (skills, abilities, attacks, equipment, cyphers). Patches address items by uid, never by array index, or a concurrent reorder rewrites the wrong row. Clients seed new rows with a local id until the real one returns.
- **Currency stores amount only.** The display name comes from GM config, falling back to "currency" until gm-domain-and-page-shell exists.
- **Delete cascades:** roster entry removed, character dropped from any pending intrusion participants, any giftedTo pointing at it nulled, and the intrusion auto-resolves if that leaves no pending participants. Unlikely in real use; recorded so the app cannot reach a locked state by accident.

Testing is API-level (curl) plus a throwaway harness page for the queue behaviour: type with the server stopped, restart, confirm ordered replay and an honest indicator.
