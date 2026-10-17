# Project improvement tasks

Goal: Build TopDownSoloRPG into a polished single-player, 2D top-down action RPG where players explore connected areas, complete quests, fight varied enemies and bosses, collect loot, trade with merchants, and develop their character through equipment, abilities, and meaningful stat choices. Support a complete adventure with clear onboarding, responsive controls, helpful feedback, adjustable settings, and saved progress, backed by a maintainable codebase and reliable performance.

## 1. Stabilize gameplay — highest priority

- [x] 1.01 Remove procedural trees, their shadows and collisions, and code used only by tree generation.
- [x] 1.02 Add trees using `tree.png`, depth sorting and trunk collision for players and enemies.
- [x] 1.03 Remove generated houses, building rendering and their collision footprints while preserving other gameplay.

- [x] 1.04 Align collision data with the background map: traced water/cliff regions, painted tree trunks, sprite tree trunks, and passable bridges/dock. Generated buildings were removed.
- [x] 1.05 Define scenery, collision, and spawn points in shared world data.
- [x] 1.06 Create shared movement/collision functions that accept each entity's bounds.
- [x] 1.07 Apply collision checks to enemy wandering, chasing, and returning.
- [x] 1.08 Add start/playing/dead states, a start screen and death popup; prevent movement and casting outside play.
- [x] 1.09 Restart the adventure with Space after death, resetting the player and combat state.
- [x] 1.10 Consolidate equipment ownership into one source of truth; remove the duplicate `player.equipment` state.
- [x] 1.11 Equip the starting staff or clearly explain how to equip it.
- [x] 1.12 Use logical viewport dimensions for canvas HUD positioning at all pixel densities.
- [x] 1.13 Include enemies in the same depth-sorted render queue as scenery and the player.

Completion target: exploration and combat work without obvious world or state inconsistencies.

## 2. Complete the core gameplay loop

- [x] 2.01 Remove the introductory quest, NPC, quest UI and interaction code.
- [x] 2.02 Add a data-defined kill quest with separate progress tracking, event-driven UI and one-time rewards.
- [x] 2.03 Begin with equipping item `00001` for 20 XP, then unlock and start Slime Trouble.

- [x] 2.04 Define central derived-stat formulas for resources, regeneration, damage, and defense.
- [x] 2.05 Apply equipment intelligence/vitality bonuses to regeneration.
- [x] 2.06 Include casting-weapon damage bonuses in direct spell damage; keep Ignite's damage per tick fixed.
- [x] 2.07 Give Strength maximum-health bonuses and Dexterity movement-speed bonuses; add hover explanations for all displayed stats.
- [x] 2.08 Ensure the character sheet displays shared gameplay stats and updates live resources without rebuilding inventory. Show spell damage, mana cost and casting details on action-bar hover tooltips. Use instant shared tooltips for spells, stats and items, with keyboard-focus support.
- [x] 2.09 Enforce spell range and line of sight against cliffs and tree trunks; water remains passable for spells.
- [x] 2.10 Define Fireball interruption and release costs, spell cooldowns, and non-stacking Ignite refreshes that preserve tick timing.
- [x] 2.11 Add Sword Strike requiring the Iron Sword (`00002`), with melee range, weapon damage, cooldown and a visible swing.
- [x] 2.12 Add Charge: sword required, minimum 150px distance, terrain-aware dash, 2-second stun, 20-second cooldown reset by enemy deaths.
- [x] 2.13 Give spells and attacks permanent incremental five-digit IDs; update action-bar assignments, cooldowns and combat references.

Completion target: a new player can explore, fight, level up, and see character choices affect gameplay.

- [x] 2.14 Render green slimes with green_slime.png, with idle/movement/hit animation and existing combat overlays.
- [x] 2.15 Render red slimes with red_slime.png using shared animation timing and existing combat overlays.

## 3. Strengthen the codebase

- [x] 3.01 Separate world data, player state, combat, rendering, input, and UI into focused modules.
- [x] 3.02 Replace implicit globals and ordered classic scripts with explicit ES module imports, shared state ownership and UI events; add local-server instructions and browser smoke checks.
- [x] 3.03 Centralize enemy damage/death handling, including XP, selection cleanup, respawn scheduling and quest events.
- [x] 3.04 Remove duplicate equipment/UI refresh calls after equipping and unequipping.
- [x] 3.05 Consolidate duplicate equipment display logic.
- [x] 3.06 Remove or document unused terrain rendering, decoration data, and legacy UI code.
- [x] 3.07 Use `house.png` for the central General Store and `tree.png` for world trees; building definitions support additional houses.
- [x] 3.08 Add a README with local run instructions, controls, and project structure.

- [x] 3.09 Organize modules into src/ feature folders and sprites into assets/images/; update imports, asset URLs, tests, and documentation.

### Focused verification

