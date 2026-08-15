---
description: when working on the client facing (i.e. /public) side of the website
---

## Frontend Architecture

- **File Naming Conventions**: All source files should be lowercase with dashes (e.g., `workflow-editor.mjs`, `node-input-selector.mjs`).
- **Framework & Libraries**: Always use `preact` + `htm/preact` for dynamic components.
- **Theme Usage**: All pages must utilize the `Page` component and initiate theming via `currentTheme.subscribe` to ensure consistent theming across the app.
- **Component Strategy**:
  - **Functional Components (Preferred)**: Use functional components with hooks (`useState`, `useEffect`, `useCallback`) for most UI elements. This aligns with modern Preact patterns seen in `App.mjs`.
  - **Class Components (Allowed)**: Use `Component` from `preact` for complex stateful logic or when lifecycle methods (`componentDidMount`, `componentWillUnmount`) offer cleaner abstraction than hooks (e.g., `ProgressBanner.mjs`).
  - **Existing Components First — mandatory check before any `styled()` call.** Before writing any `styled('div')`, `styled('section')`, or other layout-only wrapper, verify that none of the components below cover the need. A single-use `styled()` that could have been replaced by combining existing primitives is always wrong.

    **Layout & typography — `custom-ui/themed-base.mjs`**

    | Component               | Use when…                                                                                                                                                                                                                                                       |
    | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `VerticalLayout`        | Stacking children in a column with a themed gap (`gap="none\|small\|medium\|large"`); `justifyContent="flex-end"` bottom-aligns children; supports `overflow` prop                                                                                              |
    | `HorizontalLayout`      | Placing children in a row with a themed gap (`gap="none\|small\|medium\|large"`); configurable `alignItems` and `justifyContent` (`flex-end` right-aligns); `fitContent` keeps children at their natural width instead of flex-compressing them to fill the row |
    | `HorizontalEdgesLayout` | Two children pushed to opposite edges (title left / action right); use for sub-section headers and toolbar rows                                                                                                                                                 |
    | `H1`                    | Main page title (2 rem, bold)                                                                                                                                                                                                                                   |
    | `H2`                    | Section heading (1.2 rem, bold)                                                                                                                                                                                                                                 |
    | `H3`                    | Subsection or component heading (1 rem, medium weight, secondary color)                                                                                                                                                                                         |
    | `Label`                 | Form field or section label text                                                                                                                                                                                                                                |

    **Content containers — `custom-ui/layout/panel.mjs`**

    | Component | Use when…                                                                                                                        |
    | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
    | `Panel`   | Any padded content box; `variant="default\|elevated\|outlined\|glass"`, `padding="small\|medium\|large"`, optional `color` theme |

    **App-level header bar — `app-ui/themed-base.mjs`**

    | Component   | Use when…                                                                                                                                    |
    | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
    | `AppHeader` | Top-level page header bar (page title + HamburgerMenu); semantically distinct from `HorizontalEdgesLayout` even though the CSS is equivalent |

    **IO components — `custom-ui/io/`**
    Never create a custom input, button, or control. Use: `Button` (variants: `medium-text`, `medium-icon`, `medium-icon-text`, `large-icon`, `small-text`, `small-icon`, `chip`), `Input` (supports `buttonProps` for an inline icon action button), `Textarea`, `Select` (fully custom portal dropdown; supports `buttonProps`), `MultiSelect` (options as `{ label, value, tooltip? }[]`; supports `buttonProps`), `Checkbox`, `Slider`, `RangeSlider`, `DiscreteSlider`, `ToggleSwitch`, `Pill` (variants: static, dismiss, interactive icon, template toggle; `variant="filled|outlined"`; `onClick`/`value` for clickable body; `outlined` variant keeps shell neutral while slot tokens still render in the assigned `color`), `ContentEditablePillInput` (contenteditable div with inline pills + autocomplete dropdown; supports `onPillClick` for pill-body click; `getPillTooltip` (show tooltip on hover; returning null dismisses any visible tooltip rather than being a no-op, since container-bound `mouseleave` does not fire on pill→pill moves) and `buttonProps` for an overlay icon button; use `TagInput` from `app-ui/tags/tag-input.mjs` for tag-specific use), `useAutocomplete` + `AutocompleteDropdown` (hook + stateless component pair from `io/use-autocomplete.mjs` and `io/autocomplete-dropdown.mjs`; compose onto any input — including plain `<textarea>` or `<input>` — to add a filtered suggestion dropdown without pulling in `ContentEditablePillInput`; hook returns stable refs safe to call from `useEffect([])` closures).

    **Icon names come from `ICON_MAP`, not from Material Symbols.** Every `icon`/`prefix`/`suffix`/`name` prop on a `custom-ui` component takes a key of `ICON_MAP` in `public/js/custom-ui/layout/icon.mjs`, which `Icon` translates to a Material Symbol name internally. Consult that map before choosing a name. A name absent from the map renders **nothing** — `Icon` falls through the `if (!materialName)` branch — so a guessed Material Symbol name fails silently rather than erroring. If no suitable key exists, say so and propose adding the mapping; never pass a raw Material Symbol name through and assume it resolves.

    **`buttonProps` pattern** — consistent inline icon button overlay used by `Input`, `Select`, `MultiSelect`, and `ContentEditablePillInput`:

    ```js
    buttonProps: {
      icon: string,          // icon name
      color?: string,        // button color theme
      disabled?: boolean,    // merged with component's own disabled via OR
      onClick: () => void,
      title?: string,        // tooltip text
      loading?: boolean,     // shows spinner
    }
    ```

    For `Input`: button is absolutely positioned top-right; input gains right-padding automatically.
    For `Select`/`MultiSelect`: button sits left of the value text inside the trigger; `e.stopPropagation()` prevents dropdown toggle.
    For `ContentEditablePillInput`: primary button is absolutely positioned `top: 4px; right: 4px`; secondary button (`secondaryButtonProps`) sits at `top: 40px; right: 4px`. Editor gains right-padding automatically (88px when both buttons present).

    **Media viewer — `custom-ui/media/transition-viewer.mjs`**

    | Component          | Use when…                                                                                                                                                                                                     |
    | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `TransitionViewer` | Displaying a visual element that changes over time and needs a smooth fade transition; accepts any Preact VNode via `viewerRef.current.transitionTo(vnode)`; size is controlled by the caller via props/style |

    **Video player — `custom-ui/media/video-player.mjs`**

    | Component     | Use when…                                                                                                                                                                                     |
    | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `VideoPlayer` | Rendering play/pause + progress controls for a `<video>` element owned by the caller; props: `videoRef` (ref to the raw `<video>` DOM node), `videoUrl` (string, for source-change detection) |

  - **New component placement.** When a new UI component is genuinely needed (cannot be composed from existing primitives):
    - Reusable across pages or projects → `custom-ui/`; add a usage example to `test.html` and a render entry to `test.vitest.mjs`.
    - Page- or feature-specific → `app-ui/`.
  - **Custom UI Component Documentation**: Every new custom UI component added to `public/js/custom-ui/` must include usage examples in `public/js/custom-ui/test.html` to demonstrate its API and typical use cases.
