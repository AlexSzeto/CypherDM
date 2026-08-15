# Cypher System Web Companion - Functional Design Specification

## 1. Overview

This document outlines the functional requirements for a locally hosted, real-time web application to support gameplay for the Cypher System (Starter Rules). The application acts as a synchronized hub, providing an interactive character sheet for players and an overwatch/management dashboard for the Game Master (DM). The interface is tailored for new players, providing persistent tooltips and UI elements that explain core mechanics to minimize rulebook referencing.

## 2. Core Game Mechanics & UI Tooltips

Because the coding agent may lack full context of the ruleset, the UI must surface these mechanical rules directly. The following text/logic should be implemented as tooltips, modal popups, or persistent helper text near the relevant UI components.

- **Applying Effort:** "Applying one level of Effort lowers the difficulty of a task by one step. The first level of Effort costs 3 points from the relevant pool. Each additional level costs 2 points. _Always subtract your Edge in that stat from the total cost before spending points._"
- **Spending XP:** "Spend 1 Experience Point (XP) to reroll any d20 roll. You must take the new result." _(Note: Keep it simple for the starter set)._
- **Recovery Rolls:** "A recovery roll restores points to your stat pools. You heal 1d6 + your Recovery Bonus. You get four recovery rolls per day, taking increasing amounts of time: 1 Action, 10 Minutes, 1 Hour, 10 Hours."
- **Damage Track:**
  - _Hale:_ Normal state. No penalties.
  - _Impaired:_ "Applying Effort costs 1 extra point per level. You ignore minor and major effect results on rolls of 19 or 20." _(Triggered when 1 stat pool reaches 0)._
  - _Debilitated:_ "You can only move an immediate distance. You cannot take standard actions." _(Triggered when 2 stat pools reach 0. If all 3 reach 0, the character is Dead)._
- **Abilities:** "Abilities cost points from your stat pools to activate. Subtract your Edge from the cost. **Actions** require your turn to use. **Enablers** happen automatically as part of another action and do not take up your turn."
- **Skills:**
  - _Trained:_ "Reduces the difficulty of a task by 1 step."
  - _Inability:_ "Increases the difficulty of a task by 1 step."

## 3. Data Requirements & State Management

The server must maintain a unified state for each character. Below are the required data properties.

### 3.1 Character Object

- **Identity String:** `Descriptor`, `Type`, `Focus`.
- **Pools:** Three objects (Might, Speed, Intellect). Each contains:
  - `Max Value` (Integer)
  - `Current Value` (Integer)
  - `Edge` (Integer)
- **Effort:**
  - `Current Effort Limit` (Integer - maximum levels of effort applicable at once)
  - _Derived UI state:_ The adjusted cost dynamically calculated based on current damage track and applied edge.
- **Experience Points (XP):** `Total` (Integer).
- **Recovery Rolls:**
  - `Bonus` (Integer)
  - `Used Rolls` (Array of Booleans/Checkboxes: [Action, 10 Min, 1 Hour, 10 Hour])
- **Damage Track:** _Strictly Derived Value_.
  - If 0 pools = 0: Hale.
  - If 1 pool = 0: Impaired.
  - If 2 pools = 0: Debilitated.
  - If 3 pools = 0: Dead.
- **Skills:** Array of objects.
  - `Name` (String)
  - `Type` (Enum: Trained, Inability)
  - `Source` (String: Descriptor, Type, or Focus)
  - `Description/Label` (String)
- **Special Abilities:** Array of objects.
  - `Name` (String)
  - `Source` (String: Descriptor, Type, or Focus)
  - `Cost` (Integer)
  - `Pool Type` (Enum: Might, Speed, Intellect)
  - `Execution` (Enum: Action, Enabler)
  - `Description` (String)
- **Attacks:** Array of objects.
  - `Name` (String)
  - `Descriptors` (String - e.g., Light, Medium, Heavy)
  - `Damage` (Integer)
- **Armor:** Array of objects.
  - `Value` (Integer)
  - `Descriptors` (String - e.g., Light, Medium, Heavy)
  - `Effort Cost Penalty` (Integer - armor makes speed effort more expensive)
- **Cyphers:** Array of objects.
  - `Name` (String)
  - `Level` (Integer or String/Die Roll)
  - `Descriptors` (String - e.g., Subtle, Fantastic)
  - `Description` (String)
- **Equipment:** Array of objects.
  - `Name` (String)
  - `Description` (String - Optional)

## 4. Functional Interfaces

### 4.1 Player Interface (Interactive Character Sheet)

- **Real-Time Sync:** Modifying any value (spending a pool point, checking a recovery box, gaining a Cypher) instantly updates the server state and reflects on the DM's dashboard.
- **Quick Pool Adjustments:** Large, tap-friendly `+` and `-` buttons for Current Pool values, as they change frequently during a session.
- **Derived Calculations:** The UI must automatically shift the Damage Track visual indicator when pool values reach 0, alerting the player of their Impaired/Debilitated status.
- **Helper Overlays:** Info icons (i) next to headers (Effort, Recovery, Damage Track, Abilities, Skills) that trigger the mechanical tooltips defined in Section 2.

### 4.2 DM Interface (Overwatch & Management)

- **Party Dashboard:** A high-level, read-only grid displaying all active players.
  - _Visible metrics:_ Current/Max Pools, Damage Track State, XP count, Cypher count vs. limit.
  - _Visual Alerts:_ Highlight players whose damage track drops below "Hale" or who exceed their Cypher limit.
- **DM to Player Interactions:**
  - **GM Intrusions:** A module to push an "Intrusion Alert" to a specific player's screen. The UI should prompt the player to either Accept (granting 1 XP to them, and 1 XP to distribute to another player) or Refuse (costing them 1 XP).
  - **Loot Distribution:** A form to create a Cypher or item and send it directly to a player's inventory without them needing to type it out.
- **Encounter/Lore Module (Optional but Recommended):** A basic markdown-supported scratchpad for the DM to track NPC levels (which govern Target Numbers) and custom campaign notes.
