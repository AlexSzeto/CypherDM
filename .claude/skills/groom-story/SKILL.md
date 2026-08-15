---
name: groom-story
description: Develops a thorough, developer-ready story spec through interactive Q&A, then writes it to .kanban/boards/features/ with status "groomed" or "in-progress". Adopts the card into the active feature when one is in progress. USE FOR: turning a backlog or planned idea into a full spec; grooming an existing card; starting implementation planning for a well-understood story.
---

# Groom Story

You are developing a full story specification through iterative dialogue, one question at a time. The end goal is a detailed spec that can be handed off to any developer or agent without ambiguity.

This skill grooms a **single story or ticket** — one unit of work. To scope a whole branch-level rollout, use `groom-feature` instead.

## Inputs

The skill may be invoked with:

- **A filename from `.kanban/boards/features/backlog/` or `.kanban/boards/features/planned/`** — read that file first and use its goal/notes as the starting context. Check `backlog/` first, then `planned/` if not found there.
- **A free-form description** — treat it as the seed and begin questioning from there.
- **No argument** — Glob both `.kanban/boards/features/backlog/*.md` and `.kanban/boards/features/planned/*.md`, read frontmatter from all files, and present a numbered list sorted by `priority` (high → medium → low → unknown) before asking the user which story to groom:

```
High priority:
  1. Story Name — one-sentence goal
  2. Story Name — one-sentence goal

Medium priority:
  3. Story Name — one-sentence goal

Low priority:
  4. Story Name — one-sentence goal

(unset)
  5. Story Name — one-sentence goal
```

Ask: _"Which story would you like to groom? Enter a number, or describe a new story from scratch."_ If the user picks a number, load that file and proceed as if it was passed as an argument. If the user describes a new story, treat it as a free-form description and do **not** use any existing card.

If a source card was used, read it before asking the first question.

## Resolve the active feature

Before the first question, run `git branch --show-current` and look for a card whose `id` matches the branch name and whose `labels` contain `feature` — check `.kanban/boards/features/in-progress/` first, then the other lanes.

- If a feature card is found, that is the **active feature**. Note whether it is `in-progress`.
- If the source card already carries `metadata.feature`, keep that value — never reassign a card that already belongs to a feature.
- If the source card is unaffiliated and an active feature exists, the card is **adopted** into it: set `metadata.feature: '<active-feature-id>'` when writing. Mention this in the final summary so the user sees it happening.
- If no feature card matches the branch, skip linking entirely.

## Questioning process

- Ask **one question at a time**. Each question should build on the previous answer and dig into a relevant detail.
- Cover: user-facing behavior, edge cases, data shapes, dependencies on existing features, constraints, and anything that would block a developer from starting.
- **Investigate before asking**: When you are unsure how an existing feature is implemented, search the source code and report your findings to the user instead of asking them. Reserve questions for decisions and intent that cannot be determined from code alone.
- If a new sub-story surfaces that is clearly out of scope, do **not** spec it here. Tell the user: _"That sounds like a separate story — run `/create-story` to capture it, then we can groom it independently."_
- Continue until you are confident the spec is thorough enough to hand off.

## Finalizing the spec

When the Q&A is complete, generate a structured summary before writing any file. If an open question surfaces while drafting the summary, do **not** include it — return to the questioning phase, resolve it, then re-attempt the summary.

Present the summary in this format:

1. **Goal** — one or two sentences restating the desired outcome in your own words.
2. **Scope** — bullet list of what is in scope and, if helpful, what is explicitly out of scope.
3. **Work** — the planned work grouped by phase. Each phase gets a short milestone label and a flat bullet list of the concrete work items in that phase. Use plain sentences, not checkboxes. Maintenance or server-only stories with no phases use a single flat list under a **Work** heading.
4. **Assumptions** — every detail you filled in that the user did not specify. For each, state what you decided and why (convention match, simplicity, existing pattern). This section must be present even if minimal.
5. **Category** — the card's category label: `story` (substantial unit of work), `polish` (small usability/visual win), `idea` (uncommitted brainstorm), `blocker` (breaking bug), or `defect` (non-breaking bug). Preserve the source card's label if it has one; otherwise propose the best fit. Grooming is the natural moment to confirm or reassign — a groomed card should rarely remain `idea`. Never assign `feature`.
6. **Feature** — the active feature this card belongs to, if any. State plainly whether the card is already linked, is being adopted now, or stays unaffiliated.

End the summary with:

> Does this look right? Reply with any changes, or say **"approved"** to save the spec.

Each time the user requests a change, acknowledge it in one sentence, show only the updated item(s), and repeat the approval prompt. Reprint the full summary only if the user asks. Repeat until the user says "approved" (case-insensitive).

