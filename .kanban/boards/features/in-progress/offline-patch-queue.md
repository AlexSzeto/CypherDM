---
version: 1
id: 'offline-patch-queue'
boardId: 'features'
status: 'in-progress'
priority: 'high'
assignee: null
dueDate: null
created: '2026-08-18T05:28:38Z'
modified: '2026-08-18T05:50:00Z'
completedAt: null
labels: ['story']
attachments: []
order: 'a1'
metadata:
  feature: 'character-data-and-sync'
---

# Offline Patch Queue and Save Indicator

## Goal

A client editing a character carries a save indicator that tells the truth. Edits made while the server is unreachable queue locally and replay in order once it returns, and the indicator says saving, saved, or not saving honestly rather than reassuring falsely.

## Tasks

### Phase 1 — Edits survive a dropout and replay in order

- [x] Complete initial implementation
  - Add `public/js/app-ui/sync/patch-queue.mjs` exporting `createPatchQueue({ send, onStateChange, retryDelays })` — the FIFO queue described in Implementation Details. It owns the client sequence counter, the pending array, the single in-flight send, retry with backoff, and the derived sync state.
  - Give the queue a `flushNow()` that abandons the current backoff wait and retries immediately, called on `window.addEventListener('online', …)` from the character queue module below. A device that just regained the network should not sit out the rest of a 30-second backoff.
  - Add `public/js/app-ui/sync/character-queue.mjs` exporting `getCharacterQueue(id)` — one queue per character id, whose `send` posts a batch to `PATCH /api/characters/:id` via a new `patchCharacterBatch(id, patches, actor, clientSeq)` export added to `public/js/app-ui/character-api.mjs` (moved up out of `harness/`, since permanent sync code must not import from a throwaway page's folder). It also exports `subscribeSyncState(id, listener)` and `getSyncState(id)` so any surface can render the indicator, and `resetCharacterQueues()` for tests.
  - Rewire `patchCharacter(id, patches, actor)` in `public/js/app-ui/character-api.mjs` to enqueue through the character queue instead of calling `fetch` directly, keeping its existing signature. It resolves with the record from the server response when the write lands, and rejects only on a permanent (4xx) failure — a dropout leaves the promise pending until the write eventually succeeds.
  - Coalesce repeated writes to the same path: when a patch is enqueued for a path already pending in an un-sent batch, replace that entry in place rather than appending a second one, so holding a key down does not queue fifty writes of the same field. Order between _different_ paths is preserved.
  - Add `public/js/app-ui/sync/patch-queue.test.mjs` asserting: patches send in enqueue order with increasing `clientSeq`; a failing send is retried and later patches wait behind it rather than overtaking it; a 400 response drops that batch and moves on instead of blocking the queue forever; two patches to the same path collapse to one entry carrying the later value; the state sequence over a failure and recovery is `saving → notSaving → saved` — the queue stays `notSaving` through the retry itself, because a retry in flight is not evidence that the write is landing.
  - Add `public/js/app-ui/sync/character-queue.test.mjs` asserting that `patchCharacter` resolves with the record returned for its batch, and that `subscribeSyncState` fires with `saved` after a successful write.

### Phase 2 — The indicator tells the truth on screen

- [ ] Complete initial implementation
  - Add `public/js/app-ui/sync/save-indicator.mjs` exporting `SaveIndicator({ characterId })` — a persistent inline element (not a toast) subscribing via `subscribeSyncState`. It renders three states: `saved` ("Saved", success color, `check` icon), `saving` ("Saving…", secondary color, `refresh` icon), and `notSaving` ("Not saving — N changes waiting", danger color, `warning` icon, where N is the pending count). It must subscribe on mount and unsubscribe on unmount.
  - Render `SaveIndicator` in `public/js/app-ui/harness/character-editor.mjs`, in the `HorizontalEdgesLayout` header row beside "Reload from server", so it is visible the whole time a character is open.
  - Have the editor stop swallowing failures into its error panel for queued writes: `commit` no longer sets `error` on a network failure, because the queue owns that state now and the indicator reports it. A permanent 4xx rejection still surfaces in the error panel.
  - Add `public/js/app-ui/sync/save-indicator.test.mjs` asserting the component renders "Saving…" while a write is in flight, "Saved" after it resolves, and the pending count while the queue is failing.
  - Verify by hand: open a character in `/harness`, stop the server with `npx pm2 stop cypher-dm`, edit the name and two pool values, confirm the indicator reads "Not saving" with the correct count and that nothing is lost from the fields, then `npx pm2 start cypher-dm`, confirm the indicator returns to "Saved", and reload the page to confirm all three edits are on the server in the order they were made.
  - Review and update affected living docs: `docs/features/character-record.md` (replace the "client patches with a plain `fetch`" deferral with the queue's actual contract, and document the three indicator states), `.claude/rules/client.md` (add a short "Client sync" subsection stating that character writes go through `app-ui/sync/`, never a bare `fetch`, and that every character surface carries a `SaveIndicator`).

## Implementation Details

### Why a queue at all

On a local table network the failure that matters is a **dropout**, not latency: a phone wanders out of range mid-session and comes back a minute later. The player keeps typing throughout and must not lose those edits, and must not be told they were saved when they were not. A stale reassurance is worse than a visible failure, which is why the indicator is persistent and states the pending count rather than flashing a transient toast.

### The queue

One queue per character id, holding entries of:

```js
{ clientSeq, patches: [{ path, value }], resolve, reject }
```

- **FIFO with a client sequence number.** `clientSeq` increments per queue and is sent with each batch; the server echoes it back. Order is the whole point: two writes to `pools.might.current` must land in the order the player made them, or last-write-wins settles on the wrong value.
- **One request in flight at a time.** The next batch is not sent until the current one resolves. This is what makes ordering guaranteed rather than probable.
- **Retry with backoff on transport failure**, using delays of 500 ms, 1 s, 2 s, 5 s, 10 s, then 30 s repeating. A transport failure is a rejected `fetch` or a 5xx response.
- **A 4xx is permanent.** It means a bad path or a deleted character — retrying forever would wedge the queue and the indicator would lie about a change that is never going to land. Drop that batch, reject its promise, log at error level, and continue with the next.
- **Coalescing is per path within an un-sent batch only.** A batch already in flight is never mutated.

### Derived sync state

The queue exposes one of three states, derived and never persisted:

| State       | Means                                                                     |
| ----------- | ------------------------------------------------------------------------- |
| `saved`     | Nothing pending, last send succeeded.                                     |
| `saving`    | A send is in flight or a batch is waiting to be sent.                     |
| `notSaving` | The last send failed and the queue is in backoff, with N entries waiting. |

`onStateChange` fires with `{ state, pending }` whenever either changes. `notSaving` is entered on the **first** failure, not after a retry threshold — the indicator's job is to be honest immediately.

### Out of scope

- Persisting the queue to `localStorage` across a page reload. A reload is a deliberate act, unlike a dropout, and the harness surfaces the loss rather than hiding it. Revisit if real play shows accidental reloads mid-session.
- Any server-side change. The endpoint from `character-record-api` already accepts and echoes `clientSeq`; the server does not need to know the queue exists.
- Live push of other people's changes — `live-sync-and-notifications`.