- **File Structure**:
  - **Reusable Components**: Place generic, reusable UI components in `public/js/custom-ui/` (e.g., `io/`, `layout/`, `msg/`).
  - **App-Specific Logic**: Place application-specific components and logic in `public/js/app-ui/`.
  - **Utility Functions**: Generic utilities go in `public/js/custom-ui/util.mjs`.
- **Navigation Registration**: Every new page must be registered in `public/js/app-ui/hamburger-menu.mjs` as part of the same task that creates it. Do not ship a page without a navigation entry.

## Component Implementation Standards

- **State Management**:
  - Use `useState` or `useReducer` for local component state.
  - For global state or complex logic shared across components (like theme or SSE), use the subscription pattern (e.g., `currentTheme.subscribe`).
- **Styling Integration**:
  - Always use `styled` from `goober-setup.mjs` (which configures `goober` with `h` from Preact) unless a specific feature cannot support it and there are no reasonable workarounds.
  - Do **not** import `styled` directly from `goober`.
- **DOM Refs and Goober Styled Components**:
  - Attaching a `ref` to a `styled()` component (e.g., `<${StyledDiv} ref=${myRef}>`) yields the **Preact component instance**, not the underlying DOM node. Calling DOM methods like `getBoundingClientRect()`, `focus()`, or `select()` on such a ref will throw a runtime error.
  - **Avoid `createRef` and direct DOM measurement wherever possible** — prefer event-driven alternatives (e.g., `e.currentTarget.getBoundingClientRect()` in event handlers, native `<input>` elements that expose DOM APIs natively).
  - When a ref to a raw DOM node is absolutely necessary (e.g., for canvas or scroll APIs), attach the ref to a **plain HTML element** (`<div>`, `<canvas>`, `<input>`) rather than a styled wrapper, even if that means adding a minimal unstyled element whose sole purpose is to be the ref target.
