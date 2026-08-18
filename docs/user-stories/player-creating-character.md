# Player Creating a Character

## 1. Persona & Context

**Who:** A player in a Cypher System campaign, part of a small trusted group.

**Device:** A tablet. Mobile devices are first-class users of this app, not a responsive afterthought. The layout must work in portrait on a phone-width viewport.

**Environment:** A locally hosted server on the group's network. There is no login, no accounts, and no per-user authentication — security is deliberately minimal because the deployment is trusted and local. Each participant owns their own device, and a device is effectively "claimed" by whoever uses it.

**Prior state:** The player has already built their character using an external tool or the printed rulebook. They are not making choices here — they are transcribing a finished character into the app. The app carries no built-in reference data for descriptors, types, or foci in this phase, so every value is typed by hand.

**Frequency:** Once per character. This is a one-time flow, distinct from playing the character and from levelling it up later.

---

## 2. Narrative

I open the main page for CypherDM on my tablet. There is a fixed hamburger menu in the top-right corner; I use it to switch the theme from dark to light. The hamburger holds only the theme toggle and a link home — everything else lives in the page content.

On the home page I can see the option to enter GM mode and a searchable list of existing characters. I glance past both and tap the button to create a new character.

I see a version of the character sheet where every section is editable, rather than the play version where most sections are locked and reorganised for glanceability. It is laid out as tabs. I work through it in order.

On the first tab I type my character's name and pick a colour that will identify me at a glance on the GM's party dashboard. Below that I fill in my descriptor, type, and focus as three separate fields. I enter the maximum value and Edge for each of my pools — Might, then Speed, then Intellect. I see that I am a tier 1 character with Effort 1 and 0 XP; all three are editable, but the defaults are right, so I skip them. My recovery roll is 1d6 + 1; the bonus is editable and I leave it. Beneath it I can see the four recovery slots and the damage track, greyed out — they are not editable here, but seeing them tells me what the sheet will look like in play.

I move to the Skills & Abilities tab and use the familiar dynamic list to add my skills one at a time, typing the fields for each. There are no create, save, or revert buttons on these item forms — in this app every change saves automatically. I add my special abilities to their own list the same way.

On the Equipment tab I find my attacks, my armour, and my equipment. My currency sits at the top of the equipment list. I add each item in turn. My armour is a single entry, not a list — I have one suit, and I record its weight class, the Armor points it gives me, and the extra Speed it costs me per level of Effort.

Finally I open the Cyphers tab, set my cypher limit, and add the cyphers I am carrying. There is a Notes tab past that for anything else I want to record.

Fixed at the bottom of the viewport is an indicator telling me my character was saved, and when. Satisfied that my sheet is complete, I close the browser until my play session.

---

## 3. Screens & Elements

### 3.1 Home page

The only navigation hub in the app. All routes are reached from its content.

| Element                           | Behaviour                                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hamburger menu (fixed, top-right) | Contains exactly two items: **theme toggle** (dark/light) and **home**. No page registry.                                                                           |
| GM mode entry                     | Enters the GM dashboard.                                                                                                                                            |
| Character search + list           | Filterable list of existing characters; tapping one opens its sheet and claims that seat. A character already claimed by another connected client renders disabled. |
| Create new character              | Enters the creation layout with an empty character.                                                                                                                 |

**Last-destination memory.** The app remembers the last destination the device visited — a specific character _or_ GM mode — and **auto-redirects there on load**. For a character, that memory is also a **claim on the seat**: the device is that character, and the app reports it as connected. The hamburger's home link is the escape hatch back to the picker, releasing the seat. A device with no stored destination (first visit) lands on the home page. See §5.7.

### 3.2 Creation layout

Five tabs. Every value on every tab is editable except where noted as an inert preview.

#### Tab bar

- The **active** tab shows its icon **and** its label.
- **Inactive** tabs show their icon only.
- This keeps five tabs legible on a portrait phone viewport.

| Tab                    | Contents                                                |
| ---------------------- | ------------------------------------------------------- |
| **Overview**           | Identity, pools, tier/effort/XP, recovery, damage track |
| **Skills & Abilities** | Skills list, special abilities list                     |
| **Equipment**          | Attacks list, armour sub-form, equipment list           |
| **Cyphers**            | Cypher limit, cypher list                               |
| **Notes**              | Free-text notes                                         |

#### Tab 1 — Overview

Field order, top to bottom:

