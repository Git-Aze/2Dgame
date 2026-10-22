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

Press **Ctrl+M** to toggle collision borders for the current area, including while paused. Green outlines mark floor regions, red marks solid obstacles and scenery footprints, blue marks water, cyan marks bridges/crossings, yellow marks passages through solid scenery, and purple marks blocked tiles. Overlapping floor-region outlines show the component polygons; their shared edges do not block movement. The overlay follows the camera and area changes and is not stored in saves.

- Explore the map, cross bridges, and navigate around water, cliffs, and tree trunks.
- Enter the northeast cave by approaching its mouth and pressing **E**, or clicking it nearby. Explore its chambers, fight level-1 creatures, and loot them. Use the southwest cave exit to return to the village.
- The opening in the cave's northeast chamber leads to **Cave Arena**, home to **Stonehorn**. Press **E** or click nearby to enter. The southern corridor is safe; entering the arena floor starts the fight. Leave his red cleave circle and dodge his marked charge lane. Below half health he attacks faster. Retreat to the southern corridor to reset the encounter, or use its exit to return to the cave.
- Entering Cave Arena starts **The Arena Guardian** quest. Defeating Stonehorn grants 100 kill XP plus the quest's **150 XP and 50 gold**. His corpse always contains a **Rare Knight's Iron Sword** and **3 gold**. The boss stays defeated for the adventure, including after saving/loading. Full inventory leaves the sword on the corpse. A fresh restart resets the encounter and quest.
- Travel preserves your character and pauses enemies in the area you leave. Unlooted corpses stay in their own area. Saves restore the active area at its safe entrance with fresh enemies; older saves load in the village. Restart begins a fresh village adventure.
- Equip weapons and armor from your inventory and inspect your character's attributes.
- Target green slimes, red slimes, and wolves, then cast Fireball or Ignite.
- Your portrait shows your level. Selecting an enemy displays its portrait, name, level, and live health in a frame beside yours; the target frame disappears when selection is cleared or the enemy dies.
- Casting spells have a **1.5-second base cast time**. A gold bar above the action bar shows the spell and remaining time. Each hit pushes casting progress back by one sixth of the total cast time (0.25 seconds for a 1.5-second cast), down to zero. Moving or losing a valid target or weapon interrupts the cast without spending mana or starting its cooldown. Pausing freezes casting; melee and ranged weapon attacks remain instant.
- Red slimes shoot red slimeballs from up to **180 pixels** away, once per second. Shots travel straight toward your position when fired, so move aside to dodge. Walls, trees, and buildings block them. Slimes move to find line of sight; their shots use normal monster damage scaling and player armor.
- Direct attacks (Fireball, Sword Strike, and Ranged Attack) have a **5% base critical chance** and deal **double damage** on a crit. Casting Fireball while its target is burning from Ignite guarantees a critical hit, even if the burn expires before release or impact. Ignite ticks do not crit. Critical damage displays **CRIT!**; action-bar tooltips show your current chance. Future items can add critical chance bonuses.
- Enemies navigate around trees, buildings, cliffs, and water while chasing, wandering, or returning home, using bridges when needed. Solid obstacles also block their melee attacks.
- Equip any sword and use Sword Strike (default key **3**) against nearby enemies. It costs no mana and has a 0.6-second cooldown.
- Buy the Common **Short Bow** (`01000`, 25 gold) or **Throwing Dagger** (`01001`, 18 gold) at the General Store. Equip it and use **Ranged Attack** (default key **5** in new adventures). Bow range is 280 pixels; dagger range is 180 pixels. Both have a 0.8-second cooldown and use no mana or ammunition. Throwing does not consume the dagger. Existing saves can assign Ranged Attack from the spell book.
- With a sword of any rarity equipped, use Charge (**4**) on an enemy at least 150 pixels away. Rush into melee range and stun it for 2 seconds. Charge costs no mana, stops at obstacles, and has a 20-second cooldown that resets whenever an enemy dies.
- Arrange spells on the action bar using the spell book and drag-and-drop.
- Earn XP from enemies and quests, level up, and spend attribute points.
- Loot defeated enemies by clicking a nearby corpse (within 64 pixels), or stand on it and press **E**. Hover for loot details. Corpses persist until fully looted, independently of enemy respawns, and are included in saves. A full inventory still allows collecting gold; the item remains until space is available.
- Restart a fresh adventure after your character dies.
- Visit the General Store at the map center. Click the house nearby or press **E** at its entrance to buy equipment with gold. Gameplay pauses while shopping; press **E**, **Escape**, or Close to leave.

