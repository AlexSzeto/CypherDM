---
version: 1
id: 'audit-vendored-frontend-libraries'
boardId: 'features'
status: 'planned'
priority: 'medium'
assignee: null
dueDate: null
created: '2026-08-15T07:35:45.480Z'
modified: '2026-08-15T07:38:31.230Z'
completedAt: null
labels: ['polish']
attachments: []
order: 'a0VVV'
metadata:
  feature: 'project-imported-code-cleanup'
---

# Audit Vendored Front-End Libraries

## Goal

Make the vendored-library manifest match what the app actually loads, so `npm run libs` stops pulling down dependencies no page references and the list reflects CypherDM's real front-end.

## Notes

**The confirmed stale entry.** `scripts/lib.config.json` lists `https://cdn.jsdelivr.net/npm/@tarekraafat/autocomplete.js@10.2.7/dist/autoComplete.min.js` targeting `autocomplete/autoComplete.min.js` with `injectAs: 'script'`. That file is not present in `public/lib/` (which holds only `boxicons`, `favloader`, `goober`, `htm`, `preact`) and no page references it. It was superseded by `custom-ui/io/use-autocomplete.mjs` + `autocomplete-dropdown.mjs`, which implement autocomplete natively. Remove the entry.

**The open question — `favloader`.** `public/lib/favloader/favloader.js` is vendored and loaded by `public/index.html` as a plain script, but no module under `public/js/` references it (it is a favicon loading-animation library that exposes a global). Determine during implementation whether it is genuinely unused; if so, remove both the `index.html` script tag and the `lib.config.json` entry. If something does depend on it, leave it and record what.

**Keep `boxicons` regardless of first appearances.** It looks unused from `public/js/app.mjs`, but `custom-ui/layout/icon.mjs` renders either box-icons or Material Symbols depending on theme configuration, so the global from `public/lib/boxicons/boxicons.js` is a live dependency of the shared component library. Do not remove it.

**Check the rest against real usage.** Verify each remaining `lib.config.json` entry resolves to a file in `public/lib/` and is either in `index.html`'s importmap or loaded as a script: `preact`, `preact/hooks`, `preact/compat`, `@preact/signals`, `htm/preact`, `goober`, `goober/prefixer`. Note that `@preact/signals` is in the importmap but not imported anywhere in `public/js/` yet — leave it, since it is standard scaffolding for this stack rather than imported cruft.

**Scope boundary.** `public/js/custom-ui/test.html` loads boxicons and Material Symbols from CDNs directly; it is a shared-library file and out of scope. Do not edit it.

**Verification.** `npm run libs` should complete without fetching anything that lands outside `public/lib/`. Load the app and confirm no console errors from a missing global. `npx vitest run` must stay green.
