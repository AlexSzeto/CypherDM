---
name: groom-feature
description: Scopes a branch-level rollout through interactive Q&A — adopts strays from Planned, scans the backlog for candidates, discusses intent, then pulls agreed cards in and spins up new story cards. Re-runnable at any stage. USE FOR: deciding what belongs in a release; filling out a blank-slate feature; re-scoping a rollout mid-branch.
---

# Groom Feature

You are scoping a **feature** — a branch-level rollout — by deciding which stories and tickets belong to it. You are not writing an implementation spec: individual cards are specced later by `groom-story`.

This skill is **re-runnable**. Run it to fill out a new feature, and run it again mid-branch whenever the scope shifts.

## Inputs

- **A filename** from any lane (check `backlog/` first, then `in-progress/`, then the rest) — read that feature card first.
- **No argument** — Glob every lane for cards whose `labels` contain `feature`, and present them grouped by lane with their goals. Ask which feature to groom. If exactly one feature is `in-progress`, offer it as the default.

Read the feature card before doing anything else. Note its **stage**, which governs all card movement below:

- **Backlog-stage** — the feature card is in `backlog` (or `planned`). Nothing has been branched yet.
- **Active** — the feature card is in `in-progress`. Its branch is checked out and work is underway.

## Step 1 — Housekeeping: adopt strays

Runs once, at the start. This is the only board read before the discussion.

Glob `.kanban/boards/features/planned/*.md` and find cards with no `metadata.feature`. These are strays — cards a user dragged into Planned by hand, which the lane's semantics say belong to the active feature.

If any exist, list them (filename + one-line goal) and ask: _"These cards are sitting in Planned without a feature link. Adopt them into `<feature-id>`?"_ Let the user accept all, accept some, or decline.

For each adopted card, set `metadata.feature: '<feature-id>'` in its frontmatter. Note the adoptions — you will mention them in the context brief.

Do **not** move these cards. They are already in Planned; adoption is a link, not a move.

## Step 2 — Backlog scan

Glob `.kanban/boards/features/backlog/*.md` and read each card's frontmatter and `## Goal`. Identify the ones plausibly within this feature's remit, judging by the feature's Goal and Notes.

This step matters most for a blank-slate feature, where the backlog is the entire raw material for the rollout. Do not present the list yet — carry it into the discussion and raise candidates as they become relevant.

## Step 3 — Context brief

Before asking anything, summarize the current state in a few lines so the discussion starts grounded:

- **Goal** — the feature card's stated intent.
- **Progress** — current checklist state (`N of M stories done`, `N of M tickets done`), or "nothing linked yet" for a blank slate.
- **Current scope** — the cards already linked, grouped as stories and tickets, with their lanes.
- **Just adopted** — any strays adopted in Step 1.
- **Candidates** — a short count teaser only (e.g. _"I found 7 backlog cards that may fit; I'll raise them as we go."_), not the full list.

## Step 4 — Grooming Q&A

Normal grooming dialogue: **one question at a time**, each building on the last answer.

Clarify the rollout's intent and boundaries — what a user should be able to do when this merges, what the release explicitly will not include, and what would make the feature feel unfinished if left out.

As topics arise, be proactive:

- **Surface candidates.** When the discussion touches an area a backlog card already covers, name that card and ask whether it belongs in this feature. Do not dump the whole candidate list at once — raise cards where they are relevant.
- **Propose new stories.** When the discussion reveals work that no card covers, say so and propose a story: a title and a one-line goal. Get agreement, then note it for Step 5. Do not write the card mid-discussion.
- **Every story must end at a user-visible change.** A story is a unit that ships something a user can see or do differently — not a layer (schema, repository, migration script) with no observable effect on its own. Before proposing a story, check that it concludes with something a user could notice: a new UI, a new choice, a fixed behavior, a visibly different result. A pure data-model or backend-plumbing slice with no UI or behavior change is not a story by itself — fold it into the story that surfaces it, even if that makes the surfacing story larger. It is fine for one story to carry a large invisible foundation as long as it ends visibly; it is not fine to split the foundation off as its own card.
- **Push back on scope.** If the feature is growing past what a single branch should carry, say so and propose what to defer. Deferred items are recorded in Notes, not silently dropped.
- **Investigate before asking.** When unsure how something currently works, search the codebase and report findings rather than asking the user.

