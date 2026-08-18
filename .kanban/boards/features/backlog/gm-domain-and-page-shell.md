---
version: 1
id: 'gm-domain-and-page-shell'
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
order: 'b2'
---

# GM Domain and Page Shell

## Goal

The GM gets a record of their own and a home to work from: a three-tab GM page with a scratchpad and campaign configuration, and a roster that fills itself in as players connect.

## Stories

## Tickets

## Notes

Depends on live-sync-and-notifications.

**GM data is a character sheet.** A single persistent domain on the same terms as a character: server-side, autosaved, surviving restarts. One GM object per deployment. Holds config, notes, roster, encounter, and intrusion. The consequence is that an encounter left running is simply still there next session, which is correct behaviour rather than a bug: an earlier proposal for an "encounter in progress" prompt on load was reversed, since a prompt would be the app second-guessing state it was told to keep.

Delivers the Party/Encounter tab as a placeholder, the Notes tab, and the Config tab carrying the currency name, which the character sheet's currency row starts reading from in place of its fallback.

**Roster membership is automatic**, created the first time a character's device connects, and persists thereafter. There is no add-to-session interaction. Deriving the roster from live connections instead was rejected: tablets sleep constantly, and rows vanishing mid-combat would look like a bug and would take initiative answers and turn markers with them.

The GM page is the destination recorded by last-destination memory. The GM's **view of a character sheet is not recorded**, so reopening the app returns the GM to their dashboard rather than to whichever sheet they last inspected.

GM notes are private and never broadcast. Character notes are visible to the GM through the sheet, but never generate a toast on either side.

**Inherited from character-data-and-sync (archived 2026-08-18):**

- **Character delete currently cascades nowhere, and this branch owns the roster half.** `DELETE /api/characters/:id` removes the character record only, because the GM Object did not exist when it was written. When the roster lands here, deleting a character must also remove its roster entry — otherwise the dashboard renders a row pointing at a record that is gone. Add a co-located test for it.
- **Currency name.** The character record stores `currency.amount` only, and every surface currently falls back to the literal string "currency". This branch's Config tab is what replaces that fallback.
- The GM domain should follow the storage conventions the characters domain established: a JSON **object** carrying `version` (not a bare array), the version stamped by the domain's single write function, atomic `.tmp`-then-rename writes, and a schema in `server/resource/schemas/`. See `docs/features/character-record.md`.
