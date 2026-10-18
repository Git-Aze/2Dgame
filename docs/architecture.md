# Module architecture

`index.html` loads one entry point: `src/game.js`. The browser resolves dependencies through explicit imports. There is no bundler or required package installation.

## Ownership

- Data definitions live in `src/world/world.js`, `src/data/items.js`, `src/data/enemy-types.js`, `src/data/action-definitions.js`, and `src/quests/quests.js`. Permanent IDs remain five-digit strings.
- `src/core/state.js` owns mutable player, inventory, enemy, quest, and combat data. Its `runtime` object owns session state, camera coordinates, selected targets, and active shop/charge references. Imported scalar bindings are never reassigned by another module.
- Gameplay modules own state transitions and rules: `src/player/player.js`, `src/player/inventory.js`, `src/player/equipment.js`, `src/player/stats.js`, `src/combat/enemies.js`, `src/combat/spells.js`, `src/quests/quest-system.js`, `src/shops/shops.js`, `src/world/movement.js`, and `src/world/collision.js`.
- UI and render modules read those models and call explicit actions. Rendering does not advance simulation time. Input bindings are registered in `src/core/input.js`; panels own their click/drag handlers.
- `src/game.js` initializes event subscriptions and input once, then calls `update(dt)` and `render()` through `requestAnimationFrame`.

Keep imports acyclic. Gameplay must not import a panel merely to refresh it: announce a change through `src/core/events.js` instead. New session data should have one owner rather than a second copy in a renderer or panel.

## Events

Subscriptions are installed during startup, never on each restart. Notifications are synchronous, so a completed action updates its dependent UI immediately.

| Event | Meaning / consumers |
| --- | --- |
| `player:changed` | Equipment, attributes, XP, or gold changed; refresh the character sheet, XP bar, and ability details |
| `resources:changed` | Health/mana changed outside the regular update; refresh the resource HUD and visible sheet |
| `player:hurt` | Combat can interrupt an unreleased cast |
| `player:died` | Lifecycle enters the dead state |
| `game:statechanged` | Start/death screens respond to session transitions |
| `portraits:ready` | Player sprite image finished loading; refresh portraits |
| `quests:changed` | Refresh quest progress and status |
| `shop:requested` | A nearby building interaction requests its shop |
| `shop:opened`, `shop:closed` | Update the modal, focus, and background interaction |
| `shop:changed` | Refresh stock, affordability, inventory capacity, and gold |
| `menu:changed` | Pause modal visibility, keyboard focus, background interaction, and save availability |
| `enemy:defeated` | Roll loot once and create an independent corpse |
| `loot:changed` | Clear stale corpse hover details after drops, pickup, and loading |

Resource bars also update during active simulation. Live character-sheet updates only change displayed resources and preserve inventory controls. Opening the shop pauses simulation using `isPlaying()`; closing it clears held keys and frame timing.

`src/core/pause-menu.js` owns pause transitions through `runtime.menuOpen`. `isPlaying()` gates simulation and gameplay actions while the menu is open, preserving casts and transient effects. Menu transitions clear held input and frame timing. `src/ui/pause-menu-ui.js` owns the dialog, focus trap, and restart controls; save controls remain in `save-ui.js`. Loading or changing session state closes the menu. Escape closes nested Load choices, then the pause menu; outside the menu it closes the shop or topmost gameplay panel before opening pause. Panel closing and focus cleanup live in src/ui/panels.js; input consumes Escape once and ignores repeats.

## Monster loot

Monster levels live on enemy types and can be overridden per world spawn. `src/combat/enemy-stats.js` scales attack damage without changing base damage, HP, or XP. The guarded death handler emits `enemy:defeated`; `setupLoot()` subscribes once at startup, keeping loot separate from combat and avoiding circular inventory/combat imports. `src/data/loot-tables.js` defines gold rules, item chance, and rarity weights. Rarity is rolled before selecting an item within that tier, so adding Common definitions does not dilute Legendary rarity odds.

