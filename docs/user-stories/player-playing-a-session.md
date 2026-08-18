# Player Playing a Session

## 1. Persona & Context

**Who:** A player in a Cypher System campaign, at the table for a live session.

**Device:** A tablet or a phone. Phone-portrait is a fully supported environment, not a degraded one — the same standard the GM interface holds itself to.

**Environment:** The same locally hosted, login-free server the GM uses. The player has their own device, and that device is claimed as their character by the app's last-destination memory. The physical table is present and active: dice are rolled by hand, the GM narrates aloud, and the rulebook is within reach.

**Prior state:** The character already exists, transcribed through _Player creating a character_. Pools, skills, abilities, equipment, and cyphers are all filled in.

**Frequency:** Every session, for the whole session. Unlike the creation flow, this is the surface the player lives in — it stays open on the table and is touched dozens of times an hour, overwhelmingly to move pool points.

---

## 2. Narrative

I return to the home page and find my character in the list. I tap their name and the sheet opens on the Overview tab, in its in-play form — the same information as the editor, but nothing is a form field any more and everything is condensed so I can read my whole character at a glance.

At the top, a single line: **Kade** is a **Strong-Willed** **Warrior** who **Bears a Halo of Fire**. Below it my three pools sit side by side, each showing its points over its maximum, its Edge, and a button to apply Effort. The Effort button carries a number — the cost it thinks one level will run me. Under that, my Tier, Effort and XP; then my recovery rolls, laid out as four slots the way the paper sheet does it; then my conditions, empty because nothing is wrong yet. At the very bottom, past a read-only summary of which advancement steps I have taken, is the button that opens the sheet in edit mode. I leave it alone — I am here to play.

Every number on the page sits in a box. The ones I can change are filled in solid; the ones I cannot are outlined. I do not have to remember which is which, I can just see it.

Combat starts. A modal takes over my screen: **Roll for Initiative!** It tells me the number to beat and gives me two buttons — acts before the NPCs, or after. I roll a d20 by hand, beat the number, and tap the first button. The modal closes.

A creature hits me for 4 Speed. I tap my Speed points, and a modal opens showing where the number is heading with minus and plus on either side and the change so far above it. I tap down four times and confirm.

On my turn I want to hit hard, so I tap Apply Effort under Might. The same adjustment modal opens, except the cost is already applied and a line beneath explains how it got there — `Cost: 3 - 1 (Edge)`. That is right, so I confirm without touching it. Later, after my Speed pool bottoms out and I go Impaired, the same button shows a bigger number and the line grows a term to explain it.

I flip to Skills & Abilities to check something. My skills are one line each, name and whether I am trained. My abilities are the same, with the cost on a button at the right edge — I tap it, the points come out of the pool, and the GM sees that I used it. One of my abilities has a variable cost; tapping that one lets me choose how much to pour in before it commits.

Partway through the fight my screen is taken over again: **GM Intrusion!** I can accept it, which earns me 1 XP and immediately hands 1 XP to someone else at the table — the modal lists them and I pick one. Or I can spend 1 XP to refuse. I want to check my sheet first, so I dismiss the modal; a button appears pinned at the top of my screen reminding me the intrusion is still waiting. I look at my pools, tap the button, and accept.

Later the GM hands me a cypher as a reward. It simply appears on my Cyphers tab and I get a small notification. This time it puts me over my limit, so a modal warns me what happens to people who carry too many — and it is not subtle about it. I dismiss it, go to my cyphers, and remove one I was never going to use. The GM sees it go.

At the end of the session my XP has gone up enough to advance. I scroll to the bottom of my Overview tab and switch to edit mode, where the whole sheet becomes editable again. I check off an advancement step, read what it says the step gives me, and make the changes myself — the app records that I took the step and nothing else. Fixed at the bottom of the screen, as it has been all session, is the note telling me everything is saved.

---

## 3. Screens & Elements

### 3.1 Entry and mode structure

The player reaches their sheet from the home page's character list, or lands there directly via last-destination memory.

The sheet has **two modes and no more**:

| Mode     | Purpose                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Play** | The session surface. Condensed typographic display, with dedicated controls on the few values that move during play.       |
| **Edit** | The full sheet, all values editable, borrowing the creation layout. Reached by a button at the bottom of the Overview tab. |