Keep the discussion at feature altitude. If the user starts specifying _how_ a story should work, note it in that story's Notes and steer back — that detail belongs in `groom-story`.

Continue until the scope is settled and the user has confirmed it.

## Step 5 — Housekeeping: apply changes

All card creation and movement happens here, batched, after the scope is confirmed. Behavior depends on the stage recorded at the start.

### Backlog-stage feature

Nothing moves lanes. The feature is not branched, so Planned must stay reserved for the active feature's scope.

- **Existing cards** agreed into the feature: set `metadata.feature: '<feature-id>'` in place, leaving them in `backlog`.
- **New stories** proposed during discussion: create in `.kanban/boards/features/backlog/` with `metadata.feature` set.

### Active (in-progress) feature

- **Existing backlog cards** agreed into the feature: set `metadata.feature`, then move each with `node scripts/move-feature.mjs <filename> backlog planned`.
- **New stories** proposed during discussion: create directly in `.kanban/boards/features/planned/` with `metadata.feature` set.
- Cards already in `planned`, `groomed`, or `in-progress` stay where they are — never move a card backwards.

### New card format (both stages)

New cards are **capture-quality**, not specs — the same shape `create-story` produces. Each gets a full spec later via `groom-story`.

```markdown
---
version: 1
id: '<slug>'
boardId: 'features'
status: '<backlog | planned>'
priority: '<high | medium | low>'
assignee: null
dueDate: null
created: '<current UTC time in ISO 8601 format>'
modified: '<current UTC time in ISO 8601 format>'
completedAt: null
labels: ['<story | polish | idea | blocker | defect>']
attachments: []
order: 'a0'
metadata:
  feature: '<feature-id>'
---

# <Story Title>

## Goal

<One to three sentences from the discussion. No implementation details.>

## Notes

<Anything the discussion established about this card — constraints, dependencies, open questions.>
```

### Update the feature card

Rewrite the feature card's `## Goal` if the discussion sharpened it, and append to `## Notes`:

- Scoping decisions and their rationale.
- Deferred or descoped items, with why.
- Anything the discussion settled that a future reader would otherwise have to re-derive.

Leave `## Stories` and `## Tickets` alone — those are derived and regenerated by `stage-and-commit`.

### Finish

1. Run `npx prettier . --write`.
2. Report what changed: cards adopted, cards linked, cards moved, new cards created (by filename), and how the feature card was updated.
3. Suggest the next step — `/implement-feature <slug>.md` for a backlog-stage feature that is ready to branch, or `/groom-story <filename>` for a specific card on an active feature.

## Rules

- Do **not** move any card during Steps 1–4. All movement is batched into Step 5.
- Do **not** move cards at all for a backlog-stage feature — only set links.
- Do **not** reassign a card that already carries a different `metadata.feature`. Surface the conflict to the user and let them decide.
- Do **not** move a card backwards (e.g. `groomed` → `planned`).
- Use `metadata.feature`, never a bare top-level `feature:` field. Kanban Lite strips unknown top-level frontmatter keys when the board rewrites a card.
- Do **not** write full specs, tasks, or phases onto the new cards — that is `groom-story`'s job.
- Do **not** scope a story that ends at a backend-only or data-model-only milestone with no user-visible result. Every story must conclude with something a user can see or do differently; fold invisible groundwork into the story that surfaces it.
- Never assign the `feature` label to a child card.
- Always use `node scripts/move-feature.mjs <filename> <from-lane> <to-lane>` for file moves — never direct copy/move/delete commands.
- Do **not** modify any code.
