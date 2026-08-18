---
version: 1
id: 'event-log-and-session-shakedown'
boardId: 'features'
status: 'backlog'
priority: 'low'
assignee: null
dueDate: null
created: '2026-08-18T04:47:40Z'
modified: '2026-08-18T04:47:40Z'
completedAt: null
labels: ['feature']
attachments: []
order: 'b8'
---

# Event Log and Session Shakedown

## Goal

The last button in the GM's row opens a history of everything that has happened this session. Then the whole app is run at a real table, on real devices, and whatever that exposes is fixed. This is the branch that declares stage one complete.

## Stories

## Tickets

## Notes

Depends on gm-intrusions. Final branch of stage one.

**The event log is provisional by design.** A scrollable panel of this session's notifications, hosted at app level alongside the toasts because the GM page unmounts whenever a sheet is opened. Uniquely in this app it is **client-side session data, not server state**. A persisted server-side log was rejected: unbounded growth, a truncation policy, and an audit trail for a trusted five-person game nobody will litigate. Its usefulness is genuinely unknown, so it is placed where it can be tried and then upgraded or dismantled cheaply.

_Known and accepted:_ it dies on browser reload. sessionStorage is the cheap fix if that turns out to matter.

**The shakedown is the real content of this branch.** Run an actual session with a GM and at least two players on their own devices, and settle the questions that were deliberately left open until there was something to use:

- The phone-portrait clipping point on the GM table, held provisionally since it is unknowable before implementation.
- Whether the light theme's border reads clearly enough beside a filled box; if not, fix it globally in theme.mjs at light and dark parity.
- Whether the offline queue's ordering holds now that player-to-player writes are in the mix.
- Whether multi-tap on the adjustment modal proves tedious, with long-press-to-repeat as the noted fallback.

Bugs found here become tickets against this feature rather than silent fixes, so the shakedown leaves a record.
