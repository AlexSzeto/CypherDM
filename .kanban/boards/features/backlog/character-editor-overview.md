---
version: 1
id: 'character-editor-overview'
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

**Inherited from character-data-and-sync (archived 2026-08-18):**

- **Write path.** Every field writes through `patchCharacter(id, patches, actor)` in `public/js/app-ui/character-api.mjs`, which enqueues onto the per-character patch queue. Never call `fetch` directly — see the Client Sync section of `.claude/rules/client.md` and `docs/features/character-record.md`.
- **The debounce sits above the queue, not inside it.** The 750ms–1s typing debounce is this branch's job; the queue separately coalesces repeated writes to the same path while they are still unsent, so the two compose rather than duplicate. Still flush on blur.
- **The sheet carries a `SaveIndicator`** (`public/js/app-ui/sync/save-indicator.mjs`), persistently and not as a toast. It is what replaces the save/revert row this card removes: with no save button, the indicator is the only thing telling the player their edits are landing.
- **Patch paths are validated server-side and an unknown path is a 400**, not a silent no-op. A field bound to a mistyped path fails loudly — expect that during wiring rather than treating it as a bug in the API.
