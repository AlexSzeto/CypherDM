---
description: when a planning step workflow starts
---

## Project Management Structure

Project planning is organized into **two tiers**:

- A **feature** is a branch-level rollout — the unit that ships. One feature per branch, and the branch is named after the feature card's `id`.
- **Stories** and **tickets** are the individual work cards that make up a feature. They are what actually gets groomed and implemented.

Both tiers live as cards on the same Kanban Lite board, distinguished by their category label.

### Terminology

| Term        | Means                                                  | Category labels           |
| ----------- | ------------------------------------------------------ | ------------------------- |
| **feature** | A branch-level rollout containing many stories/tickets | `feature`                 |
| **story**   | A unit of intended work (UX story, enhancement, idea)  | `story`, `polish`, `idea` |
| **ticket**  | A unit of corrective work (a bug)                      | `blocker`, `defect`       |

"Story" and "ticket" are umbrella terms used in prose and skill names; they are not labels themselves. When the distinction does not matter, "card" refers to any of them.

### Board lanes

All cards live in a single Kanban Lite board directory, organized into status subdirectories:

- `.kanban/boards/features/backlog/` — freeform ideas captured quickly, not yet committed to any feature
- `.kanban/boards/features/planned/` — **scoped to the active feature**: cards committed to the in-progress rollout but not yet groomed
- `.kanban/boards/features/groomed/` — fully specified cards ready to pull into development
- `.kanban/boards/features/in-progress/` — cards currently being implemented
- `.kanban/boards/features/done/` — completed cards awaiting archival. The user manually moves cards here once all phases are finished.
- `.kanban/boards/features/abandoned/` — cards shelved at any stage of the lifecycle

Each card is a markdown file with YAML frontmatter. The `status` field mirrors the subdirectory name. All card filenames use kebab-case slugs with no sequential numbering.

The board configuration lives at `.kanban.json` at the repo root.

> **Lane semantics changed with the feature system.** `planned` no longer means "backlog, but organized" — it now specifically means "pulled into the active feature." Cards reach it via feature grooming or `implement-feature`'s sweep, not by casual dragging. `backlog` is the only true pre-commitment lane.

### Reopening a completed card

`done` is not terminal. When a bug surfaces in work that was already marked done — and the card is still on the board, not yet archived — **reopen that card rather than filing a new ticket**. The original card already holds the goal, the phases, the implementation details, and the design decisions that produced the bug; a fresh ticket would have to reference all of it second-hand, and the two records then drift apart.

The flow:

1. Move the card back: `node scripts/move-feature.mjs <filename> done in-progress`.
2. Add the fix as a **sibling checkbox** named after it, next to that phase's `Complete initial implementation` (the same shape as any post-phase fix).
3. Implement and verify it.
4. The **user** moves the card back to `done` once satisfied. As with the first pass, an agent never makes that move on its own.

This is the one sanctioned backwards move. It does not license dragging cards backwards through the grooming lanes (`groomed` → `planned`, say), which the skills still forbid — a card that has been specified does not become unspecified.

Once a card has been **archived**, it is gone from the board and this no longer applies: file a new ticket and reference the feature summary in `project-management/archived/`.

### Category labels

Every card carries exactly one category label in its `labels` frontmatter array. The registry (names + colors) lives in `.kanban.json` under `labels`, grouped as `category`.

| Label     | Tier    | Meaning                                                                                                       |
| --------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| `feature` | feature | A branch-level rollout. Created by `create-feature`; never assigned to a work card.                           |
| `story`   | story   | A substantial unit of intended work. The default for groomed feature work.                                    |
| `polish`  | story   | Small, isolated usability/informational/visual improvement to an already-functional area.                     |
| `idea`    | story   | Uncommitted brainstorm of any size — may or may not ever be implemented. Default category for `create-story`. |
| `blocker` | ticket  | Breaking bug — prevents essential function; fix as soon as found. Default category for `create-ticket`.       |
| `defect`  | ticket  | Non-breaking bug — occurs in known edge cases and can be avoided; burn down before a release.                 |

Category is orthogonal to both lane (status) and `priority` — priority orders work _within_ a category. `create-story` and `create-ticket` assign the label at creation; `groom-story` confirms or reassigns it (a groomed card should rarely stay `idea`). Do not invent category names outside this registry.

## Linking Cards to Features

Every story and ticket belonging to a feature records the parent feature's `id` under the frontmatter `metadata` object:

```yaml
metadata:
  feature: 'new-user-experience-polish'
```

The value is the feature card's stable `id` slug. It is deliberately **not** a file path: cards move between lanes constantly, and any relative link breaks the moment they do.

**Use `metadata.feature`, never a bare top-level `feature:` field.** Kanban Lite's card serializer builds frontmatter from a fixed allowlist, so unknown top-level keys are silently dropped whenever the board rewrites a card (dragging between lanes, editing in the UI). `metadata` is the sanctioned arbitrary-data extension point and survives the round trip.