1. **Character name** + **colour swatch** (single row)
2. **Descriptor**, **Type**, **Focus** — three separate text inputs
3. **Pools** — one row per pool, in order Might, Speed, Intellect: `[Max] Edge [n]`
4. **Tier**, **Effort**, **XP** — editable integers, defaults 1 / 1 / 0
5. **Recovery** — `1d6 + [bonus]`, with the four recovery slot checkboxes rendered **inert**
6. **Damage track** — rendered as an **inert preview**

Not rendered at all during creation: the **advancement checkboxes**, and the **current** value of each pool.

#### Tab 2 — Skills & Abilities

Two dynamic lists, in order: **Skills**, then **Special Abilities**. Item forms have no create/save/revert buttons.

#### Tab 3 — Equipment

In order:

1. **Attacks** — dynamic list
2. **Armour** — a **single fixed sub-form**, not a list. Always present, no add/remove.
3. **Equipment** — dynamic list, whose **first item is the currency row**: a pinned hybrid currency/equipment component that cannot be deleted or reordered and shows no delete affordance.

#### Tab 4 — Cyphers

**Cypher limit** as an editable integer in the tab header, above the cypher dynamic list.

#### Tab 5 — Notes

Free-text notes.

### 3.3 Dynamic list interactions

Applies to every list on the sheet (skills, abilities, attacks, equipment, cyphers):

- **Add** — appends a new blank item; fields are filled inline.
- **Edit** — inline, autosaved. No create/save/revert buttons on item forms.
- **Delete** — a per-row trash icon in the item header, gated behind a confirmation dialog. Required because autosave means there is no revert to undo a mistake.
- **Reorder** — drag-based; the resulting order is persisted on the character.

### 3.4 Save indicator

Fixed to the bottom of the viewport. The only feedback the player receives that their work is persisting.

| State  | Display                                      |
| ------ | -------------------------------------------- |
| Saved  | Timestamp of the last successful write       |
| Failed | A persistent, visually prominent error state |

On failure the client **auto-retries** and **queues changes locally until it reconnects**. There is no transient "Saving…" state.

---

## 4. Data Touched

### 4.1 Written by this flow

Character name, colour, descriptor, type, focus, pool maxima and Edge (×3), tier, effort, XP, recovery bonus, skills, special abilities, attacks, armour, equipment, currency, cypher limit, cyphers, notes.

Current pool values are **initialised to their maxima** and never surfaced in this layout.

### 4.2 Read but not written

Damage track (strictly derived), recovery slots (initialised unused), advancement checkboxes (not rendered).

### 4.3 Fields this story adds to the design spec

The design spec's §3.1 does not cover these. All are required.

| Field            | Shape         | Notes                                                                                                 |
| ---------------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| **Name**         | String        | §3.1 defines the identity string as Descriptor/Type/Focus only; the character's own name is missing.  |
| **Colour**       | Colour value  | Player-picked at creation. Identifies the character on the GM party dashboard.                        |
| **Tier**         | Integer       | Referenced throughout the rules but absent from §3.1. Defaults to 1.                                  |
| **Cypher limit** | Integer       | Required by the GM dashboard's "cypher count vs. limit" alert.                                        |
| **Currency**     | `{ amount }`  | Displayed as the pinned first row of the equipment list.                                              |
| **Notes**        | String        | Free text, own tab.                                                                                   |
| **Advancement**  | Five booleans | The five advancement steps; four purchases raise the tier. Persistent state, not touched by creation. |

### 4.4 Fields this story changes in the design spec

**Armour becomes singular.** §3.1 defines Armor as an array. It is instead a single object:

```
Armour: {
  name:          String   // amended in: required by the in-play row template
  description:   String   // amended in: was `descriptor`, now free text
  points:        Integer  // Armor value contributed by the worn suit
  speedPenalty:  Integer  // extra Speed cost per level of Effort
}
```

A character wears one suit of armour. Their **total Armor value is derived** — the worn suit plus any bonuses granted by special abilities and cyphers, which already live in their own arrays. The original list-vs-single framing was the wrong axis: armour is singular; armour _value_ is a sum.

> **Amended by _Player playing a session_ §5.14.** "Descriptor" is now reserved as the rules term for the character's Descriptor and retired as an attribute name. Armour, attacks, and equipment all carry a free-text `description` instead; cyphers carry `type` and `effect`; skills carry `proficiency` rather than `type`.

**Attacks gain nothing.** No modifier or skill-level field, since the starter set's pre-built characters are trained on the weapons they carry. Revisit if a later story needs it.

---

## 5. Design Decisions

### 5.1 Three distinct layouts, not one

