# GM Running a Session

## 1. Persona & Context

**Who:** The Game Master of a Cypher System campaign, running a live session for a small trusted group.

**Device:** Assumed to be phone-portrait capable. The GM may be on a tablet or laptop, but the layout is designed so that a phone in portrait remains a complete, usable GM interface — a GM whose laptop dies mid-combat must be able to finish the session on a phone.

**Environment:** The same locally hosted, login-free server the players use. The GM sits behind a screen with **supplementary physical materials** — rulebooks, a bestiary, a printed difficulty cheat sheet. The app does not replace those and does not try to.

**Prior state:** Characters already exist, created through the flow in _Player creating a character_. Players' devices are connected. GM data — roster, notes, configuration, and any encounter left running — persists from previous sessions.

**Frequency:** Every session, for the whole session. This is the GM's primary surface and it stays open continuously.

---

## 2. Narrative

I open the app and choose the GM view. Every player who has ever connected is on my table, one coloured row each. Out of encounter each row shows the character's name, their three current pool values in damage order — Might, Speed, Intellect — a condition icon if anything is wrong, their XP, and the time cost of their next recovery roll. It is a borderless table, mostly numbers, with an icon at the head of each column. Tapping a header tells me what that column is. Players whose devices have gone quiet are still listed, just dimmed.

I want to check something on one of the characters, so I tap their name. Their sheet opens — the same in-play layout the player sees, fully editable by me, with a return button fixed at the top that only exists in this view. I go to the Skills & Abilities tab, find the ability I was looking for, and tap return to come back.

Combat starts. I press **Start Initiative**, and a modal asks me for one number — the target the whole group of NPCs acts on, which I set to the highest among them. While the players roll and answer on their own devices, I press **Add Creatures**. A modal asks for a name, then a level, and prefills health from the creature's target number; I can override it. A count field at the bottom, preset to 1, lets me add several identical creatures at once — three zombies arrive as "zombie 1", "zombie 2", "zombie 3". I can tap any creature's name to rename it, so "zombie 1" becomes "Karen".

The initiative column fills in as answers arrive, and the table sorts itself into three bands: players who act before the NPCs, then the creatures, then players who act after. Creatures sit in the same list as the players, each creature's health shown in the Might column and its level in the Level column. Players who haven't answered yet wait at the bottom.

During combat the initiative cell doubles as a turn marker — I tap it and it becomes a checkmark, so I know who has acted. Because the rules only define whether someone acts before or after the creatures, not a strict order, this is a checklist rather than a queue. When the round ends I press **New Round** and every checkmark clears.

I tap a pool value or a creature's health to change it. A modal opens showing the value's name, the projected new number large in the centre, minus and plus on either side, and the delta above it — red when negative. I tap down to the new value and confirm. If a creature would hit zero, the modal tells me first, in an error panel above the confirm button, that confirming removes it from the table.

Whenever a player changes something on their own sheet, I get a toast — "Joshua −2 Might" — and the table updates immediately. A button at the bottom of my button row opens a log of everything that has happened this session.

Partway through I decide to intrude. I press **GM Intrusion**, pick the affected player — or press the group button to hit everyone — and stay in the modal, which becomes a small table of participants and their outcomes as each one accepts or refuses, and shows who they gifted their XP to. Non-participants are greyed out. When everyone has resolved, the cancel button becomes dismiss.

As creatures drop to zero they leave the table. When the fight is over I press **End Initiative**, confirm, and the remaining creatures and the combat-only columns disappear.

As a reward I hand a cypher to one of the players. I open their sheet from my table, go to the Cyphers tab, and add it. It appears on their device immediately and they get a notification. I could have changed anything else on that sheet the same way — every number outside initiative has the same tap-to-adjust interaction my table does.

---

## 3. Screens & Elements

### 3.1 GM page structure

Three tabs, using the same tab-bar convention the character sheet established: the active tab shows icon and label, inactive tabs show icon only.

| Tab                 | Contents                  |
| ------------------- | ------------------------- |
| **Party/Encounter** | The table, the button row |
| **Notes**           | Free-text scratchpad      |
| **Config**          | Currency name             |

The GM page is the destination recorded by the app's last-destination memory. The GM's view of a character sheet is **not** recorded, so reopening the app returns the GM to their dashboard rather than to whichever sheet they last inspected.

### 3.2 The table

