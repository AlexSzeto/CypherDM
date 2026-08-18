---
version: 1
id: 'encounter-and-creatures'
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
order: 'b5'
---

# Encounter and Creatures

## Goal

The GM can start a fight, put creatures on the table beside the players, track their health and who has acted, run rounds, and tear the whole thing down when it is over.

## Stories

## Tickets

## Notes

Depends on gm-party-table.

Covers the encounter lifecycle, the Initiative and Level columns **appearing and disappearing** rather than being disabled, Add Creatures, rename, health, turn markers and New Round. The target-number prompt is stubbed here and completed by initiative-loop.

**Add Creatures** takes name, level, health prefilled from the creature's target number and editable, and a count defaulting to 1. With count above 1 names are suffixed 1 to N; with count 1 the bare name is used. Suffixes **continue past the highest existing suffix** for that base name so a second batch never collides with the first. Any creature can be renamed by tapping its name.

**Creatures are ephemeral.** They exist only inside an encounter and are destroyed with it. There is no group identity: three zombies are three independent records that cohere on the table only because they share a band. A bestiary and add-creature autocomplete were both considered and deferred as ranking below basic coverage.

**Destructive actions are told, not guarded.** Creature removal at zero health stays automatic, but the adjust-value modal states the consequence in an error-coloured panel above the confirm button first. This closes the one unrecoverable mis-tap the table permits, since horizontal scrolling with no pinned name column makes wrong-row taps plausible. Leaving dead creatures to be cleared manually was rejected: it turns the most common event in a fight into a chore and fills the table with noise exactly when it most needs to be readable.

**Level is the bought exception** to the mutable-state-only rule: it sets the target number for every roll every player makes against that creature, many times a round, and earns permanent space.

End Initiative requires confirmation and sits second to last in the button row purely by press frequency, which incidentally buries it.
