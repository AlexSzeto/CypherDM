---
version: 1
id: 'initiative-loop'
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
order: 'b6'
---

# Initiative Loop

## Goal

The full initiative round trip: the GM sets one number, every player is asked whether they act before or after the NPCs, and the table sorts itself into bands as the answers arrive.

## Stories

## Tickets

## Notes

Depends on encounter-and-creatures and gm-character-sheet-view. Spans both surfaces and is only testable as a loop.

**Initiative is a band, not a number, and that is a rules decision rather than a UI one.** Modelling it as a submitted number produces the right order but inverts a real mechanic: applying Speed Effort to ease an initiative task should lower the target, whereas that model can only express it as raising the player's roll. Correct output, wrong causality, and any UI showing a player their initiative as a value teaches the inverted model.

The fix is the optional rule that **NPCs act as a group on the highest target number among them**, which removes per-creature initiative entirely. The GM enters one number; the player answers a binary question; creatures carry no initiative value.

Player side: a modal showing the target number and two buttons, acts before NPCs or acts after. The player rolls a physical d20 and applies Effort themselves by rolling against a lower number. If the GM ends or dismisses initiative first, the modal simply goes away.

GM side: the table sorts into three bands, acts-before then creatures then acts-after, name ascending inside each, with unanswered players last. The initiative cell doubles as the turn-taken marker, and the NPC band shows a bare marker with no number. Within a band participants act in any order; the table does not enforce or highlight a current turn, which is exactly why the checkmarks exist.

**Player-visible initiative order is withheld, not unbuilt.** The rules define no ordinal position, so the app shows none. This is load-bearing.

The target number is never displayed after entry. Restarting initiative clears answers and re-prompts without destroying creatures or health.

_Recorded risk:_ a mistyped target number can only be fixed by restarting initiative, which re-prompts everyone. One field entered once; if it bites, make it editable.

_Accepted, cosmetic:_ name-ascending is lexical, so ten identical creatures sort 1, 10, 2.