A borderless table, numbers only in cells, icon-only column headers.

**Column order — in encounter:**

| #   | Column         | Players                      | Creatures      |
| --- | -------------- | ---------------------------- | -------------- |
| 1   | Name           | Character name, coloured row | Creature name  |
| 2   | Initiative     | Reported band / turn marker  | Turn marker    |
| 3   | Level          | _(blank)_                    | Creature level |
| 4   | Might / Health | Current Might                | Current health |
| 5   | Speed          | Current Speed                | _(blank)_      |
| 6   | Intellect      | Current Intellect            | _(blank)_      |
| 7   | Condition      | Single highest-priority icon | _(blank)_      |
| 8   | XP             | Total XP                     | _(blank)_      |
| 9   | Recovery       | Time cost of next slot       | _(blank)_      |

**Out of encounter**, columns 2 and 3 do not render. Remaining order is unchanged.

Column order is by combat relevance, so that horizontal truncation costs XP and Recovery first. Inapplicable creature cells are **empty**, not dashed.

**Row behaviour**

| Aspect            | Behaviour                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Player row colour | The character's chosen colour                                                                                                            |
| Creature row      | No colour                                                                                                                                |
| Disconnected      | Row de-emphasised; all interactions remain fully available                                                                               |
| Sort              | Three bands: `actBeforeNPCs === true` → creatures → `actBeforeNPCs === false`, name ascending within each. Unanswered players sort last. |
| Out-of-encounter  | No initiative values; sort by name ascending                                                                                             |

**Cell interactions**

| Cell                                    | Tap behaviour                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| Column header icon                      | Tap-tooltip giving the column's expanded label, e.g. "Might — Current Points" |
| Name (player)                           | Opens that character's sheet in the GM's view                                 |
| Name (creature)                         | Opens the rename modal                                                        |
| Initiative                              | Toggles turn-taken; the band label or marker is replaced by a checkmark       |
| Might / Speed / Intellect / Health / XP | Opens the adjust-value modal                                                  |
| Condition icon                          | Opens the condition detail modal                                              |
| Level, Recovery                         | Not tappable                                                                  |

**The condition column** shows exactly one icon — the highest-priority active condition. Priority: **cypher overload → debilitated → impaired**. Empty when none apply. The recovery column shows `1a` / `10m` / `1h` / `10h`, and an `X` icon when all four slots are spent.

**Horizontal overflow** scrolls. No column is pinned. The assumed resting state is leftmost scroll.

### 3.3 The button row

Full-width stacked buttons beneath the table, ordered by press frequency — which on a phone is also top-to-bottom reading order.

| Order | Button                     | Present           |
| ----- | -------------------------- | ----------------- |
| 1     | New Round                  | In encounter only |
| 2     | GM Intrusion               | Always            |
| 3     | Start / Restart Initiative | Always            |
| 4     | Add Creatures              | In encounter only |
| 5     | End Initiative             | In encounter only |
| 6     | Event Log                  | Always            |

Encounter-only buttons **appear and disappear** rather than being disabled, matching the table's columns.

- **New Round** clears every turn-taken marker.
- **Start / Restart Initiative** first opens a modal asking for the **NPC group's target number** — the highest among the creatures involved. It then clears all player initiative answers and re-prompts players. Creatures, their health, and everything else remain; the table re-sorts as answers arrive. Restarting mid-encounter is expected and does not destroy anything.

  The target number is **not displayed anywhere after entry**. It exists to determine order, and once everyone has answered it is rules-meaningless — so it is tracked in GM state, because the initiative request persists, but claims no screen space.

- **End Initiative** requires confirmation. It removes all remaining creatures and hides the combat-only columns.

### 3.4 Modals

Every modal cancels on dismissal with no confirmation. This is universal.

**Add Creatures**

| Field  | Behaviour                       |
| ------ | ------------------------------- |
| Name   | Text                            |
| Level  | Integer                         |
| Health | Prefilled `level × 3`; editable |
| Count  | Integer, default 1              |

Creatures carry **no initiative value** — the whole NPC group acts on one target number set when initiative starts.

With count > 1, names are suffixed `name 1 … name N`. With count 1, the bare name is used. Suffixes **continue past the highest existing suffix** for that base name, so a second batch never collides with the first.

**Rename Creature** — a single text field for the creature's stored name.

**Adjust Value**