Character creation, in-play, and post-play edit (levelling) are **separate layouts**. They may share app-level layout primitives, but in-play carries the bulk of the custom UI work: only key stats like pool values get dedicated interaction controls, and sections are reorganised for visual clarity and screen-space efficiency.

### 5.2 Shared information architecture, divergent affordances

The alternative considered was replicating the play UI in creation and editing every value through a modal. Rejected:

- Creation is roughly 14 scalar fields plus 10–20 list items. Tap → modal → type → confirm → dismiss turns a 14-tap job into 60–100 interactions.
- Modals fight the soft keyboard. An inline form keeps the keyboard up and lets the player walk the fields; a modal tears it down and rebuilds it on every field. This is the specific thing that makes bulk entry unpleasant on a tablet.
- Modals are designed for _change one thing_; creation is _change everything_.

The cohesion benefit of the rejected option is preserved by a constraint rather than by sharing a layout:

> **Both layouts hold the same information architecture** — same tabs, same section order, same labels, same section chrome. Only the _affordances_ differ: creation renders inline inputs, play renders typographic display plus dedicated controls.

Switching modes should read as _"the fields woke up"_, not _"a different app"_. Implementation follows from this: section components take a mode prop rather than being forked.

**The governing rule this produces:**

> **Bulk entry is inline. Targeted single-field edits are modal.**

This gives the modal pattern its proper home — mid-session "adjust this pool value right now" genuinely is a single targeted edit under time pressure — instead of making it the universal editing mechanism.

> **Amended by _Player playing a session_ §5.2.** This rule originally named "in-play edit" as a third mode. It is not one. There are **two** modes — play and edit — and what this story called in-play edit turned out to be a capability rather than a layout: the adjustment modal on points and XP, direct entry on currency, give/remove and add on equipment. The rule itself survives; the parenthetical naming a mode does not.

### 5.3 Inert previews of play-only elements

Play-only elements split by kind:

- Play-only **displays** (damage track) render as inert previews.
- Play-only **interactions** (recovery slot checkboxes) also render, but inert.

Both cost zero interactions and teach the sheet's anatomy, reinforcing the shared skeleton from §5.2. Advancement checkboxes are the exception — they are not rendered at all, since they are meaningless before play has happened.

### 5.4 Colour now, portraits later

A colour swatch was chosen over a portrait upload for this phase: it buys most of the GM-dashboard scanning benefit for one field's worth of work, with no file upload, storage, size limits, or placeholder handling.

The two systems **coexist** rather than one replacing the other. When portraits arrive, a character's colour can be derived from the image palette, and some UI still reads better with a colour identifier than with an image competing for space.

### 5.5 Autosave, and what it costs

Character data autosaves. There are no save, create, or revert buttons anywhere on the sheet.

- **Trigger:** debounced while typing (~750ms–1s), flushed immediately on blur. Blur-only would lose a value typed just before the player closes the tablet.
- **Partial values persist.** A half-typed name or a partially-filled skill row is written. Acceptable: there is no validation gate and no consumer of a half-created character.
- **Granularity: field-level patches.** Whole-object writes were chosen first for simplicity, then reversed. During play the **GM writes directly into player sheets** (pushing a cypher or loot per spec §4.2), so concurrent writers genuinely exist. A whole-object write from a player who loaded the sheet before the GM's push would silently erase it. Field-level patches surface the collision immediately and cost at most one field. This also makes the offline queue a replayable ordered list of changes rather than a stack of full snapshots.

  Two consequences settled during planning: **list items are addressed by a server-assigned identifier**, never by array position, so a concurrent reorder cannot redirect a patch onto the wrong row; and **operations that write to two character records are server-side commands rather than pairs of patches**, so giving an item or resolving an intrusion cannot half-land.

- **Failure handling:** a persistent error state, auto-retry, and local queueing until reconnect. On a local server latency is negligible but _dropout_ is real — a tablet wandering off wifi mid-session is the failure mode that matters, and a stale "Saved" timestamp would quietly lie about it.

**Resolved.** Local queueing makes the client a temporary source of truth, which pulls against the real-time sync requirement in spec §4.1. The answer, settled before implementation: each device keeps a **FIFO queue with a client sequence number** and replays it in order on reconnect; conflicts resolve **last-write-wins per field path**, with no rejection and no merge interface; and the two operations that span two records are **commands rather than patches**. Losing a collision costs one field, which is what makes the rule tolerable.

### 5.6 Delete requires confirmation because autosave removed the safety net

