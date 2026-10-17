# TopDownSoloRPG

A single-player, top-down RPG prototype built with plain JavaScript, HTML, CSS, and the Canvas API. Explore a fantasy village, equip your adventurer, and fight creatures using targeted spells.

## Play locally

Open `index.html` in a modern desktop browser. Keep the source files and images together in the project folder. No installation or build step is required.

You can also serve the folder with your editor's local web server and open its address in your browser.

## What you can do

- Explore the map, cross bridges, and navigate around water, cliffs, and tree trunks.
- Equip weapons and armor from your inventory and inspect your character's attributes.
- Target green slimes, red slimes, and wolves, then cast Fireball or Ignite.
- Equip the Iron Sword and use Sword Strike (default key **3**) against nearby enemies. It costs no mana and has a 0.6-second cooldown.
- With the sword equipped, use Charge (**4**) on an enemy at least 150 pixels away. Rush into melee range and stun it for 2 seconds. Charge costs no mana, stops at obstacles, and has a 20-second cooldown that resets whenever an enemy dies.
- Arrange spells on the action bar using the spell book and drag-and-drop.
- Earn XP from enemies and quests, level up, and spend attribute points.
- Restart a fresh adventure after your character dies.

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
| `game.js` | Game states, player, input, camera, rendering, and main loop |
| `stats.js` | Shared stat formulas, resource limits, spell damage, and defense |
| `tooltips.js` | Immediate hover and keyboard-focus tooltips |
| `world.js` | Map settings, scenery, collision regions, and spawn locations |
| `collision.js` | Background polygon collision checks |
| `enemies.js` | Enemy definitions, AI, damage, death, and respawning |
| `slime-sprites.js` | Green and red slime sprite-sheet frames and animation |
| `items.js`, `inventory.js` | Item definitions, inventory, and equipment |
| `spells.js` | Spell casting, projectiles, and damage-over-time effects |
| `spellbook.js`, `actionbar.js` | Spell selection and action-bar controls |
| `quests.js` | Quest definitions, prerequisites, objectives, and rewards |
| `quest-system.js`, `quest-ui.js` | Quest progress, completion, and display |
| `*.png` | Map and sprite assets |
| `todo.md` | Numbered development tasks and verification checklist |
| `AGENTS.md` | Guidelines for coding agents working on the project |

## Development status

Hover over stats in the character sheet for explanations. Strength increases maximum health, Dexterity increases movement speed, Vitality improves health regeneration, and Intelligence improves mana regeneration. Equipment bonuses count toward these effects.

This is an evolving prototype. Progress is kept in memory: reloading the page or restarting after death resets the adventure. Saving and attribute-based spell damage are not implemented yet. See [todo.md](todo.md) for planned improvements.
