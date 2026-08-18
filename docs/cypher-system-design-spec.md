# Cypher System Web Companion - Functional Design Specification

## 1. Overview

This document outlines the functional requirements for a locally hosted, real-time web application to support gameplay for the Cypher System (Starter Rules). The application acts as a synchronized hub, providing an interactive character sheet for players and an overwatch/management dashboard for the Game Master (GM). The interface is tailored for new players, providing persistent tooltips and UI elements that surface the rules **text** for the mechanic at hand, so common lookups do not require reaching for the book mid-turn.

The application's purpose is to be **a digital character sheet that saves itself and is easy to edit** - replacing the erase-and-rewrite cycle of paper - rather than a rules engine. It presents rules text for reference; it does not perform rules **resolution**. Where a value depends on situational rules judgement, the app takes the player's number and records it instead of calculating one. This is the north star for pruning any UI that would require excessive rules knowledge to implement or to use.

## 2. Core Game Mechanics & UI Tooltips

Because the coding agent may lack full context of the ruleset, the UI must surface these mechanical rules directly. The following text/logic should be implemented as tooltips, modal popups, or persistent helper text near the relevant UI components.

- **Applying Effort:** "Applying one level of Effort lowers the difficulty of a task by one step. The first level of Effort costs 3 points from the relevant pool. Each additional level costs 2 points. _Always subtract your Edge in that stat from the total cost before spending points._"
- **Spending XP:** "Spend 1 Experience Point (XP) to reroll any d20 roll. You must take the new result." _(Note: Keep it simple for the starter set)._
- **Recovery Rolls:** "A recovery roll restores points to your stat pools. You heal 1d6 + your Recovery Bonus. You get four recovery rolls per day, taking increasing amounts of time: 1 Action, 10 Minutes, 1 Hour, 10 Hours."
- **Damage Track:**
  - _Hale:_ Normal state. No penalties.
  - _Impaired:_ "+1 Effort per level, ignore minor & major results, combat rolls of 17-20 deal only +1 damage." _(Triggered when 1 stat pool reaches 0)._
  - _Debilitated:_ "Can only move an immediate distance; if Speed Pool is 0, cannot move." _(Triggered when 2 stat pools reach 0. If all 3 reach 0, the character is Dead - handled at the table, not in the app)._
- **Abilities:** "Abilities cost points from your stat pools to activate. Subtract your Edge from the cost. **Actions** require your turn to use. **Enablers** happen automatically as part of another action and do not take up your turn." Some abilities are passive and are neither.
- **Skills:**
  - _Trained:_ "Reduces the difficulty of a task by 1 step."
  - _Specialized:_ "Reduces the difficulty of a task by 2 steps."
  - _Inability:_ "Increases the difficulty of a task by 1 step."

## 3. Data Requirements & State Management

The server must maintain a unified state for each character. Below are the required data properties.

### 3.1 Character Object

- **Identity:** `Name` (String), `Color` (identifies the character at a glance on the GM dashboard), `Descriptor`, `Type`, `Focus`.
- **Tier:** (Integer - defaults to 1).
- **Pools:** Three objects (Might, Speed, Intellect). Each contains:
  - `Max Value` (Integer)
  - `Current Value` (Integer)
  - `Edge` (Integer)
- **Effort:**
  - `Current Effort Limit` (Integer - maximum levels of effort applicable at once)
  - _UI state - assisted, not adjudicated:_ The app computes a **best-guess** cost from the three modifiers it can know - Edge, the worn armor's Speed Penalty (Speed Effort only), and the Impaired damage-track surcharge - and **displays the formula that produced it**: `Cost: 3 - [edge] (Edge) + [penalty] (Armor Penalty) + 1 (Impaired)`, each term rendering only when it applies.
  - The spend shortcut opens the standard adjustment modal with that cost **already applied**, so confirming without changes spends the estimate. The player adjusts up or down first when something the app cannot know applies - armor training, focus and cypher effects, temporary conditions.
  - The formula is what makes the estimate safe. It asserts no correct answer; it shows its scope, so the player can see what was not counted. Partial automation is permitted here **because** it can display its work - see the Advancement bullet for the case where it cannot.
