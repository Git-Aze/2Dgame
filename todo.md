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
- [x] 2.06 Include casting-weapon damage bonuses in direct spell damage. Ignite excludes weapon damage; its ticks now scale with Intelligence as part of 2.16.
- [x] 2.07 Give Strength maximum-health bonuses and Dexterity movement-speed bonuses; add hover explanations for all displayed stats.
- [x] 2.08 Ensure the character sheet displays shared gameplay stats and updates live resources without rebuilding inventory. Show spell damage, mana cost and casting details on action-bar hover tooltips. Use instant shared tooltips for spells, stats and items, with keyboard-focus support.
- [x] 2.09 Enforce spell range and line of sight against cliffs and tree trunks; water remains passable for spells.
- [x] 2.10 Define Fireball interruption and release costs, spell cooldowns, and non-stacking Ignite refreshes that preserve tick timing.
- [x] 2.11 Add Sword Strike requiring the Iron Sword (`02000`), with melee range, weapon damage, cooldown and a visible swing.
- [x] 2.12 Add Charge: sword required, minimum 150px distance, terrain-aware dash, 2-second stun, 20-second cooldown reset by enemy deaths.
- [x] 2.13 Give spells and attacks permanent incremental five-digit IDs; update action-bar assignments, cooldowns and combat references.

Completion target: a new player can explore, fight, level up, and see character choices affect gameplay.

- [x] 2.14 Render green slimes with green_slime.png, with idle/movement/hit animation and existing combat overlays.
- [x] 2.15 Render red slimes with red_slime.png using shared animation timing and existing combat overlays.
- [x] 2.16 Add 1.1 damage per offensive attribute point above 10: Strength for melee, Intelligence for casting (including Ignite ticks), and Dexterity for ranged; retain existing stat benefits and update explanations. Add Common item-level-1 bow/dagger (`01000`–`01001`) and Ranged Attack (`00005`) with projectiles, range/cooldown checks, shop access, and save/load verification.
- [x] 2.17 Add 5% base critical chance and double damage for direct player hits, with additive item stats.critChance bonuses capped at 100%. Fireball cast on an actively burning target guarantees a crit; retain that result through flight, show CRIT feedback, and explain chance in tooltips. Ignite ticks remain non-critical.

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
- [x] 3.17 Assign category-based item IDs from items.js; update starting gear, shop stock, weapon requirements, and checks. Migrate version 1 saves to version 2 while preserving equipment, quantities, ability IDs, and quest rewards.

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
- [x] 4.10 Add footprint-aware A* enemy pathfinding around terrain, trees, and buildings; reuse routes with timed updates, cross bridges safely, and retry unreachable destinations without walking through obstacles.

Completion target: predictable frame times on intended devices, supported by measurements.

## 5. Persistence and usability polish

- [x] 5.01 Validate dropped spell IDs, source slot bounds, and source spell assignments before changing the action bar.

- [x] 5.02 Add versioned manual browser saves for progression, resources, inventory, equipment, quests, and action-bar assignments; Continue, JSON export/import, and safe-spawn loading with fresh enemies.
- [x] 5.03 Validate saves before applying them; safely handle missing/corrupt data, storage errors, and unsupported versions. Retain the previous valid save as a recovery backup; test round trips, UI controls, and reward preservation. Add explicit migrations when a newer format is introduced.
- [ ] 5.04 Make the inventory grid adapt to narrow viewports.
- [x] 5.05 Limit character-sheet height to the viewport; scroll its contents while keeping the header, close button, and footer visible. Add viewport and scrolling guidance for future panels to AGENTS.md.
- [ ] 5.06 Show visible controls for opening the character sheet (C) and spell book (K).
- [x] 5.07 Make Escape close the topmost panel or nested menu before opening the pause menu; cover the character sheet, spell book, shop, and Load choices. Document consistent Escape and focus handling in AGENTS.md.
- [ ] 5.08 Add descriptive accessible labels to icon-only controls.
- [ ] 5.09 Provide a keyboard alternative to dragging spells onto the action bar.
- [ ] 5.10 Verify the complete introductory gameplay loop across intended screen sizes.
- [x] 5.11 Add an L-toggle quest log with a quest list and parchment details, grouped quest states, a single selected-quest side tracker, saved selection, consistent Escape/focus handling, and scrolling layouts for narrow and short screens.

## 6. Loot

