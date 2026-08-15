---
name: stage-and-commit
description: "Stages all codebase changes, generates a commit message, and commits. USE FOR: after editing files; after completing a phase; after any code change in a session; at the end of an implement-story run; whenever the codebase is modified. Auto-invoked after every codebase change — always run this after editing, creating, or deleting files. Derives the commit message from the in-progress phase in .kanban/boards/features/in-progress/, marks in-progress ([/]) checkboxes as [x], and refreshes the active feature card's derived checklists so the card update lands in the same commit as its related code. When auto-invoked by the model, always ask the user to confirm before committing. When the user explicitly triggers this skill (e.g. typed /stage-and-commit), commit immediately without asking."
---

# Stage and Commit

Stage all current codebase changes, generate a meaningful commit message, then commit — either immediately (if the user explicitly triggered this skill) or after user approval (if auto-invoked by the model).

## When to Invoke

This skill should be invoked **automatically by the model** at the end of any turn that modifies files — whether from an individual request or as the final step of an `implement-story` run. It is also available as a manual slash command (`/stage-and-commit`).

## Procedure

### 1. Branch Guard

Run `git branch --show-current`. Per `.claude/rules/git.md`, nothing is ever committed to `main`.

- If the current branch is `main`, **stop — do not stage or commit anything**. Tell the user, and offer the correct path: uncommitted changes carry over to a new branch automatically, so cut or switch to the appropriate feature branch first (e.g. via `implement-feature`) and run this skill there.
- This guard has no override. If the user insists on committing to `main`, they must do it by hand outside this skill.

### 2. Check for Changes

Run `git status --short` to detect staged and unstaged changes.

- If there are no changes, output: "Nothing to commit." and stop.

### 3. Determine Commit Message

Apply these rules in order, using the first source that yields a meaningful message:

**A. In-progress phase** — Glob `.kanban/boards/features/in-progress/*.md` and read all files found. Look for tracked checkboxes currently marked in-progress (`[/]`).

- For a `Complete initial implementation` checkbox, derive the message from its **phase heading milestone** (the text after `### Phase N — `), informed by the nested task bullets beneath it. The phase milestone describes the unit of work; the bullets tell you what actually changed. Example: a phase headed `Phase 2 — Story-tier skills` with bullets about renaming folders yields `rename story-tier skills; drop review-features`.
- For a **sibling fix checkbox** (a tracked checkbox next to `Complete initial implementation`, named after a post-phase fix), use its own text — it is already a description of the change.
- If several tracked checkboxes are in-progress, join their phrases with `;`.
- If the derived phrase is too vague to be meaningful, skip to **D**.

**B. Skill argument** — If the user supplied text as a skill argument, use it directly as the commit message (apply light formatting: lowercase first word, trim trailing punctuation).

**C. Context of changes** — If neither source is available, run `git diff --cached --stat` and `git diff --stat` to see which files changed, then write a short phrase describing what was changed (e.g. `update theme constants in dynamic list`). Keep it under 72 characters.

**D. Ask the user** — If none of the above yields a specific, meaningful message, ask the user directly: _"What should the commit message be?"_ Wait for their response before continuing.

### 4. Determine Whether to Commit Immediately or Ask

This gate runs **before** any files are staged or modified, so a declined commit never leaves the working tree mutated.

**If the user explicitly triggered this skill** (they typed `/stage-and-commit` or directly asked to commit), proceed to Step 5 immediately.

**If this skill was auto-invoked by the model** (after editing files, at the end of a task run, etc.), output the proposed commit message and ask for approval:

> Commit message: `<message>`
> Ready to commit? (yes / no)

Wait for the user's response before continuing. If they say no or provide a revised message, update the commit message accordingly or stop if they decline.

### 5. Mark In-Progress Checkboxes Complete

Re-read all `.kanban/boards/features/in-progress/*.md` files and replace every `[/]` marker with `[x]`. Write each modified file back.

This applies to phase-level `Complete initial implementation` checkboxes and to sibling fix checkboxes alike. It does **not** apply to nested task bullets — those carry no checkboxes and are never marked.

This runs **before** staging so the card update lands in the same commit as its related code changes. This step is always performed — do not skip it even if no board files appear to have changed.

### 6. Refresh the Active Feature Checklist

Resolve the **active feature**: run `git branch --show-current` and look for a card whose `id` matches the branch name and whose `labels` contain `feature` (check `.kanban/boards/features/in-progress/` first, then the other lanes).

If no feature card matches the branch, skip this step entirely.

If one is found, regenerate its `## Stories` and `## Tickets` sections:

1. **Discover children.** Glob every lane under `.kanban/boards/features/` and collect each card whose frontmatter contains `metadata.feature` equal to the active feature's `id`.
2. **Partition by category label.** Cards labeled `story`, `polish`, or `idea` go under **Stories**; cards labeled `blocker` or `defect` go under **Tickets**.
3. **Determine checkbox state.** A card is `[x]` if its current lane is `done`, otherwise `[ ]`.
4. **Preserve archived entries.** Any entry already present in the feature card's checklist whose file no longer exists in any lane was archived — keep it, checked (`[x]`). Archived cards are gone from the board and cannot be rediscovered by globbing, so a naive regeneration would silently drop completed work from the tally.
5. **Write each entry** as `- [<state>] \`<filename>.md\` — <Card Title>`, where the title comes from the card's `# ` heading. Sort checked entries before unchecked ones within each section, preserving relative order otherwise.
6. **Omit an empty section's body** but keep its heading, so the card's shape stays stable.

Leave the feature card's `## Goal` and `## Notes` sections untouched — those are hand-maintained by `groom-feature`.

### 7. Run Prettier

Run:

```
npx prettier . --write
```

This formats all modified files before staging so the commit contains consistently formatted code.

### 8. Stage All Changes

Run:

```
git add -A
```

This stages the code changes, the card updates from Step 5, and the feature checklist refresh from Step 6 together.

### 9. Commit

Run:

```
git commit -m "<message>"
```

Output confirmation:

> Committed: `<message>`

## Commit Message Style

- Imperative mood, lowercase, no trailing period (e.g. `add breadcrumb scroll fix`, `fix autocomplete positioning`)
- 50 characters or fewer for the subject
- No generic words alone: `fix`, `update`, `cleanup`, `misc`, `wip` are only acceptable as qualifiers alongside a specific subject (e.g. `fix tag selector scroll`)
- When multiple items are summarised, join with `;` (e.g. `add floating panels; fix drag behaviour`)

## Completion Check

- The current branch is not `main` (see `.claude/rules/git.md`) — the branch guard ran first and no commit was ever made on `main`
- Commit message is specific and describes what actually changed
- If auto-invoked, user approved before any files were staged or modified
- All `[/]` checkboxes in `.kanban/boards/features/in-progress/` were marked `[x]` before staging
- The active feature card's checklists were refreshed, with archived entries preserved
- All changes are staged (`git add -A` was run), including the card updates
- `git commit` was run with the message, capturing the card updates and code together