On approval, ask: **"Save to `groomed` for later, or start implementing now (`in-progress`)?"**

### Option A — Save as groomed

1. Derive a kebab-case slug from the story name.
2. Write the new file to `.kanban/boards/features/groomed/<slug>.md` with the full frontmatter (`version: 1`, `boardId: "features"`, `status: "groomed"`, `priority` preserved from source (or `medium` if none), `assignee: null`, `dueDate: null`, current `modified` timestamp, `completedAt: null`, `labels: ['<category>']` (the approved category label), `attachments: []`, `order: "a0"`, and `metadata.feature` if linked) and the spec body.
3. If a source card existed (from `backlog/` or `planned/`): run `node scripts/move-feature.mjs <source-filename> <source-lane> groomed` to remove the source file and move its attachment. (The destination was already written in step 2, so the script will only delete the source.)
4. Run `npx prettier . --write` to format the new spec file.
5. Tell the user to run `/implement-story <slug>.md` when ready to begin.

### Option B — Start now (in-progress)

1. Derive a kebab-case slug from the story name.
2. Write the new file to `.kanban/boards/features/in-progress/<slug>.md` with `status: "in-progress"`, `labels: ['<category>']` (the approved category label), `metadata.feature` if linked, and all required frontmatter fields.
3. If a source card existed (from `backlog/` or `planned/`): run `node scripts/move-feature.mjs <source-filename> <source-lane> in-progress` to remove the source file and move its attachment. (The destination was already written in step 2, so the script will only delete the source.)
4. Run `npx prettier . --write` to format the new spec file.
5. Invoke the `implement-story` skill with `<slug>.md` as the argument — do not just tell the user to run it manually.

Status transitions move the file to the appropriate status subdirectory. Always use `node scripts/move-feature.mjs <filename> <from-lane> <to-lane>` for any file move — never use direct file copy/move/delete commands.

## Output file structure

The markdown body (everything after the YAML frontmatter block) must follow this format:

```markdown
# <Story Title>

## Goal

<Concise description of the desired outcome. No implementation steps.>

## Tasks

### Phase 1 — <Short milestone description>

- [ ] Complete initial implementation
  - Task description one
  - Task description two

### Phase 2 — <Short milestone description>

- [ ] Complete initial implementation
  - Task description one

## Implementation Details

<Code snippets, data shapes, class definitions, constraints, and design decisions captured during grooming. This section provides context but does not dictate step-by-step instructions unless a critical restriction applies.>
```

Do **not** include a `**Priority:**` line in the body — priority lives in YAML frontmatter only.

## Per-Phase Progress Tracking

Progress is tracked **per phase**, not per task:

- Each phase carries exactly **one** tracked checkbox, labeled `Complete initial implementation`.
- The concrete tasks are plain **nested bullets** beneath it — implementation notes, not tracked items. They carry no checkboxes.
- Leave the phase checkbox unchecked (`- [ ]`).
- Maintenance or server-only stories with no phases use a flat list with a single `Complete initial implementation` checkbox.

Post-phase fixes are added later (by `implement-story`) as sibling checkboxes at the same level as `Complete initial implementation`, named after the fix. Do not create a `#### Fixes and Changes` subheader — that convention is retired.

## Task Standards

Each nested task bullet focuses on a single outcome that can be verified — either by automated tests or a brief observable check (e.g. what to open or curl). If a piece of work is not independently verifiable, bundle it with the adjacent work that completes the testable unit.

Phases end at a user-visible or testable milestone. Every answer from the Q&A that affects implementation must be captured somewhere in the spec — no context should be lost between sessions.

**Always append a docs-review bullet** as the final nested bullet of the last phase. See below.

### Subagent-ready task standards

Each phase will be handed off to a cold subagent with no memory of prior phases or the grooming dialogue. Every task bullet must be self-contained enough for that agent to implement correctly without asking questions:

- **File references**: Name the exact file path and, where relevant, the specific function, class, or render section to change (e.g. "in `character-section.mjs`, inside the `renderAttributes()` loop"). Never assume the implementer knows the codebase layout.
- **API ownership**: When two components share a boundary, state explicitly which side owns each behavior (e.g. "ContentEditablePillInput implements click delegation internally; callers receive the result via `onPillClick` prop — TagInput does not wire this itself").
- **Term definitions**: Any domain-specific term used in a task (e.g. "stat pool", "effort tier", "browse-only mode") must be defined in the Implementation Details section. Never use project jargon in a task without a corresponding definition there.
- **Multi-file tasks**: If a task touches more than one file, list every affected file explicitly — never write "and related files" or "all callers".
- **Review/update tasks**: Tasks that say "review and update" a doc must name the specific sections to change and state what constitutes done (e.g. "add a `buttonProps` row to the Input component table; remove the deprecated `onReplace` row from the Select component table").
- **Breaking changes**: If a task removes or renames a public prop or exported function, state the old name, the new name or replacement, and list every caller file that needs updating.
- **Test tasks**: Specify what to assert, not just "add a test" (e.g. "assert that clicking the icon button fires `onClick` but does not toggle the dropdown open state").