- **Props & API**:
  - Destructure props with default values in the function signature (functional) or `render()` method (class).
  - Forward DOM-compatible props using `...rest`.
  - Document public props with JSDoc, including examples for non-trivial usage.

## Styling & Theming

- **Naming Conventions**:
  - All source files should be lowercase with dashes (e.g., `workflow-editor.mjs`, `node-input-selector.mjs`).
  - Use PascalCase for styled components (e.g., `StyledButton`).
  - Always attach a readable class name for debugging: `StyledButton.className = 'styled-button';`.
- **Theme Usage**:
  - Import `currentTheme` from `custom-ui/theme.mjs`.
  - **Never hardcode generic values**. Use theme tokens for:
    - Colors (`theme.colors.primary.background`, `theme.colors.text.secondary`)
    - Spacing (`theme.spacing.medium.padding`)
    - Borders (`theme.border.radius`, `theme.border.width`)
    - Typography (`theme.typography.fontSize`)
  - If a token is missing, add it to `theme.mjs` rather than hardcoding.
- **CSS-in-JS**:
  - Keep styles local to the component file whenever possible.
  - Avoid generic class names like `.container` or `.wrapper` in global CSS; scope them within the styled component.

## Logging

All client-side logging goes through `public/js/custom-ui/logger.mjs`:

```js
import { log } from './logger.mjs' // adjust path as needed

log('source', 'info', 'message')
log('source', 'warn', 'message')
log('source', 'error', 'message')
```

- `info` messages pass through a `HIDE_LOG_SOURCES` denylist.
- `warn` and `error` messages always emit.
- Output format is `[source] message`.
- Do not call `console.log`, `console.warn`, or `console.error` directly. Use the `log()` function with a stable source name.

## Multi-Tab / Queue SSE Patterns

### Per-tab client identity

- `public/js/app-ui/client-id.mjs` exports `getClientId()`, which returns a stable UUID stored in `sessionStorage` (isolated per tab, survives page refresh within the same tab).
- Every queue-submission fetch must include `clientId: getClientId()` in its request body (or `formData.append('clientId', getClientId())` for FormData requests). This lets the server associate each queue item with the submitting tab.

### Ownership-gated task SSE subscriptions

- The `queue:task-started` SSE event carries a `clientId` field.
- Every `queue:task-started` handler that opens a task SSE connection (directly or via `progressShow`) must check `if (clientId !== getClientId()) return;` before subscribing. This prevents idle tabs from opening task SSE connections for tasks they didn't submit.
- Idle tabs may still consume `queue:task-started` for UI display purposes (queue dashboard), but must not call `sseManager.subscribe()` or `progressShow()` for tasks they don't own.

### Queue SSE reconnect recovery

- `QueueSSEManager` exposes `onConnect(fn)` which fires every time the SSE connection (re)opens. Use it to re-fetch `/queue/status` so the client recovers its view of the queue after a dropped connection.
- `use-queue-status.mjs` already wires this up — new callers of `useQueueStatus()` get recovery for free.
- Any component or hook that subscribes directly to `queueSSEManager` and caches queue state should also call `onConnect` and refresh from the REST endpoint.

### Running task progress hook

- `useRunningTaskProgress(taskId)` in `public/js/app-ui/use-queue-status.mjs` opens a raw `EventSource('/progress/${taskId}')` and returns the latest `percentage` (number) or `null` if no progress has arrived yet.
- Returns `null` (not `0`) before the first `progress` event to avoid a misleading flash.
- Closes the `EventSource` and resets to `null` on `complete`, `error-event`, or `cancelled` events, and whenever `taskId` changes or the component unmounts.
- Used by `QueueStatusBanner` to append `— N%` to the running chip label.

### SSEManager event coalescing

