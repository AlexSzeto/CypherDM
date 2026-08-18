---
name: create-user-story
description: Develops a user story artifact in docs/user-stories/ from a user-supplied narrative, via a one-question-at-a-time grooming dialogue that resolves every gap between the narrative and docs/cypher-system-design-spec.md. Writes the story document and amends the design spec where the story contradicts it. USE FOR: turning a described user scenario into a foundational design document; capturing "what the app must do" before any feature cards exist; establishing UI conventions from a known use case.
---

# Create User Story

You are building a **foundational design document** — an artifact of _what_ the app must do, not _how_ it will be built. It describes interactions required of the application. Implementation details belong in kanban story cards, which come later.

This skill operates **outside the kanban system**. Do not create cards, do not write YAML frontmatter, and do not commit — the user handles commits manually.

## What a user story artifact is for

The user stories collectively define the practical UI design against known use cases. They are written **before** feature cards, and the feature cards are extracted _from_ them. A story is complete when a cold agent could read it and know every screen, field, and interaction the flow requires without asking the user anything.

## Steps

### 1. Ground yourself before asking anything

Read, in this order:

1. `docs/cypher-system-design-spec.md` — the functional design spec.
2. Every existing file in `docs/user-stories/` — for established conventions and decisions you must not contradict.
3. The relevant `.claude/rules/*.md` files — `client.md` especially, since UI stories routinely collide with it.

Do not skip this. Most of the value you add is spotting where the narrative conflicts with something already written down.

### 2. Take the narrative

The user describes the story in prose, usually first-person ("I, as a player, open…"). If they have not provided one, ask for it before doing anything else.

### 3. Build the question list

Read the narrative against the design spec and existing stories. Produce an ordered list of every gap, in these bands:

| Band              | Covers                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------- |
| **A — Structure** | Page/route architecture, modes and layouts, navigation, persistence of app-level state |
| **B — Fields**    | Data the flow touches that the spec omits, contradicts, or leaves ambiguous            |
| **C — Layout**    | Section order, tab/screen naming, responsive behaviour                                 |
| **D — Mechanics** | Save/persistence semantics, list operations, error and failure states                  |

Structure first, because structural answers invalidate later questions. Fields before layout, because you cannot order what you have not enumerated.

Present the full list once, up front, so the user can see the shape of the round. Then work it one question at a time.

### 4. Ask one question at a time

**This is the core of the skill.** Ask a single question, wait for the answer, then ask the next. Do not batch. The user's answers routinely reshape later questions, and batching wastes them.

Every question must include:

- **Labelled options** — `(a)`, `(b)`, `(c)` — where the choice is bounded.
- **A recommendation, with the reasoning that produced it.** Not a preference; an argument.
- **The cost of your recommendation**, stated honestly.

**Argue a position rather than collecting answers.** The most valuable moments in this dialogue are where you push back — where you tell the user their two answers conflict, or that a decision they are leaning toward has a cost they have not seen. A skill run that merely transcribes preferences has failed. If the user asks for your opinion on a tradeoff, give a structured pros/cons with a clear pick and a justification, not a neutral survey.

**Surface contradictions the moment you see one:**

- Between the narrative and the design spec.
- Between the narrative and an earlier answer in the same session.
- Between an answer and a project rule in `.claude/rules/`.
- Between two answers given minutes apart — users flip-flop mid-narrative, and it is your job to notice.

When an answer contradicts a project rule, say so explicitly and record it as a rule amendment. Do not silently follow the new instruction.

**Reverse yourself when the user's reasoning is better.** If they raise a consideration that defeats your recommendation, say so plainly, revise the decision, and note the revision in the artifact. Recorded reversals are more useful than clean-looking decisions.

### 5. Verify claims against the codebase

Before asserting that a component exists, lacks a capability, or needs to be built — **read it**. Before proposing icon names, grep the actual icon map. Before claiming a pattern is unimplemented, glob for it.

