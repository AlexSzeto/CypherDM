---
name: implement-feature
description: Starts work on a feature rollout — verifies a clean main, cuts a branch named after the feature id, moves the feature card to In Progress, and sweeps its linked cards into Planned. Requires explicit consent if the feature has not been groomed. USE FOR: beginning a new release push; branching for a feature that is ready to start.
---

# Implement Feature

You are starting work on a **feature** — a branch-level rollout. This skill sets up the branch and the board, then stops. It does not implement anything: individual stories and tickets are executed later, one at a time, via `implement-story`.

## Invocation

- **A filename** — read that feature card. It should be in `backlog` or `planned`.
- **No argument** — Glob every lane for cards whose `labels` contain `feature` and that are in `backlog` or `planned`. Present them sorted by priority (high → medium → low) with their goals, and ask which one to start.

Verify the card carries `labels: ['feature']`. If the user pointed at a story or ticket instead, tell them to use `/implement-story <filename>` and stop.

If the card is already `in-progress`, its branch already exists — tell the user the feature is already underway and suggest `/groom-feature` to re-scope it or `/implement-story` to work a specific card. Stop.

## Step 1 — Grooming check

Grooming before implementation is **recommended but not required**.

A feature is considered groomed if it has at least one linked child card (any card carrying `metadata.feature: '<feature-id>'`), or its `## Notes` section records scoping decisions.

If the feature appears ungroomed, do **not** proceed silently. Ask for explicit consent:

> `<feature-id>` has not been groomed — no cards are linked to it and its Notes are empty. Grooming first (`/groom-feature <filename>`) would pull in relevant backlog cards and spin up the stories this rollout needs.
>
> Start implementation anyway, with an empty scope? (yes / groom first)

Wait for a clear answer. Proceed only on explicit consent; if the user chooses to groom first, invoke `groom-feature` with the filename and stop.

## Step 2 — Pre-flight: clean tree on main

Run `git status --short` and `git branch --show-current`.

- **Uncommitted changes** — do not ask to commit them (per `.claude/rules/git.md`, nothing is ever committed to `main`, and grooming typically happens there). List the affected files and tell the user they will carry onto the new branch — `git checkout -b` preserves working-tree changes, so this is safe. They land in the branch's first commit via Step 6's `stage-and-commit`.
- **Not on `main`** — tell the user which branch is checked out and ask whether to switch to `main` first. A feature branch must fork from `main`, not from another feature. Do not switch without confirmation, since the current branch may hold unmerged work. Switching carries any uncommitted changes with it as long as they don't conflict with `main`'s versions of the same files; if the switch fails due to conflicts, stop and report it rather than discarding anything.

Once `main` is checked out, run `git pull` so the new branch starts from current `main`. If the pull fails (no remote, network down, conflicts), report the failure and ask whether to branch from local `main` anyway.

## Step 3 — Cut the branch

The branch name **is** the feature card's `id` — this is how every other skill resolves the active feature, so it must match exactly.

```
git checkout -b <feature-id>
```

If a branch of that name already exists, stop and report it — do not reuse or force it. Ask the user whether they meant to resume that branch (`git checkout <feature-id>`) instead.

## Step 4 — Move the feature card to In Progress

```
node scripts/move-feature.mjs <filename> <source-lane> in-progress
```

## Step 5 — Sweep linked cards into Planned

Glob every lane for cards carrying `metadata.feature: '<feature-id>'`. For each one currently in `backlog`:

```
node scripts/move-feature.mjs <filename> backlog planned
```

Cards already in `planned`, `groomed`, or `in-progress` stay where they are — never move a card backwards. Cards in `done` or `abandoned` are left alone.

This sweep is why a backlog-stage feature only _links_ its children without moving them: the move is deferred to the moment the branch is cut, so Planned always reflects the active rollout and nothing else.

## Step 6 — Confirm

1. Run `npx prettier . --write`.
2. Invoke `stage-and-commit` so the branch starts with the board state committed. The feature checklist refresh in that skill will populate the card's Stories and Tickets sections for the first time.
3. Report:
   - The branch that was created.
   - The feature card's new lane.
   - How many cards were swept into Planned, by filename.
   - The next step: `/groom-story <filename>` to spec the first card, or `/groom-feature` if the scope still needs filling out.

## Rules

- The branch name must exactly match the feature card's `id`. Every other skill resolves the active feature by comparing the branch name to card ids — a mismatch silently breaks all auto-linking.
- Do **not** branch from anything but `main` without explicit user confirmation.
- Do **not** proceed past Step 1 on an ungroomed feature without explicit consent.
- Do **not** start implementing any story or ticket here. This skill sets up the branch and stops.
- Do **not** move cards backwards through the grooming lanes during the sweep (e.g. `groomed` → `planned`). The one sanctioned backwards move is reopening a `done` card into `in-progress` to fix a bug found in completed work, which is `implement-story`'s job, not this skill's — the sweep leaves `done` cards alone.
- Always use `node scripts/move-feature.mjs <filename> <from-lane> <to-lane>` for file moves — never direct copy/move/delete commands.
