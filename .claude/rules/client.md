---
description: when working on the client facing (i.e. /public) side of the website
---

## Frontend Architecture

- **File Naming Conventions**: All source files should be lowercase with dashes (e.g., `character-sheet.mjs`, `stat-pool-tracker.mjs`).
- **Framework & Libraries**: Always use `preact` + `htm/preact` for dynamic components.
- **Theme Usage**: All pages must utilize the `Page` component and initiate theming via `currentTheme.subscribe` to ensure consistent theming across the app.
- **Component Strategy**:
  - **Functional Components (Preferred)**: Use functional components with hooks (`useState`, `useEffect`, `useCallback`) for most UI elements. This aligns with modern Preact patterns seen in `public/js/app.mjs`.
  - **Class Components (Allowed)**: Use `Component` from `preact` for complex stateful logic or when lifecycle methods (`componentDidMount`, `componentWillUnmount`) offer cleaner abstraction than hooks (e.g., `custom-ui/msg/progress-banner.mjs`).
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
    Never create a custom input, button, or control **in `custom-ui/`**. Use: `Button` (variants: `medium-text`, `medium-icon`, `medium-icon-text`, `large-icon`, `small-text`, `small-icon`, `chip`), `Input` (supports `buttonProps` for an inline icon action button), `Textarea`, `Select` (fully custom portal dropdown; supports `buttonProps`), `MultiSelect` (options as `{ label, value, tooltip? }[]`; supports `buttonProps`), `Checkbox`, `Slider`, `RangeSlider`, `DiscreteSlider`, `ToggleSwitch`, `Pill` (variants: static, dismiss, interactive icon, template toggle; `variant="filled|outlined"`; `onClick`/`value` for clickable body; `outlined` variant keeps shell neutral while slot tokens still render in the assigned `color`), `ContentEditablePillInput` (contenteditable div with inline pills + autocomplete dropdown; supports `onPillClick` for pill-body click; `getPillTooltip` (show tooltip on hover; returning null dismisses any visible tooltip rather than being a no-op, since container-bound `mouseleave` does not fire on pill→pill moves) and `buttonProps` for an overlay icon button), `useAutocomplete` + `AutocompleteDropdown` (hook + stateless component pair from `io/use-autocomplete.mjs` and `io/autocomplete-dropdown.mjs`; compose onto any input — including plain `<textarea>` or `<input>` — to add a filtered suggestion dropdown without pulling in `ContentEditablePillInput`; hook returns stable refs safe to call from `useEffect([])` closures).

    **Scoped exception — the boxed number vocabulary.** The character sheet and the GM dashboard use a project-wide convention where every number sits in a box whose fill states whether it is interactive. Its **boxed number display and matching boxed numeric input belong in `app-ui/`**, because their font size, border treatment, and padding differ drastically from `Input` and the convention only holds if inputs share the vocabulary. This is a deliberate amendment recorded in _Player playing a session_ §6, not licence to build custom controls generally: anything that a `custom-ui` component can express still uses that component, and `custom-ui/` itself gains no bespoke inputs.

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

### The custom-ui library is shared, and frozen against rework

- `public/js/custom-ui/` is shared-library code mirrored from a central repository — it is not owned by this project.
- `lib-sync.mjs` must never be run in either direction, because both `push` and `pull` are destructive mirrors:
  - `push` overwrites the central repository with local content and deletes files present upstream but absent locally (propagating local prunes outward to all other library consumers).
  - `pull` overwrites the local directory with upstream content and deletes local files absent upstream (silently reverting local edits to `custom-ui/`).
- The `pull` and `push` npm scripts were removed for exactly this reason; their absence is deliberate, not an oversight.
- Unused components under `custom-ui/` are normal for a shared library and must **never** be treated as cleanup targets. Components are added to and removed from `custom-ui/` only through the future library system, never by editing this repo.
- A future library system will supply the proper way to reset and re-sync the folder.
- **Additive changes are permitted.** The hard dependency on `custom-ui/` as a live mirror has been removed, so new components and new props may be added. A future re-share reconciles the differences, which stays tractable only while changes are **additive** — reworking the behaviour of an existing component is still out of bounds, as is deleting anything. `lib-sync.mjs` remains untouched in both directions regardless.