- Title: the value's label
- Centre: the projected new value, large
- Above centre: delta from the current value, red when negative
- Left / right: −1 and +1
- Below: confirm

Pools clamp to `[0, max]`; creature health floors at 0; XP floors at 0 with no ceiling. Buttons disable at their bounds. When confirming would reduce a creature to 0, an **error-coloured panel** above the confirm button states that the creature will be removed from the table.

**Condition Detail** — lists every active condition on that character, not only the one displayed.

**GM Intrusion** — opens as a participant picker: one button per roster character, plus a group button, plus a checkbox labelled **"Free Intrusion (character rolled a 1)"**.

The checkbox is **always unchecked when the modal opens** — it is never sticky. While it is checked, the **group button is disabled**, and choosing a player initiates a _free_ intrusion rather than a targeted one. The two differ only on the player's side: a free intrusion grants no XP and offers no gifting list, but remains refusable at the usual cost of 1 XP.

After selection the modal becomes a live resolution table:

| Column      | Content                                     |
| ----------- | ------------------------------------------- |
| Participant | Character name; non-participants greyed out |
| Consequence | Accepted / refused, and gifted-XP recipient |

Cancel is a no-op with no XP movement and simply clears the pending intrusion from the players' screens. Once every participant has resolved, the cancel button becomes **dismiss**.

**Event Log** — a scrollable list of this session's notifications.

### 3.5 The GM's view of a character sheet

The in-play character sheet layout, with identical affordances. The GM can change anything the player can.

| Difference from the player's view |                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Return button                     | Fixed at the top; exists only in this view                                                            |
| Edit-mode button                  | **Not shown**                                                                                         |
| Remove from session               | At the bottom of the Overview tab; GM-only; **disabled while the character has an active connection** |

Delete-character remains the player's, on the player's edit mode, reachable by the GM only by opening the sheet the way a player would — from the home page, outside GM mode. Doing so **claims that character's seat**, which is why it is available outside a session and blocked during one, when the player's own device holds it.

### 3.6 Notes tab

A single free-text area. Private to the GM; changes are never broadcast.

### 3.7 Config tab

Currency name only.

### 3.8 Save indicator and notifications

The GM page carries the same fixed-bottom save indicator as the character sheet: timestamp on success, persistent error state with auto-retry and local queueing on failure.

Toasts and the event log are hosted at **app level**, not by the GM page, because the GM page unmounts whenever a character sheet is opened.

---

## 4. Data Touched

### 4.1 GM data

A single persistent domain, shaped like a character sheet — the GM's equivalent record.

```
GM data
├─ config
│   └─ currencyName
├─ notes                        String, free text
├─ roster[]                     Persistent; survives sessions
│   ├─ characterId
│   ├─ actBeforeNPCs            true | false | null (unanswered)
│   └─ turnTaken                false outside an encounter
├─ encounter
│   ├─ active                   Boolean
│   ├─ targetNumber             Set per initiative request; never displayed after entry
│   └─ creatures[]              Emptied on End Initiative
│       ├─ id
│       ├─ name                 Generated at creation, stored, editable
│       ├─ level
│       ├─ health
│       └─ turnTaken
└─ intrusion                    Null when none active
    ├─ type                     'targeted' | 'free' | 'group'
    └─ participants[]
        ├─ characterId
        ├─ resolution           'pending' | 'accepted' | 'refused'
        └─ giftedTo             characterId | null
```

**Roster membership is created automatically** the first time a character's device connects, and persists thereafter. It is removed only by the GM's explicit "Remove from session", or by cascade when the character itself is deleted.

**The delete cascade is total.** Deleting a character removes its roster entry, drops it from any pending intrusion's participants, and nulls any `giftedTo` pointing at it, auto-resolving the intrusion if that leaves no pending participants. None of this is expected to arise in real use; it exists so the app cannot be walked into a state it can never leave.

**Connection state is never persisted.** It is derived live from the SSE connection and exists only in memory. It follows the **seat** a device has claimed — a device that opened this character from the home page — and not merely whichever sheet happens to be on screen. The GM's own view of a sheet claims no seat and never marks a character connected.

### 4.2 Read but not written by this flow

Every value shown on the table for a player row — name, colour, pool values, XP, recovery slots, cypher count and limit, damage track — is read live from the character record. The roster holds none of it.

### 4.3 Fields this story adds