- [x] 6.01 Define shared enemy loot rules: guaranteed gold (level to 3× level), 35% chance of one equipment item, and decreasing rarity weights (70/20/7.5/2/0.5%).
- [x] 6.02 Roll loot once per enemy death through the shared enemy-death event, regardless of the killing attack.
- [x] 6.03 Leave a corpse at the defeated enemy's position, independently of its respawning instance.
- [x] 6.04 Add downed sprites, rarity-colored markers, monster levels, and instant loot hover descriptions.
- [x] 6.05 Loot by nearby click or E while overlapping a corpse; prioritize corpse interaction over shops and enforce range/solid scenery.
- [x] 6.06 Collect gold even with a full inventory; retain uncollected items without rerolling or duplicating rewards.
- [x] 6.07 Corpses do not expire until fully looted; clear on fresh restart and preserve in version 3 saves. Migrate versions 1/2 safely.
- [x] 6.08 Verify probabilities, exactly-once pickup, full inventory, independent respawns, pause/death restrictions, save validation, and restart cleanup.
- [x] 6.09 Add monster levels (currently 1); scale base attack damage by +10% per level after 1 and scale gold rewards linearly with level.

Completion target: defeated enemies can drop loot that the player can identify and collect without losing items or duplicating rewards.

## 7. Combat feedback

- [x] 7.01 Add outlined floating damage: yellow outgoing hits, orange DOT labels, and red incoming damage; separate overlapping lanes and combine burst overflow without losing displayed totals.
- [x] 7.02 Add brief player/enemy hit flashes and on-screen notices for interrupted, blocked, out-of-range, invalid-weapon, and failed-mana attacks.
- [x] 7.03 Add action-bar cooldown countdowns and unavailable reasons (weapon, target, range, line of sight, mana, casting/charging, pause); preserve dragging/tooltips and update DOM only when displayed values change.
- [x] 7.04 Add orbiting stun stars and an outlined, rounded-up timer based on actual remaining stun duration; pause with gameplay.
- [x] 7.05 Verify simultaneous hits, bounded bursts, effect expiry, shared availability checks, pause behavior, Charge reset, save exclusion, and death/load/restart cleanup; inspect a combined combat scene visually.

- [x] 7.06 Give casting spells a shared 1.5-second base cast time and a gold progress bar above the action bar with spell icon, name, and remaining time; preserve interruption rules and pause behavior.

- [x] 7.07 Replace damage interruption with cast pushback: each hit removes one sixth of total cast duration from elapsed progress, clamped at zero; update the cast bar immediately and preserve other interruption rules.

- [x] 7.08 Show the player level on the portrait and add an adjacent target frame with enemy portrait, name, level, and live health; hide it when the target is cleared or defeated and keep frames within narrow viewports.

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

- [x] 10.01 Define five rarity tiers with shared WoW-style colors and fixed stat progression; give all current equipment item level 1 as metadata without level scaling. Add one sword per tier (`02000`–`02004`) and support all swords in Sword Strike/Charge.
- [x] 10.02 Add stronger weapons and armor with permanent item IDs: one staff, bow, throwing dagger, sword, head, chest, offhand, legs, and boots item per rarity. Keep item level 1, improve fixed stats by tier, and include all equipment in merchant stock and rarity-weighted loot.
- [ ] 10.03 Define and enforce level or attribute requirements for equipment.
- [ ] 10.04 Show rarity, requirements, and comparisons with equipped items in tooltips. Rarity names/colors and item level are implemented; requirements and comparisons remain.
- [ ] 10.05 Connect equipment upgrades to enemy loot, merchants, and quest rewards. Equipment now drops from corpses and is sold by the General Store; quest upgrades remain.
- [x] 10.06 Verify derived stats, attack requirements, and resource limits when swapping current upgraded swords; cover all five tiers, purchases, styling, Sword Strike/Charge, health clamping, and save/load.

- [x] 10.07 Add data-driven Warrior (Strength), Hunter (Dexterity), and Mage (Intelligence) classes; explicit gear categories, class armor families across all rarities, starting selection/loadouts/abilities and class-specific introduction objectives. Enforce equipment/ability restrictions in gameplay, UI, and version-6 saves; offer non-destructive class selection for older saves and verify class flows and migration.

- [x] 10.08 Add specialization points (one per level-up), a responsive N-key tree, prerequisites, saved unlocks and ability gating. Warriors start with Sword Strike; unlock Charge → Shield Wall and Cleave → Rend. Implement Cleave, Rend and Shield Wall, preserve action assignments, and migrate older saves with earned points available to spend.