- **Navigation Registration**: The **home page is the only navigation hub** — every route is reached from its content, and a new page must be reachable from it as part of the same task that creates it. Do not ship a page with no way to reach it.

  The hamburger menu is **not** a page registry. It holds exactly two items, a theme toggle and a link home, and gains nothing further. (Supersedes the previous rule requiring every page to be registered in `public/js/app-ui/hamburger-menu.mjs`; see _Player creating a character_ §6.)

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
  - All source files should be lowercase with dashes (e.g., `character-sheet.mjs`, `stat-pool-tracker.mjs`).
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

## Save/Revert Pattern (settings and persistent records)

Use `useFormRecord` from `app-ui/forms.mjs` (create it with the first form that needs it) to manage dirty state. Derive button enable states via `formButtonStates(recorded, dirty)`. On save: call the API → `markSaved(newData)`. On revert: confirm via `showDialog` → reset form state to `savedData`. Config-style forms that always exist set `recorded = true` always and omit delete.

### Form action button row

Every Save/Revert/Delete row follows the same order, icon, and color:

| Button        | Icon    | Color                                      | Order           |
| ------------- | ------- | ------------------------------------------ | --------------- |
| Save / Create | `save`  | `primary`                                  | 1st             |
| Revert        | `undo`  | `secondary` (or omit — `Button`'s default) | 2nd             |
| Delete        | `trash` | `danger`                                   | 3rd (rightmost) |

Both Delete and Revert require a `showDialog` confirmation before acting (e.g. `['Delete', 'Cancel']`, `['Revert', 'Cancel']`). Save does not require confirmation.

There are two layout sub-patterns, depending on whether the form is a top-level entity editor or an item inside a `DynamicList`:

- **Pattern A — top-level entity form**: `HorizontalEdgesLayout` with a left-aligned **"Clear"** button (`color="danger" icon="x"`) whenever the form content can be cleared, and a right-aligned `HorizontalLayout gap="small"` containing Save/Revert/Delete. The left button must always be labeled "Clear" — entity-specific labels are not the convention.
- **Pattern B — DynamicList item form**: no left-side button; a right-aligned `HorizontalLayout gap="small" justifyContent="flex-end"` containing Save/Revert/Delete. An unsaved new item is discarded by closing/removing its DynamicList card (wired via the list's `onDelete` callback), not via a dedicated Cancel button. Revert stays disabled for the entire lifetime of a new/unrecorded item since there is no saved baseline to revert to (`formButtonStates` returns `revertEnabled: recorded && dirty`, and `recorded` is false for a new item).

Variant selection: `variant="medium-icon-text"` for page-level/top-of-page single-form contexts (a config tab, a page-level editor). `variant="small-text"` for forms nested inside a multi-section editor or rendered as a DynamicList item.

### DynamicList identity-based keying

`DynamicList` (`custom-ui/layout/dynamic-list.mjs`) keys each rendered row by `item.uid ?? item._localId ?? item.id ?? index`, not raw array position. This matters for any `renderItem` component that seeds local edit state from props via `useState` — that initializer only runs once, on mount. If rows were keyed by index, reordering the list (drag, add, delete-from-middle, or any bulk replace that reorders/prepends items) would make Preact reuse a slot's existing component instance for a _different_ item, silently carrying stale unsaved-edit state onto the wrong record. Always give new/unsaved items a stable `_localId` (e.g. `String(Date.now())`) so this keying works correctly for them too.

## Testing

- **Custom UI components**: Every new component added to `public/js/custom-ui/` must have a render entry added to `public/js/custom-ui/test.vitest.mjs`. The entry should render the component with minimal props and assert no `console.error` calls.
- **Passing definition**: At phase boundaries, "passing" means `npx vitest run` (full suite) exits 0 — not just `--changed`. All tests, including pre-existing ones, must be green before a phase is considered complete.