| Field                | Shape              | Notes                                                                                                        |
| -------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| **GM data**          | Object             | An entire domain the spec does not define                                                                    |
| **Creature**         | Object             | The spec has no creature entity at all                                                                       |
| **Intrusion record** | Object             | Spec §4.2 describes the interaction but no persisted state                                                   |
| **Patch actor**      | Enum on each write | Required so the GM is not notified of their own edits, and so a player can be told a change came from the GM |

### 4.4 Fields this story changes in the design spec

**Party dashboard metrics.** Spec §4.2 lists "Current/Max Pools" — the table shows **current only**. Maximum pool values are static reference data and are excluded under the principle in §5.1.

**Cypher over-limit is a condition, not a metric.** Spec §4.2 lists "Cypher count vs. limit" as a visible metric with a separate highlight. It is instead folded into the single-icon condition column, at the highest priority.

**Loot distribution.** Spec §4.2 describes "a form to create a Cypher or item and send it directly to a player's inventory." There is no such form. The GM opens the player's sheet and adds the item through the sheet's own interface, which the GM already has full write access to.

**Encounter/Lore module.** Spec §4.2's "markdown-supported scratchpad… to track NPC levels" becomes a plain-text Notes tab. NPC levels are tracked in the table's Level column during encounters and in the bestiary behind the GM screen otherwise.

**Helper overlays.** Spec §4.1 specifies info icons triggering tooltips on the player sheet. The mechanism becomes the tap-driven tooltip described in §6, shared by both the player sheet and the GM's column headers.

**DM → GM.** Every occurrence of "DM" in the spec is renamed to "GM", the correct term for this system.

---

## 5. Design Decisions

### 5.1 The GM screen tracks mutable state, not reference data

The governing principle for the whole GM interface.

> Numbers that go up and down during play earn screen space. Anything the GM can read off a rulebook or bestiary behind their screen stays out of the app.

The player side is deliberately more informational — a player sheet shows Edge and other static values for reference — because a player has no screen to hide books behind. The GM does.

This decided, on its own: no creature `maxHealth`, no armour or damage on creatures, no maximum pool values on the table, no cheat sheets, and label-only tooltips instead of mechanical explanations.

**Level is the bought exception.** A creature's level sets the target number for every roll every player makes against it, many times per round. It is the most-consulted number in a fight and it earns permanent space.

### 5.2 The app never rolls dice

Deliberate, and it explains the shape of several interactions. Initiative arrives from players rather than being generated; no resolution mechanic exists anywhere. Some interactions are better left physical at the table.

It also justifies clamping in the adjust-value modal: the real number is spoken aloud at the table, and mechanically 0 and negative are identical for tracking, so clamping costs nothing and keeps stored state stable.

### 5.3 GM data is a character sheet

The GM gets a single persistent domain of their own, on the same terms as a character: server-side, continuously updated, autosaved, surviving restarts.

The consequence is that an encounter left running is simply _still there_ next session. An earlier proposal for an explicit "encounter in progress" prompt on load was **reversed** — if the data is durable by design, finding it intact is correct behaviour, and a prompt would be the app second-guessing state it was told to keep. Cleaning up a forgotten encounter is two taps plus a confirmation.

### 5.4 One roster, not a separate participant list

Initiative and turn-taken live as nullable fields on roster entries rather than in a combat-only participants collection.

A second list would have to be reconciled with the roster on every membership change, and membership genuinely changes mid-encounter: a player connects for the first time and auto-joins; the GM removes a disconnected character. Under one list those cases are not expressible — a character either has an initiative number or does not. It also makes "restart initiative" a null-out across one array rather than a partial teardown and rebuild.

### 5.5 Roster membership is automatic; removal is deliberate

A character joins the roster the first time their device connects. There is no add-to-session interaction.

Removal is GM-only, buried inside the character's own sheet, and **unavailable while that character is connected** — a connected device would simply re-add itself, so a removal that appeared to work and then silently reverted would be worse than no button at all.

**Connected means the seat is claimed**, not that a sheet is open somewhere. A device claims a character by opening it from the home page and holds it until it goes home; the home page disables a character already claimed by another connected client, so one character cannot be held twice. The GM's view of a sheet from inside the dashboard claims nothing — if it did, inspecting a character would disable the very button used to remove them.