Both modes carry the **same five tabs** in the same order — Overview, Skills & Abilities, Equipment, Cyphers, Notes — under the standing rule that layouts share an information architecture and differ only in affordances. The tab bar follows the established convention: active tab shows icon and label, inactive tabs show icon only.

### 3.2 Numeric display convention

**Every number on the sheet is boxed. The fill states whether it is interactive.**

| Kind                       | Treatment                                                              |
| -------------------------- | ---------------------------------------------------------------------- |
| **Interactive number**     | Filled contrast box — dark theme: white background, black text         |
| **Non-interactive number** | Bordered box — dark theme: white border, background and text unchanged |

**Direct number inputs match the interactive treatment** rather than using the standard `custom-ui` `Input`: a relatively large font in a rectangle sized for two digits, with generous padding. An input that looked like a generic text field would break the vocabulary the boxes establish.

### 3.3 Overview tab — play mode

Top to bottom:

**1. Identity line.** `[Name] is a [Descriptor] [Type] who [Focus]`. Each of the four values is bold and slightly larger than the surrounding text.

**2. Pools.** A three-column layout, Might / Speed / Intellect, read top to bottom:

| Row | Content                                                                  |
| --- | ------------------------------------------------------------------------ |
| 1   | Stat name                                                                |
| 2   | `[Points] / [Pool]` — Points is a filled box, Pool a bordered box        |
| 3   | Column-merged label **"Edge"**                                           |
| 4   | The Edge value, bordered box                                             |
| 5   | Column-merged label **"Apply Effort"**                                   |
| 6   | Per-column Effort button, labelled with the estimated cost as a negative |

**3. Tier / Effort / XP.** Three columns, label above value. Tier and Effort are bordered; **XP is filled and interactive**.

**4. Recovery.** The label `Recovery Rolls 1d6 + [Recovery bonus]`, then four columns — slot label (1 action, 10 mins, 1 hr, 10 hrs) above a **non-interactive** checkbox each, mirroring the paper sheet's at-a-glance spectrum. Two buttons beneath:

| Button      | Behaviour                                    |
| ----------- | -------------------------------------------- |
| **Recover** | Ticks the next slot. Disabled when all spent |
| **Clear**   | Clears the whole track, for any reason       |

Neither button touches pool points — see §5.4.

**5. Conditions.** A non-interactive list of the character's active damage-track conditions, each rendered as the bare condition name (Impaired, or Impaired and Debilitated). Empty when Hale.

**6. Advancement.** A **read-only** display of which of the five advancement steps have been taken. All interaction lives in edit mode.

**7. Edit-mode button.** Buried at the very bottom of the tab.

#### Tooltips

| Label              | Text                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Effort**         | "You can apply one level of Effort by spending 3 points from a Pool (minus that Pool's Edge, if any)."                            |
| **XP**             | "You gain experience points (XP) during the game, usually from GM intrusions. You can spend 1 XP to reroll any roll in the game." |
| **Recovery Rolls** | "You regain points to your Pools each time you rest, up to four times a day, but each rest takes longer."                         |
| **Impaired**       | "+1 Effort per level, ignore minor & major results, combat rolls of 17-20 deal only +1 damage."                                   |
| **Debilitated**    | "Can only move an immediate distance; if Speed Pool is 0, cannot move."                                                           |

### 3.4 Skills & Abilities tab — play mode

Information display only. Editing either list requires edit mode.

**Skills.** One line each: `[name] ([proficiency])` — trained, specialized, or inability.

**Special Abilities.** A full-line header per ability: `[name] ([execution])` at the left edge, a use button at the right. The `([execution])` segment is omitted for passive abilities that are neither Action nor Enabler. The full description is collapsible beneath the header.

**Use button label:** `[cost][+ if variable] [Might/Speed/Intellect] (-[Edge])`. The `(-[Edge])` segment renders only when that pool's Edge is 1 or more.

| Ability kind      | Tapping the button                                                         |
| ----------------- | -------------------------------------------------------------------------- |
| **Fixed cost**    | Spends the Edge-discounted points from the pool and notifies the GM        |
| **Variable cost** | Opens the adjustment modal repurposed as a point-spend chooser (see §3.10) |

### 3.5 Equipment tab — play mode

In order: **Attacks**, **Armor**, **Equipment**.

| Section       | Row template                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| **Attacks**   | Left `[name] ([description])`, right `[damage]`                                                             |
| **Armor**     | Left `[name] ([description])`, right `[armor value]`; second line `+[penalty] additional Speed Effort cost` |
| **Equipment** | Left `[name] ([description])`, right actions **give** and **remove**                                        |

