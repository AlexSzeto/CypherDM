# Cypher System Web Companion - Phase 1 Implementation Specification

## 1. Purpose of This Document

The functional design specification describes _what the application is_. The three user stories in `docs/user-stories/` describe _what it is like to use_. This document sits between them and describes _what the first phase of implementation delivers_ - the scope of work that takes the project from scaffolding to a companion app that can run a real session at a real table.

It is deliberately written above the level of individual screens, fields, and controls. Those details live in the user stories, and the work needed to build them lives in the feature cards on the board. This document exists so that anyone - a new contributor, or the same contributor six months later - can understand the shape of the phase without reading nineteen cards.

## 2. What Phase 1 Delivers

At the end of phase 1, a small group can play a Cypher System session with the app in place of paper character sheets.

A player can transcribe a finished character into the app, keep it open on their own device throughout a session, and use it as the record of everything that changes during play. A Game Master can watch the whole party from one screen, reach into any character to correct or reward, run a fight with creatures and initiative, and push intrusions at the table. Both sides see each other's changes as they happen.

The application is a **character sheet that saves itself**, not a rules engine. It presents rules text for reference; it does not resolve rules. It never rolls dice. Where a value depends on situational judgement, it records the number the player gives it rather than calculating one. This constraint is the primary tool for deciding what does _not_ get built.

## 3. Scope

Phase 1 covers the three written user stories in full:

| Story                           | Covers                                                                                              |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Player creating a character** | Transcribing a finished character into the app and having it persist                                |
| **Player playing a session**    | The in-play sheet, spending and recovering points, inventory, cyphers, and end-of-session levelling |
| **GM running a session**        | The party dashboard, encounters, initiative, intrusions, and full write access to player sheets     |

Everything those stories mark as deferred is out of scope. Section 7 lists the significant exclusions.

## 4. Capability Areas

The work divides into seven areas. They are described here as capabilities, not as screens.

### 4.1 The character record and its write model

A character is a single server-held record covering identity, pools, skills, abilities, equipment, cyphers, and notes. It saves itself continuously - there are no save or revert controls anywhere on a character sheet - and it survives restarts.

Because the GM writes into player sheets and players occasionally write into each other's, the application assumes **concurrent writers as the normal case**. Writes are therefore small and targeted rather than whole-record, they record who made them, and the few operations that touch two records at once are handled as single indivisible actions. A device that loses the network keeps working and replays its changes in order when it returns. Every surface carries a persistent indicator of whether saving is actually working, because a stale reassurance is worse than a visible failure.

### 4.2 Navigation and identity

The application has one navigation hub. From it a participant reaches an existing character, creates a new one, or enters GM mode. There are no accounts and no authentication; the deployment is trusted and local.

Identity is instead modelled as a **seat**. A device that opens a character holds that character until it goes back to the hub, and holding the seat is what makes the character appear connected to the GM. A character cannot be held by two devices at once. Because participants own their devices and return to the same character every session, the application remembers where a device was and takes it back there automatically.

### 4.3 The character sheet

One sheet with two modes over the same information, organised identically in both:

- an **edit mode**, where everything is a form field, used for transcription at the start and for levelling at the end of a session; and
- a **play mode**, condensed for reading at a glance, where only the handful of values that genuinely move during play can be touched.

Switching between them should feel like the fields waking up rather than like a different application. The two modes share section components and differ only in what those sections afford.

### 4.4 Playing the character

During a session the sheet supports the small set of things that actually happen dozens of times an hour: moving points in and out of pools, spending points on Effort and on special abilities, gaining and spending experience, marking off recovery, and managing what the character carries.

Two behaviours characterise the whole area. First, every change is confirmed explicitly and commits as a **single net result**, so a large hit is one recorded event rather than a stream of them. Second, where the application can help with arithmetic it **shows the working** - it offers a starting figure and displays how it arrived at it, so the player can see what was not accounted for and adjust before confirming. Where it cannot show its working, it does not assist at all: advancement records that a step was taken and changes nothing else, because a partial automation with nowhere to explain itself teaches the player something false.

### 4.5 The GM dashboard

A single screen showing every character admitted to the session, one row each, reading live from the character records. It carries the values that move during play and deliberately omits anything the GM can read off a rulebook behind their screen.

From it the GM can reach into any character's sheet and change anything on it, using the same controls the player uses rather than a separate administrative interface. The roster fills itself as devices connect and persists between sessions; removing someone is deliberate and slightly buried, because it is rare and the cost of an accident is high.

The dashboard is designed to remain complete and usable on a phone in portrait, on the reasoning that a GM whose laptop dies mid-session must be able to finish on whatever is in their pocket.

### 4.6 Running an encounter