Deleting the character outright is a **separate action belonging to the player**, in the player's edit mode. The GM reaches it only by opening the sheet from the home page, outside GM mode. Both actions take a single confirmation; navigation depth is the safety mechanism rather than escalating confirmation, on the grounds that a double confirmation is theatre and burying the control further is the better lever.

### 5.6 Disconnected does not mean absent

Disconnected rows are de-emphasised but keep every interaction. The app cannot distinguish a player who stepped away for a drink from one who is out for the session but still in the campaign, so it does not try — it reports connection state and lets the GM interpret it.

This also rules out deriving the roster from live connections. Tablets sleep constantly; rows vanishing mid-combat and reappearing at the bottom would look like a bug and would take initiative numbers and turn markers with them.

### 5.7 The GM's sheet view is the player's sheet

Not a read-only variant and not a third affordance set. The GM writes through the same controls the player uses.

A read-only mode with an edit toggle was rejected: the adjust-value modal already requires an explicit confirm, so a stray tap cannot change anything, and the toggle would add a step to every legitimate edit to prevent an impossible mistake. A GM-specific affordance set was rejected more strongly — the previous story established that section components take a _mode_ prop rather than being forked, and a third mode would make every current and future section answer "what does this look like for the GM" forever.

The edit-mode button is hidden in the GM's view because that path is a two-layer-deep specialisation with almost no use.

### 5.8 The condition column is a single prioritised alarm

One icon, highest priority wins, tap for the full list. Priority runs cypher overload → debilitated → impaired.

The column was originally conceived as wider text, and was collapsed because it is destined to overload as temporary conditions get tracked there. Cypher overload outranks the damage track because the pool numbers already give an approximate read on damage, while overload has no other representation on the table and must be resolved within in-game minutes.

Nothing here is persisted — both conditions are derived, from pool values and from cypher count against limit respectively.

**Cypher overload appears here but deliberately _not_ in the player's Conditions list.** "Condition" is a rulebook term with mechanical weight, and overload is not one — a player who saw it listed beside Impaired would go looking for the rule that governs it. This column can carry it because the GM reads it as informational: a reminder that the player must deal with the problem or the GM delivers swift consequences. The asymmetry between the two surfaces is intentional. See _Player playing a session_ §5.8.

### 5.9 Initiative is three bands, not an ordered list

**Reversed from a numeric model, for a rules reason rather than a UI one.**

Initiative was first modelled as a number each player submitted, sorted descending against creature initiative seeded from level. It produced the right order, but it inverted a real mechanic: applying Speed Effort to ease an initiative task should _lower the target_, whereas that model can only express it as _raising the player's roll_. Correct output, wrong causality — and any UI that showed a player their initiative as a value would teach the inverted model.

The fix is a rules option, not a workaround. Invoking the optional rule that **NPCs act as a group with the target number set to the highest among them** removes the need for per-creature initiative entirely. One number governs the encounter, the GM enters it once, and the player answers a binary question.

The table therefore sorts into three bands — acts-before, creatures, acts-after — with name ascending inside each. Within a band, participants act in any order they choose; the table does **not** enforce or highlight a current turn, and the turn-taken checkmarks exist precisely because order is loose.

**The NPC band shows no number.** Creature initiative cells are bare turn markers. Printing one encounter-level number across five creature rows is five copies of one fact, in the column the GM scans for who has yet to act. A labelled divider row carrying the number was considered and rejected: it introduces a non-data row type into a borderless numbers-only table, and phone-portrait height is the scarcest resource on this screen.

_Cost accepted:_ the Initiative column is now heterogeneous — band text for players, a bare marker for creatures — so its icon header labels two related but different things.

_Resolved by this change:_ creature groups of differing levels no longer interleave with players, since the group acts on one number. _Still accepted, cosmetic:_ name-ascending is lexical, so ten identical creatures sort "1, 10, 2".

### 5.10 Ephemeral creatures

Creatures exist only inside an encounter and are destroyed with it. Names are generated at creation and stored as ordinary independent records — there is no group identity, because the app has no need to understand one. Three zombies are three records that cohere on the table only because they share an initiative value.

A bestiary, and the lighter option of autocompleting previously-used creatures, were both considered and deferred. A creature is two typed fields; a bestiary is a whole CRUD surface with a management UI, which ranks far below basic coverage.

### 5.11 Destructive actions are told, not guarded

Creature removal at 0 health stays automatic, but the adjust-value modal states the consequence in an error panel before the GM confirms. This closes the one unrecoverable mis-tap the table permits — horizontal scrolling with no pinned name column makes wrong-row taps plausible.