Shared state owns `corpses` and a monotonic ID counter. Corpses copy the enemy's identity, level, position, and visual fields, then keep one rolled gold amount and optional item ID. They do not reference respawning enemy instances, collide with actors, or expire. Pickup validates active play, membership, range, and solid scenery; gold/items are removed individually, and an empty corpse is deleted. Full inventory retains the item. Rendering reuses flattened slime sprites and a downed wolf fallback; hover uses the shared instant tooltip. E prioritizes an overlapping corpse over a nearby shop.

Version 3 saves whitelist remaining corpse rewards and positions. Validation checks unique IDs, known definitions, level/gold bounds, and coordinates before loading, then visuals are rebuilt from enemy definitions. Versions 1/2 migrate to an empty corpse list; loading never rolls loot. Reset clears session corpses before loading restores saved ones. Save parsing and file import share a size limit.

## Verification

Offensive attribute scaling is centralized in `getSpellStats()` using `STAT_RULES.damagePerAttribute` (1.1 per effective attribute point above 10). Ability weapon categories select Strength, Intelligence, or Dexterity; gear attributes are included once. Direct hits add matching weapon damage, DOT ticks add only their attribute bonus, and results round to tenths. Projectile/effect damage is captured when launched or applied; later gear changes do not rewrite damage already in flight. The existing `fireballs` collection now also holds ranged projectiles tagged with ability ID `00005` and a weapon class for arrow/dagger rendering. Shared projectile updates handle movement, scenery, range, death credit, and cleanup. Ranged Attack reads its equipped weapon's range. New adventures assign it to slot 5; loading preserves saved action-bar assignments. `tests/attribute-damage-checks.js` covers formulas, restrictions, projectiles, purchases, tooltips, and persistence.

Equipment rarity definitions live in `src/data/rarities.js`; each item declares a rarity key and `itemLevel` in `items.js`. Item level is metadata only. Fixed item stats remain the source of combat bonuses; rarity colors never apply hidden multipliers. `src/ui/item-appearance.js` applies shared colors to inventory, equipment, and shop controls, and item tooltips show both rarity text and level. Sword abilities use shared `meetsWeaponRequirement()` checks with weapon category/class, so upgrading to another sword preserves ability access. Saves keep stable item IDs and resolve rarity/level from definitions without storing duplicate rarity/level metadata. `tests/rarity-checks.js` covers every tier through purchases, equipment, combat, tooltips, and save/load.

Enemy navigation is owned by `src/world/navigation.js`. A* uses a half-tile grid and the existing collision checks with the requesting enemy's dimensions; diagonal edges and bridge transitions validate intermediate movement positions. Search storage is reused, searches have a fixed visit budget, and routes are retained between timed updates. Direct paths avoid A* when unobstructed. Each enemy owns transient route state, cleared on death/respawn and replaced when AI modes change; it is not saved. Unreachable chasing/returning goals retry after a delay; wandering abandons unreachable goals and chooses another after its normal pause. Solid geometry blocks melee attacks as well as navigation.

Persistence lives in `src/persistence/saves.js`, with controls in `src/ui/save-ui.js`. Version 3 snapshots whitelist persistent fields and stable IDs; validation completes before loading mutates shared objects. Loading reuses `resetAdventure()` to clear transient state, restores progress in place, recalculates derived stats, and emits normal UI events. The starting spawn is checked before applying a save. No save/load listeners are registered during loading. `localStorage` holds a current snapshot and previous valid backup; export/import works independently of browser storage. Version 1 snapshots migrate legacy item IDs in inventory/equipment before validation; ability IDs and quest counters are unchanged. Other versions are rejected. Migration applies to browser saves, recovery backups, and file imports; version 2 adds an empty corpse list during migration, and new writes use version 3. `tests/save-checks.js` checks validation, storage recovery, round trips, quest rewards, and actual controls without leaving test saves behind.

Run `serve.ps1` and open `/tests/smoke.html`. The checks import public module APIs and operate inside an isolated iframe. They do not add debug globals or change the normal game entry point. A restart resets adventure data without registering duplicate handlers.