- [x] 10.09 Restyle the specialization tree as connected icon-only nodes with instant hover/focus details. Require Charge first, branch to Shield Wall or Cleave, and place Rend after Cleave; migrate earlier Cleave-first builds by refunding inaccessible nodes.

## 11. Enemy behavior and navigation

- [x] 11.01 Complete obstacle-aware pathfinding tracked in 4.10 for chasing, wandering, and returning; verify all enemy sizes, changing routes, bridges, unreachable goals, stuns, chase limits, and respawn cleanup.
- [x] 11.02 Make Red Slime a ranged enemy: aimed red slimeballs, 180px attack range, 1s cooldown, 200px/s projectile speed, 260px travel limit, and line-of-sight repositioning. Verify dodging, solid collision, level/armor scaling, pauses, stuns, leash/respawn behavior, and projectile cleanup.
- [ ] 11.03 Define patrol routes and patrol behavior using world data.
- [ ] 11.04 Add retreat behavior with clear conditions for retreating and returning to combat.
- [ ] 11.05 Add special attacks with visible warnings and time for the player to react.
- [ ] 11.06 Verify navigation, attack cooldowns, stuns, leash behavior, and respawns for each enemy behavior.

## 12. Boss encounter

- [x] 12.01 Place Stonehorn in Cave Arena with a safe southern entrance corridor and existing floor collision.
- [x] 12.02 Add level-1 Stonehorn (600 HP, 14 base damage), boss1.png animations, warned cleave and aimed charge, and faster attacks below half health.
- [x] 12.03 Add a responsive boss health display. Start when entering the arena floor or attacking; reset on retreat, re-entry, or player death. Completed encounters do not respawn within the adventure.
- [x] 12.04 Add The Arena Guardian quest (150 XP, 50 gold) and guaranteed Rare Knight's Iron Sword plus 3 gold on the corpse; defeat also grants 100 XP. Preserve full-inventory loot handling.
- [x] 12.05 Verify attack warnings, dodging, charge collision, pauses/stuns, resets, one-time rewards, and completed/looted encounter persistence. Version 5 saves add the quest and migrate versions 1–4.

## 13. Areas and exploration

- [x] 13.01 Define multiple areas with their own scenery, collision, spawn points, and entrances.
- [ ] 13.02 Add enterable building interiors and transitions back outside.
- [x] 13.03 Add a cave area with enemies, loot, and an entrance on the overworld.
- [ ] 13.04 Add named discoverable locations and discovery feedback.
- [x] 13.05 Define how enemies, dropped loot, and player position behave when changing areas. Enemies pause off-area; corpses retain area IDs; travel uses safe arrivals. Version 4 saves retain the active area and all corpses, loading at a safe spawn with fresh enemies.
- [x] 13.06 Verify transitions cannot place the player inside obstacles or duplicate entities and rewards.
- [x] 13.07 Retrace cave collision against the artwork: block walls, pool banks, water, and chasms; preserve connected floor paths and both bridge decks. Check blocked positions, movement at edges, and corridor reachability.
- [x] 13.08 Add an empty Cave Arena using cave_boss_area.png, accessible from the cave's northeast chamber. Include wall collision, connected floor/stairs, a return exit, and save/load support; no boss or monsters.
- [x] 13.09 Add Ctrl+M collision debug borders for the active area, following the camera and area transitions. Include floor regions, solids, water, crossings, passages, tree/building footprints, and blocked tiles.
- [x] 13.10 Trace Cave Arena's walkable floor from the inside of cave_boss_area_border.png, aligned to the ground map. Preserve obstacle footprints, travel, and floor connectivity.
- [x] 13.11 Retrace the replacement Cave Arena border reference (936x932, offset 300,92), updating the upper chamber and entrance corridor; recheck floor connectivity and travel.
- [x] 13.12 Slide normal player movement along sloped collision borders in the intended direction, without crossing walls, water, or corners. Preserve Charge and enemy movement.
- [x] 13.13 Trace the cave's floor and enclosed chasm from cave_groundmap_border.png (1420x933, offset 72,91). Preserve bridges, connected chambers, portals, enemy spawns, and spell visibility over water; use the central rock's base footprint for passage clearance.
- [x] 13.14 Trace village collision from ground_map_border.png at native 1536x1024 size, including enclosed blocked regions. Preserve scenery footprints, crossings, shop/cave access, spell visibility over water, and clear enemy spawns.

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