- [x] 3.10 Verify equipping, swapping, and unequipping items, including a full inventory. Browser checks cover every equipment slot, UI labels, stat changes, health clamping, item conservation, duplicate copies, full-backpack swaps, and blocked unequipping.
- [x] 3.11 Verify enemy kills award XP exactly once for both direct damage and damage over time.
- [x] 3.12 Verify kill quest progress, one-time rewards, simultaneous damage and quest reset on restart.
- [x] 3.13 Verify XP overflow and multiple level-ups from one reward. Browser checks cover exact thresholds, carried XP, rounded level costs, five attribute points per level, HUD/sheet updates, invalid rewards, and restart resets.
- [x] 3.14 Verify dead players cannot move or cast and can restart correctly with Space or the restart button.
- [x] 3.15 Verify player and enemy collision against obstacles and world boundaries. Browser checks cover real map regions, trunks, buildings, bridges/dock, all four boundaries, fast movement from four directions, sliding, blocked tiles, enemy wander/chase/return, and safe spawns/respawns.
- [x] 3.16 Verify HUD placement at device pixel ratios 1 and 2.

Completion target: new spells and enemies can be added without duplicating core gameplay logic.

## 4. Measure and optimize performance

- [ ] 4.01 Capture browser performance profiles during exploration and a representative fight.
- [ ] 4.02 Record frame times and identify actual bottlenecks before larger optimizations.
- [ ] 4.03 Cull offscreen objects using their full visual bounds, including tall trees and roofs.
- [ ] 4.04 Reduce per-frame render-queue allocations and drawing closures where profiling justifies it.
- [ ] 4.05 Consider cached static drawing commands if static scenery is expensive.
- [ ] 4.06 Cache frequently used DOM references.
- [ ] 4.07 Avoid rewriting health/mana text and styles when the displayed values are unchanged.
- [ ] 4.08 Optimize loaded image assets while preserving visual quality.
- [ ] 4.09 Re-profile after changes and compare against the baseline.
- [ ] 4.10 Add enemy pathfinding if collision-aware movement reveals persistent navigation problems.

Completion target: predictable frame times on intended devices, supported by measurements.

## 5. Persistence and usability polish

- [x] 5.01 Validate dropped spell IDs, source slot bounds, and source spell assignments before changing the action bar.

- [x] 5.02 Add versioned manual browser saves for progression, resources, inventory, equipment, quests, and action-bar assignments; Continue, JSON export/import, and safe-spawn loading with fresh enemies.
- [x] 5.03 Validate saves before applying them; safely handle missing/corrupt data, storage errors, and unsupported versions. Retain the previous valid save as a recovery backup; test round trips, UI controls, and reward preservation. Add explicit migrations when a newer format is introduced.
- [ ] 5.04 Make the inventory grid adapt to narrow viewports.
- [ ] 5.05 Limit character-sheet height to the viewport and allow scrolling.
- [ ] 5.06 Show visible controls for opening the character sheet (C) and spell book (K).
- [ ] 5.07 Add Escape-to-close behavior for panels.
- [ ] 5.08 Add descriptive accessible labels to icon-only controls.
- [ ] 5.09 Provide a keyboard alternative to dragging spells onto the action bar.
- [ ] 5.10 Verify the complete introductory gameplay loop across intended screen sizes.

## 6. Loot

- [ ] 6.01 Define enemy loot tables using existing item IDs, drop chances, quantities, and gold ranges.
- [ ] 6.02 Roll loot once per enemy death through the shared enemy-death handler, regardless of the killing attack.
- [ ] 6.03 Spawn loot at the defeated enemy's position, separate from its respawning instance.
- [ ] 6.04 Add visible loot markers and hover descriptions showing item names and gold amounts.
- [ ] 6.05 Add nearby loot pickup with clear controls and feedback.
- [ ] 6.06 Add collected items to inventory and gold to the player; keep uncollected items available when the inventory is full.
- [ ] 6.07 Define loot expiration and cleanup rules, including resetting loot when restarting the adventure.
- [ ] 6.08 Verify drop probabilities, exactly-once loot rolls and pickup, full-inventory handling, enemy respawns, and restart cleanup.

Completion target: defeated enemies can drop loot that the player can identify and collect without losing items or duplicating rewards.

## 7. Combat feedback

- [ ] 7.01 Show floating damage numbers and distinguish player damage, enemy damage, and damage over time.
- [ ] 7.02 Add brief hit flashes and clear visual feedback for interrupted or blocked attacks.
- [ ] 7.03 Show remaining cooldowns on action-bar slots and indicate unavailable actions.
- [ ] 7.04 Improve stun effects and display their remaining duration consistently.
- [ ] 7.05 Verify feedback stays readable during overlapping attacks and resets correctly after death.

## 8. Potions and consumables

- [ ] 8.01 Define health and mana potions in the item database, including restoration amounts and stack limits.
- [ ] 8.02 Support consumable stacks in inventory without changing equipment ownership rules.
- [ ] 8.03 Add potion use through inventory and action-bar slots, with shared cooldown rules.
- [ ] 8.04 Include potions in appropriate loot tables and show restoration details in tooltips.
- [ ] 8.05 Verify resource caps, stack consumption, cooldowns, and restrictions before starting or after death.

## 9. Shops and merchants

