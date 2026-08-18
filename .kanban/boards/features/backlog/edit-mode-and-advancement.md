---
version: 1
id: 'edit-mode-and-advancement'
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
order: 'b1'
---

# Edit Mode and Advancement

## Goal

The end-of-session flow: a player switches their sheet out of play mode into the full editor, records the advancement steps they bought, makes the resulting changes themselves, and switches back. Completes the character sheet.

## Stories

## Tickets

## Notes

Depends on character-editor-lists and play-mode-overview.

Delivers the play-to-edit mode switch, edit mode exposing everything play renders read-only (pool maxima, Edge, tier, effort, recovery bonus, cypher limit, attack damage, armor values, ability costs), the interactive Advancement section, and the player's own delete-character control at the bottom of the Overview tab.

**Advancement records that a step was taken and nothing else.** Checking a step does not deduct the 4 XP, raise a pool, add a skill, or raise the tier. This is not an oversight and no future card may change it without first solving the display problem: applying some value changes and not others, with nowhere to explain which, teaches one of two wrong lessons, either that the applied changes are the only ones required, or that since some were not applied none were, in which case an inattentive player subtracts the XP twice.

This is the counterpart to the Effort decision. Effort automates partially **because** it can display its scope; advancement has no equivalent display surface, so it automates nothing.

Five steps, each choosable once, four purchases raising the tier. The rules text each checkbox carries is **verified** against the printed starter set and recorded in the design spec and in _Player playing a session_ §3.8.

Advancement is edit-mode only and read-only in play, which also puts the checkbox in the same place as the fields it implies, making levelling one visit rather than a bounce between modes.
