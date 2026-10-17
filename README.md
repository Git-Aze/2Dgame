# TopDownSoloRPG

A single-player, top-down RPG prototype built with plain JavaScript, HTML, CSS, and the Canvas API. Explore a fantasy village, equip your adventurer, and fight creatures using targeted spells.

## Play locally

The game uses native JavaScript modules and must be served over HTTP. Keep the folder structure intact. No dependency installation or build step is required.

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
- Visit the General Store at the map center. Click the house nearby or press **E** at its entrance to buy equipment with gold. Gameplay pauses while shopping; press **E** or Close to leave, or **Escape** to switch to the pause menu.

## Your first adventure

1. Click **New game** or press **Space**.
2. Press **C** to open your character sheet, then click the **Apprentice Staff** in your inventory. Equipping it completes **Ready for Adventure** and grants **20 XP**.
3. **Slime Trouble** then starts automatically. Defeat three green slimes to earn an additional **75 XP and 20 gold**, alongside their normal kill XP.
4. Click an enemy to select it, then press **1** for Fireball or **2** for Ignite. Both spells require a casting weapon, such as the staff.

Quest progress appears in the quest panel, and combat messages appear in the message log. Enemies respawn after being defeated.

Fireball has a 320-pixel range and a 0.5-second cooldown; Ignite has a 240-pixel range and a 2-second cooldown. Cliffs and tree trunks block spells, while water does not. Moving, taking damage, changing weapons, or losing a valid target interrupts Fireball before release without spending mana. Escape pauses an active cast along with the game. Recasting Ignite refreshes its duration without stacking damage or postponing the next tick. Hover over action-bar spells for details.

## Controls

| Action | Control |
| --- | --- |
| Start or restart after death | Space or the on-screen button |
| Move | WASD or arrow keys |
| Open or close character sheet | C |
| Open or close spell book | K |
| Select an enemy | Left-click the enemy |
| Open the shop nearby | E or click the building |
| Close the shop | E or Close; Escape switches to the pause menu |
| Pause or continue | Escape, or Continue in the pause menu |
| Cast an assigned spell | 1–9 and 0, or click its action-bar slot |
| Equip an item | Click it in the character sheet's inventory |
| Unequip an item | Click its equipment slot |
| Assign a spell | Drag it from the spell book to the action bar |
| Move or swap action-bar spells | Drag between action-bar slots |
| Remove an action-bar spell | Right-click its slot |

## Saving and loading

During play, press **Escape** to open the pause menu. **Continue** or Escape resumes play; **Save** stores your adventure in this browser and **Export** downloads a portable JSON backup. **Load** offers the browser save or a JSON file import. Successful loading resumes play; saving, exporting, and invalid imports leave the menu paused. **Restart** begins a fresh adventure and preserves the stored save. **Settings** is a disabled placeholder. Saving is manual; progress since your last save is not automatically stored.

On the start or death screen, **Continue** loads your saved adventure. **Import save** loads an exported JSON file; press Save afterward if you want to keep the imported adventure in browser storage. Invalid or unsupported files show an error without changing your adventure. Version 1 is the first supported format; other versions are rejected until explicit migrations are added.

Saves include level, XP, base attributes, unspent points, gold, health/mana, inventory, equipment, quest progress/completed rewards, and action-bar assignments. Loading recalculates derived stats and places you at the starting spawn with fresh enemies. Position, enemy state, cooldowns, projectiles, and active casts are not saved.

Death still offers a fresh restart, or Continue from your last save. New Game/restart does not erase the stored save; pressing Save in the new adventure replaces it. The previous valid browser save is retained as a backup and used if the current one becomes unreadable.

Browser saves belong to this browser profile and exact site address: different ports have separate saves. Clearing browser data removes them. Use Export save for backups or to move progress between browsers. No account or backend is required.

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
| `index.html`, `styles.css` | Page layout, menus, and interface styling |
| `src/game.js` | Module initialization and the main loop |
| `src/persistence/saves.js`, `src/ui/save-ui.js` | Versioned snapshots, validation, storage/backup recovery, and save/load controls |
| `src/core/state.js`, `src/core/lifecycle.js` | Shared session data and start/death/restart transitions |
| `src/player/player.js`, `src/core/update.js` | Player progression, damage, regeneration, and simulation updates |
| `src/core/input.js`, `src/combat/targeting.js` | Keyboard/mouse bindings and enemy selection |
| `src/rendering/canvas.js`, `src/rendering/renderer.js` | Canvas sizing, camera, and world rendering |
| `src/ui/character-ui.js`, `src/ui/screens.js` | Character sheet, resource HUD, and start/death screens |
| `src/rendering/player-sprites.js`, `src/rendering/enemy-renderer.js` | Character sprites and enemy rendering |
| `src/player/stats.js` | Shared stat formulas, resource limits, spell damage, and defense |
| `src/core/events.js`, `src/ui/messages.js`, `src/ui/tooltips.js` | UI notifications, message log, and immediate tooltips |
| `src/world/world.js`, `src/world/world-state.js` | World definitions, scenery instances, and boundary data |
| `src/world/buildings.js`, `src/rendering/building-renderer.js` | Building definitions, interaction, and drawing |
| `src/shops/shops.js`, `src/ui/shop-ui.js` | Purchase rules and shop interface |
| `src/world/collision.js`, `src/world/movement.js` | Geometry checks and entity movement |
| `src/data/enemy-types.js`, `src/combat/enemies.js` | Enemy definitions, AI, damage, death, and respawning |
| `src/rendering/slime-sprites.js` | Green and red slime sprite-sheet frames and animation |
| `src/data/items.js`, `src/player/inventory.js`, `src/player/equipment.js` | Item definitions, inventory actions, and equipment bonuses |
| `src/ui/inventory-ui.js` | Inventory/equipment interface and item tooltips |
| `src/data/action-definitions.js`, `src/combat/spells.js` | Ability definitions, casting, projectiles, charge, and damage over time |
| `src/ui/spellbook.js`, `src/ui/actionbar.js` | Spell selection and action-bar controls |
| `src/quests/quests.js` | Quest definitions, prerequisites, objectives, and rewards |
| `src/quests/quest-system.js`, `src/ui/quest-ui.js` | Quest progress, completion, and display |
| `assets/images/*.png` | Map and sprite assets |
| `todo.md` | Numbered development tasks and verification checklist |
| `AGENTS.md` | Guidelines for coding agents working on the project |

Modules declare dependencies with `import`/`export`; they do not expose gameplay globals on `window`. Gameplay changes notify UI modules through `src/core/events.js`. See [docs/architecture.md](docs/architecture.md) for the dependency and event conventions.

## Verification

With the local server running, open **http://localhost:8000/tests/smoke.html**. The browser runs gameplay checks in a separate game frame and displays a PASS/FAIL result. Checks cover startup, input, equipment and stats, quests, spells and melee attacks, shop purchases, tooltips, sprites, and death/restart behavior.

Collision checks in `tests/collision-checks.js` also cover player and enemy footprints against map terrain, tree trunks, buildings, world boundaries, bridges and the dock, plus fast movement, sliding, and enemy AI movement. Controlled fixtures are restored after the checks.

## Development status

Hover over stats in the character sheet for explanations. Strength increases maximum health, Dexterity increases movement speed, Vitality improves health regeneration, and Intelligence improves mana regeneration. Equipment bonuses count toward these effects.

This is an evolving prototype. Save manually to keep progress between sessions. Autosaving, persistent world changes, and attribute-based spell damage are not implemented yet. See [todo.md](todo.md) for planned improvements.
