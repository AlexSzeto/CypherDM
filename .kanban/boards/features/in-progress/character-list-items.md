---
version: 1
id: 'character-list-items'
boardId: 'features'
status: 'in-progress'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-18T05:28:38Z'
modified: '2026-08-18T05:58:00Z'
completedAt: null
labels: ['story']
attachments: []
order: 'a2'
metadata:
  feature: 'character-data-and-sync'
---

# Character List Items and Identifiers

## Goal

The list-shaped parts of a character — skills, abilities, attacks, equipment, cyphers — can be added, edited, and removed, and survive a restart. Rows are addressed by a server-assigned identifier, so editing one row while another is added or removed never rewrites the wrong row.

## Tasks

### Phase 1 — Rows are added, edited, and removed through the API

- [x] Complete initial implementation
  - Add `addListItem(id, listName, seed)`, `patchListItem(id, listName, uid, patches)`, and `removeListItem(id, listName, uid)` to `server/features/characters/service.mjs`. `addListItem` assigns `uid` with `crypto.randomUUID()`, fills the row's schema defaults through the item sanitizer, appends it, and returns the created row. All three reject an unknown `listName` and an unknown `uid` with the existing `CharacterError`.
  - Add `sanitizeListItem(listName, row)` to `server/features/characters/sanitizer.mjs`, resolving the item schema for that list from `characters.schema.json` and filling its defaults. Export `LIST_NAMES` (`skills`, `abilities`, `attacks`, `cyphers`, `equipment`) from the same module and use it as the allowlist in the service — a `listName` outside it must never reach a property lookup.
  - Extend the patch-path rules in `service.mjs` so `patchListItem` reuses `resolvePathSchema`-style validation against the **item** schema: paths inside a row are single-segment or nested scalar paths, `uid` itself is not patchable, and the forbidden-segment and type checks apply exactly as they do to the record.
  - Add routes to `server/features/characters/router.mjs`: `POST /:id/:listName` (body `{ actor, seed? }` → `201 { record, item }`), `PATCH /:id/:listName/:uid` (body `{ actor, clientSeq?, patches }` → `200 { record, applied, actor, clientSeq? }`), and `DELETE /:id/:listName/:uid` (body `{ actor }` → `200 { record }`). Each validates its body with core `validate()` and answers `400 { error, details }` on a malformed body, `404` on an unknown character, list, or uid.
  - Extend `server/features/characters/service.test.mjs`: adding a skill returns a row with a uuid `uid` and the item defaults filled; adding two rows gives distinct uids; patching a row by uid changes only that row; removing the first of three rows leaves the other two with their uids and values intact; patching a removed uid throws a 404-status `CharacterError`; patching `uid` itself is rejected; an unknown `listName` is rejected before any lookup.
  - Extend `server/features/characters/router.test.mjs`: `POST /api/characters/:id/skills` returns 201 with the new row; `PATCH` on its uid updates it; `DELETE` removes it and a second `DELETE` returns 404; `POST` to `/api/characters/:id/nonsense` returns 404.
  - Verify by hand: `curl` an add, a patch by uid, and a remove; restart the server and confirm the surviving rows and their uids are unchanged.

### Phase 2 — Rows are editable in the browser and reconcile their local ids

- [/] Complete initial implementation
  - Add `addListItem(id, listName, seed, actor)`, `patchListItem(id, listName, uid, patches, actor)`, and `removeListItem(id, listName, uid, actor)` to `public/js/app-ui/character-api.mjs`. The add and remove calls go straight out rather than through the patch queue — they are structural, and a queue that reordered them against row patches would address a row that does not exist yet. Row patches go through the queue, keyed by a path of `<listName>.<uid>.<field>` so per-path coalescing works per row and per field.
  - Have the client seed a new row with a local id (`_localId`, `String(Date.now())`) and swap in the server's `uid` when the add resolves, per the `DynamicList` keying rule in `.claude/rules/client.md`. Row patches are not sent for a row that still has only a `_localId`; they are held on the row and flushed once its `uid` arrives.
  - Add `public/js/app-ui/harness/character-lists.mjs` — one `Panel` per list (Skills, Abilities, Attacks, Cyphers, Equipment) rendering rows in a `DynamicList` keyed by `item.uid ?? item._localId`. Each row exposes its text fields as `Input`s that patch on blur, an "Add" `Button` per list, and a per-row delete `Button color="danger"` guarded by `showDialog`. Only the fields listed in Implementation Details are rendered.
  - Render `CharacterLists` from `public/js/app-ui/harness/character-editor.mjs`, below the Notes panel, passing the record and a callback that re-seeds the editor's record from a server response.
  - Add `public/js/app-ui/harness/character-lists.test.mjs` — with `fetch` stubbed, assert that clicking Add on Skills POSTs to `/api/characters/:id/skills`, that a row renders under its returned `uid`, and that editing a row's name PATCHes `/api/characters/:id/skills/:uid` rather than an index-based path.
  - Verify in the browser: add three skills, edit the middle one's name, delete the first, reload the page, and confirm the two survivors kept their own values — the edit must not have migrated to a neighbouring row.
  - Review and update affected living docs: `docs/features/character-record.md` (add a "List rows" section documenting the three endpoints, the uid rule, and the local-id reconciliation), `.claude/rules/client.md` (extend the Client Sync subsection with how structural list operations bypass the queue and why).

## Implementation Details

### Why uids exist at all

Two people write to one character at once — the GM reaches into a player's sheet while the player is editing it. If a row were addressed by array index, a concurrent insert or delete would silently redirect the other party's edit onto a different row, and last-write-wins would settle on a value nobody typed. A server-assigned `uid` makes an edit address the row it was made against, or fail loudly.

The same reasoning drives the client keying rule already recorded in `.claude/rules/client.md`: `DynamicList` keys rows by `item.uid ?? item._localId ?? item.id ?? index`, so a row component's `useState` seed cannot be carried onto a different record by a reorder.

### The five lists and the fields the harness renders

| List        | Fields shown in the harness                    |
| ----------- | ---------------------------------------------- |
| `skills`    | `name`, `proficiency`, `source`, `description` |
| `abilities` | `name`, `cost`, `poolType`, `description`      |
| `attacks`   | `name`, `damage`, `description`                |
| `cyphers`   | `name`, `level`, `cypherType`, `effect`        |
| `equipment` | `name`, `description`                          |

The full item shapes are already in `server/resource/schemas/characters.schema.json` — this story adds no schema fields and therefore needs no migration. Enum fields (`proficiency`, `poolType`, `cypherType`) render as `Select`s over the schema's enum values; everything else is an `Input`.

### Endpoints

| Method   | Path                  | Body                             | Answers                          |
| -------- | --------------------- | -------------------------------- | -------------------------------- |
| `POST`   | `/:id/:listName`      | `{ actor, seed? }`               | `201 { record, item }`           |
| `PATCH`  | `/:id/:listName/:uid` | `{ actor, clientSeq?, patches }` | `200 { record, applied, actor }` |
| `DELETE` | `/:id/:listName/:uid` | `{ actor }`                      | `200 { record }`                 |

`DELETE` answers with the record rather than `204` because the client needs the surviving rows to re-render, and a follow-up `GET` would race a concurrent write.

### Out of scope

- Reordering rows. Nothing in the rules gives a list an order that matters, and a durable order field is cost with no reader. Rows render in insertion order.
- The real sheet's list UI. The harness proves the contract; `character-editor-lists` builds the surface a player uses.
- Any change to the record-level patch endpoint, which continues to reject index paths.