The field is registered in `.kanban.json` under `boards.features.metadata` with `highlighted: true`, so each card displays its parent feature on the board preview.

Cards with no `metadata.feature` are unaffiliated — legitimate for backlog items not yet committed to any rollout.

**A feature and its children must not share a slug.** Every card's `id` matches its filename basename, and the feature's `id` doubles as the branch name — so a child card named after its parent collides with it on the board and makes the active-feature lookup ambiguous. Name the feature after the rollout and the child after the specific work (`feature-rollout-tracking` the feature, `two-tier-card-system` the story that implements it).

`move-feature.mjs` only renames a card while moving it between lanes (`--rename`). To rename a card within its lane, move the file and update its `id` field to the new basename by hand.

## Feature Cards

### Body structure

```markdown
# Feature Title

## Goal

Release-level statement of the rollout's intent — what a user gets when this branch merges. One short paragraph, no implementation detail.

## Stories

- [x] `character-sheet-stat-pools.md` — Character Sheet Stat Pools
- [ ] `dm-dashboard-party-overview.md` — DM Dashboard Party Overview

## Tickets

- [ ] `stat-pool-edit-desyncs-across-tabs.md` — Stat Pool Edit Desyncs Across Tabs

## Notes

Release-scoping decisions from feature grooming, deferred/descoped items, constraints, and anything discovered mid-branch worth remembering at archive/PR time.
```

### The derived checklist

The **Stories** and **Tickets** sections are a _derived view_, not hand-maintained:

- Membership comes from every card carrying `metadata.feature: '<this-feature-id>'`, in any lane.
- A card is listed under **Stories** or **Tickets** according to its category label (see the tier column above).
- A card is checked (`[x]`) iff its current lane is `done`, or it is no longer on the board because it was archived.
- Filename first (machine-matched), title after the dash (human-readable). Lane is not shown — checkbox state is the only signal that matters.

`stage-and-commit` regenerates both lists on every run, so the tally stays current as work lands and appears in commit history alongside the work itself.

### Feature lifecycle

```
create-feature → groom-feature → implement-feature → (work happens) → archive-feature
    backlog         backlog          in-progress                        pre-merge
```

1. **`create-feature`** captures the rollout as a card in `backlog` with `labels: ['feature']`.
2. **`groom-feature`** develops its scope, pulls existing cards in, and spins up new stories. Re-runnable at any time, including mid-implementation.
3. **`implement-feature`** cuts a branch named after the feature `id` from `main`, moves the feature card to `in-progress`, and sweeps its recorded children into `planned`. Grooming first is recommended but not required — an ungroomed feature requires explicit user consent to proceed.
4. Stories and tickets are groomed and implemented individually while the feature stays `in-progress`. As each child finishes, the user moves **that child** to `done`.
5. **`archive-feature`** runs pre-merge, condensing the feature and its completed children into a single dated summary and drafting the PR message.

**The feature card never moves to `done`.** Only children do. The feature card stays `in-progress` for the entire life of the branch and is deleted by `archive-feature` when the summary is written — archiving _is_ the act of completing a feature, so there is no window in which the rollout is finished but not yet archived. `archive-feature` blocks if any child is still outside `done`, but it expects to find the feature card itself in `in-progress`.

After archiving, the summary and board cleanup are committed **on the feature branch**, so they travel with the PR rather than landing on `main` as a separate commit. Opening and merging the PR stays a manual user step.

Only one feature is active per branch. Concurrent features live on their own branches or worktrees.

## Story and Ticket Cards

### Frontmatter

```markdown
---
version: 1
id: '<slug>'
boardId: 'features'
status: 'backlog|planned|groomed|in-progress|done|abandoned'
priority: 'high|medium|low'
assignee: null
dueDate: null
created: '<ISO 8601 UTC timestamp>'
modified: '<ISO 8601 UTC timestamp>'
completedAt: null
labels: ['<category>']
attachments: []
order: 'a0'
metadata:
  feature: '<parent-feature-id>'
---
```

`metadata` is omitted entirely for unaffiliated cards. The `priority` field lives in YAML frontmatter only — never as a `**Priority:**` line in the markdown body.

### Backlog and planned body structure

```markdown
# Card Title

## Goal

Concise description of the desired outcome. No implementation steps.

## Notes

Rough ideas, constraints, or open questions.
```

### Groomed / in-progress body structure

```markdown
# Card Title

## Goal

Concise description of the desired outcome. No implementation steps.

## Tasks

### Phase 1 — <Short milestone description>

- [ ] Complete initial implementation
  - Task description one
  - Task description two

### Phase 2 — <Short milestone description>

- [ ] Complete initial implementation
  - Task description one

## Implementation Details

Code snippets, data shapes, constraints, and design decisions.
```

## Per-Phase Progress Tracking

Progress is tracked **per phase**, not per task.

