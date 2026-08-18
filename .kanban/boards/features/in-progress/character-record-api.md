---
version: 1
id: 'character-record-api'
boardId: 'features'
status: 'in-progress'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-18T05:28:38Z'
modified: '2026-08-18T05:40:00Z'
completedAt: null
labels: ['story']
attachments: []
order: 'a0'
metadata:
  feature: 'character-data-and-sync'
---

# Character Record API

## Goal

A character lives on the server and survives a restart. A participant can create a character, see it in a list, open it, change a scalar field, reload the page, and find the change still there — proved through a throwaway harness page that exercises the API directly.

## Tasks

### Phase 1 — A character persists through the API

- [x] Complete initial implementation
  - Add `server/resource/schemas/characters.schema.json` — a draft-07 schema for the whole characters data file (`{ version, characters: [] }`), with the full character object shape from Implementation Details below, every property carrying a `default` so `sanitize()` can fill a partial record. Include the list fields (`skills`, `abilities`, `attacks`, `equipment`, `cyphers`) with their item shapes even though no endpoint writes them yet, so the later list-item story needs no schema migration.
  - Register the domain in `server/core/data-versions.mjs`: add `characters: { currentVersion: 1, filePath: path.join(DATABASE_DIR, 'characters-data.json') }` to `DATA_DOMAINS`, importing `DATABASE_DIR` from `./paths.mjs`. No migration script is needed — the domain is new and starts at v1.
  - Add `server/features/characters/repository.mjs` — reads and writes `server/database/characters-data.json`. On a missing file, return `{ version: getCurrentVersion('characters'), characters: [] }`. The single write function stamps `data.version = getCurrentVersion('characters')` before writing and writes atomically (write to a `.tmp` sibling, then `fs.renameSync`).
  - Add `server/features/characters/sanitizer.mjs` exporting `sanitizeCharacter(record)` and `sanitizeCharactersData(data)`, each calling core `sanitize()` with the schema, then deleting unknown top-level keys from the record (the domain's unknown-field policy is drop-silently).
  - Add `server/features/characters/service.mjs` — `listCharacters()`, `getCharacter(id)`, `createCharacter({ name })`, `deleteCharacter(id)`, `patchCharacter(id, { actor, patches })`. `patchCharacter` applies patches in array order, last-write-wins per path, and returns `{ record, applied }`. Ids are generated with `crypto.randomUUID()`.
  - Implement dot-path patching inside `service.mjs` per the Path rules in Implementation Details: reject unknown paths, array-index paths, and the keys `__proto__` / `constructor` / `prototype`; validate each value's type against the schema leaf.
  - Add `server/features/characters/router.mjs` with `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` — routes extract params and call the service only. `POST` and `PATCH` call core `validate()` on `req.body` against the request schemas and return `400 { error, details }` on failure. Unknown id returns `404 { error }`.
  - Mount the router in `server/server.mjs` at `/api/characters`, in the "Mount feature routers" section.
  - Add `server/features/characters/service.test.mjs`: creating a character yields all schema defaults and a uuid id; a patch to `pools.might.current` changes only that field; two patches to the same path in one call leave the last value; a patch to an unknown path is rejected; a patch to `__proto__.polluted` is rejected and object prototypes stay clean; delete removes the record and a second delete reports not-found. Point the repository at a temp directory per test.
  - Add `server/features/characters/router.test.mjs` using supertest: `POST /api/characters` returns 201 with a record; `GET /api/characters/:id` returns it; `PATCH` with a malformed body returns 400 with `details`; `GET` on an unknown id returns 404; `DELETE` then `GET` returns 404.
  - Verify by hand: start the server, `curl` a create, a patch, and a read; restart the server and confirm the patched value is still returned.

### Phase 2 — A character is editable from the browser

- [x] Complete initial implementation
  - Add `public/harness.html` — a copy of `public/index.html`'s head (theme cookie, fonts, importmap, boxicons) whose module entry is `/js/harness.mjs`.
  - Add `public/js/harness.mjs` — the page root. Wraps everything in `Page`, subscribes to `currentTheme` with `currentTheme.subscribe`, and renders an `H1` and a `Caption` as the page header (`app-ui/themed-base.mjs` and its `AppHeader` do not exist yet — they arrive with `app-shell-and-home-page`). Holds the selected character id in `useState`; shows the roster when none is selected and the editor when one is.
  - Add `public/js/app-ui/harness/character-roster.mjs` — lists characters from `GET /api/characters` in a `VerticalLayout`, one `Panel` per character showing name and id with an "Open" `Button`, plus a `Button` that POSTs a new character and opens it, and a per-row delete `Button color="danger"` that confirms via `showDialog` before calling `DELETE`.
  - Add `public/js/app-ui/harness/character-editor.mjs` — renders `Input` fields for `name`, `descriptor`, `type`, `focus`, `notes` and numeric inputs for `tier`, `xp`, `cypherLimit`, `effortLimit`, `currency.amount` and each of the nine pool values. Each field PATCHes its own dot path on `blur` (text) or `change` (numeric) with `actor: 'harness'`, and re-seeds from the response. A "Reload from server" `Button` re-fetches the record. No save or revert buttons — the sheet saves itself.
  - Add `public/js/app-ui/harness/character-api.mjs` — the fetch wrapper (`listCharacters`, `createCharacter`, `getCharacter`, `patchCharacter`, `deleteCharacter`) used by both components, logging failures via `log('harness', 'error', …)`. The offline queue story replaces the internals of `patchCharacter` here; keep the signature `patchCharacter(id, patches, actor)`.
  - Add a link to `/harness` from the home page in `public/js/app.mjs`, labelled "Character Harness (temporary)", so the page is reachable from the navigation hub per `.claude/rules/client.md`.
  - Add `public/js/app-ui/harness/character-editor.test.mjs` — with `fetch` stubbed, assert the editor renders a record's name into its input, and that blurring a changed name issues one PATCH whose body carries a patch entry with `path: 'name'` and the new value.
  - Verify in the browser: create a character, change its name and a pool value, reload the page, and confirm both survive.
  - Create `docs/features/character-record.md` documenting the character data shape, the patch contract (dot paths, actor tag, last-write-wins), the five endpoints, and the harness page's temporary status.
  - Review and update affected living docs: `docs/features/character-record.md`, `docs/cypher-system-design-spec.md` (confirm §3.1 field names match the implemented shape; correct the doc only if the spec is ambiguous, never the other way round), `.claude/rules/server.md`, `.claude/rules/client.md`.

## Implementation Details

### Data file

`server/database/characters-data.json` holds `{ "version": 1, "characters": [] }` — a JSON object rather than a bare array, so it can carry `version`.

### Character record shape

```js
{
  id: '<uuid>',
  name: '',
  color: '#888888',
  descriptor: '',
  type: '',
  focus: '',
  tier: 1,
  pools: {
    might:     { max: 0, current: 0, edge: 0 },
    speed:     { max: 0, current: 0, edge: 0 },
    intellect: { max: 0, current: 0, edge: 0 },
  },
  effortLimit: 1,
  xp: 0,
  recovery: { bonus: 0, used: [false, false, false, false] },
  skills: [],      // { uid, name, proficiency, source, description }
  abilities: [],   // { uid, name, source, cost, variableCost, poolType, execution, description }
  attacks: [],     // { uid, name, description, damage }
  armor: { name: '', points: 0, description: '', speedPenalty: 0 },
  cypherLimit: 2,
  cyphers: [],     // { uid, name, level, cypherType, effect }
  equipment: [],   // { uid, name, description }
  currency: { amount: 0 },
  notes: '',
  advancement: {
    increasingCapabilities: false,
    movingTowardPerfection: false,
    extraEffort: false,
    skills: false,
    otherOptions: false,
  },
  createdAt: '<ISO 8601>',
  modifiedAt: '<ISO 8601>',
}
```

Notes on naming, all traceable to `docs/cypher-system-design-spec.md` §3.1:

- **Damage track is not stored.** It is strictly derived from how many pools sit at 0, and is computed client-side.
- `skills[].proficiency` — not `type`; "Type" is reserved for the character's Type and for cypher types.
- `cyphers[].cypherType` — the Manifest/Subtle enum, spelled so it never collides with the character's `type`.
- `currency` stores an amount only. The display name comes from GM config, which does not exist yet; the harness labels it "currency".
- `recovery.used` is a fixed four-element boolean array: Action, 10 Minutes, 1 Hour, 10 Hours.

### Patch request

`PATCH /api/characters/:id` takes a body of `{ actor, clientSeq?, patches: [{ path, value }] }` and answers `200` with `{ record, applied, actor, clientSeq }`, where `applied` lists the paths written. `clientSeq` is optional and echoed back; the queue story uses it.

**Path rules.** A path is a dot-separated route to a scalar leaf or a whole object that already exists in the schema.

- The path must resolve against the character schema. An unresolvable path is a `400`, not a silent no-op — a typo in a path that quietly succeeds is the worst failure mode here.
- `__proto__`, `constructor`, and `prototype` are rejected as path segments before anything else.
- Numeric segments (`skills.0.name`) are rejected with a `400` naming the list-item story: rows are addressed by `uid`, never by index, and no list endpoint exists yet.
- The value's type must match the schema leaf's `type`. `recovery.used` accepts a four-element boolean array as a whole.
- Patches apply in array order; the last write to a repeated path wins. There is no rejection and no merge — the whole point of field-level granularity is that a collision costs one field.

The `actor` string identifies who wrote. It is required, echoed in the response, and **not persisted** — nothing consumes it until `live-sync-and-notifications` uses it to skip notifying the originator of their own change.

### Out of scope for this story

- List add/update/remove and server-assigned `uid`s — `character-list-items`.
- The client-side FIFO queue, retry, and save indicator — `offline-patch-queue`. The harness patches with a plain `fetch` here and is rewired there.
- SSE or any push — `live-sync-and-notifications`.
- Delete cascades into the GM roster, intrusion participants, and `giftedTo` — those records do not exist until `gm-domain-and-page-shell`. Delete removes the character record only.