Leaving dead creatures on the table to be cleared manually was rejected: it turns the most common event in a fight into a two-step chore and fills the table with noise at the moment it most needs to be readable.

End Initiative takes a confirmation, and lands second-to-last in the button row purely by press frequency — which incidentally buries it, consistent with §5.5's preference for depth over friction.

### 5.12 One tap, one net change

The adjust-value modal offers ±1 only. Cypher's numbers are small and most adjustments are one to six taps.

A ±5 control was rejected as trading taps for arithmetic on a screen whose purpose is to remove arithmetic. Direct numeric entry was rejected on the grounds the previous story already established — modals fight the soft keyboard, and this one exists to avoid typing. It would also break the delta framing, since the GM thinks "took 4 damage", not "is now at 5".

The cost is that a large hit is a long press sequence. Accepted, with the observation that a physical interaction proportional to a big number may read as satisfying rather than tedious. Long-press-to-repeat is the noted fallback if it does not.

Because the modal commits one net delta, a player taking six damage generates one notification, not six.

### 5.13 Notifications are point-to-point

Emitted on every numeric field change and on item addition, modification, and deletion, with parity in both directions — a GM adding an item produces the same message shape a player would.

Never emitted for reordering, which is mechanically meaningless, or for notes, which are private on both sides.

Messages travel between the affected player and the GM only. The sole cross-player exception is a player gifting 1 XP to another during an intrusion, which notifies the recipient. Group intrusions follow the normal rule: each decision reaches the GM alone, and the rest of the table learns verbally — by design.

### 5.14 The event log is provisional

A history panel behind the last button in the row, holding this session's notifications. Uniquely in this app it is **client-side session data**, not server state.

Its usefulness is genuinely unknown, so it is placed where it can be tried and then easily upgraded or dismantled. A persisted server-side log was rejected: unbounded growth, a truncation policy, and an audit trail for a trusted five-person game nobody will litigate.

Because the GM page unmounts whenever a sheet is opened, the log must be hosted at app level alongside the toasts. _Recorded risk:_ it does not survive a browser reload. `sessionStorage` is the cheap fix if that matters.

### 5.15 Intrusions are tracked because they have to be

Pending intrusion state is unavoidable — a player whose tablet slept must still see the prompt on waking, so the server holds it until resolved. Given the state exists, surfacing it costs almost nothing, and it closes the failure where a GM intrudes on a disconnected player and the intrusion sits pending forever.

The modal therefore becomes a live resolution view rather than a fire-and-forget picker. Intrusion **type** is tracked because a per-player boolean cannot distinguish one player remaining in a group intrusion from a targeted intrusion on one player.

No description field: the GM narrates the fiction aloud, and the app carries only the mechanical transaction.

**Resolution is a single server-side command**, not a set of patches, because accepting with a gift moves XP between two character records. It emits one report rather than three XP movements.

**Reversed:** rolled-1 intrusions were originally left entirely manual, on the grounds that building resolution machinery for a possible −1 XP was disproportionate. That reasoning was wrong about the cost — the machinery already exists for targeted intrusions, so a free intrusion is a checkbox and a third `type` value, not a new mechanism. It is now a first-class intrusion type.

The three types differ only in what the player is offered:

| Type         | XP gained | Gifting | Refusable       |
| ------------ | --------- | ------- | --------------- |
| **Targeted** | 1         | Yes     | Yes, costs 1 XP |
| **Free**     | None      | No      | Yes, costs 1 XP |
| **Group**    | 1         | No      | No              |

Group intrusions grant XP without a gifting step, so the GM's resolution table shows no recipient for them, and every participant resolves as accepted.

### 5.16 Phone-portrait is a supported GM environment

The table scrolls horizontally rather than clipping, with no pinned column, and the assumed resting state is leftmost scroll. Column order is chosen so that truncation costs the least-critical values first.

Clipping without scroll was rejected because it would make Recovery — confirmed as critical in §5.1 — permanently unreachable with no affordance signalling it exists. Assuming a wide viewport was rejected because the cost of being wrong is having no GM interface at all, mid-session.

_Position held provisionally:_ the real clipping point is unknowable before implementation, so this is deliberately left open to revision after testing.

### 5.17 Trimming is the point

