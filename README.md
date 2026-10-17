# TopDownSoloRPG

A single-player, top-down RPG prototype built with plain JavaScript, HTML, CSS, and the Canvas API. Explore a fantasy village, equip your adventurer, and fight creatures using targeted spells.

## Play locally

The game uses native JavaScript modules and must be served over HTTP. Keep the source files and images together. No dependency installation or build step is required.

On Windows, run this from the project folder:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\serve.ps1
```

Open **http://localhost:8000** in a modern desktop browser. Press **Ctrl+C** in the server terminal to stop it. The included development server listens only on your own computer; use `-Port 8080` if port 8000 is occupied.

Your editor's local web server also works. Opening `index.html` directly with a `file://` URL no longer loads the module-based game.

## What you can do

- Explore the map, cross bridges, and navigate around water, cliffs, and tree trunks.
- Equip weapons and armor from your inventory and inspect your character's attributes.
- Target green slimes, red slimes, and wolves, then cast Fireball or Ignite.
- Equip the Iron Sword and use Sword Strike (default key **3**) against nearby enemies. It costs no mana and has a 0.6-second cooldown.
- With the sword equipped, use Charge (**4**) on an enemy at least 150 pixels away. Rush into melee range and stun it for 2 seconds. Charge costs no mana, stops at obstacles, and has a 20-second cooldown that resets whenever an enemy dies.
- Arrange spells on the action bar using the spell book and drag-and-drop.
- Earn XP from enemies and quests, level up, and spend attribute points.
- Restart a fresh adventure after your character dies.
- Visit the General Store at the map center. Click the house nearby or press **E** at its entrance to buy equipment with gold. Gameplay pauses while shopping; press **E**, **Escape**, or Close to leave.

## Your first adventure

1. Click **Start game** or press **Space**.
2. Press **C** to open your character sheet, then click the **Apprentice Staff** in your inventory. Equipping it completes **Ready for Adventure** and grants **20 XP**.
3. **Slime Trouble** then starts automatically. Defeat three green slimes to earn an additional **75 XP and 20 gold**, alongside their normal kill XP.
4. Click an enemy to select it, then press **1** for Fireball or **2** for Ignite. Both spells require a casting weapon, such as the staff.

Quest progress appears in the quest panel, and combat messages appear in the message log. Enemies respawn after being defeated.

Fireball has a 320-pixel range and a 0.5-second cooldown; Ignite has a 240-pixel range and a 2-second cooldown. Cliffs and tree trunks block spells, while water does not. Moving, taking damage, pressing Escape, changing weapons, or losing a valid target interrupts Fireball before release without spending mana. Recasting Ignite refreshes its duration without stacking damage or postponing the next tick. Hover over action-bar spells for details.

## Controls

| Action | Control |
| --- | --- |
| Start or restart after death | Space or the on-screen button |
| Move | WASD or arrow keys |
| Open or close character sheet | C |
| Open or close spell book | K |
| Select an enemy | Left-click the enemy |
| Open the shop nearby | E or click the building |
| Close the shop | E, Escape, or Close |
| Cast an assigned spell | 1–9 and 0, or click its action-bar slot |
| Equip an item | Click it in the character sheet's inventory |
| Unequip an item | Click its equipment slot |
| Assign a spell | Drag it from the spell book to the action bar |
| Move or swap action-bar spells | Drag between action-bar slots |
| Remove an action-bar spell | Right-click its slot |

## Project structure

Spells and attacks use permanent five-digit string IDs, in a separate namespace from items:

| ID | Spell or attack |
| --- | --- |
| `00001` | Fireball |
| `00002` | Ignite |
| `00003` | Sword Strike |
| `00004` | Charge |

Assign the next unused ID when adding an ability; never renumber existing IDs or reuse retired ones.

| File | Purpose |
| --- | --- |
| `index.html`, `style.css` | Page layout, menus, and interface styling |
| `game.js` | Module initialization and the main loop |
| `state.js`, `lifecycle.js` | Shared session data and start/death/restart transitions |
| `player.js`, `update.js` | Player progression, damage, regeneration, and simulation updates |
| `input.js`, `targeting.js` | Keyboard/mouse bindings and enemy selection |
| `canvas.js`, `renderer.js` | Canvas sizing, camera, and world rendering |
| `character-ui.js`, `screens.js` | Character sheet, resource HUD, and start/death screens |
| `player-sprites.js`, `enemy-renderer.js` | Character sprites and enemy rendering |
| `stats.js` | Shared stat formulas, resource limits, spell damage, and defense |
| `events.js`, `messages.js`, `tooltips.js` | UI notifications, message log, and immediate tooltips |
| `world.js`, `world-state.js` | World definitions, scenery instances, and boundary data |
| `buildings.js`, `building-renderer.js` | Building definitions, interaction, and drawing |
| `shops.js`, `shop-ui.js` | Purchase rules and shop interface |
| `collision.js`, `movement.js` | Geometry checks and entity movement |
| `enemy-types.js`, `enemies.js` | Enemy definitions, AI, damage, death, and respawning |
| `slime-sprites.js` | Green and red slime sprite-sheet frames and animation |
| `items.js`, `inventory.js`, `equipment.js` | Item definitions, inventory actions, and equipment bonuses |
| `inventory-ui.js` | Inventory/equipment interface and item tooltips |
| `action-definitions.js`, `spells.js` | Ability definitions, casting, projectiles, charge, and damage over time |
| `spellbook.js`, `actionbar.js` | Spell selection and action-bar controls |
| `quests.js` | Quest definitions, prerequisites, objectives, and rewards |
| `quest-system.js`, `quest-ui.js` | Quest progress, completion, and display |
| `*.png` | Map and sprite assets |
| `todo.md` | Numbered development tasks and verification checklist |
| `AGENTS.md` | Guidelines for coding agents working on the project |

Modules declare dependencies with `import`/`export`; they do not expose gameplay globals on `window`. Gameplay changes notify UI modules through `events.js`. See [docs/architecture.md](docs/architecture.md) for the dependency and event conventions.

## Verification

With the local server running, open **http://localhost:8000/tests/smoke.html**. The browser runs gameplay checks in a separate game frame and displays a PASS/FAIL result. Checks cover startup, input, equipment and stats, quests, spells and melee attacks, shop purchases, tooltips, sprites, and death/restart behavior.

## Development status

Hover over stats in the character sheet for explanations. Strength increases maximum health, Dexterity increases movement speed, Vitality improves health regeneration, and Intelligence improves mana regeneration. Equipment bonuses count toward these effects.

This is an evolving prototype. Progress is kept in memory: reloading the page or restarting after death resets the adventure. Saving and attribute-based spell damage are not implemented yet. See [todo.md](todo.md) for planned improvements.
