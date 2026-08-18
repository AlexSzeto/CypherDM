---
version: 1
id: 'sheet-ui-vocabulary'
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
order: 'a2'
---

# Sheet UI Vocabulary

## Goal

The shared visual and interaction vocabulary that both the character sheet and the GM dashboard are built from, delivered once so that two surfaces built months apart cannot drift.

## Stories

## Tickets

## Notes

Depends on app-shell-and-home-page only for somewhere to render. Blocks every sheet and dashboard feature.

**Contents:** the boxed numeric display (filled means interactive, bordered means not) and its matching boxed numeric input; the parameterised adjustment modal (title, annotation slot, projected value, plus and minus, confirm, configurable clamps and opening value); the tap-driven tooltip replacing hover project-wide; the collapsible list row; TabPanels icon support with active-shows-label and inactive-shows-icon-only; the borderless horizontally-scrolling table with icon-only headers; and the port of the form-validation components still missing from custom-ui/.

**Placement decided:** the **number boxes and the numeric input live in app-ui/**, not custom-ui/. Their font size, border treatment, and padding differ drastically from the standard Input, so they are app vocabulary rather than a general-purpose control. This is also the sanctioned answer to the client.md rule against custom inputs, recorded as a deliberate amendment. Everything else in this branch is generic and goes to custom-ui/, each with a test.html example and a test.vitest.mjs render entry.

ICON_MAP additions are **already complete** and are not part of this branch.

**Theme note.** The light theme border.primary (#cccccc) may read faint beside a solid filled box. Left as-is for now. If it proves unreadable in practice it is fixed **globally in theme.mjs**, holding light and dark at parity, never worked around inside a component.

Not user-facing on its own. layout-preview-page is where it becomes visible.
