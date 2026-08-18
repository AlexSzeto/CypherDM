---
version: 1
id: 'gm-party-table'
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
order: 'b3'
---

# GM Party Table

## Goal

The GM's overwatch screen: every character in the session on one row each, live, with every number on it a tap away from being changed.

## Stories

## Tickets

## Notes

Depends on gm-domain-and-page-shell. Table component comes from layout-preview-page.

The out-of-encounter table: name on a row coloured by the character's chosen colour, current Might, Speed and Intellect in damage order, a single condition icon, XP, and the time cost of the next recovery roll. Borderless, numbers only in cells, icon-only headers with a tap-tooltip giving the plain label, horizontally scrollable with no pinned column, resting at leftmost scroll.

**The governing principle for this whole surface:** numbers that go up and down during play earn screen space; anything the GM can read off a rulebook or bestiary behind their screen stays out of the app. That decided, on its own, that there are no maximum pool values on the table, no creature armor or damage, no cheat sheets, and label-only tooltips rather than mechanical explanations. The player side is deliberately more informational because a player has no screen to hide books behind.

**The condition column is a single prioritised alarm:** one icon, highest priority wins, cypher overload then debilitated then impaired, tap for the full list. Overload outranks the damage track because the pool numbers already give an approximate read on damage, while overload has no other representation here and must be resolved within in-game minutes.

**Disconnected does not mean absent.** Rows dim but keep every interaction. The app cannot tell a player who stepped away for a drink from one who is out for the session, so it reports connection state and lets the GM interpret it.

Column order is by combat relevance so that horizontal truncation costs XP and Recovery first. The real clipping point is unknowable before testing on a phone, so this is expected to be revised after layout-preview-page and after real use.