Currency is the pinned first row of the Equipment list. Tapping its number opens a **direct numeric entry modal**, not a stepper.

An **add equipment** button sits on this tab, opening a modal to enter the new item's values. It adds to the equipment list only — never to attacks or armor.

#### Give and remove

**Give** opens a modal listing the other roster characters as buttons; tapping one moves the item and notifies the recipient. **Remove** deletes the item after confirmation.

Both may also strip a matching entry from attacks or armor on the giver. That offer appears **only when the departing item is the last equipment entry of its name**, and is presented as pre-checked boxes rather than a second dialog:

> "An entry with this equipment's name is found elsewhere, so:"
>
> - ☑ Also remove this Attack
> - ☑ Also remove this Armor

Leaving a box checked _is_ the confirmation. A box does not render when no entry of that name exists. When other equipment items of the same name remain, no boxes render and nothing is stripped.

**The recipient receives the equipment item only** — never the attack or armor entry — because carrying a thing and being able to use it are different facts. They reconcile it in edit mode.

**Giving is a single server-side command, not a pair of patches**, since it writes to two character records. A dropout between the two halves would otherwise duplicate the item or destroy it in transit.

### 3.6 Cyphers tab — play mode

**Limit indicator:** the text "You are bearing", the number `[carrying]/[limit]`, the text "cyphers". The number turns **error red** while over limit.

**List.** Header `[name] (level [level], [type])` with a collapsible full effect text beneath. One action: **remove**, which deletes after confirmation and requires no rules justification — used, voluntarily destroyed to get back under limit, or destroyed by the GM enforcing the limit are all the same operation.

Whichever party acts, the other is notified: `[actor] removed [cypher name]`, with `GM` as the actor name when the GM acted.

### 3.7 Notes tab

Free-text notes, as in creation. **Never broadcast** - notes emit no toast on either side. They are not hidden from the GM, who reads them through the sheet like any other tab; "private" here means unannounced, not inaccessible.

### 3.8 Edit mode

The creation layout, with two additions:

- **XP and every other value are editable**, including the ones play mode renders read-only: pool maxima, Edge, Tier, Effort, recovery bonus, cypher limit, attack damage, armor values, ability costs.
- **The Advancement section is interactive** here and nowhere else.

#### Advancement

Five checkboxes, one per step, each labelled and each carrying its rules text as reference. A step may be chosen **once**. Spending XP on **four** of the five raises the character to the next tier.

| #   | Step                         | What the text tells the player                                                                                                                                                 |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Increasing Capabilities**  | Assign 4 new points, distributed as they choose, permanently added to their stat Pools                                                                                         |
| 2   | **Moving Toward Perfection** | Increase one Edge stat by 1                                                                                                                                                    |
| 3   | **Extra Effort**             | Effort score increases by 1, raising how many levels may be applied to a roll                                                                                                  |
| 4   | **Skills**                   | Become trained in a new skill; _or_ upgrade a trained skill to specialized, or cancel out an inability; _or_ become trained in using one of their special abilities            |
| 5   | **Other Options**            | In place of one of the above: reduce the additional Speed cost of worn armor by 1; _or_ permanently increase recovery rolls by +2; _or_ choose another ability from their type |

> **Verified** against the printed starter set. This wording is the reference text the checkboxes carry.

**Checking a step changes no other value.** It does not deduct the 4 XP, raise a pool, or add a skill. See §5.6.

### 3.9 The fixed-top contextual action bar

A single **app-level** slot, pinned to the top of the viewport, holding at most one button. Its occupant is determined by context, and the two possible occupants can never co-occur:

| Context                         | Occupant                                    |
| ------------------------------- | ------------------------------------------- |
| GM viewing a character sheet    | "Return to GM view"                         |
| Player with an unresolved event | The event's own label, e.g. "GM Intrusion!" |

App-level hosting is required because the bar must survive tab switches _and_ the play↔edit mode switch. Tapping the button reopens the event's modal. The reminder persists until the player resolves the event.

**Strict priority, no count badge: intrusion outranks initiative.** Only one button ever shows.

### 3.10 Modals

All modals except GM-initiated events cancel silently on outside dismissal.

#### The adjustment modal