- [x] 9.01 Add a central shop with click/nearby E interaction and an entrance prompt.
- [ ] 9.02 Define shop stock and item buy/sell prices as data. Stock and buy prices are implemented; sell prices remain.
- [ ] 9.03 Add a shop interface for purchasing supplies and selling inventory items. Purchasing is implemented; selling remains.
- [ ] 9.04 Handle insufficient gold, full inventory, and selling stacked items without losing or duplicating items.
- [ ] 9.05 Verify transactions update gold, inventory, and tooltips immediately.

## 10. Equipment progression

- [ ] 10.01 Define equipment tiers, rarity, and a consistent stat budget.
- [ ] 10.02 Add stronger weapons and armor with permanent item IDs.
- [ ] 10.03 Define and enforce level or attribute requirements for equipment.
- [ ] 10.04 Show rarity, requirements, and comparisons with equipped items in tooltips.
- [ ] 10.05 Connect equipment upgrades to enemy loot, merchants, and quest rewards.
- [ ] 10.06 Verify derived stats, attack requirements, and resource limits when swapping upgraded gear.

## 11. Enemy behavior and navigation

- [ ] 11.01 Complete obstacle-aware pathfinding tracked in 4.10 before adding more complex movement behaviors.
- [ ] 11.02 Add a ranged enemy with projectile attacks and line-of-sight checks.
- [ ] 11.03 Define patrol routes and patrol behavior using world data.
- [ ] 11.04 Add retreat behavior with clear conditions for retreating and returning to combat.
- [ ] 11.05 Add special attacks with visible warnings and time for the player to react.
- [ ] 11.06 Verify navigation, attack cooldowns, stuns, leash behavior, and respawns for each enemy behavior.

## 12. Boss encounter

- [ ] 12.01 Design a boss location with safe access and an intentional combat area.
- [ ] 12.02 Define boss stats, distinct attack patterns, and clearly signaled attacks.
- [ ] 12.03 Add a boss health display and rules for starting, resetting, and completing the encounter.
- [ ] 12.04 Add a boss quest and guaranteed loot through the existing quest and loot systems.
- [ ] 12.05 Verify boss rewards are granted once per defeat and the encounter resets correctly after player death.

## 13. Areas and exploration

- [ ] 13.01 Define multiple areas with their own scenery, collision, spawn points, and entrances.
- [ ] 13.02 Add enterable building interiors and transitions back outside.
- [ ] 13.03 Add a cave area with enemies, loot, and an entrance on the overworld.
- [ ] 13.04 Add named discoverable locations and discovery feedback.
- [ ] 13.05 Define how enemies, dropped loot, and player position behave when changing areas.
- [ ] 13.06 Verify transitions cannot place the player inside obstacles or duplicate entities and rewards.

## 14. Quest variety

- [ ] 14.01 Add item-collection objectives connected to the inventory and loot systems.
- [ ] 14.02 Add exploration objectives referencing named world locations.
- [ ] 14.03 Support NPC dialogue and quest turn-in where a quest requires it.
- [ ] 14.04 Add branching quest chains with explicit prerequisites and mutually exclusive choices where needed.
- [ ] 14.05 Verify collection counts, area transitions, prerequisites, and one-time rewards for each objective type.

## 15. Sound and music

- [ ] 15.01 Add an audio manager that starts playback only after player interaction.
- [ ] 15.02 Add sounds for attacks, hits, potion use, loot pickup, and quest completion.
- [ ] 15.03 Add background music and area ambience with smooth transitions.
- [ ] 15.04 Add separate master, music, and effects volume controls plus mute.
- [ ] 15.05 Verify overlapping sounds are limited and audio stops or transitions correctly on restart and area changes.

## 16. Settings and key bindings

- [ ] 16.01 Add a settings menu accessible from the start screen and during play.
- [ ] 16.02 Support rebinding movement, action-bar, interaction, and panel controls.
- [ ] 16.03 Detect conflicting bindings and provide a restore-defaults option.
- [ ] 16.04 Add visual-effect preferences for flashes, screen shake, and floating combat text where implemented.
- [ ] 16.05 Persist settings independently of adventure progress and update control hints to reflect bindings.
- [ ] 16.06 Verify menus and text entry do not trigger gameplay actions.
- [x] 16.07 Add an Escape pause menu with Continue, Save, Export, Load (browser/file), Restart, and a Settings placeholder; move save/export controls out of the HUD and verify paused simulation, focus, loading, and restart.

## 17. Minimap

- [ ] 17.01 Add a minimap showing the current area and player position.
- [ ] 17.02 Track explored terrain and reveal it as the player travels.
- [ ] 17.03 Show discovered entrances, merchants, and relevant quest locations.
- [ ] 17.04 Add a minimap visibility control and keep it clear of existing HUD panels.
- [ ] 17.05 Verify markers stay aligned with world coordinates across areas and screen sizes.

Suggested progression: loot → potions → merchants → equipment upgrades → boss encounter. Prioritize save/load tasks 5.02–5.03 before expanding progression, and include quest, discovery, and area state when those systems are added.