## Your first adventure

Equipment has five rarity tiers: **Common** (white), **Uncommon** (green), **Rare** (blue), **Epic** (purple), and **Legendary** (orange). Inventory/equipment borders, item names, and tooltips show rarity; tooltips also name the tier for clarity. Every current item has **item level 1**. Item level is descriptive metadata and does not scale stats or restrict equipping yet.

Choose a class before starting a new adventure. Your class stays fixed for that adventure, including after death or restarting.

| Class | Main stat / gear category | Starting abilities |
| --- | --- | --- |
| Warrior | Strength | Sword Strike (**3**); learn other skills in the specialization tree (**N**) |
| Hunter | Dexterity | Ranged Attack (**5**) using a bow or throwing dagger |
| Mage | Intelligence | Fireball (**1**), Ignite (**2**) |

Equipment has an explicit Strength, Dexterity, or Intelligence category; your class can equip only its matching category, regardless of secondary stat bonuses. You can collect and buy other categories, and tooltips explain restrictions. The General Store stocks all **85 equipment items**: five rarity tiers for every weapon family, Strength/Dexterity/Intelligence head/chest/legs/boots families, and Strength shields. Hunters and Mages currently leave offhand empty. All equipment is also in the rarity-weighted loot pool. Higher tiers offer stronger fixed stats and cost more gold; rarity never adds a hidden multiplier.

Press **N** to open your specialization tree. Level 1 starts with no points; each level-up grants **one specialization point**, in addition to five attribute points. Warriors start with Sword Strike only. Each tree node costs one point: **Charge first**, then branch into **Shield Wall** or **Cleave → Rend**. Hover or keyboard-focus an icon for effects, prerequisites, and cost; click it to learn. Both branches remain available as you earn more points. Choices last for the adventure and are saved. Learned skills appear in the spell book and fill their preferred action slot if empty, otherwise another empty slot; existing assignments are preserved. Hunters and Mages keep their current starting abilities and save points for future trees.

| Warrior unlock | Default key | Effect |
| --- | --- | --- |
| Charge | 4 | Existing charge and 2-second stun; 20-second cooldown, reset on enemy death |
| Cleave | 6 | Strength/sword-scaled damage in a 70px, 120-degree forward cone; 5-second cooldown |
| Rend | 7 | Strength-scaled bleed every second for 6 seconds; 4-second cooldown; refreshes without stacking or delaying ticks |
| Shield Wall | 8 | 40% less damage after armor for 5 seconds; 30-second cooldown; requires sword and shield, no enemy target |

| Sword ID | Name | Rarity | Weapon damage | Strength | Vitality | Price |
| --- | --- | --- | --- | --- | --- | --- |
| `02000` | Iron Sword | Common | 8 | +3 | — | 30 gold |
| `02001` | Guard's Iron Sword | Uncommon | 9 | +4 | — | 60 gold |
| `02002` | Knight's Iron Sword | Rare | 10 | +5 | +1 | 120 gold |
| `02003` | Oathkeeper | Epic | 12 | +6 | +2 | 240 gold |
| `02004` | Dawnbreaker | Legendary | 14 | +7 | +3 | 480 gold |

1. Choose Warrior, Hunter, or Mage, then click **New game** or press **Space** from the New game button.
2. Press **C**, then equip your starting **Iron Sword**, **Short Bow**, or **Apprentice Staff**. This completes **Ready for Adventure** and grants **20 XP**.
3. **Slime Trouble** then starts automatically. Defeat three green slimes to earn an additional **75 XP and 20 gold**, alongside their normal kill XP.
4. Click an enemy to select it, then use your class's action-bar keys listed above. The spell book shows only your class's abilities. Ability weapon requirements still apply.

Press **L** or click **Quest Log** on the side to open your journal. Browse in-progress, available, locked, and completed quests, with descriptions, objectives, prerequisites, and rewards. Selecting a quest makes it the **only quest shown in the side tracker**; progress updates live. Selection stays until you choose another quest and is preserved in saves. Close the log with **L**, **Escape**, or its close button. Combat messages appear in the message log. Regular enemies respawn after being defeated.

Every kill rolls **gold**, plus a **35% chance of one item** from the current equipment pool. Loot is rolled once at death and never rerolled by clicking, respawning, or loading. Item rarity is selected first, then one item is chosen from that tier:

