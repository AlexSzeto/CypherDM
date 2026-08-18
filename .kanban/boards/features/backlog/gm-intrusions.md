---
version: 1
id: 'gm-intrusions'
boardId: 'features'
status: 'backlog'
priority: 'medium'
assignee: null
dueDate: null
created: '2026-08-18T04:47:40Z'
modified: '2026-08-18T06:20:00Z'
completedAt: null
labels: ['feature']
attachments: []
order: 'b7'
---

# GM Intrusions

## Goal

The GM can push an intrusion at one player, at a player who rolled a 1, or at the whole table, and watch each of them accept, refuse, or gift their XP as it happens.

## Stories

## Tickets

## Notes

Depends on initiative-loop. Spans both surfaces; the last major interaction in the app.

GM side: a picker with one button per roster character, a group button, and a **Free Intrusion** checkbox that is never sticky and that disables the group button while checked. After selection the modal becomes a **live resolution table** showing each participant and their outcome, with non-participants greyed out and cancel becoming dismiss once everyone has resolved. Cancel is a no-op with no XP movement that clears the pending intrusion from the players' screens. There is no description field: the GM narrates the fiction aloud and the app carries only the mechanical transaction.

| Type     | XP gained | Gifting | Refusable       |
| -------- | --------- | ------- | --------------- |
| Targeted | 1         | Yes     | Yes, costs 1 XP |
| Free     | None      | No      | Yes, costs 1 XP |
| Group    | 1         | No      | No              |

Player side: all three variants, the gifting list, and the refusal block with its disabled state and error panel when the player has no XP to spend. **Solo roster** replaces the empty gifting list with a plain accept button, per the rules.

**Intrusions block, then remind.** GM-initiated modals are dismissible, leaving a persistent button in the contextual action bar until the event resolves. This is a scoped exception to "modals cancel silently on dismissal", which still holds everywhere else. **Strict priority, no count badge: intrusion outranks initiative.** The only realistic overlap is a free intrusion triggered by rolling a 1 on the initiative task, where intrusion-first is correct anyway, so a queue would be machinery for a case that does not arise.

Pending intrusion state is **unavoidable server state**: a player whose tablet slept must still see the prompt on waking. Intrusion type is tracked because a per-player flag cannot distinguish one unresolved player in a group intrusion from a targeted intrusion on one player.

Resolution moves XP between two character records, so it goes through a **server-side command** and emits one report rather than three XP movements. Gifting is the sole cross-player notification in the app.

_Recorded risk:_ a dismissed intrusion is easy to ignore. The reminder bar is the only pressure and nothing escalates.

**Inherited from character-data-and-sync (archived 2026-08-18):**

- **This branch owns the intrusion half of the character-delete cascade.** Deleting a character must drop it from any pending intrusion's participants, null any `giftedTo` pointing at it, and auto-resolve the intrusion if that leaves no pending participants. Without this, deleting a character mid-intrusion leaves an intrusion nobody can resolve — a locked state. Unlikely in real use; cheap to prevent, expensive to hit.
- **The two-record command pattern is described but not yet built.** `character-data-and-sync` established that operations touching two character records are single atomic server calls rather than pairs of patches, and shipped none of them. `play-mode-equipment` builds the first; reuse its shape here rather than inventing a second.
- Resolution must not go through the client patch queue: like other structural operations it is one call, and a queue that reordered it against field patches could apply XP against a stale record.