The Q&A removed material the narrative originally contained: a difficulty cheat sheet, and with it the difficulty-to-target-number toggle. Header tooltips shrank from mechanical explanations to plain label expansions — "Might — Current Points".

This follows directly from §5.1. The GM's supplementary materials, including a physical difficulty cheat sheet, live outside the app. Everything that is not tracking was cut.

---

## 6. Conventions Established / Rules Amended

> **Transient section.** Delete once extracted into feature cards.

1. **`HoverPanel` is not used anywhere in this app.** It is a persistent on-screen panel requiring manual dismissal, which has no place in a mobile-first layout.

2. **A tap-driven tooltip replaces hover tooltips project-wide.** Cloned from `custom-ui/overlays/tooltip.mjs`: opens on tap with no delay, anchored at the tap position, semi-transparent, non-blocking (`pointer-events: none` retained), dismissed by a tap anywhere — inside, outside, or on an element underneath, which still receives that tap. This serves both the GM's column headers and the player sheet's info icons, superseding spec §4.1's hover-tooltip assumption.

3. **Modals cancel on dismissal, with no confirmation.** Universal across every modal that makes a change.

4. **Destructive confirmations use an error-coloured panel above the confirm button**, not inline text.

5. **Notifications carry an actor.** Every field-level patch records who made it, so the originator is not notified of their own change and the recipient can be told the change came from the GM.

### Component work this story implies

- **A table component.** `custom-ui/layout/` has none. Borderless, icon-only headers, horizontally scrollable, per-cell tap targets, row colouring and de-emphasis.
- **The tap-tooltip clone** described above.
- **The adjust-value modal**, reusable across every numeric field in the app.
- **`ICON_MAP` additions** for Might, Speed, Intellect, Initiative, Level, XP, Recovery, and each condition state — **done**, along with the three GM tab icons. An unmapped name still renders **nothing, silently**, so any concept added later needs its entry first.
- **Tab icons** for the GM page's three tabs, same constraint.

---

## 7. Dependencies & Deferred

> **Transient section.** Delete once extracted into feature cards.

### Depends on

| Dependency                                             | Notes                                                                                                                                                    |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The in-play character sheet**                        | §5.7 makes the GM's sheet view _be_ the in-play sheet. Defined in _Player playing a session_. This is the hardest prerequisite in this document.         |
| **Form-validation UI components**                      | Missing from `custom-ui/`. In development on a branch in a different project; to be manually ported at implementation time so they can be used verbatim. |
| **Player-side initiative reporting**                   | The GM's table fills from it. Defined in _Player playing a session_.                                                                                     |
| **Player-side intrusion accept/refuse and XP gifting** | Defined in _Player playing a session_.                                                                                                                   |
| **Field-level patches with an actor tag**              | Extends the sync contract from _Player creating a character_ §5.5.                                                                                       |

### Explicitly deferred

| Deferred                                        | Rationale or destination                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Player-visible initiative order                 | **Withdrawn, not deferred.** Deliberately withheld — see _Player playing a session_ §5.5 |
| Creature bestiary or add-creature autocomplete  | Ranked below basic coverage                                                              |
| Round counter                                   | Nothing depends on round number; a counter that can desync is worse than none            |
| Temporary conditions                            | Will occupy the condition column; introduces the first persisted condition state         |
| Markdown or structured GM notes                 | If notes outgrow a scratchpad, that is a documentation system, not a bigger textarea     |
| Persisted event log / `sessionStorage` survival | Only if the provisional log proves useful                                                |
| Long-press-to-repeat on the adjust modal        | Only if multi-tap proves tedious                                                         |

### Recorded risks

- **A mistyped NPC target number can only be fixed by restarting initiative**, which re-prompts every player. Lower stakes than the old per-creature initiative risk it replaces, since it is one field entered once rather than one per creature — but it is the same shape of problem, and the same eventual fix (make it editable) applies if it bites.

  _Resolved by the band model:_ the previous risk here — that creature initiative was set at creation and never editable, with delete-and-re-add as the workaround — no longer exists. Creatures have no initiative value.

- **The event log dies on browser reload.**
- **Cypher overload is invisible until it has already happened** — there is no approaching-limit warning.
- **Local write queueing from the previous story's §5.5 applies to GM data too**, on the same resolved terms: ordered per-device replay and last-write-wins per field path, with intrusion resolution handled as a **server-side command** because it moves XP between two character records.
