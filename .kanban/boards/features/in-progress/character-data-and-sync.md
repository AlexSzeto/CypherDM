---
version: 1
id: 'character-data-and-sync'
boardId: 'features'
status: 'in-progress'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-18T04:47:40Z'
modified: '2026-08-18T05:29:11.311Z'
completedAt: null
labels: ['feature']
attachments: []
order: 'a0'
---

# Character Data and Sync

## Goal

A character record that lives on the server and saves itself as the player types. When this merges, a character can be created, read, patched field by field, and deleted through the API, and any client editing one carries a save indicator that tells the truth — including when the network drops, where changes queue locally and replay in order once the connection returns.

## Stories

- [x] `character-record-api.md` — Character Record API
- [ ] `offline-patch-queue.md` — Offline Patch Queue and Save Indicator
- [ ] `character-list-items.md` — Character List Items and Identifiers

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

**Scoping decided during grooming (2026-08-18):**

- Split into three stories, each ending at something checkable in a browser rather than at a layer boundary: the record API, the offline queue and save indicator, and the list-item operations.
- The throwaway harness page is the visible end of every story here. It is linked from the home page while it exists and is removed once `app-shell-and-home-page` supplies the real hub.
- **Delete cascades are deferred**, not dropped. The roster, intrusion participants, and `giftedTo` pointers all live on the GM Object, which does not exist until `gm-domain-and-page-shell`. Character delete on this branch removes the character record only; each GM-side reference is cleaned up by the feature that introduces it.
- **Two-record commands are pattern-only here**, as the card's original notes say. No such endpoint ships on this branch; `play-mode-equipment` and `gm-intrusions` add the real ones.
- Currency display name falls back to the literal "currency" until GM config exists.
- No SSE on this branch. Live push is `live-sync-and-notifications`; this branch is request/response plus local queueing only.