## Docs-Review Bullet (always append)

Every generated task list must end with a docs-review bullet nested under the final phase's `Complete initial implementation`. Infer which living docs are likely affected from the spec content, and name them explicitly:

```
  - Review and update affected living docs: <comma-separated list of likely affected docs>
```

**Mapping story scope → affected docs:**

| Story touches…                               | Likely affected docs                |
| -------------------------------------------- | ----------------------------------- |
| A named app section or feature area          | `docs/features/<section>.md`        |
| Cypher System rules, stats, or game concepts | `docs/cypher-system-design-spec.md` |
| New or changed API endpoints                 | `docs/server.md`                    |
| New `custom-ui` components                   | `docs/components.md`                |
| Backend architecture, new feature domains    | `docs/architecture.md`              |
| Client-side patterns, component strategy     | `.claude/rules/client.md`           |
| Server-side patterns, domain structure       | `.claude/rules/server.md`           |
| Project management, board, card format       | `.claude/rules/planning.md`         |

A story may affect multiple docs — list all that apply. When in doubt, err toward listing more rather than fewer.

**Feature doc creation:** If the story touches a named app section and that section's `docs/features/<section>.md` file does not yet exist, add a bullet before the docs-review bullet to create it:

```
  - Create `docs/features/<section>.md` documenting the user flow, component interactions, server endpoints, and key data shapes for the <section> feature area
```

## Data Migration Tasks

If a story changes the schema of any tracked data file (`server/config.json` or any `server/database/*.json` — see `server/core/data-versions.mjs`'s `DATA_DOMAINS` for the authoritative list), the task list **must** include:

1. A migration script at `scripts/migrate/<domain>/<N>-to-<M>.mjs` (where `<domain>` matches the filename without `.json`, `<N>` is the current version, `<M>` is `<N>+1`).
2. A bullet to bump `currentVersion` for that domain in `server/core/data-versions.mjs`.

Migration scripts export a fixed interface — include this in the Implementation Details section when a migration is required:

```js
// scripts/migrate/<domain>/<N>-to-<M>.mjs
export const fromVersion = N
export const toVersion = M

/**
 * @param {Object} data - Parsed JSON data (do not set data.version — the migrator handles that)
 * @returns {Object} The migrated data object
 */
export function migrate(data) {
  // ... transform data ...
  return data
}
```

The migrator (`server/core/migrator.mjs`) runs all required scripts automatically on server startup, backs up data before migrating, and restores on failure. Migration scripts do **not** set `data.version` — the migrator writes the final version after each step.

**`migrate(data)` must be idempotent and guarded** — safe to run twice in a row against its own output with the second run a no-op. This isn't just a startup-chain concern: `migrateDataObject` (also in `server/core/migrator.mjs`) runs the same scripts in-memory against arbitrary source versions when importing an externally-supplied data bundle. Gate destructive renames/moves on the **absence** of the destination field, use `??`/`!Array.isArray(x)`/`x === undefined` guards for default-fill migrations, and verify (don't assume) that value-remap migrations can't re-fire on their own output.

**New data files must be stamped with the current version on creation.** If the story adds or changes a domain's write path, its single write function should set `data.version = getCurrentVersion(domain)` (from `data-versions.mjs`) before writing — otherwise a freshly created file (e.g. from a first save or an import) carries no `"version"` field and gets misread as version `0` on the next server restart, incorrectly replaying the full migration chain. This only applies where the data file is a JSON object; a bare top-level array can't carry `.version`.

## Rules

- Do **not** modify any code.
- Every written card must carry exactly one category label (`story`, `polish`, `idea`, `blocker`, or `defect`) in `labels`. The registry lives in `.kanban.json`; do not invent new category names, and never assign `feature`.
- Use `metadata.feature`, never a bare top-level `feature:` field. Kanban Lite strips unknown top-level frontmatter keys when the board rewrites a card.
- Do **not** write to `task.md` — the old root-level file is retired.
- Do **not** skip the conflict check when starting from scratch (no source file): briefly scan `.kanban/boards/features/backlog/`, `.kanban/boards/features/planned/`, and `.kanban/boards/features/groomed/` for cards that cover similar ground before the first question.