| Rarity | Chance when an item drops |
| --- | --- |
| Common | 70% |
| Uncommon | 20% |
| Rare | 7.5% |
| Epic | 2% |
| Legendary | 0.5% |

Monsters currently start at **level 1**, shown above their health bars and when targeted. Each level above 1 adds **10% of base attack damage**. Gold rolls uniformly from **monster level to three times monster level**: 1–3 gold at level 1, 5–15 at level 5. Health and XP retain their existing values; item rarity odds do not scale with level yet. Fresh adventures clear old corpses.

Fireball has a 320-pixel range and a 0.5-second cooldown; Ignite has a 240-pixel range and a 2-second cooldown. Cliffs and tree trunks block spells, while water does not. Taking damage pushes back casting progress by one sixth of its total duration per hit. Moving, changing weapons, or losing a valid target interrupts either casting spell before release without spending mana. Escape pauses an active cast along with the game. Recasting Ignite refreshes its duration without stacking damage or postponing the next tick. Hover over action-bar spells for details.

## Controls

Offensive attributes add **1.1 damage per point above the starting value of 10**, including equipment bonuses: **Strength → melee**, **Intelligence → casting**, and **Dexterity → ranged**. Direct-hit damage equals base ability damage + matching weapon damage + attribute bonus, rounded to one decimal. Ignite applies the Intelligence bonus per tick, without adding weapon damage; its damage is fixed when cast or refreshed. Charge remains non-damaging.

For example, the Iron Sword gives a starting character 13 Strength: Sword Strike deals `12 + 8 + (13 − 10) × 1.1 = 23.3` damage. Strength still increases maximum HP, Intelligence still improves mana regeneration, and Dexterity still increases movement speed.

| Action | Control |
| --- | --- |
| Start or restart after death | Space or the on-screen button |
| Move | WASD or arrow keys |
| Open or close character sheet | C |
| Open or close spell book | K |
| Open or close quest log | L or the Quest Log button |
| Select an enemy | Left-click the enemy |
| Open the shop nearby | E or click the building |
| Loot a corpse | Click nearby, or stand on it and press E |
| Close the shop | E, Escape, or Close |
| Close the topmost panel, then pause or continue | Escape; Continue also resumes from the pause menu |
| Cast an assigned spell | 1–9 and 0, or click its action-bar slot |
| Equip an item | Click it in the character sheet's inventory |
| Unequip an item | Click its equipment slot |
| Assign a spell | Drag it from the spell book to the action bar |
| Move or swap action-bar spells | Drag between action-bar slots |
| Remove an action-bar spell | Right-click its slot |

## Combat feedback

Combat feedback includes outlined floating damage numbers: yellow for your direct hits, orange marked **DOT** for damage over time, and red over the player for incoming damage. Brief flashes highlight hits; on-screen notices explain blocked or interrupted attacks. Overlapping hits use separate lanes, with large bursts combined to keep the display readable.

Action-bar slots show remaining cooldowns and short unavailable reasons such as Weapon, Target, Range, Blocked, Mana, or Too close. Slots keep their tooltips and drag controls. Stunned enemies show orbiting stars and a timer driven by their actual stun duration. Visual effects and countdowns pause with the game; transient feedback clears on death, restart, and loading.

## Saving and loading

During play, **Escape** closes the topmost open panel first (spell book, character sheet, or shop); press it with no panel open to open the pause menu. Within the menu, Escape closes expanded Load choices before resuming play. **Continue** or Escape resumes play; **Save** stores your adventure in this browser and **Export** downloads a portable JSON backup. **Load** offers the browser save or a JSON file import. Successful loading resumes play; saving, exporting, and invalid imports leave the menu paused. **Restart** begins a fresh adventure and preserves the stored save. **Settings** is a disabled placeholder. Saving is manual; progress since your last save is not automatically stored.

On the start or death screen, **Continue** loads your saved adventure. **Import save** loads an exported JSON file; press Save afterward if you want to keep the imported adventure in browser storage. Invalid or unsupported files show an error without changing your adventure. New saves use version 3 and preserve unlooted corpses. Versions 1 and 2 migrate automatically (with no corpses); version 1 also migrates legacy item IDs. Other versions are rejected. Saving or exporting afterward writes version 3.

Saves include level, XP, base attributes, unspent points, gold, health/mana, inventory, equipment, quest progress/completed rewards, action-bar assignments, and each unlooted corpse's position, monster level, and remaining gold/item. Loading recalculates derived stats and places you at the starting spawn with fresh enemies while restoring corpses. Player position, live enemy state, cooldowns, projectiles, and active casts are not saved.

