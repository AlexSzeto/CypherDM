---
name: complete-story
description: "Closes out a finished story or ticket by verifying every tracked checkbox on its card is complete, then moving the card from the in-progress lane to done and refreshing its parent feature's checklist. USE FOR: marking a story or ticket done after its last phase lands; moving a card to the Done lane; confirming a card is actually finished before archiving the feature."
---

# Complete Story

Move a finished **story or ticket** from `in-progress` to `done`, after verifying the card is genuinely complete.

This is the sanctioned way to make the In Progress → Done move. `implement-story` deliberately stops short of it, and `archive-feature` refuses to run while any child is outside `done` — this skill is the step between them.

## Invocation

The user supplies a card title or `id`, the same way as every other lane skill (`/complete-story gm-party-table.md`, `/complete-story gm-party-table`, or `/complete-story GM Party Table`).

Resolve it by globbing `.kanban/boards/features/in-progress/*.md` and matching, in order:

1. Exact filename or basename match against the argument.
2. `id` frontmatter field match.
3. Case-insensitive match of the card's `# ` heading against the argument.

If **no argument** was given, list the cards in `in-progress/` and ask which one to complete. If the argument matches **more than one** card, list the matches and ask.

If the card is not in `in-progress/`:

- **Already in `done/`** — report that it is already complete and stop. Do not re-move it.
- **In `groomed/` or `planned/`** — the card never entered implementation. Stop and say so; ask whether they meant to run `/implement-story <filename>` first.
- **Nowhere on the board** — report that no matching card exists, and list the `in-progress/` cards.

## Guard — this skill never completes a feature card

If the resolved card's `labels` contain `feature`, **stop**. Feature cards never move to `done`: they stay `in-progress` for the whole life of the branch and are deleted by `archive-feature` when the summary is written. Tell the user this and point them at `/archive-feature`.

## Step 1 — Verify the card is complete

Read the card in full and scan every tracked checkbox — the per-phase `Complete initial implementation` boxes and any sibling fix checkboxes beside them. Nested task bullets carry no checkboxes and are not counted.

The card passes only when **every** tracked checkbox is `[x]`.

If any checkbox is `[ ]` or `[/]`, **do not move the card**. Report them grouped by phase:

> `gm-party-table.md` is not complete:
>
> - Phase 3 — Live sync: `[/]` Complete initial implementation
> - Phase 4 — Empty states: `[ ]` Complete initial implementation
>
> Finish these with `/implement-story gm-party-table.md`, or tell me to complete the card anyway.

A `[/]` box most often means the work landed but was never committed — `stage-and-commit` is what flips `[/]` → `[x]`. Say so when you see one, and offer to run `/stage-and-commit` first.

The user may override and complete the card anyway; that is their call. If they do, record why in the card's `## Notes` (create the section if absent) before moving it — e.g. `Phase 4 descoped at completion: empty states deferred to a follow-up card.` — so `archive-feature` picks it up as deferred work rather than losing it.

## Step 2 — Check for uncommitted work

Run `git status --short`.

If anything outside `.kanban/` is modified, ask whether to commit first:

> There are uncommitted changes in [files]. Commit them before completing the card? (yes / no)

- **Yes** — invoke `stage-and-commit`, wait for it to finish, then re-read the card (its checkboxes may have just flipped to `[x]`) and re-run Step 1.
- **No** — proceed; the lane move will be committed alongside whatever else is pending.

Changes confined to `.kanban/` need no prompt.

## Step 3 — Move the card

```
node scripts/move-feature.mjs <filename> in-progress done
```

The script updates `status`, `modified`, and `order`. It does **not** set `completedAt` — edit the moved card at `.kanban/boards/features/done/<filename>` and set:

```yaml
completedAt: '<ISO 8601 UTC timestamp — now>'
```

Leave the rest of the frontmatter and the entire body untouched. A completed card is a record; do not tidy, summarize, or prune it. `archive-feature` is what distills it later.

## Step 4 — Refresh the parent feature checklist

Read the card's `metadata.feature`. If it is absent, skip this step — the card is unaffiliated, which is legitimate.

Otherwise find the feature card whose `id` matches (check `in-progress/` first, then the other lanes) and regenerate its `## Stories` and `## Tickets` sections using the same procedure as `stage-and-commit` Step 6:

1. Glob every lane and collect cards whose `metadata.feature` equals the feature's `id`.
2. Cards labeled `story`, `polish`, or `idea` go under **Stories**; `blocker` or `defect` go under **Tickets**.
3. A card is `[x]` iff its lane is `done`.
4. Preserve any existing checklist entry whose file no longer exists in any lane — it was archived; keep it `[x]`.
5. Write each entry as `- [<state>] \`<filename>.md\` — <Card Title>`, checked entries first.
6. Keep an empty section's heading; omit only its body.

Leave the feature card's `## Goal` and `## Notes` alone.

If no feature card matches, skip silently.

## Step 5 — Commit

Invoke `stage-and-commit` so the lane move and the checklist refresh land together. A reasonable message is `complete <card-title>`.

## Step 6 — Report

Output:

- The card that moved, and its new path.
- The parent feature's tally after the refresh — e.g. _"`gm-party-table` feature: 4 of 7 stories done, 1 of 2 tickets done."_
- **If every child of the feature is now `done`**, say so and suggest `/archive-feature` as the next step.
- Anything recorded under `## Notes` as an override in Step 1.

## Rules

- **Only on explicit user invocation.** Do not call this skill automatically at the end of an `implement-story` run, and do not chain into it after a commit. Declaring work finished is the user's judgement call; this skill is the mechanism, not the trigger.
- **Never move a feature card to `done`.**
- **Never move a card backwards.** Reopening a `done` card is `implement-story`'s job.
- **Never edit the card body** beyond the Step 1 override note.
- **Never open a pull request or archive the feature** — that is `archive-feature`.
