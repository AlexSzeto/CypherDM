# Character Data and Sync

Completed 2026-08-18 · branch `character-data-and-sync`

## Goal

A character record that lives on the server and saves itself as the player types. A character can be created, read, patched field by field, and deleted through the API; its list-shaped parts are addressed by server-assigned identifiers; and any client editing one carries a save indicator that tells the truth — including when the network drops, where changes queue locally and replay in order once the connection returns.

This is the first branch of phase 1. Every later feature writes through the contract established here.

## What shipped

- **Story** — Character Record API: the `characters` server domain (schema, versioned flat file, sanitizer, repository, service, router) with list/create/read/delete and a field-level patch endpoint, plus a throwaway `/harness` page that exercises it in a browser.
- **Story** — Offline Patch Queue and Save Indicator: a per-character FIFO queue with client sequence numbers, ordered replay after a dropout, retry with backoff, and a persistent three-state save indicator.
- **Story** — Character List Items and Identifiers: add/patch/remove endpoints for skills, abilities, attacks, cyphers, and equipment, every row carrying a server-assigned `uid`, with a harness list editor over all five.

## Notable decisions

### The write model

**Writes are field-level patches, never whole-record.** The GM writes into player sheets while the player is editing them, so concurrent writers are the normal case rather than an edge case. A whole-record write from a stale client would silently erase the other party's change. Field granularity is also what makes the conflict rule affordable: **last-write-wins per path**, with no rejection and no merge interface, because the blast radius of a collision is one field.

**Patch paths are validated against the schema, and an unknown path is a `400`.** A typo'd path that quietly succeeds is the worst available failure mode — the client believes it saved and the value is nowhere. `__proto__`, `constructor`, and `prototype` are rejected as path segments before anything else, and a batch is validated in full before any of it is written, so one bad path cannot leave a half-updated record.

**The `actor` tag is required, echoed, and not persisted.** Nothing consumes it yet; it exists so `live-sync-and-notifications` can skip notifying the originator of their own edit and can tell a player that a change came from the GM. Persisting it would imply a history the app deliberately does not keep.

**`clientSeq` is optional on the wire and echoed back.** The server does not need to know the queue exists — it stays a pure request/response endpoint, which is what let the queue be built and replaced entirely client-side in the following story.

### The queue

**The failure that matters is a dropout, not latency.** On a table network a phone wanders out of range and returns a minute later, so writes are held in a per-character FIFO with **one request in flight at a time** — that is what makes ordering guaranteed rather than probable. Two writes to the same pool must land in the order the player made them, or last-write-wins settles on the wrong value.

**A 4xx is permanent; a 5xx or a rejected `fetch` is retried.** Retrying a bad path forever would wedge the queue behind a write that can never land, and the indicator would keep promising it. The batch is dropped and its promise rejected instead.

**The indicator stays `notSaving` through its retries.** A retry in flight is not evidence that the write is landing, and softening the indicator on hope is exactly the stale reassurance the design set out to avoid. It reports the count of writes still waiting, and it is a persistent element rather than a toast for the same reason.

**Coalescing is keyed by batch context, not by patch path.** Repeated writes to one field collapse while still unsent, so holding a key down does not queue fifty writes — but the row identity (`{ actor, listName, uid }`) is part of the comparison, so two different rows both patching `name` never merge into each other. A batch already in flight is never mutated.

**The queue is not persisted across a page reload.** A reload is a deliberate act, unlike a dropout; the loss is visible rather than hidden. Revisit if real play turns up accidental reloads mid-session.

### List rows

**Rows are addressed by a server-assigned `uid`, never by index**, and `listName` is checked against an allowlist before it can reach a property lookup. An index would let a concurrent insert or delete redirect the other party's edit onto a different row. The record-level patch endpoint rejects index paths outright rather than tolerating them.

**Structural list operations bypass the queue; row patches ride it.** A queue that reordered an add against a row patch would address a row the server has not created yet. A new row carries a local `_localId` only until its add resolves, matching the `DynamicList` keying rule already in `.claude/rules/client.md`.

**`DELETE` on a row answers with the record rather than `204`**, because the client needs the surviving rows and a follow-up `GET` would race a concurrent write.

### Storage

The data file is a JSON **object** (`{ version, characters }`) rather than a bare array, so it can carry a version. The domain's single write function stamps the current version and renames a `.tmp` sibling into place — a file created by a first save must carry its version, or the next restart reads it as version 0 and replays the whole migration chain against current data.

The full character shape, including every list item's fields, was written into the schema in the first story even though nothing wrote lists until the third. A new domain starts at v1, so getting the shape complete up front meant the list story needed no migration at all.

### Naming

Two field names deviate from the printed rules terms on purpose, both to protect "Type": `skills[].proficiency` for Trained/Specialized/Inability, and `cyphers[].cypherType` for Manifest/Subtle. The damage track is **not stored** — it is strictly derived from how many pools sit at zero.

### Process notes discovered during the work

- Preact maps `onBlur` onto the **`focusout`** event. A test firing `blur` silently observes nothing; real browsers fire both.
- vitest runs here without `globals`, so `@testing-library/preact`'s auto-cleanup hook is never registered. Test files that render more than once must call `cleanup()` themselves or trees pile up across tests.
- A component whose loading and loaded states return **differently-shaped roots** left an orphaned DOM node behind on the swap. Splitting the body into its own component, so the two states differ by one child at a stable position, fixed it. There is a regression test for the symptom.

## Deferred / descoped

- **Delete cascades** into the GM roster, intrusion participants, and `giftedTo` pointers. Those records live on the GM Object, which does not exist until `gm-domain-and-page-shell`; each feature cleans up its own reference. Character delete currently removes the character record only.
- **Two-record atomic commands** (giving an item, resolving an intrusion). The pattern is recorded, but no such endpoint ships here — `play-mode-equipment` and `gm-intrusions` add the real ones.
- **Live push.** No SSE on this branch; it is request/response plus local queueing. `live-sync-and-notifications` adds push.
- **Currency display name.** The record stores an amount only; the name comes from GM config and falls back to the literal "currency" until it exists.
- **Row reordering.** Nothing in the rules gives a list an order that matters, so a durable order field would be cost with no reader. Rows render in insertion order.
- **The `/harness` page is temporary.** It is the visible end of all three stories and is linked from the home page while it lives; `app-shell-and-home-page` supplies the real hub, and the real sheet features replace the editor. Delete both the page and its `app-ui/harness/` components then — but note that `app-ui/character-api.mjs` and `app-ui/sync/` are permanent and were deliberately moved out of `harness/` for that reason.
