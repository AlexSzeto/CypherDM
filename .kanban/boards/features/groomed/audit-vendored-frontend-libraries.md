---
version: 1
id: 'audit-vendored-frontend-libraries'
boardId: 'features'
status: 'groomed'
priority: 'medium'
assignee: null
dueDate: null
created: '2026-08-15T07:35:45.480Z'
modified: '2026-08-15T07:42:10.000Z'
completedAt: null
labels: ['polish']
attachments: []
order: 'a3'
metadata:
  feature: 'project-imported-code-cleanup'
---

# Audit Vendored Front-End Libraries

## Goal

Make the vendored-library manifest match what the app actually loads, so `npm run libs` stops fetching dependencies no page references and the list reflects CypherDM's real front-end.

## Tasks

### Phase 1 — Manifest matches what the app loads

- [ ] Complete initial implementation
  - In `scripts/lib.config.json`, delete the `libraries` entry whose `url` is `https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@10.2.7/dist/autoComplete.min.js` and whose `path` is `autocomplete/autoComplete.min.js`. The file is absent from `public/lib/`, no page references it, and `custom-ui/io/use-autocomplete.mjs` plus `custom-ui/io/autocomplete-dropdown.mjs` implement autocomplete natively.
  - Determine whether `favloader` is used. Search `public/js/` and `public/index.html` for `favloader`, `favLoader`, and `Favloader`. As of grooming, the only hit is the `<script src="/lib/favloader/favloader.js"></script>` tag in `public/index.html` — it exposes a global and nothing calls it. If that still holds, delete both the script tag from `public/index.html` and the `favloader` entry from `scripts/lib.config.json`, and delete the vendored `public/lib/favloader/favloader.js`. If a caller is found, leave all three in place and note the caller in a comment on the card.
  - Do **not** remove `boxicons`. It looks unused from `public/js/app.mjs`, but `public/js/custom-ui/layout/icon.mjs` renders either box-icons or Material Symbols depending on theme configuration, so the global from `public/lib/boxicons/boxicons.js` is a live dependency of the shared component library. Leave its `lib.config.json` entry, its vendored file, and its `<script>` tag in `public/index.html` alone.
  - Do **not** remove `@preact/signals`. It appears in `public/index.html`'s importmap and is vendored at `public/lib/preact/signals.js`, but is not yet imported anywhere under `public/js/`. It is standard scaffolding for this stack rather than imported cruft, and the first stateful feature is likely to use it.
  - Verify every surviving `lib.config.json` entry resolves to a real file under `public/lib/` and is reachable from `public/index.html` — either as an importmap key or a `<script>` tag. The expected surviving set is `preact`, `preact/hooks`, `preact/compat`, `@preact/signals`, `htm/preact`, `goober`, `goober/prefixer`, and `boxicons` (plus `favloader` only if a caller was found). Report any entry that fails this check rather than silently deleting it.
  - Run `npm run libs` and confirm it completes without error and writes nothing outside `public/lib/`. Then run `npm start`, open `http://localhost:5000`, and confirm the page renders and the browser console shows no errors about a missing global or an unresolved importmap specifier.
  - Run `npx vitest run` and confirm the suite still passes at 75 tests across 4 files.
  - Review and update affected living docs: `.claude/rules/client.md`

## Implementation Details

### Current state as of grooming

`public/lib/` contains exactly these vendored files:

```
boxicons/boxicons.js
favloader/favloader.js
goober/goober.js
goober/prefixer.js
htm/preact.js
preact/compat.js
preact/hooks.js
preact/preact.js
preact/signals.js
```

`scripts/lib.config.json` lists ten `libraries` entries. Nine correspond to the files above; the tenth is the `@tarekraafat/autocomplete.js` entry, which has no corresponding file — it was never fetched into this repo, or was fetched and removed. Either way it is stale.

`public/index.html` wires them up as an importmap (`preact`, `preact/hooks`, `preact/compat`, `@preact/signals`, `htm/preact`, `goober`, `goober/prefixer`) plus two plain `<script>` tags (`boxicons`, `favloader`).

### `injectAs` semantics

Each `lib.config.json` entry carries `injectAs`, which is either `importmap` (with an `importMapKey`) or `script`. The autocomplete entry is `injectAs: 'script'`, so removing it also removes a would-be `<script>` tag — but since the tag was never present in `public/index.html`, no HTML change is needed for that entry specifically.

### Why `favloader` is an investigation rather than a decision

Grooming found no caller, but `favloader` is a favicon-animation library that works by exposing a global and being invoked imperatively (e.g. `favloader.start()`), so a call site could plausibly appear in a page-level script rather than a module. The search terms above cover the realistic spellings. If the search comes back empty, removal is safe; the point of writing it as a check is to avoid deleting a working loading indicator on the strength of a single grep.

### Scope boundary — do not edit

`public/js/custom-ui/test.html` loads boxicons and Material Symbols directly from CDNs (`unpkg.com`, `fonts.googleapis.com`) rather than from `public/lib/`. It is a shared-library file — `public/js/custom-ui/` mirrors a central repository at `F:\CustomUI\custom-ui\` and is not this project's to edit. Leave it alone, including its CDN references, even though they duplicate vendored libraries.
