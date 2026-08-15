---
name: create-feature
description: Captures a branch-level rollout as a feature card in .kanban/boards/features/backlog/ with the "feature" category label. Checks for conflicts with existing feature cards before writing. USE FOR: starting a new release push; naming the rollout that a batch of stories and tickets will belong to; recording a future feature before any work begins.
---

# Create Feature

You are capturing a **feature** — a branch-level rollout, the unit that ships. A feature is the parent of many stories and tickets; it is not itself a unit of work.

This is a low-ceremony step. The goal is to name the rollout and state its intent, not to decide its contents — that happens in `groom-feature`.

**If the request is a single unit of work**, this is the wrong skill. A UX story, an enhancement, or an idea goes to `/create-story`; a bug goes to `/create-ticket`. Signals that you are looking at a feature rather than a story: it will span a whole branch, it names a theme rather than a change ("new user experience polish", "the LLM assistant"), or the user talks about what "ships" or "merges" when describing it.

## Steps

1. **Collect the intent.** If the user has not already described the rollout, ask for one or two sentences on what it delivers — what a user gets when the branch merges.

2. **Check for conflicts.** Glob every lane under `.kanban/boards/features/` and read the frontmatter of each card whose `labels` contain `feature`. If an existing feature covers the same ground:
   - Present the conflicting feature(s) by name, lane, and goal.
   - Ask the user: fold this into the existing feature, or create a new one anyway?
   - If folding: append the new intent to the existing feature's `## Notes`, then stop.

3. **Assign priority.** Ask the user: _"What priority is this feature — high, medium, or low?"_ On a feature card, priority orders this rollout against other planned rollouts; the stories inside it keep their own priorities. Wait for their answer before writing the file.

4. **Write the card.** Derive a kebab-case slug from the feature name — **this slug becomes the git branch name**, so keep it short, descriptive, and free of redundant words (`new-user-experience-polish`, not `the-new-user-experience-polish-feature`). Write to `.kanban/boards/features/backlog/<slug>.md`:

```markdown
---
version: 1
id: '<slug>'
boardId: 'features'
status: 'backlog'
priority: '<high | medium | low>'
assignee: null
dueDate: null
created: '<current UTC time in ISO 8601 format>'
modified: '<current UTC time in ISO 8601 format>'
completedAt: null
labels: ['feature']
attachments: []
order: 'a0'
---

# <Feature Title>

## Goal

<Release-level statement of the rollout's intent — what a user gets when this branch merges. One short paragraph, no implementation detail.>

## Stories

## Tickets

## Notes

<Any scoping thoughts, constraints, or candidate work the user mentioned. Leave blank if none.>
```

The **Stories** and **Tickets** sections start empty — they are a derived view, populated by `stage-and-commit` as cards are linked to this feature. Keep both headings even while empty so the card's shape stays stable.

5. **Run Prettier.** Run `npx prettier . --write` to format the new card.

6. **Confirm.** Tell the user the feature card was created at `.kanban/boards/features/backlog/<slug>.md`, and that the branch will be named `<slug>` when implementation starts. Suggest running `/groom-feature <slug>.md` to scope it — pulling in existing backlog cards and spinning up new stories.

## Rules

- The card must carry exactly one label: `feature`. Never combine it with a story-tier or ticket-tier category.
- Do **not** write a `**Priority:**` line in the markdown body — priority lives in YAML frontmatter only.
- Do **not** hand-populate the Stories or Tickets checklists. Membership comes from child cards carrying `metadata.feature`, and the lists are regenerated automatically.
- Do **not** write tasks, phases, or implementation details onto a feature card. Features are not implemented directly — their stories and tickets are.
- Do **not** create the git branch here. That is `implement-feature`'s job.
- Do **not** modify any code.
