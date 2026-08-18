---
version: 1
id: 'effort-and-ability-use'
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
order: 'a8'
---

# Effort and Ability Use

## Goal

The two ways a player spends pool points on purpose: applying Effort, and using a special ability. Both arrive with the cost worked out and shown, so the player confirms a starting position rather than doing arithmetic under pressure.

## Stories

## Tickets

## Notes

Depends on play-mode-overview.

**Effort assists, it does not adjudicate.** Each pool gets an Apply Effort button labelled with the estimated cost, opening the adjustment modal with that cost **already applied** and the formula that produced it printed beneath: `Cost: 3 - [edge] (Edge) + [penalty] (Armor Penalty) + 1 (Impaired)`, each term rendering only when it applies. The Armor Penalty term appears for Speed Effort only; the Impaired term only while Impaired.

**The formula is what makes the estimate safe.** It asserts no correct answer, it shows its scope, so a cypher or a temporary condition is visibly the player's to add before confirming. Partial automation is permitted here precisely because it can display its work. Debilitated is not modelled, since standard actions are out of reach at that point.

_Recorded risk:_ the formula's silence about abilities, cyphers and temporary conditions may read as exhaustive. Judged smaller than the forgotten-surcharge risk it replaces.

Also covers the Skills and Abilities tab in play mode: one-line skills showing proficiency, collapsible ability rows, and use buttons labelled `[cost][+ if variable] [Pool] (-[Edge])` with the Edge segment rendering only when Edge is 1 or more. Fixed-cost abilities spend immediately; variable-cost abilities open the adjustment modal as a spend chooser with asymmetric clamps and a non-zero opening value.

Ability use is the first consumer of notification altitude: the toast reads at ability level, not as a raw pool change.