Death still offers a fresh restart, or Continue from your last save. New Game/restart does not erase the stored save; pressing Save in the new adventure replaces it. The previous valid browser save is retained as a backup and used if the current one becomes unreadable.

Browser saves belong to this browser profile and exact site address: different ports have separate saves. Clearing browser data removes them. Use Export save for backups or to move progress between browsers. No account or backend is required.

Saves now include a permanent class ID and specialization progress (version 8). Loading a version 1-5 save opens a class-choice dialog. Incompatible equipped items move into the backpack, and incompatible action-bar assignments are cleared. If the backpack has insufficient space, migration stops without discarding items; choose another class or free space using the original game version/save before retrying. The original browser save or imported file is unchanged until you explicitly save again.

## Project structure

Spells and attacks use permanent five-digit string IDs, in a separate namespace from items:

| ID | Spell or attack |
| --- | --- |
| `00001` | Fireball |
| `00002` | Ignite |
| `00003` | Sword Strike |
| `00004` | Charge |
| `00005` | Ranged Attack |

Assign the next unused ID when adding an ability; never renumber existing IDs or reuse retired ones.

Item IDs follow the category ranges documented in `src/data/items.js`, independently of ability and enemy IDs:

| Category | ID range | Current item |
| --- | --- | --- |
| Casting weapons | `00001`–`00999` | `00001` Apprentice Staff |
| Ranged weapons | `01000`–`01999` | `01000` Short Bow, `01001` Throwing Dagger |
| Melee weapons | `02000`–`02999` | Swords `02000`–`02004` |
| Head | `03000`–`03999` | `03000` Leather Cap |
| Chest | `04000`–`04999` | `04000` Leather Armor |
| Off hand | `05000`–`05999` | `05000` Wooden Shield |
| Legs | `06000`–`06999` | `06000` Leather Pants |
| Boots | `07000`–`07999` | `07000` Traveler's Boots |

Legacy item IDs `00002`–`00007` are retired and reserved for save migration; do not reuse them for new items.

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
| `src/world/navigation.js` | Footprint-aware A* enemy routes and timed route updates |
| `src/data/enemy-types.js`, `src/combat/enemies.js` | Enemy definitions, AI, damage, death, and respawning |
| `src/combat/enemy-stats.js` | Monster levels and damage scaling |
| `src/data/loot-tables.js`, `src/loot/loot.js` | Rarity weights, gold rules, corpses, and pickup |
| `src/rendering/corpse-renderer.js`, `src/ui/loot-ui.js` | Downed sprites, loot markers, hover details, and click coordinates |
| `src/rendering/slime-sprites.js` | Green and red slime sprite-sheet frames and animation |
| `src/data/items.js`, `src/player/inventory.js`, `src/player/equipment.js` | Item definitions, inventory actions, and equipment bonuses |
| `src/data/rarities.js`, `src/ui/item-appearance.js` | Shared rarity tiers, colors, and item presentation |
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

`tests/navigation-checks.js` checks detours around the real shop and controlled obstacles, bridges, unreachable and changing destinations, all three enemy movement states, stuns, chase limits, and respawn cleanup.

`tests/loot-checks.js` checks monster-level scaling, drop probabilities, exactly-once rewards, persistent corpses, click/E pickup, full inventories, pause/death restrictions, and corpse save validation.

Open **http://localhost:8000/tests/classes.html** for the class-system checks, including all class/equipment combinations, starting quests, ability restrictions, save migration, keyboard focus, and short-screen layouts.

## Development status

Hover over stats in the character sheet for explanations. Strength increases maximum health, Dexterity increases movement speed, Vitality improves health regeneration, and Intelligence improves mana regeneration. Equipment bonuses count toward these effects.

This is an evolving prototype. Save manually to keep progress between sessions. Autosaving and persistent world changes are not implemented yet. See [todo.md](todo.md) for planned improvements.

Open **http://localhost:8000/tests/specializations.html** to verify tree controls, point conservation, unlock prerequisites, combat behavior, save migration, and responsive layouts. Version 6 saves retain their class, receive one unspent specialization point per earned level, and remove action assignments for skills now learned through the tree; version 1-5 saves still require class selection.

The specialization tree uses connected icon nodes: green learned skills, gold available skills, and dim locked skills. Version 7 saves that learned Cleave/Rend without Charge refund those nodes and clear their action assignments, preserving all earned points for the revised Charge-first tree. Builds already containing Charge keep their skills.
