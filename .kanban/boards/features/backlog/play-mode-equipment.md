---
version: 1
id: 'play-mode-equipment'
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
order: 'a9'
---

# Play Mode: Equipment

## Goal

Inventory management at the table: a player can see what they carry, spend and receive currency, add something the GM just handed them, hand an item to another player, and drop what they no longer want.

## Stories

## Tickets

## Notes

Depends on play-mode-overview. First consumer of the two-record command pattern from character-data-and-sync.

Covers the play-mode row templates for attacks, armor and equipment, currency as the pinned first row opening a **direct numeric entry modal** rather than a stepper, and an add-equipment modal that adds to the equipment list only, never to attacks or armor.

**Give and remove.** Give lists the other roster characters as buttons; choosing one moves the item and notifies the recipient. Remove deletes after confirmation. Both may also strip a matching attack or armor entry from the departing player, offered as **pre-checked boxes inside the same modal** rather than a second dialog, and only when the departing item is the **last equipment entry of its name**. When duplicates remain, no boxes render and nothing is stripped, because the player still has one.

**The recipient receives the equipment item only**, never the attack or armor entry, because carrying a thing and being able to use it are different facts. They reconcile it in edit mode.

Giving writes to two character records, so it goes through a **server-side command**, not a pair of patches. It emits one report, not equipment-removed plus attack-removed plus armor-removed.