- **Experience Points (XP):** `Total` (Integer).
- **Recovery Rolls:**
  - `Bonus` (Integer)
  - `Used Rolls` (Array of Booleans/Checkboxes: [Action, 10 Min, 1 Hour, 10 Hour])
- **Damage Track:** _Strictly Derived Value_.
  - If 0 pools = 0: Hale.
  - If 1 pool = 0: Impaired.
  - If 2 pools = 0: Debilitated.
  - If 3 pools = 0: Dead.

> **Naming rule:** "Descriptor" is reserved as the rules term for the character's Descriptor and is **not** used as an attribute name elsewhere. Free-text parentheticals on items are `description` - arbitrary strings that may contain commas, mirroring the printed sheet (`Leather jacket (light armor, gives 1 Armor)`).

- **Skills:** Array of objects.
  - `Name` (String)
  - `Proficiency` (Enum: Trained, Specialized, Inability - renamed from `Type`, which is a rules term reserved for the character's Type and for cyphers)
  - `Source` (String: Descriptor, Type, or Focus)
  - `Description/Label` (String)
  - _A skill whose Inability has been cancelled out is deleted, not stored as a neutral value._
- **Special Abilities:** Array of objects.
  - `Name` (String)
  - `Source` (String: Descriptor, Type, or Focus)
  - `Cost` (Integer)
  - `Variable Cost` (Boolean - the ability spends a player-chosen amount; drives the `+` suffix on its use button)
  - `Pool Type` (Enum: Might, Speed, Intellect)
  - `Execution` (Enum: Action, Enabler, or absent - some abilities are passive and are neither)
  - `Description` (String)
- **Attacks:** Array of objects.
  - `Name` (String)
  - `Description` (String - free text, e.g., "medium, melee")
  - `Damage` (Integer)
- **Armor:** A single object, not an array - a character wears one suit of armor at a time.
  - `Name` (String)
  - `Points` (Integer - the Armor value the worn suit contributes)
  - `Description` (String - free text, e.g., "light")
  - `Speed Penalty` (Integer - additional Speed cost per level of Effort)
  - _Derived UI state:_ Total Armor is a sum - the worn suit plus any Armor granted by special abilities and cyphers. The full ruleset stacks armor _sources_, not armor _suits_.
- **Cypher Limit:** (Integer - the number of cyphers the character may carry; required by the GM dashboard's over-limit alert).
- **Cyphers:** Array of objects.
  - `Name` (String)
  - `Level` (Integer or String/Die Roll)
  - `Type` (Enum: Manifest, Subtle - the one rules-enforced enum among the item fields)
  - `Effect` (String - the rulebook's term for what was previously called Description)
- **Equipment:** Array of objects.
  - `Name` (String)
  - `Description` (String - free text, rendered as the row's parenthetical)
- **Currency:** `Amount` (Integer). The display name is **not stored on the character** - it is read from the GM Object's `Currency Name` and falls back to the generic term "currency" while unset. Displayed as the pinned first row of the Equipment list.
- **Notes:** (String - free text).
- **Advancement:** Five Booleans - the five advancement steps a character may spend XP on. Spending XP on **four** of the five raises the character to the next tier. Each step may be chosen once. These are **bookkeeping checkboxes only**: the app records which steps have been taken and does not apply their mechanical effects. The player reads the rulebook and manually edits the affected values (pool maxima, Edge, Effort, skills) themselves.
  - _Increasing Capabilities:_ assign 4 new points, distributed as the player chooses, permanently added to their stat Pools.
  - _Moving Toward Perfection:_ increase one Edge stat by 1.
  - _Extra Effort:_ Effort score increases by 1, raising how many levels may be applied to a roll.
  - _Skills:_ become trained in a new skill; _or_ upgrade a trained skill to specialized, or cancel out an inability; _or_ become trained in using one of their special abilities.
  - _Other Options:_ in place of one of the above - reduce the additional Speed cost of worn armor by 1; _or_ permanently increase recovery rolls by +2; _or_ choose another ability from their type.
  - The reference wording each checkbox carries is verified and recorded in _Player playing a session_ §3.8.

### 3.2 GM Object

A single persistent record for the GM, maintained on the same terms as a Character Object - server-side, autosaved, and surviving restarts. There is one GM Object per deployment.

- **Configuration:**
  - `Currency Name` (String - the campaign's term for money; the fallback referenced by the Character Object's Currency field).
- **Notes:** (String - free text. Private to the GM and never broadcast).
- **Roster:** Array of objects, one per character admitted to the session. An entry is created automatically the first time that character's device connects, and persists until explicitly removed.
  - `Character ID` (String - reference to the Character Object; the roster stores no copy of character data, which is always read live).
  - `Act Before NPCs` (Boolean or null - null while the player has not answered, and outside an encounter).
  - `Turn Taken` (Boolean - false outside an encounter).
  - _Not persisted:_ connection state, which is derived live from the SSE connection.
- **Encounter:** A single object.
  - `Active` (Boolean - governs whether encounter-only UI and columns render).
  - `Target Number` (Integer - the NPC group's shared target, entered by the GM when initiative starts. The optional rule that NPCs act as a group on the highest target among them is in force, so no creature carries its own initiative. Tracked because the initiative request persists; **never displayed after entry**, being rules-meaningless once everyone has answered).
  - `Creatures` (Array of objects - emptied when the encounter ends).
    - `ID` (String)
    - `Name` (String - generated at creation with a numeric suffix when added as a group; stored per creature and independently editable. There is no group identity).
    - `Level` (Integer - governs the Target Number).
    - `Health` (Integer - seeded from the creature's Target Number; a creature reaching 0 is removed).
    - `Turn Taken` (Boolean)
- **Intrusion:** A single object, or null when none is active.
  - `Type` (Enum: Targeted, Free, Group - tracked because a per-player flag cannot distinguish one unresolved player in a group intrusion from a targeted intrusion on one player. Free intrusions arise from a rolled 1, grant no XP, and offer no gifting, but remain refusable).
  - `Participants` (Array of objects).
    - `Character ID` (String)
    - `Resolution` (Enum: Pending, Accepted, Refused)
    - `Gifted To` (String or null - the Character ID receiving the 1 XP granted on Accept).

### 3.3 Write Model and Synchronisation

Every surface in the app writes through one contract.

- **Field-level patches, each carrying an actor.** Whole-object writes are not used: the GM writes directly into player sheets, so concurrent writers genuinely exist, and a whole-object write from a stale client would silently erase another party's change. The actor tag lets the app skip notifying the originator of their own edit, and tell a recipient that a change came from the GM.
- **Conflict rule: last-write-wins per field path.** There is no rejection and no merge interface. The cost of a collision is one field, which is the reason field-level granularity was chosen.
- **Ordered local queueing.** Each device keeps a FIFO queue with a client sequence number, replayed in order on reconnect. On a local network a dropout is the failure mode that matters, not latency.
- **Operations spanning two records are commands, not patches.** Giving an item between characters and resolving an intrusion both write to two records and land as a single atomic server call, so a dropout cannot duplicate or destroy the thing in transit.
- **List items carry a server-assigned identifier.** Skills, abilities, attacks, equipment, cyphers, and creatures are addressed by identifier rather than by array position, so a concurrent reorder cannot redirect a patch onto the wrong row.
- **Connection state is derived, never persisted.** It follows the seat a device has claimed (see §4.3) and lives only in memory.

## 4. Functional Interfaces

### 4.1 Player Interface (Interactive Character Sheet)

- **Real-Time Sync:** Modifying any value (spending a pool point, checking a recovery box, gaining a Cypher) instantly updates the server state and reflects on the GM's dashboard.
- **Quick Pool Adjustments:** Tapping a Current Pool value opens the shared adjustment modal - large `-` and `+` controls either side of the projected value, the delta above it, and an explicit confirm. The modal is used rather than inline steppers because it is the same control the GM's dashboard uses, and because an explicit confirm makes a stray tap harmless.
- **Numeric Display Convention:** Every number on the sheet is enclosed in a box. A **filled** box means the value is interactive; a **bordered** box means it is not. Direct numeric inputs adopt the filled treatment rather than a generic text input, so that inputs and editable displays share one visual vocabulary.
- **Derived Calculations:** The UI must automatically shift the Damage Track visual indicator when pool values reach 0, alerting the player of their Impaired/Debilitated status.
- **Helper Overlays:** Info icons (i) next to headers (Effort, Recovery, Damage Track, Abilities, Skills) that trigger the mechanical tooltips defined in Section 2. Tooltips open on tap, anchored at the tap position, and are dismissed by a tap anywhere — hover is not a supported trigger.

### 4.2 GM Interface (Overwatch & Management)

- **Party Dashboard:** A high-level grid displaying every character in the session roster. Values are read live from each character record; the GM may edit any of them.
  - _Visible metrics:_ Current Pools, XP count, time cost of the next recovery roll, and a single condition indicator.
  - _Visual Alerts:_ The condition indicator shows the highest-priority active condition only — Cypher over-limit outranks Debilitated, which outranks Impaired — and opens a detail view listing all of them. Disconnected characters are de-emphasised but remain fully interactive.
  - _Encounter mode:_ When an encounter is active the grid gains Initiative and Level columns and lists creatures alongside players, sorted into three bands - players acting before the NPCs, then the creatures, then players acting after - with name ascending inside each. The Initiative cell doubles as a turn-taken marker.
- **GM to Player Interactions:**
  - **GM Intrusions:** A module to push an "Intrusion Alert" to a specific player's screen, or to the whole group. A targeted intrusion prompts the player to Accept (granting 1 XP to them, and 1 XP to distribute to another player) or Refuse (costing them 1 XP); when the roster holds no other player, Accept simply grants the 1 XP. A group intrusion grants 1 XP with no gifting and cannot be refused. A **free** intrusion - triggered by a player rolling a 1, and initiated from a checkbox on the GM's picker - grants no XP and offers no gifting, but remains refusable. Each player in a group intrusion resolves individually.
  - **Initiative:** Starting or restarting initiative first asks the GM for the NPC group's Target Number, then prompts every player to answer whether they act before or after the NPCs. The app never rolls; players roll physically and apply Effort by rolling against a lower number than the one displayed to them.
  - **Loot Distribution:** The GM opens the player's character sheet and adds the Cypher or item through the sheet's own interface. There is no separate distribution form — the GM has full write access to every player sheet.
- **Encounter/Lore Module:** A plain-text scratchpad for GM campaign notes, private to the GM. NPC levels are tracked in the encounter grid's Level column.

### 4.3 Identity, Seats, and Connection State

There is no login. A device's identity is the **seat** it holds.

- Opening a character from the home page **claims that character's seat**. The device is that character until it releases the seat by returning home, and the claim is what the app reports as the character's connection state.
- **A seat cannot be held twice.** The home page renders a character disabled while another connected client holds it. Without this, two devices could hold one character and connection state would carry no meaning.
- **GM mode claims no seat.** Neither the GM dashboard nor the GM's view of a character sheet from within it registers that character as connected - otherwise inspecting a sheet would disable the very control used to remove that character from the session.
- A GM who leaves the dashboard and opens a player's sheet from the home page **is** assuming that character's identity. This is acceptable outside a session and prevented during one by the disabled seat.