One primitive, several dressings. Common shape: a title, an annotation line above the centre, the projected value large in the centre, `−1` and `+1` on either side, and a confirm button below.

| Use                       | Annotation line                                                                    | Opens at                                   | Clamps                                                 |
| ------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------ |
| **Pool points**           | Delta, red when negative                                                           | Current value                              | `[0, Pool]`                                            |
| **XP**                    | Delta, red when negative                                                           | Current value                              | Floors at 0, no ceiling                                |
| **Apply Effort**          | The cost formula (below)                                                           | Current value **minus the estimated cost** | `[0, Pool]`                                            |
| **Variable-cost ability** | `Cost [adjusted cost] ([spend]-[edge])` — the `-[edge]` segment only when Edge > 0 | `max(1, Edge)`                             | Lower: the opening value. Upper: current Points + Edge |

**The Effort formula line** reads `Cost: 3 - [edge] (Edge) + [penalty] (Armor Penalty) + 1 (Impaired)`. The Armor Penalty term renders only for Speed Effort; the Impaired term only while Impaired.

The Effort modal opens with the estimated cost **already applied**, so confirming without touching anything spends the app's best guess. The delta renders exactly as it does everywhere else.

#### Direct numeric entry modal

Used for currency. A single number input styled per §3.2, with a confirm button.

#### Cypher Overload

> **Title:** Cypher Overload!
>
> "Your Cypher is currently over your maximum limit. If you try to continue to carry more than your limit, weird things would start to happen - within a few minutes, a random cypher you're carrying instantly disappears, two cyphers cancel each other out, some start randomly activating, and so on. Cyphers lost this way can't be recovered."

Purely informational. It fires whenever an added cypher leaves the player over limit — including going from three to four against a limit of two — and persists while the player is out of session. **Dismissal counts as acceptance**, so it leaves no reminder in the top bar. Every consequence it describes is resolved manually at the table.

### 3.11 GM-initiated events

#### Roll for Initiative

> **Title:** Roll for Initiative!
>
> "GM is initiating combat. Roll for initiative and submit the result below. Initiative is a Speed-based task you can learn as a skill."

The **target number** set by the GM is shown clearly. Beneath it, two buttons:

- **Acts before NPCs**
- **Acts after NPCs**

The player rolls a physical d20, applies any Effort themselves by rolling against a _lower_ number than the one displayed, and taps the matching button. If the GM ends or dismisses initiative before the player answers, the modal simply goes away.

#### GM Intrusion

All three variants share the title **GM Intrusion!**

| Variant      | Explanation text                                                                                                                             | Controls                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Targeted** | "A GM intrusion is targeting you. You can either accept the intrusion, where you gain 1 XP and you immediately give 1 XP to another player:" | A list of the other roster players — choosing one accepts. Then the refusal block. |
| **Free**     | "A GM Intrusion is targeting you because you rolled a 1 on a task"                                                                           | An **accept intrusion** button. Then the refusal block.                            |
| **Group**    | "A GM Intrusion is affecting all of the PCs, including you. You gain 1 XP, but you cannot refuse this intrusion."                            | An **accept intrusion** button only.                                               |

**The refusal block**, where present: the text "Or, you can spend 1 XP to refuse the intrusion", then a **refuse intrusion** button. When the player has no XP, an error panel is appended above the button and the button is disabled: "You have no XP to spend, so you can't refuse this intrusion."

**Solo roster.** When a targeted intrusion finds no other players to gift to, the player list is replaced by an **accept intrusion** button; the sole player simply gains 1 XP.

These modals are dismissible, leaving the §3.9 reminder behind.

### 3.12 Save indicator and notifications

The same fixed-bottom save indicator the creation layout established: a timestamp on success, a persistent error state with auto-retry and local queueing on failure. Toasts are hosted at app level.

---

## 4. Data Touched

### 4.1 Written by this flow

Pool points (×3), XP, recovery slots, currency amount, cypher list (removals), equipment list (adds, gives, removes), attacks and armor (strips only), advancement booleans (edit mode), and everything else on the sheet via edit mode.

`actBeforeNPCs` is written to the GM's roster, not to the character.

### 4.2 Read but not written in play

Name, descriptor, type, focus, pool maxima, Edge, tier, effort, recovery bonus, conditions (derived), cypher limit, attack damage, armor values, ability costs, skills.

### 4.3 Fields this story adds

