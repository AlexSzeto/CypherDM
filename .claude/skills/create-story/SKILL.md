---
name: create-story
description: Captures a freeform story idea as a card in .kanban/boards/features/ with status "backlog" or "planned" (user's choice). Checks for conflicts with existing backlog, planned, and groomed cards before writing, and auto-links the card to the active feature when it lands in Planned. USE FOR: capturing a new idea quickly; breaking down a brainstorm document into individual story files; preserving an idea that surfaced during grooming of another card.
---

# Create Story

You are capturing a story idea into `.kanban/boards/features/`. This is a low-ceremony step — the goal is to get the idea recorded, not to fully specify it. Full grooming happens later via `groom-story`.

A **story** is a single unit of work (a UX story, an enhancement, an idea). It is not a feature — features are branch-level rollouts created by `create-feature`. If the user describes a whole rollout ("the new user experience push", "the LLM assistant"), tell them to use `/create-feature` instead.

## Steps

1. **Collect the idea.** If the user has not already described the story, ask for a one-sentence description of what they want to build.

2. **Check for conflicts.** Glob `.kanban/boards/features/backlog/*.md`, `.kanban/boards/features/planned/*.md`, and `.kanban/boards/features/groomed/*.md` and read the YAML frontmatter + `## Goal` section of each file. If any existing card covers the same or overlapping ground:
   - Present the conflicting file(s) by name and goal.
   - Ask the user: merge into the existing file, or create a new one anyway?
   - If merging: append the new idea to the existing file under a clearly labelled section, then stop.

3. **Resolve the active feature.** Run `git branch --show-current` and look for a card whose `id` matches the branch name and whose `labels` contain `feature` — check `.kanban/boards/features/in-progress/` first, then the other lanes. Record the id if found. If no feature card matches the branch, there is no active feature and linking is skipped.

4. **Assign priority, category, and lane.** Ask the user (one message, all three questions): _"What priority is this story — high, medium, or low? Which category — `story` (substantial unit of work), `polish` (small usability/visual win), `idea` (uncommitted brainstorm), `blocker` (breaking bug), or `defect` (non-breaking bug)? And should it go to the **Backlog** or **Planned** lane?"_ Suggest `idea` as the default category when the request reads like a brainstorm, and Backlog as the default lane. If an active feature was found in step 3, mention it: _"Planned will link it to the active feature `<feature-id>`."_ Wait for their answer before writing the file.

5. **Write the card.** If creating a new file:
   - Derive a kebab-case slug from the story name (e.g. `character-sheet-stat-pools`).
   - Write to `.kanban/boards/features/<lane>/<slug>.md` (where `<lane>` is `backlog` or `planned`, per the user's choice) with YAML frontmatter followed by the markdown body — the `status` field must match the chosen lane:

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
  feature: '<active-feature-id>'
---

# <Story Title>

## Goal

<One to three sentences describing the desired outcome. No implementation details.>

## Notes

<Any rough ideas, constraints, or open questions the user mentioned. Leave blank if none.>
```

**Feature linking:** include the `metadata` block **only** when the card is written to `planned` _and_ an active feature was resolved in step 3. Omit the entire `metadata` key otherwise — a backlog card is unaffiliated until a feature adopts it.

6. **Run Prettier.** Run `npx prettier . --write` to format the new card.

7. **Confirm.** Tell the user the card was created at `.kanban/boards/features/<lane>/<slug>.md`, note the feature link if one was applied, and suggest running `/groom-story <slug>.md` when they are ready to develop a full spec.

## Rules

- Do **not** write a `**Priority:**` line in the markdown body — priority lives in YAML frontmatter only.
- Every card must carry exactly one category label in `labels`. The registry lives in `.kanban.json`; do not invent new category names. Never assign `feature` — that label belongs to feature cards only.
- Use `metadata.feature`, never a bare top-level `feature:` field. Kanban Lite strips unknown top-level frontmatter keys when the board rewrites a card.
- Do **not** write tasks, implementation details, or technical specs into a `backlog` card — that is the job of `groom-story`.
- Do **not** create a backlog card for an idea that should go straight to grooming. If the user has a well-formed spec already in hand, tell them to use `groom-story` directly.
- Do **not** modify any code.