A question grounded in the real code is worth several speculative ones, and a confident wrong claim about existing code costs the user real trust.

### 6. Be honest about domain knowledge

The user may ask directly what you know about the Cypher System. Answer with calibration, not hedging:

- State what you are **confident** about (core resolution mechanics, pools, Effort, damage track, cyphers, XP economy).
- State what is **unreliable** (specific descriptor/type/focus ability lists, exact numbers, edition differences between 1e / revised / genre books).
- Note that the **starter set is a curated subset**, so even correct full-system knowledge may not match what is printed in the user's box.

Where a rules detail is load-bearing, ask the user to check their physical materials rather than relying on your recall. Real knowledge applied at the right moment is valuable — a rules insight reframed one of the questions in the founding session and produced a better answer than either option originally offered. But never present recall as authoritative.

### 7. Write the artifact

Write to `docs/user-stories/<kebab-case-slug>.md`. **No frontmatter.** Use exactly these seven sections:

```markdown
# <Story Title>

## 1. Persona & Context

Who, device, environment, prior state, frequency of the flow.

## 2. Narrative

The user's prose, lightly cleaned. Reconcile any contradictions that the
dialogue resolved — the narrative must not contradict the decisions below it.

## 3. Screens & Elements

Every UI surface the flow touches, walked in order. Tables for element
inventories; explicit field order for any form.

## 4. Data Touched

Fields written, fields read but not written, fields this story **adds** to the
design spec, and fields this story **changes** in the design spec.

## 5. Design Decisions

Every answer from the dialogue, each with its rationale. Record rejected
alternatives and why they lost. Record reversals. Record accepted risks.
This is the load-bearing section — it exists to stop the same debate
recurring in three weeks.

## 6. Conventions Established / Rules Amended

> **Transient section.** Delete once extracted into feature cards.

Project-rule changes this story forces, and component work it implies.

## 7. Dependencies & Deferred

> **Transient section.** Delete once extracted into feature cards.

What this story needs from elsewhere, and what it explicitly hands off to
other stories.
```

Sections 6 and 7 are **transient scaffolding**. Mark them as such inline with the blockquote shown. Once their contents are extracted into feature cards, they are deleted, leaving the document as a pure record of _what_ rather than _how_.

### 8. Amend the design spec

Update `docs/cypher-system-design-spec.md` where this story contradicts it.

**Constraints:**

- **Never add new sections.** Modify existing ones only.
- **Only touch what the story directly contradicts.** Prose that is merely incomplete stays as it is.
- Data-contract sections (`§3.1 Character Object`) are the exception worth arguing: implementation follows them literally, so a field the story proves is required may be added as a terse bullet inside the existing list. Flag any such addition to the user explicitly so they can trim it.
- State clearly what you changed, what you added, and what you deliberately left alone.

### 9. Report

Tell the user:

- Where the artifact was written.
- Anything you resolved on their behalf while writing (narrative contradictions you reconciled, assumptions you made).
- The two or three items most likely to bite during implementation — recorded risks, hard prerequisites, unbudgeted complexity.
- What spec edits you made and which you judged out of scope.

Do **not** commit. Remind the user that the files are uncommitted and, if the current branch is `main`, that `.claude/rules/git.md` requires a feature branch before committing.

## Rules

- **One question at a time.** Never batch questions after the initial overview list.
- **Every question carries a recommendation and its reasoning.** Never present bare options.
- **Never invent rules-system facts.** Ask for a rulebook reference when a detail is load-bearing and your recall is uncertain.
- **Never silently follow an instruction that contradicts a project rule.** Name the conflict, then record it as an amendment.
- **Do not modify any code.** This skill produces documentation only. Component work it identifies is recorded in section 6 for later extraction.
- **Do not create kanban cards** and do not write frontmatter. This skill sits outside the board.
- **Do not commit.** The user commits manually.
- Run `npx prettier . --write` after writing the artifact and spec edits.
