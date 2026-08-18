# Character Record

The character record is the server-held document behind every player-facing surface in the app. It is created empty, filled in by transcription, and mutated field by field for the rest of its life. Nothing in the app writes a whole character.

## Data file

`server/database/characters-data.json`, owned by the `characters` domain (`server/features/characters/`):

```json
{ "version": 1, "characters": [] }
```

It is a JSON object rather than a bare array so it can carry `version`. The repository's single write function stamps the current version from `server/core/data-versions.mjs` on every write and renames a `.tmp` sibling into place, so a crash mid-write cannot truncate the file.

The authoritative shape is `server/resource/schemas/characters.schema.json`. Every property carries a `default`, so a partial record read from disk — or created by `POST` — comes back complete.

## Record shape

| Field                                                    | Notes                                                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `id`                                                     | Server-assigned uuid.                                                                                    |
| `name`, `color`, `descriptor`, `type`, `focus`           | Identity. `color` is what identifies a character at a glance on the GM dashboard.                        |
| `tier`                                                   | Integer, defaults to 1.                                                                                  |
| `pools.{might,speed,intellect}`                          | Each `{ max, current, edge }`.                                                                           |
| `effortLimit`                                            | How many levels of Effort may be applied at once.                                                        |
| `xp`                                                     | Experience total.                                                                                        |
| `recovery`                                               | `{ bonus, used }`, where `used` is a fixed four-element boolean array: Action, 10 Min, 1 Hour, 10 Hours. |
| `skills`, `abilities`, `attacks`, `cyphers`, `equipment` | Lists of records, each row addressed by `uid`.                                                           |
| `armor`                                                  | A single worn suit: `{ name, points, description, speedPenalty }`.                                       |
| `cypherLimit`                                            | Drives the GM dashboard's over-limit alert.                                                              |
| `currency.amount`                                        | Amount only. The display name comes from GM config and falls back to "currency".                         |
| `notes`                                                  | Free text.                                                                                               |
| `advancement`                                            | Five booleans, bookkeeping only — the app applies no mechanical effect.                                  |
| `createdAt`, `modifiedAt`                                | ISO 8601 timestamps.                                                                                     |

**The damage track is not stored.** It is strictly derived from how many pools sit at zero and is computed client-side.

Two names differ from the rules terms on purpose: `skills[].proficiency` (Trained/Specialized/Inability) avoids "Type", which is reserved for the character's Type, and `cyphers[].cypherType` (Manifest/Subtle) avoids the same collision.

## Endpoints

Mounted at `/api/characters`.

| Method   | Path   | Answers                                                   |
| -------- | ------ | --------------------------------------------------------- |
| `GET`    | `/`    | `{ characters: [...] }`                                   |
| `POST`   | `/`    | `201 { record }` — body may carry `{ name }`              |
| `GET`    | `/:id` | `{ record }`, or `404 { error }`                          |
| `PATCH`  | `/:id` | `{ record, applied, actor, clientSeq? }`, `400`, or `404` |
| `DELETE` | `/:id` | `204`, or `404 { error }`                                 |

## The patch contract

```
PATCH /api/characters/:id
{ "actor": "harness", "clientSeq": 7,
  "patches": [ { "path": "pools.might.current", "value": 9 } ] }
```

- **Field-level, never whole-record.** The GM writes into player sheets while the player is editing them, so concurrent writers are the normal case; a whole-record write from a stale client would silently erase the other party's change.
- **Last-write-wins per path.** No rejection, no merge interface. That is affordable precisely because the blast radius of a collision is one field.
- **Paths are validated against the schema.** An unknown path is a `400`, not a silent no-op. `__proto__`, `constructor`, and `prototype` are rejected outright, as are list rows addressed by index (`skills.0.name`) — rows are addressed by `uid` through the list endpoints.
- **A batch is all-or-nothing on validation.** Every patch in the array is checked before any is written, so one bad path cannot leave a half-updated record.
- **`actor` is required, echoed, and not persisted.** It exists so a later feature can skip notifying the originator of their own edit, and can tell a player that a change came from the GM.
- **`clientSeq` is optional and echoed back**, for the client-side queue to match responses to queued writes.

## Client write path

Nothing in the browser calls `PATCH` directly. `patchCharacter(id, patches, actor)` in `public/js/app-ui/character-api.mjs` enqueues onto the per-character queue in `public/js/app-ui/sync/`:

- **One queue per character id**, FIFO, with a client sequence number sent as `clientSeq` and echoed back. One request is in flight at a time, which is what makes ordering guaranteed rather than probable.
- **A dropout is the failure that matters**, not latency: a phone wanders out of range mid-session and comes back a minute later. Writes made in between are held and replayed in order; the promise returned by `patchCharacter` stays pending until the write actually lands.
- **Retry backoff** runs 500 ms, 1 s, 2 s, 5 s, 10 s, then 30 s repeating. The `online` event flushes every queue immediately rather than leaving them to sit out the remaining wait.
- **A 4xx is permanent** — a bad path, or a character that is gone. That batch is dropped and rejected rather than retried forever, because a wedged queue makes the indicator lie. A 5xx or a rejected `fetch` is retried.
- **Repeated writes to the same path coalesce** while still unsent, so holding a key down does not queue fifty writes of one field. A batch already in flight is never mutated, and coalescing never crosses actors.

### The save indicator

`SaveIndicator` (`public/js/app-ui/sync/save-indicator.mjs`) renders the queue's derived state and belongs on every surface that edits a character. It is persistent, never a toast — a stale reassurance is worse than a visible failure.

| State       | Shows                            | Means                                                  |
| ----------- | -------------------------------- | ------------------------------------------------------ |
| `saved`     | "Saved"                          | Nothing pending, last send succeeded.                  |
| `saving`    | "Saving…"                        | A send is in flight or a batch is waiting.             |
| `notSaving` | "Not saving — N changes waiting" | The last send failed; N writes are still held locally. |

The queue stays `notSaving` through its retries: a retry in flight is not evidence that the write is landing, so the indicator does not soften until one actually does.

The queue is **not** persisted across a page reload. A reload is a deliberate act, unlike a dropout; if real play shows accidental reloads mid-session, revisit.

## Deferred

- List add/update/remove with server-assigned `uid`s — `character-list-items`.
- Live push to other devices — `live-sync-and-notifications`.
- Delete cascades into the GM roster, intrusion participants, and `giftedTo` pointers — those records arrive with `gm-domain-and-page-shell` and `gm-intrusions`, and each cleans up its own reference. Delete currently removes the character record only.

## The harness page

`/harness` (`public/harness.html` → `public/js/harness.mjs`, components in `public/js/app-ui/harness/`) is a **temporary** surface: a roster with create/open/delete and an editor whose every field patches its own path on commit. It exists to make the write model checkable in a browser before any real sheet exists, is linked from the home page while it lives, and is deleted once `app-shell-and-home-page` and the real character sheet land.
