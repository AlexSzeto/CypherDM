---
version: 1
id: 'play-mode-cyphers'
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
order: 'b0'
---

# Play Mode: Cyphers

## Goal

The cypher tab in play: what the character is carrying, how close they are to their limit, and an unmissable warning the moment they go over it.

## Stories

## Tickets

## Notes

Depends on play-mode-overview.

Covers the limit indicator (the text "You are bearing", the number carrying over limit, the text "cyphers", with the number turning error red while over), collapsible cypher rows showing name, level, type and full effect text, and remove-after-confirmation.

**Removal requires no rules justification.** Used, voluntarily destroyed to get back under limit, or destroyed by the GM enforcing the limit are all the same operation. Whichever party acts, the other is notified, with GM as the actor name when the GM acted.

**The Cypher Overload modal** fires whenever an added cypher leaves the player over limit, including going from three to four against a limit of two, and persists while the player is out of session. It is purely informational, every consequence it describes is resolved manually at the table, and **dismissal counts as acceptance**, so it leaves no reminder in the contextual action bar.

**Overload is an event, not a condition.** It deliberately does not join the player's Conditions list, because "condition" is a rulebook term with mechanical weight and a player who saw overload sitting beside Impaired would go looking for a rule that does not exist. The GM's condition column does carry it, because the GM reads it as informational. The asymmetry between the two surfaces is intentional and must not be tidied up.

_Recorded risk:_ overload is invisible until it has already happened. There is no approaching-limit warning.