| Field                        | Shape                     | Notes                                                                     |
| ---------------------------- | ------------------------- | ------------------------------------------------------------------------- |
| **Armor `name`**             | String                    | Distinct from its description; required by the play-mode row template     |
| **Equipment `description`**  | String                    | §3.1 had `Description (Optional)`; it is now the rendered parenthetical   |
| **Ability `variableCost`**   | Boolean                   | Drives the `+` suffix on the use button; not derivable from anything else |
| **Cypher `type`**            | Enum `manifest \| subtle` | The only rules-enforced enum among these fields                           |
| **Cypher `effect`**          | String                    | The rulebook's own term, replacing `description`                          |
| **Encounter `targetNumber`** | Integer, GM-side          | Set once per initiative request; tracked but not displayed after entry    |

### 4.4 Fields this story changes in the design spec

**The "descriptor" sweep.** `Descriptor` is reserved as the rules term for the character's Descriptor and retired as a general attribute name:

| Object      | Was                          | Is                                                    |
| ----------- | ---------------------------- | ----------------------------------------------------- |
| **Attacks** | `Descriptors`                | `description` — arbitrary string, commas inline       |
| **Armor**   | `Descriptor`                 | `description` — arbitrary string, commas inline       |
| **Cyphers** | `Descriptors`, `Description` | `type` (enum), `effect`                               |
| **Skills**  | `Type` (enum)                | `proficiency` — `Trained \| Specialized \| Inability` |

**Skills gain `Specialized`.** A skill whose inability has been cancelled out is deleted, not stored as a neutral value.

**Ability `Execution` becomes three-state.** Action, Enabler, or absent — some abilities are passive and are neither.

**Effort is assisted, not adjudicated.** §3.1's Effort bullet is rewritten a second time: the app computes and pre-applies a best-guess cost from Edge, armor penalty, and Impaired, displays the formula that produced it, and lets the player adjust before confirming.

**Pool adjustment is modal, not stepper buttons.** §4.1's "large, tap-friendly `+` and `-` buttons for Current Pool values" is superseded by the adjustment modal, which requires an explicit confirm.

**Damage-track tooltip text** is replaced with the wording the player supplied for Impaired and Debilitated.

**Initiative is a band, not a number.** Recorded here because it originates in this story; the GM-side consequences are amended into _GM running a session_.

---

## 5. Design Decisions

### 5.1 The north star

> "Have a digital version of the character sheet where it is saved and I can easily make edits without erasing and rewriting on physical paper", and not "Turn my brain off rules wise and let the system do all of the calculations for me".

Already written into spec §1. It is the instrument used to prune every UI in this document that would have required excessive rules knowledge — to implement or to use.

Its refinement, arrived at through the Effort and Advancement decisions:

> **Partial automation is safe only where it can show its work.**

Effort automates partially and _displays its formula_, so the player can see exactly what was and was not counted. Advancement has no equivalent display surface, so it automates nothing at all. This is a sharper rule than "automate the bare minimum," because it explains why two superficially similar decisions went opposite ways.

### 5.2 One edit mode, not three layouts

The creation story anticipated creation, in-play, post-play levelling, and a quick in-play modal edit. There are **two** modes: play and edit.

What that story called "in-play edit" was never a layout — it was a capability, _change one thing quickly without leaving the table_, and every instance of it now has a concrete answer inside play mode: the adjustment modal on points and XP, direct entry on currency, give/remove on equipment, the add-equipment modal. Building a second editing surface would have meant a third `mode` value threading through every section component, which was already rejected once when the GM story refused a GM-specific affordance set.

Its governing rule survives in amended form: **bulk entry is inline; targeted single-field edits are modal.** The parenthetical naming "in-play edit" as a mode does not.

_Cost accepted:_ bulk entry mid-session — the GM hands over three items and an attack in one scene — means a trip through edit mode.

### 5.3 Effort assists and shows its work

The Effort button was originally specified to auto-subtract a computed cost. That was withdrawn under the north star, replaced with plain player-asserted entry, and has now landed in a third position that is better than either.

**Why calculation was abandoned:** Edge is simple, but armor is deceptively so — a "Practiced in Armor" ability reduces the Speed Effort increase to "just +1", so the stored penalty gets tweaked by hand. Beyond that lie other abilities, untracked temporary conditions, and cyphers that modify the cost. The app cannot enumerate them.