- Each phase carries exactly one tracked checkbox, labeled **`Complete initial implementation`**.
- The concrete tasks are plain nested bullets beneath it — implementation notes, not tracked items. They still follow the task standards below (single verifiable outcome, explicit file paths, no jargon without a definition).
- `implement-story` marks the phase checkbox `[/]` when it begins the phase.
- `stage-and-commit` flips `[/]` → `[x]` after the commit lands, and derives the commit message from the phase milestone plus its nested bullets.

Phases end at a user-visible or testable milestone. Maintenance and server-only cards may use a flat task list with a single `Complete initial implementation` checkbox.

### Fixes and changes after a phase

When a change request arrives after a phase's initial implementation has landed, add it as a **sibling checkbox** at the same level as `Complete initial implementation`, named after the fix:

```markdown
### Phase 2 — Story-tier skills

- [x] Complete initial implementation
  - Rename the four story-tier skill folders
  - Update all cross-references
- [/] Restore the conflict check dropped from create-story
```

This supersedes the old `#### Fixes and Changes` subheader convention. The change must be written to the card **before** any code is touched.

### Task standards

Each nested task bullet describes a single outcome that can be verified — by automated tests or a brief observable check. Because a phase may be handed to a cold subagent with no memory of the grooming dialogue, every bullet must be self-contained:

- **File references**: name the exact path, and the specific function/class/section where relevant.
- **Multi-file tasks**: list every affected file explicitly — never "and related files" or "all callers".
- **Term definitions**: any project jargon used in a task must be defined in Implementation Details.
- **Breaking changes**: state the old name, the new name, and every caller that needs updating.
- **Test tasks**: specify what to assert, not just "add a test".
- **Review/update tasks**: name the specific sections to change and what constitutes done.

## Skills

| Tier    | Skill               | Purpose                                                                                             |
| ------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| Feature | `create-feature`    | Capture a rollout as a feature card in `backlog`.                                                   |
| Feature | `groom-feature`     | Develop feature scope; adopt strays, pull in backlog cards, spin up new stories. Re-runnable.       |
| Feature | `implement-feature` | Cut the feature branch from `main`, move the card to `in-progress`, sweep children into `planned`.  |
| Feature | `archive-feature`   | Pre-merge: condense the feature and its done children into one dated summary; draft the PR message. |
| Story   | `create-story`      | Capture a freeform idea as a card with a story-tier category.                                       |
| Story   | `groom-story`       | Develop a full spec from a card (or scratch) via Q&A. Moves the card to `groomed` or `in-progress`. |
| Story   | `implement-story`   | Execute a card's phases, running the full test suite at each phase boundary.                        |
| Story   | `create-ticket`     | Capture a single bug as a ready-to-implement spec, skipping the Q&A dialogue.                       |

Supporting skills: `stage-and-commit` (commits work, flips phase checkboxes, refreshes feature checklists), `update-docs`, `test`, `sync-skills`.

### Where new cards land

- **`create-story`** writes to `backlog` or `planned` (user's choice). A card sent to `planned` is auto-linked to the active feature.
- **`create-ticket`** writes straight to `groomed` — tickets skip the Q&A grooming dialogue but still land ready-to-implement — and is auto-linked to the active feature.
- **`groom-story`** may groom an unlinked backlog card mid-branch; doing so adopts it into the active feature.
- **`groom-feature`** creates new story cards in `backlog` (if the feature is still in `backlog`) or `planned` (if the feature is `in-progress`).

The "active feature" is resolved from the current git branch name, which matches the feature card's `id`. When no feature card matches the branch, linking is skipped.

## Archiving

Completed features are archived to `project-management/archived/<YYYY-MM-DD>-<feature-id>.md`, where the date is the completion date. One file per feature, plain markdown with no frontmatter:

```markdown
# Feature Title

Completed <YYYY-MM-DD> · branch `<feature-id>`

## Goal

What the feature delivered.

## What shipped

- **Story** — Card Title: one-line outcome.
- **Ticket** — Card Title: one-line outcome.

## Notable decisions

Implementation decisions and their rationale, written to be useful to a future agent asking "why is it like this?"

## Deferred / descoped

Anything considered and cut, with why.
```

`archive-feature` writes the summary, deletes the archived child cards and the feature card from the board, and outputs a draft PR title and description. Git history preserves the raw cards, so the summary is a distillation rather than a dump — it exists to be read, which the old per-card archive rarely was.

## Modifying the Project Management System

Changes to this system are themselves tracked as features within it. Do not apply process changes silently and untracked, as was the habit before the feature system existed.

**Board-wide mutations must be atomic and quiescent.** Label renames, mass relabels, archive restructures, and frontmatter migrations must land as a **single commit**, performed when **no card is mid-implementation**. A board-wide rewrite that collides with an actively edited card corrupts it, and the board's own tooling may rewrite cards underneath you while it runs.
