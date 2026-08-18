---
version: 1
id: 'play-mode-overview'
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
order: 'a7'
---

# Play Mode: Overview Tab

## Goal

The surface a player actually lives in during a session: their whole character readable at a glance, with the few numbers that move during play a tap away. This is the first branch that makes the app usable at a real table.

## Stories

## Tickets

## Notes

Depends on character-editor-lists and live-sync-and-notifications. Presentational components come from layout-preview-page.

Play mode becomes the sheet default. Covers the identity line, the three-column pool layout with points over maximum, the tier/effort/XP row where **XP alone is interactive**, the four recovery slots, the derived conditions list, the read-only advancement summary, and the edit-mode button buried at the very bottom.

Pool points and XP open the adjustment modal, which commits **one net change** with an explicit confirm, so a player taking six damage generates one notification rather than six.

**Recover ticks the next box and nothing else.** It adds no points, because the roll is 1d6 plus bonus and the app does not roll dice. The player rolls physically and moves their own points. Clear empties the whole track, for any reason. This is the clearest expression of the north star in the app and should not be quietly "improved" later.

Conditions are strictly derived from pool values: one pool at zero is Impaired, two is Debilitated. Death is handled at the table.

Carries the section tooltips for Effort, XP, Recovery Rolls, Impaired and Debilitated, on the tap-driven tooltip from sheet-ui-vocabulary.
