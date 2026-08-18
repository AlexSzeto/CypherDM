---
version: 1
id: 'character-editor-overview'
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
order: 'a4'
---

# Character Editor: Overview Tab

## Goal

The five-tab character sheet shell in edit mode, with its first tab complete: a player can type in their name and colour, their descriptor, type and focus, their three pool maxima and Edge values, tier, effort and XP, and their recovery bonus, and watch it save itself.

## Stories

## Tickets

## Notes

Depends on character-data-and-sync and sheet-ui-vocabulary.

Establishes the architecture the whole sheet rests on: **section components take a mode prop rather than being forked.** Play mode and edit mode share one information architecture, the same tabs in the same order with the same labels and section chrome, and differ only in affordances. Switching modes should read as the fields waking up, not as a different app.

Tier, effort and XP default to 1 / 1 / 0. The four recovery slots and the damage track render as **inert previews**, teaching the sheet anatomy at zero interaction cost. Advancement checkboxes and current pool values are **not rendered at all** in this layout. Current pool values initialise to their maxima.

No save, create, or revert buttons anywhere. Autosave is debounced while typing (roughly 750ms to 1s) and flushed on blur, since blur-only would lose a value typed just before the tablet is closed. Partial values persist, which is acceptable because there is no validation gate and no consumer of a half-built character.