During combat the dashboard becomes **an encounter table that tracks the character roster and doubles as an initiative tracker**, with creatures listed alongside the players. The GM can add creatures individually or in groups, rename them, track their health, and mark who has acted, round by round. Creatures exist only for the duration of the encounter.

Initiative is a request the GM sends and the players answer. The application does not roll, does not sort players against each other, and never shows a player a position in an order - the rules define no such position, and presenting one would teach the mechanic backwards. An encounter left running is simply still there next session, because the data is durable by design.

### 4.7 Table interactions

Three things travel between participants during play: **intrusions**, which the GM pushes at one player or the whole table and each player resolves individually; **items**, which players hand to each other and the GM hands to anyone; and **notifications**, which report what just happened to the party who did not do it.

Notifications report at the highest level that makes sense - a single meaningful event rather than the several small changes that implement it - and are suppressed entirely where they would be noise. Anything the GM initiates can be set aside temporarily, but leaves a persistent reminder until it is resolved, so a request cannot be silently lost by a player who wanted to check something first.

## 5. Cross-Cutting Foundations

Four things are built once and depended on everywhere. Getting them wrong is expensive to correct later, which is why they are front-loaded in the rollout.

- **A shared interaction vocabulary.** The character sheet and the dashboard are built months apart but must feel like one application, so their common controls - the way numbers are displayed, the way a number is changed, the way explanatory text is surfaced - are built once and shared.
- **A single convention for what can be touched.** Whether a value is interactive is expressed visually and consistently, so it is something a participant reads rather than something they learn field by field.
- **Mobile-first, not mobile-tolerant.** Phone portrait is a supported environment for every surface in the application, including the GM's. Layouts that cannot fit make their overflow reachable rather than clipping it away.
- **Durable, versioned data.** Every persisted domain carries a schema and a migration path from the beginning, so the shape of stored data can change without losing what a group has already recorded.

## 6. Rollout

Phase 1 is nineteen features, each a branch that ships something checkable. The dependency chain is close to linear, so the order below is the build order; the cards on the board carry the individual dependencies.

| Wave                    | Features                                                                                                          | Reaches                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Foundations**         | Character data and sync · App shell and home page · Shared UI vocabulary · Layout preview page                    | Layouts verifiable on real devices; nothing playable yet |
| **Transcription**       | Character editor overview · Character editor lists                                                                | A character can be entered and persists                  |
| **Live**                | Live sync and notifications                                                                                       | Every surface updates itself from here on                |
| **Play**                | Play mode overview · Effort and ability use · Play mode equipment · Play mode cyphers · Edit mode and advancement | A player can run a whole session on their own device     |
| **Game Master**         | GM domain and page shell · GM party table · GM character sheet view                                               | A GM can watch the party and reach into any sheet        |
| **Session interaction** | Encounter and creatures · Initiative loop · GM intrusions                                                         | A full combat, initiative, and intrusions all work       |
| **Completion**          | Event log and session shakedown                                                                                   | Run at a real table; open questions settled from use     |

A **layout preview page** is deliberately built early, before any of the layouts it renders are wired to live data. The layouts most expensive to get wrong - the encounter table, the character overview, and the control used to change a number - can then be checked and corrected on real hardware while correcting them is still cheap. It is built from the real components rather than mocked, so it is also a head start on two later features, and it is kept afterwards as a component gallery.

The final feature is as much a **shakedown as a build**: several decisions were deliberately held open until there was something to use, and they are settled from real play rather than from argument.

## 7. Out of Scope for Phase 1

Excluded deliberately, each with a reason recorded in the user stories:

- **Portrait images** for characters, and any built-in reference data for descriptors, types, or foci.
- **A creature bestiary** or any reuse of previously-entered creatures.
- **Temporary conditions** beyond those derived from the damage track.
- **Player-visible initiative order** - withheld on rules grounds rather than merely unbuilt.
- **A persisted history** of session events.
- **Any mechanical automation of advancement**, which may not be added without first solving the problem that made it bookkeeping-only.
- **Death as an application state**; it is handled at the table.

## 8. How Phase 1 Is Judged Complete

Not by the nineteen branches merging, but by a session: a Game Master and at least two players, each on their own device, playing from start to finish - transcribing or loading characters, fighting an encounter with initiative and creatures, resolving intrusions, handing out loot, and levelling up at the end - without anyone reaching for paper to cover something the application could not do, and without losing data when a device wanders off the network.

## 9. Related Documents

| Document                            | Holds                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `docs/cypher-system-design-spec.md` | Functional requirements, data shapes, and rules text                        |
| `docs/user-stories/`                | The three narratives, screen detail, and the reasoning behind each decision |
| `.kanban/boards/features/`          | The nineteen feature cards and their dependencies                           |
| `.claude/rules/`                    | Conventions binding on implementation                                       |
