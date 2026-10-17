# Project improvement tasks

Goal: deliver a complete, reliable five-minute experience using the existing village and enemies before expanding content.

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

- [ ] 2.04 Define central derived-stat formulas for resources, regeneration, damage, and defense.
- [ ] 2.05 Apply equipment intelligence/vitality bonuses to regeneration.
- [ ] 2.06 Include weapon damage bonuses in the appropriate damage calculations.
- [ ] 2.07 Give strength and dexterity meaningful gameplay effects and explain them in the UI.
- [ ] 2.08 Ensure the character sheet displays the same stats that gameplay uses.
- [ ] 2.09 Define spell range and line-of-sight rules and enforce them consistently.
- [ ] 2.10 Define casting interruption and Ignite refresh/cooldown behavior.
- [ ] 2.11 Add clear onboarding for movement, targeting, equipment, and spells.

Completion target: a new player can explore, fight, level up, and see character choices affect gameplay.

## 3. Strengthen the codebase

- [ ] 3.01 Separate world data, player state, combat, rendering, input, and UI into focused modules.
- [ ] 3.02 Replace implicit global dependencies and script-order coupling with explicit module dependencies.
- [x] 3.03 Centralize enemy damage/death handling, including XP, selection cleanup, respawn scheduling and quest events.
- [x] 3.04 Remove duplicate equipment/UI refresh calls after equipping and unequipping.
- [x] 3.05 Consolidate duplicate equipment display logic.
- [x] 3.06 Remove or document unused terrain rendering, decoration data, and legacy UI code.
- [ ] 3.07 Review unused assets such as `house.png` and `tree.png`; retain only if needed or document their intended use.
- [ ] 3.08 Add a README with local run instructions, controls, and project structure.
- [ ] 3.09 Reconcile the existing `todo.txt` with this checklist.

### Focused verification

- [ ] 3.10 Verify equipping, swapping, and unequipping items, including a full inventory.
- [x] 3.11 Verify enemy kills award XP exactly once for both direct damage and damage over time.
- [x] 3.12 Verify kill quest progress, one-time rewards, simultaneous damage and quest reset on restart.
- [ ] 3.13 Verify XP overflow and multiple level-ups from one reward.
- [x] 3.14 Verify dead players cannot move or cast and can restart correctly with Space or the restart button.
- [ ] 3.15 Verify player and enemy collision against obstacles and world boundaries.
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

- [ ] 5.02 Add versioned saves for player progression, equipment, inventory, and action-bar assignments.
- [ ] 5.03 Handle missing, invalid, and older save data safely.
- [ ] 5.04 Make the inventory grid adapt to narrow viewports.
- [ ] 5.05 Limit character-sheet height to the viewport and allow scrolling.
- [ ] 5.06 Show visible controls for opening the character sheet (C) and spell book (K).
- [ ] 5.07 Add Escape-to-close behavior for panels.
- [ ] 5.08 Add descriptive accessible labels to icon-only controls.
- [ ] 5.09 Provide a keyboard alternative to dragging spells onto the action bar.
- [ ] 5.10 Verify the complete introductory gameplay loop across intended screen sizes.
