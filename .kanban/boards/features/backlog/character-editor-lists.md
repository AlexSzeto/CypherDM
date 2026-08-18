---
version: 1
id: 'character-editor-lists'
boardId: 'features'
status: 'backlog'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-18T04:47:40Z'
modified: '2026-08-18T06:20:00Z'
completedAt: null
labels: ['feature']
attachments: []
order: 'a5'
---

# Character Editor: List Tabs

## Goal

The remaining four tabs of the editor, completing the transcription flow: a player can enter a finished character from an external tool or the printed rulebook into the app, end to end, and close the tablet knowing it is saved.

## Stories

## Tickets

## Notes

Depends on character-editor-overview.

Covers the Skills and Abilities tab (two dynamic lists), the Equipment tab (attacks list, the **single armour sub-form** that is always present with no add or remove, and the equipment list whose **first row is the pinned currency component** that cannot be deleted or reordered and shows no delete affordance), the Cyphers tab (limit plus list), and the Notes tab.

**Dynamic list behaviour is uniform across every list:** add appends a blank item filled inline, edits autosave, reorder is drag-based and persisted, and delete is a per-row trash icon in the item header **behind a confirmation dialog**. The confirmation exists specifically because autosave removed the safety net: with no revert, a deletion is irreversible the moment it lands. Item forms carry no create, save, or revert row at all.

Two new components implied: the hybrid currency/equipment row and the single-armour sub-form.

Currency renders with the generic fallback label until gm-domain-and-page-shell supplies the campaign name.

Verification is the real test: transcribe an actual starter-set pre-generated character, reorder a list, reload, and confirm everything came back in order.

**Inherited from character-data-and-sync (archived 2026-08-18):**

- **Rows are addressed by a server-assigned `uid`, never by index.** Adding, patching, and removing go through `addListItem` / `patchListItem` / `removeListItem` in `public/js/app-ui/character-api.mjs`. Structural add and remove bypass the patch queue deliberately; row patches ride it. A new row carries a local `_localId` only until its add resolves.
- **Persisted reordering has no server support yet, and this branch must add it.** `character-data-and-sync` deliberately shipped no order field and no reorder endpoint — rows render in insertion order — on the reasoning that nothing in the rules gives a list a meaningful order. This card's "reorder is drag-based and persisted" therefore needs either a durable order field on each row plus a reorder command, or a decision to drop drag-reordering from the editor. **Settle this during grooming**; do not discover it mid-implementation.
- **Delete the harness list editor** (`public/js/app-ui/harness/character-lists.mjs`) once these tabs exist, if `app-shell-and-home-page` has not already removed the whole harness.
- Currency stores an amount only (`currency.amount`); the label falls back to the literal "currency" until `gm-domain-and-page-shell` supplies the campaign name.
