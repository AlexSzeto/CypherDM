---
version: 1
id: 'layout-preview-page'
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
order: 'a3'
---

# Layout Preview Page

## Goal

One page that renders the three layouts most expensive to get wrong, the GM encounter table, the character Overview tab in play mode, and the adjustment modal in each of its dressings, against fixture data, so they can be checked and corrected on a real phone and a real tablet before anything is wired to live data.

## Stories

## Tickets

## Notes

Depends on sheet-ui-vocabulary. This is the layout-verification step requested during planning.

**Built from the real components, not mocked up.** The table, the pool section, the identity line, the recovery and conditions blocks, and the modal dressings are the same components play-mode-overview and gm-party-table will consume. Only the data is stubbed. So this branch is not throwaway work: it front-loads the presentational half of two later features and leaves the data wiring to them.

**Fixture data must cover what actually breaks layouts:** a long character name, three-digit pool and XP values, a full encounter with creatures and players in all three initiative bands, a disconnected row, every condition icon, an exhausted recovery track, and an over-limit cypher count.

Kept afterwards as the app-ui gallery, the counterpart to custom-ui/test.html.

Verification is by eye and by hand: phone-portrait and tablet, both themes, checking that nothing clips, that horizontal scroll reaches the Recovery column, and that filled versus outlined boxes are distinguishable at arm's length across a whole table. This is where the light-theme border question gets settled one way or the other.