With no revert, a deletion is irreversible the moment it lands. Hence the per-row trash icon behind a confirmation dialog — the one destructive affordance that survives on item forms that otherwise have no buttons at all.

### 5.7 One device, one seat

Auto-redirect to the last destination assumes each participant owns their device. It removes four taps per person at the start of every session. Handing a tablet to another player is recoverable through the hamburger's home link, which is why that link exists at all.

**Opening a character claims it.** The destination is not merely remembered — it is an identity. A device that opens a character sheet _is_ that character for as long as it holds the seat, and that claim is what the app reports as the character's connection state. There is no login, so the seat is the whole of the identity model.

**A claimed seat cannot be claimed twice.** The home page disables the button for any character already held by another connected client. This is what keeps the model honest: without it two devices could hold one character and connection state would mean nothing. It also makes the GM's occasional trip into a player's sheet from the home page safe — that trip _is_ an assumption of the character's identity, which is acceptable outside a session and blocked during one.

GM mode is its own destination and claims no seat, so the GM's dashboard and the GM's in-dashboard view of a sheet never register a character as connected.

---

## 6. Conventions Established / Rules Amended

> **Transient section.** These belong in `.claude/rules/client.md` and in implementation cards. Delete once extracted.

1. **Hamburger menu is not a page registry.** `client.md` currently requires every new page to be registered in `app-ui/hamburger-menu.mjs`. That rule is superseded: the hamburger holds only the theme toggle and a home link, and all navigation flows through home page content.

2. **The `custom-ui/` freeze is lifted for additive changes.** The dependency on `custom-ui/` as a shared mirrored library has been removed. Additions are permitted; a future re-share reconciles differences, which stays tractable as long as changes are additive rather than reworking existing component behaviour. `lib-sync.mjs` remains untouched.

3. **Delete-button placement for autosaved `DynamicList` item forms.** Autosaved item forms carry no create/save/revert row. Delete is a per-row trash icon in the item header, gated behind a `showDialog` confirmation.

4. **Save/Revert is retired for character data only.** Character data autosaves. GM configuration surfaces retain the documented `useFormRecord` / `formButtonStates` Save/Revert pattern — an explicit commit is worth having where a mistyped value has broad blast radius.

### Component work this story implies

- **`TabPanels`** (`custom-ui/nav/tab-panels.mjs`) needs an `icon` field on its tab shape and the active-shows-label / inactive-shows-icon-only behaviour. It currently accepts `{ id, label, content }` with no icon support.
- **`ICON_MAP`** (`custom-ui/layout/icon.mjs`) — **done.** The five tab icons, the three pool stats, and every other concept these stories name have been added, with the reused-key choices recorded as comments so the mapping decisions stay traceable. A name absent from the map still renders **nothing, silently**, so any future concept needs its entry before it is referenced.
- A **hybrid currency/equipment item component** for the pinned first row of the equipment list.
- A **single-armour sub-form** for the Equipment tab.

---

## 7. Dependencies & Deferred

> **Transient section.** Delete once extracted into feature cards.

### Depends on

- **Currency display name comes from GM data.** The GM specifies what the campaign's currency is called; `"currency"` is the generic fallback until that GM-side configuration exists. This story ships with the fallback. _GM running a session_ specifies that configuration surface.

### Explicitly deferred to other stories

| Deferred                                            | Goes to                                                           |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| In-play layout and interactions                     | _Player playing a session_                                        |
| In-play edit (quick add mid-session, modal pattern) | **Dissolved** — never a mode; see _Player playing a session_ §5.2 |
| Post-play edit / levelling, advancement checkboxes  | _Player playing a session_ §3.8 (edit mode)                       |
| GM writing into a player sheet                      | _GM running a session_                                            |
| GM party dashboard, colour-coded grid               | _GM running a session_                                            |
| Portrait images                                     | Future phase                                                      |
| Built-in descriptor/type/focus reference data       | Future phase                                                      |
| Attack modifiers / skill level                      | Revisit if a later story needs it                                 |

### Companion stories planned

_GM running a session_ (written) · _Player playing a session_ (written — covers the in-play sheet, edit mode, Effort, initiative, intrusions, and cyphers)

All originally planned companion stories are now written. _Player handles a combat_ and _Player handles an intrusion_ were absorbed into _Player playing a session_, which cuts the vertical slice through one session rather than splitting it per interaction.

**Superseded by this story's own decisions:** the delete-character button described in _GM running a session_ §3.5 lives at the bottom of this sheet's Overview tab in **edit mode**, and is the player's action. The GM's separate "Remove from session" control is GM-view only.