- `SSEManager` (in `public/js/app-ui/sse-manager.mjs`) batches events via `setTimeout(0)` before dispatching. This prevents replayed completed tasks from firing multiple `onComplete` calls.
- Pruning rule in `_flushEvents`: if a terminal event (`complete`/`error`/`cancelled`) is present in the batch, discard all `progress` events and dispatch only the terminal. If no terminal: discard all `progress` except the last, dispatch that one.
- Transient-error rule in `_handleError`: an `onerror` with `readyState === CONNECTING` (browser auto-reconnecting) must NOT kill the subscription — the server keeps completed tasks (with their full message buffer, including terminal events) for 5 minutes and replays the buffer on reconnect, so the completion arrives after the retry. Only `readyState === CLOSED` cleans up (silently, deferred one tick); other states surface `onError` and unsubscribe. The 2-minute inactivity timeout remains the backstop.
- The `/progress/:taskId` heartbeat is a NAMED SSE event (`event: heartbeat`, every 30s), not a comment — comments never reach EventSource JS. `SSEManager` listens for it and resets the inactivity timeout without dispatching to callbacks, so the timeout only fires on a genuinely dead stream, never on a slow-but-alive generation (long video renders can go minutes between progress events).
- Server task completions carry the full `generationData` as the event's `result` — client handlers must read what they need from the payload rather than re-fetching `/media-data` on `complete`: any media-entry write done in `_executeQueuedTask`'s post-processing `.then()` lands AFTER the `complete` event was emitted, so an immediate re-fetch races it (see `handleVideoComplete` in `anytale.mjs` for the payload-driven pattern).
- `ProgressBanner` fast-complete bypass: if `handleComplete` fires before any `progress` event was received (`hadProgressRef.current === false`), skip the banner display and call `onComplete`/`onDismiss` immediately — the task was already done when the subscription opened.
- `queue:task-started` events are NOT replayed after a `/queue/sse` reconnect. Any page that relies on them to attach `progressShow` handlers must also register `queueSSEManager.onConnect(...)` recovery so it doesn't strand a subscription across a dropped connection; `progressShow`/`sseManager` dedupe by taskId, so re-attaching is safe. Two different recovery shapes exist, and picking the wrong one for a given page matters:
  - **Re-fetch and re-attach** (`anytale.mjs`'s reconnect-recovery effect): re-fetches `/generation/tasks/active` and re-attaches handlers to in-flight tasks it owns. Appropriate when the page has no server-side source of truth to re-synchronise against beyond the queue itself.
  - **Reconcile-on-reconnect** (AnyTale Play mode, `anytale-play.mjs`): `queueSSEManager.onConnect` calls `reconcileFromRefs()` — the exact same `POST /anytale/play/reconcile` call chapter init, the media toggles, and debug regenerate all use (see `docs/server.md`'s Play-Mode Queue Reconciliation) — instead of re-invoking `initChapter`. This is deliberate: `initChapter` flushes the server queue before rebuilding, which would destroy in-flight generation on every reconnect blip; reconcile re-synchronises from server truth (the tale record + live queue state) without flushing, and a `running` item's response carries the `sseTaskId` needed to re-attach progress — the one thing `queue:task-started` would otherwise have supplied. Prefer this shape whenever the page already has a server-side record (like a tale) it can reconcile against, rather than re-deriving "what was I waiting on" from `/generation/tasks/active`.

### Snapshot-ordering hazard: `queue:updated` can predate a registration it should be compared against

A multi-asset reconcile (e.g. a forced page regenerate enqueuing image + sfx + video) calls `queueService.enqueue()` once per missing asset, and every `enqueue()` broadcasts a full `queue:updated` snapshot immediately — so an early broadcast can reflect only the first asset or two enqueued so far. That broadcast races the reconcile HTTP response over separate channels (`/queue/sse` vs. the fetch response), and the HTTP response can win: the client registers every enqueued id at once (e.g. into `taskToPageRef` in `anytale-play.mjs`), and only afterward receives a snapshot that predates some of those registrations.

Any handler that sweeps ids absent from a `queue:updated` snapshot as "externally deleted" (like AnyTale Play's "Mechanism 2") must not trust that absence unless the snapshot is at least as new as the registration it's being checked against — otherwise it deletes tracking state for assets that are in fact still queued or generating, silently losing their completion. Both `GET /queue/status`/`queue:updated` (`seq`) and the reconcile response (`queueSeq`, sampled after all of reconcile's own queue mutations) carry the same monotonic counter for this reason. `selectStaleQueueEntries` in `play-utils.mjs` is the reference guard: an entry is only swept when its id is absent from the live set AND (it has no recorded registration seq, OR the snapshot's seq is strictly greater than the seq recorded at registration time).

## TagSelectorPanel Singleton

All opens of `TagSelectorPanel` go through `openTagPanel(config)` / `closeTagPanel()` from `app-ui/tags/tag-panel-state.mjs`. Never render `<${TagSelectorPanel}.../>` inline — use the singleton API instead.

```js
import { openTagPanel, closeTagPanel } from '../tags/tag-panel-state.mjs';

// Open a floating browse-only panel
openTagPanel({ type: 'float', initialSearchTerm: term, showConfirm: false });

// Open a modal selector with a confirm callback
openTagPanel({ type: 'modal', initialSearchTerm: '', onConfirm: (displayName, internalName) => { ... }, confirmRequiresDefinition: false });

// Close from inside a handler
closeTagPanel();
```

Config fields: `type` (`'float'|'modal'`), `initialSearchTerm?`, `onConfirm?`, `showConfirm?` (default `true`), `confirmLabel?`, `confirmRequiresDefinition?` (default `true`), `onClose?` (called by `closeTagPanel` before closing).

The singleton enforces at most one panel open at a time. Same-type re-opens update the initialSearchTerm and re-run search; type switches close the old panel first (via `setTimeout(0)`).

## Save/Revert Pattern (settings and persistent records)

Use `useFormRecord` from `app-ui/forms.mjs` to manage dirty state. Derive button enable states via `formButtonStates(recorded, dirty)`. On save: call the API → `markSaved(newData)`. On revert: confirm via `showDialog` → reset form state to `savedData`. Config-style forms that always exist set `recorded = true` always and omit delete.

### Form action button row

Every Save/Revert/Delete row follows the same order, icon, and color:

| Button        | Icon    | Color                                      | Order           |
| ------------- | ------- | ------------------------------------------ | --------------- |
| Save / Create | `save`  | `primary`                                  | 1st             |
| Revert        | `undo`  | `secondary` (or omit — `Button`'s default) | 2nd             |
| Delete        | `trash` | `danger`                                   | 3rd (rightmost) |

Both Delete and Revert require a `showDialog` confirmation before acting (e.g. `['Delete', 'Cancel']`, `['Revert', 'Cancel']`). Save does not require confirmation.

There are two layout sub-patterns, depending on whether the form is a top-level entity editor or an item inside a `DynamicList`:

- **Pattern A — top-level entity form** (e.g. `character-section.mjs`, `plot-section.mjs`, `outfit-section.mjs`): `HorizontalEdgesLayout` with a left-aligned **"Clear"** button (`color="danger" icon="x"`) whenever the form content can be cleared, and a right-aligned `HorizontalLayout gap="small"` containing Save/Revert/Delete. The left button must always be labeled "Clear" — entity-specific labels are not the convention.
- **Pattern B — DynamicList item form** (e.g. `models-config-tab.mjs`'s `ModelEntryForm`/`ExtensionEntryForm`): no left-side button; a right-aligned `HorizontalLayout gap="small" justifyContent="flex-end"` containing Save/Revert/Delete. An unsaved new item is discarded by closing/removing its DynamicList card (wired via the list's `onDelete` callback), not via a dedicated Cancel button. Revert stays disabled for the entire lifetime of a new/unrecorded item since there is no saved baseline to revert to (`formButtonStates` returns `revertEnabled: recorded && dirty`, and `recorded` is false for a new item).

Variant selection: `variant="medium-icon-text"` for page-level/top-of-page single-form contexts (e.g. `anytale-config-tab.mjs`, `workflows-config-tab.mjs`, `services-config-tab.mjs`, `misc-config-tab.mjs`, `handy-config-tab.mjs`, `pages-section.mjs`, `brew-editor.mjs`). `variant="small-text"` for forms nested inside a multi-section editor or rendered as a DynamicList item (AnyTale editor sections, `models-config-tab.mjs`'s item forms).

**Known non-compliant forms (not yet fixed):** the Genre list form and SFX list form (`music-section.mjs`, `plot-section.mjs`) conflate their DynamicList delete action with dismissing an unsaved new entry — there is no way to cancel out of a new item except the load modal — and neither form has its own dedicated Delete button in the Save/Revert/Delete row. These should be brought into line with Pattern B in a future change; do not treat them as reference examples.

### DynamicList identity-based keying

`DynamicList` (`custom-ui/layout/dynamic-list.mjs`) keys each rendered row by `item.uid ?? item._localId ?? item.id ?? index`, not raw array position. This matters for any `renderItem` component (like `SfxCard`, `GenreCard`, `VideoExpansionCard`, `HandyPresetForm`) that seeds local edit state from props via `useState` — that initializer only runs once, on mount. If rows were keyed by index, reordering the list (drag, add, delete-from-middle, or a Load-select that reorders/prepends items) would make Preact reuse a slot's existing component instance for a _different_ item, silently carrying stale unsaved-edit state onto the wrong record. Always give new/unsaved items a stable `_localId` (e.g. `String(Date.now())`) so this keying works correctly for them too.

### Library + Load pattern (SFX / Genres / Video Expansions / Handy Presets)

Several record types are edited via a shared "library + session-selected workspace" pattern: a full CRUD-backed collection on the server (`GET/POST/PUT/DELETE` per item), a sessionStorage-persisted set of selected UIDs (`anytale-state.mjs`'s `load*Selected`/`save*Selected` pairs), and a **Load** button (`variant="small-text" color="secondary" icon="folder-open"`) next to the section's `H2` that opens a `SearchSelectModal` (multi-select) over the full library. Selecting a new subset replaces the server-backed items in the workspace while preserving any unsaved local items (identified by `_localId`, no `uid` yet). Each item in the workspace list renders as its own Pattern B form (own Save/Revert/Delete row) via `DynamicList`. Reference implementations: `SfxSection`/`SfxCard`, `MusicSection`'s Genre list/`GenreCard`, `VideoSection`'s Tag Expansions list/`VideoExpansionCard`, and `HandySection`/`HandyPresetForm` — all in `music-section.mjs` and `handy-section.mjs`.

**Modal-based Clone convention.** Every Load modal (both the multi-select library modals above and the single-select Character/Outfit/Plot Load modals) carries a Clone `itemAction` (`icon: 'copy'`, `title: 'Clone'`, `closeAfter: true`) via `SearchSelectModal`'s `itemActions` prop. Cloning always produces an UNSAVED copy: `uid` stripped via `cloneRecordData(source, { omit, clear })` and the name de-duplicated via `nextCloneName(allLibraryNames, sourceName)` (both in `app-ui/forms.mjs` — `(copy)`, `(copy 2)`, … numbering). Generated/derived media fields are stripped per entity (character: `portraitUrl`/`audioUrl`/`introTranscript`; outfit: `renderUrl`; SFX: `audioUrl`; genre: `tracks` → `[]`; part: `data.previewImageUrl` → `''`). Multi-select modals insert the clone into the workspace `DynamicList` as a new `_localId` item; single-select modals replace the open form (with a `showDialog(['Clone', 'Cancel'])` confirm if the form has unsaved edits). The modal is the ONLY place to clone — the former in-form Clone button on `PartItem` was removed; do not add per-item Clone buttons to forms.

**Scope of that rule: library records only.** It governs entities that have their own server-backed collection reached through a Load modal, where an in-form Clone button competed with the modal's `itemAction`. A **sub-item of a single record** — one with no library of its own, no Load modal, and no `uid` — is outside it, and may carry an in-row Clone action. The reference case is the Location editor's Spots list (`location-section.mjs`), whose rows clone via a `DynamicList` `headerActions` entry (`icon: 'copy'`, `title: 'Clone'`) inserting a deep copy directly below the source. Two consequences follow from a sub-item having no identity of its own: there is no name to de-duplicate, so `nextCloneName`/`cloneRecordData` do not apply and the clone's derived row title is identical to its source until edited; and where the parent tracks a sub-item **positionally** (Location's session-only `previewSpotIndex`), the insertion must remap that index or it silently retargets a neighbour. This is a carve-out, not an exception to re-litigate.

## Testing

- **Custom UI components**: Every new component added to `public/js/custom-ui/` must have a render entry added to `public/js/custom-ui/test.vitest.mjs`. The entry should render the component with minimal props and assert no `console.error` calls.
- **Passing definition**: At phase boundaries, "passing" means `npx vitest run` (full suite) exits 0 — not just `--changed`. All tests, including pre-existing ones, must be green before a phase is considered complete.