**Why it came back anyway:** the original objection was that _a confidently wrong number is worse than no number_. Displaying the formula dissolves that objection. `Cost: 3 - 1 (Edge) + 2 (Armor Penalty)` does not assert a correct answer — it shows its scope, so a cypher or a temporary condition is visibly the player's to add. The number stops being a claim and becomes a starting position.

**Impaired is included** because it is knowable with _more_ certainty than the armor penalty: it falls straight out of a pool hitting zero, with no human step in between, whereas the armor number is only right if the player maintained it. Including the less certain term while excluding the more certain one would be inconsistent in the wrong direction. Impaired is also the term players most often forget, for the same reason it matters — they are under pressure when it applies.

**Debilitated is not modelled.** Standard actions are out of reach at that point, so Effort is moot.

**The Effort button is not a catch-all for point changes.** Damage is the other major reason points move, and it is entirely manual. Keeping the two visibly distinct is why Points remain directly editable alongside the Effort shortcut, rather than the shortcut becoming the only path.

_Recorded risk:_ the formula's silence about everything else may read as exhaustive. A player who sees Edge, Armor, and Impaired accounted for may assume the list is complete. Judged smaller than the forgotten-surcharge risk it replaces.

### 5.4 The app never rolls, and Recover proves it

**Recover ticks a box. That is all it does.** It adds no points, because the roll is `1d6 + bonus` and the app does not roll dice. The player rolls physically and moves their own points through the adjustment modal.

This is the same principle that shapes initiative and, ultimately, the entire north star: some interactions are better left at the table.

### 5.5 Initiative is a band, not a number — and the optional rule is what makes it work

**The contradiction that forced this.** Initiative was first modelled as a submitted number, sorted descending against creature initiative seeded from level. It produces the right order, but it inverts a real mechanic: applying Speed Effort to ease an initiative task should _lower the target_, whereas that model can only express it as _raising the player's roll_. Correct output, wrong causality — and a player who sees their initiative as a number learns the inverted model.

**The fix is a rules option, not a UI workaround.** Invoking the optional rule that _NPCs act as a group with the target number set to the highest among them_ removes the need for any per-creature initiative value. One target number governs the whole encounter.

Everything simplifies from there:

- The player submits **two buttons** — acts before NPCs, or after — with the target number displayed so they can apply Effort themselves and roll against a lower number.
- Player initiative data reduces to **`actBeforeNPCs`**, null while unreported.
- The GM enters **one target number** in a modal before sending the initiative request.
- Adding creatures no longer collects an initiative value.
- Sorting becomes `actBeforeNPCs === true` → NPCs → `actBeforeNPCs === false`, with name ascending inside each band.

**The target number is not displayed after entry.** It is one-time-use data for determining order and becomes meaningless once everyone has answered, so it is tracked in GM state — the initiative request persists — but claims no screen space.

**Initiative is never shown back to the player as a value.** This is the load-bearing constraint, not an omission. The player sees the target number to roll against and their own band; there is no ordinal position because the rules do not define one.

_Superseded:_ the earlier fallback plan — split initiative and turn-taken into separate table columns and make initiative editable if mistyped submissions forced too many rerolls — is retired. Two buttons cannot be mistyped.

### 5.6 Advancement records that a step was taken, and nothing else

Checking a step deducts no XP, raises no pool, adds no skill.

**Why not even the invariant parts.** The 4 XP cost never varies and involves no rules judgement, which made it look like a safe thing to automate. It is not — because applying _some_ value changes and not others, without explanation, teaches one of two wrong lessons: that the applied changes are the only ones required, or that since some were not applied none were, in which case an inattentive player subtracts the XP a second time. There is no good outcome available.

This is what produced the refinement in §5.1. Effort can automate partially because it displays its scope; advancement has nowhere to display anything, so it automates nothing.

**Advancement is edit-mode only**, read-only in play. That also removes the friction it first appeared to create: the checkbox now lives in the same place as the fields it implies, so levelling is one visit to edit mode rather than a bounce between modes.

**Five steps, four to advance.** "Other Options" reads _"In place of one of the above options, you can choose one of the following options"_, which is why it counts as a fifth choosable step while four purchases raise the tier. Each step may be chosen once.

### 5.7 Notification altitude

> Toasts report at the **highest semantic level available**, and the constituent field changes that implement them are suppressed — especially where several apply at once.

So ability use emits `Kade uses Ward` and not the pool change beneath it; an intrusion resolution emits one report rather than three XP movements; giving an item emits one report rather than equipment-removed plus attack-removed plus armor-removed.

