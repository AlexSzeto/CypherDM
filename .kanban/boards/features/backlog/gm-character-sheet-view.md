---
version: 1
id: 'gm-character-sheet-view'
boardId: 'features'
status: 'backlog'
priority: 'medium'
assignee: null
dueDate: null
created: '2026-08-18T04:47:40Z'
modified: '2026-08-18T04:47:40Z'
completedAt: null
labels: ['feature']
attachments: []
order: 'b4'
---

# GM Character Sheet View

## Goal

The GM can open any player's sheet from the table, change anything on it, and get back. This is how loot is handed out, how a mistake is corrected, and how a character leaves the session.

## Stories

## Tickets

## Notes

Depends on gm-party-table and the whole play-mode set. This is the hardest prerequisite chain in the project.

**The GM's sheet view is the player's sheet.** Not a read-only variant and not a third affordance set. The GM writes through the same controls the player uses. A read-only mode with an edit toggle was rejected because the adjustment modal already requires an explicit confirm, so a stray tap cannot change anything, and the toggle would add a step to every legitimate edit to prevent an impossible mistake. A GM-specific affordance set was rejected more strongly: section components take a mode prop rather than being forked, and a third mode would make every current and future section answer "what does this look like for the GM" forever.

Three differences only: a **return button** fixed at the top, existing solely in this view; the **edit-mode button hidden**, since that path is a two-layer-deep specialisation with almost no use; and **Remove from Session** at the bottom of the Overview tab, GM-only and **disabled while the character is connected**, because a connected device would re-add itself and a removal that silently reverted would be worse than no button at all.

Establishes the **fixed-top contextual action bar** as an app-level slot holding at most one button, with its occupant chosen by context. The GM's return button and a player's pending-event reminder are the same primitive and can never co-occur.

**There is no loot distribution form.** The GM adds the cypher or item through the sheet's own interface. The design spec's separate distribution form is superseded.

Delete-character stays the player's action in the player's edit mode, reachable by the GM only by opening the sheet from the home page outside GM mode. Navigation depth is the safety mechanism, not escalating confirmations.
