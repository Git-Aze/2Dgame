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

Resource bars also update during active simulation. Live character-sheet updates only change displayed resources and preserve inventory controls. Opening the shop pauses simulation using `isPlaying()`; closing it clears held keys and frame timing.

## Verification

Run `serve.ps1` and open `/tests/smoke.html`. The checks import public module APIs and operate inside an isolated iframe. They do not add debug globals or change the normal game entry point. A restart resets adventure data without registering duplicate handlers.