The principle governs **suppression where a higher-level report exists**, not an obligation to create one. Effort deliberately has no semantic report — toasts are kept to minimum character count and a bare numeric is sufficient — so its field change stands alone. That is consistent with the rule, not an exception to it.

### 5.8 Cypher overload is an event, not a condition

Reversed from an earlier recommendation to list it alongside the damage track.

**"Condition" is a rulebook term with mechanical weight.** A player who sees Cypher Overload sitting next to Impaired will reasonably go looking for the rule that governs it, and there is none. Teaching a wrong rule is a worse failure than a missing reminder.

The GM's condition column can carry it because the GM reads it as _informational_ — a reminder that the player must deal with the problem or the GM delivers swift consequences. The player is the one who would try to apply it. The asymmetry is deliberate and the two documents do not disagree by accident.

So overload is represented player-side by the modal and the red `[carrying]/[limit]` indicator, and the Conditions list stays damage-track only.

### 5.9 In-play editing is deliberately narrow

The editable set in play mode is small by design: **pool points are the vast majority of in-session interaction**, with XP, currency, recovery slots, and the equipment/cypher lists making up the rest.

Everything else — pool maxima, Edge, tier, effort, recovery bonus, cypher limit, attack damage, armor values, ability costs — is display-only, because those values change through advancement or correction, and both belong in edit mode.

The one addition made after the set was drawn: **an add-equipment button**, because inventory management is semi-frequent and give/remove already lived in that UI.

### 5.10 Give and remove: possession and usability are different facts

A recipient gets the equipment item and never the attack or armor entry, because they may be untrained on the weapon or already wearing armor. They reconcile in edit mode.

**The linked strip is offered, not inferred.** Pre-checked boxes inside the give/remove modal replaced a second confirmation dialog. They render only when the departing item is the **last** equipment entry of its name — when duplicates remain, nothing is offered and nothing is stripped, because the player still has one.

Three approaches were considered: always strip (silently wrong on duplicates — the player discovers mid-combat that they cannot attack with a weapon they still carry), always ask via a second dialog (taxes the common case where the answer is obvious), and this. The failure directions are what decided it: wrong-and-silent versus a visible box that fails safe.

**The add-equipment modal is not the mirror image.** Removal fits on a checkbox because the entry already exists; creating an attack needs a damage value and armor needs points and a speed penalty. That is bulk entry, and it belongs in edit mode — which also makes an added item behave exactly like a gifted one.

### 5.11 Intrusions block, then remind

GM-initiated modals were first specified as undismissable. That stranded the player: a targeted intrusion on a solo roster had an empty gifting list and, with no XP to refuse, no exit at all.

Both problems are fixed:

- **Solo roster** resolves per the rules as the sole player gaining 1 XP for accepting, so the empty list is replaced by an accept button.
- **Dismissal is allowed**, leaving a persistent reminder in the top bar until the event resolves.

The reminder bar is a better answer than blocking because it keeps the obligation visible without holding the sheet hostage — and it generalises to every future GM-initiated event.

**One slot, strict priority, no count.** Intrusion outranks initiative. The only realistic overlap is a free intrusion triggered by rolling a 1 _on_ the initiative task, where intrusion-first is correct anyway — so a queue would be machinery for a case that does not arise.

**The bar is shared with the GM's return button.** They are the same primitive with one occupant chosen by context, and they can never co-occur: pending events target a player, and the GM's sheet view is always of another character.

### 5.12 The box convention

Every number is boxed; fill means interactive, border means not. This makes "can I tap this?" a property the player reads rather than learns per field, and it carries to the GM's table and to direct number inputs, which are styled to match rather than using the generic input component.

_Constraint it depends on:_ the theme must supply a genuinely high-contrast pairing. White-fill against white-border reads instantly; a subtle pairing would collapse the whole convention.

### 5.13 One tap, one net change — inherited and extended

The adjustment modal from the GM story is confirmed as a **parameterised primitive** rather than a fixed component: title, an annotation slot above the centre, the projected value, ±1, confirm, and configurable clamps and opening value.

Four dressings exist across the two stories — GM value adjust, player pool/XP adjust, Effort with a pre-applied cost and a formula annotation, and variable-cost ability spend with asymmetric clamps and a non-zero opening value. A fifth, inline and modal-less, was considered for advancement and died with the automation.

