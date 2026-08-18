---
version: 1
id: 'app-shell-and-home-page'
boardId: 'features'
status: 'backlog'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-18T04:47:40Z'
modified: '2026-08-18T06:20:00Z'
completedAt: null
labels: ['feature']
attachments: []
order: 'a1'
---

# App Shell and Home Page

## Goal

The app's only navigation hub. A home page with a searchable character list, a create-new-character button, and GM mode entry; a hamburger menu reduced to exactly a theme toggle and a home link; and a device that remembers where it was and returns there on load.

## Stories

## Tickets

## Notes

Depends on character-data-and-sync.

**Supersedes the client.md navigation rule** that every new page be registered in app-ui/hamburger-menu.mjs. The hamburger is not a page registry: all navigation flows through home page content.

**Seat claiming.** Opening a character claims that seat for the device, and the app returns there on next load. A GM who goes home and opens a player's sheet is assuming that character's identity, which is expected outside play and prevented during it, because the home page disables the button for any character already claimed by another connected client. GM mode is its own destination and claims no seat.

The disabled-claimed-seat state needs live connection data, so it lands with live-sync-and-notifications, not here. This branch ships the claim itself, the last-destination memory, and the hamburger home link as the escape hatch when a device changes hands.

**Inherited from character-data-and-sync (archived 2026-08-18):**

- **Delete the temporary harness page here.** `character-data-and-sync` shipped `/harness` as the visible end of its stories, linked from the home page. This branch supplies the real hub, so remove `public/harness.html`, `public/js/harness.mjs`, `public/js/app-ui/harness/`, and the "Character Harness (temporary)" button in `public/js/app.mjs`. Nothing else may be reachable only from the harness by then.
- **Do not delete `public/js/app-ui/character-api.mjs` or `public/js/app-ui/sync/`.** They were deliberately moved out of `harness/` because they are permanent: the API client, the patch queue, and the `SaveIndicator`. The real character sheet imports all three.