### 5.14 Terminology is reserved

"Descriptor" is a rules term for one of the character's three identity fields, so it is retired everywhere else and replaced with `description` on attacks, armor, and equipment — arbitrary strings with commas inline, matching how the printed sheet reads (`Leather jacket (light armor, gives 1 Armor)`).

Skills' `Type` becomes `proficiency` for the same reason: `type` does genuine rules work on characters and on cyphers, and a third non-rules usage is exactly the ambiguity being removed. `proficiency` is still slightly awkward for _inability_ — an inability is the absence of training rather than a grade of it — but less so than `type`.

Cypher `type` is the one enum here that the rules actually enforce (`manifest | subtle`). Every `description` field carries no enforcement at all.

---

## 6. Conventions Established / Rules Amended

> **Transient section.** Delete once extracted into feature cards.

1. **Custom numeric inputs are permitted, against `client.md`.** That file says "Never create a custom input, button, or control." A large, boxed, two-digit numeric input styled to match the editable number displays is exactly a custom control — and it is required, because the fill-means-interactive convention only holds if inputs share the vocabulary. Recorded as a deliberate amendment, not an oversight.

   **They live in `app-ui/`, not `custom-ui/`.** Their font size, border treatment, and padding differ drastically from the standard `Input`, which makes them app vocabulary rather than a general-purpose control. The amendment is therefore scoped: `custom-ui/` keeps its rule intact, and the boxed number display and input are app-level components.

2. **The box convention.** Every number is boxed. Filled = interactive, bordered = not. Project-wide, both modes, both roles.

3. **Notification altitude.** Toasts report at the highest semantic level available; constituent field changes are suppressed. Never emitted for reordering or for notes.

4. **GM-initiated modals are dismissible and leave a reminder.** A scoped exception to "modals cancel on dismissal with no confirmation," which still holds everywhere else.

5. **The fixed-top contextual action bar** is one app-level primitive with a context-selected occupant.

6. **"Descriptor" is a reserved rules term** and may not be used as an attribute name.

7. **Advancement is bookkeeping.** No skill, card, or future story may make an advancement checkbox apply a mechanical effect without also solving the display problem in §5.6.

### Component work this story implies

- **The adjustment modal** — the parameterised primitive of §5.13, shared with the GM story.
- **A boxed numeric display component** with filled and bordered variants, and a matching **boxed numeric input** — both in `app-ui/`, per the scoping note in §6.1.
- **A collapsible list-row component** for abilities and cyphers — header always visible, body expandable.
- **The fixed-top contextual action bar.**
- **`ICON_MAP` additions** for the five tabs and for the pool, XP, recovery, and condition labels — **done**. An unmapped name still renders **nothing, silently**, so any concept added later needs its entry first.

---

## 7. Dependencies & Deferred

> **Transient section.** Delete once extracted into feature cards.

### Depends on

| Dependency                            | Notes                                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **The creation/edit layout**          | Edit mode borrows it wholesale. Defined in _Player creating a character_.                      |
| **Field-level patches with an actor** | Every toast needs to know who acted. Extends the sync contract from that story's §5.5.         |
| **GM roster and encounter state**     | `actBeforeNPCs` and `targetNumber` live on the GM's record. Defined in _GM running a session_. |
| **Form-validation UI components**     | Still missing from `custom-ui/`; to be ported at implementation time.                          |

### Explicitly deferred

| Deferred                                   | Rationale or destination                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| Player-visible initiative **order**        | Deliberately withheld, not merely unbuilt — see §5.5                          |
| Temporary conditions                       | Will join the Conditions list; introduces the first persisted condition state |
| Death / the fourth damage-track state      | Handled at the table; the player deletes the sheet in edit mode               |
| Attack modifiers or skill level on attacks | Unchanged from the creation story                                             |
| Portraits, reference data for type/focus   | Future phase                                                                  |

### Recorded risks

- **The Effort formula may read as exhaustive.** It accounts for Edge, armor, and Impaired, and is silent about cyphers, abilities, and temporary conditions that also modify cost.
- **Local write queueing** from the creation story's §5.5 applies here too, now resolved: ordered per-device replay, last-write-wins per field path, and — because giving an item writes into another character's sheet — a **server-side command** for the two operations that span two records, so neither can half-land.
- **A dismissed intrusion is easy to ignore.** The reminder bar is the only pressure, and nothing escalates.
