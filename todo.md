# Project improvement tasks

Goal: deliver a complete, reliable five-minute experience using the existing village, quest, and enemies before expanding content.

## 1. Stabilize gameplay — highest priority

- [x] Remove procedural trees, their shadows and collisions, and code used only by tree generation.

- [ ] Align collision data with the background map, including cliffs, water, trees, and buildings.
- [ ] Define scenery, collision, spawn points, and quest locations in shared world data.
- [ ] Create shared movement/collision functions that accept each entity's bounds.
- [ ] Apply collision checks to enemy wandering, chasing, and returning.
- [ ] Add explicit playing/dead states and prevent movement and casting while dead.
- [ ] Implement player respawn and reset relevant combat state.
- [x] Consolidate equipment ownership into one source of truth; remove the duplicate `player.equipment` state.
- [ ] Equip the starting staff or clearly explain how to equip it.
- [ ] Use logical viewport dimensions for canvas HUD positioning at all pixel densities.
- [ ] Include enemies in the same depth-sorted render queue as scenery, NPCs, and the player.

Completion target: exploration and combat work without obvious world or state inconsistencies.

## 2. Complete the core gameplay loop

- [ ] Define central derived-stat formulas for resources, regeneration, damage, and defense.
- [ ] Apply equipment intelligence/vitality bonuses to regeneration.
- [ ] Include weapon damage bonuses in the appropriate damage calculations.
- [ ] Give strength and dexterity meaningful gameplay effects and explain them in the UI.
- [ ] Ensure the character sheet displays the same stats that gameplay uses.
- [ ] Define spell range and line-of-sight rules and enforce them consistently.
- [ ] Define casting interruption and Ignite refresh/cooldown behavior.
- [ ] Correct quest directions to match the clearing's actual location.
- [ ] Make the quest destination identifiable in the world.
- [ ] Add a final quest turn-in state and a reward that can only be claimed once.
- [ ] Repair temporary dialogue: connect `showMessage()` to an actual UI element or the canvas dialogue state.
- [ ] Add clear onboarding for movement, targeting, equipment, spells, and quests.

Completion target: a new player can complete a quest, fight, level up, and see character choices affect gameplay.

## 3. Strengthen the codebase

- [ ] Separate world data, player state, combat, rendering, input, and UI into focused modules.
- [ ] Replace implicit global dependencies and script-order coupling with explicit module dependencies.
- [ ] Centralize enemy damage/death handling, including XP, selection cleanup, and respawn scheduling.
- [x] Remove duplicate equipment/UI refresh calls after equipping and unequipping.
- [x] Consolidate duplicate equipment display logic.
- [x] Remove or document unused terrain rendering, decoration data, and legacy UI code.
- [ ] Review unused assets such as `house.png` and `tree.png`; retain only if needed or document their intended use.
- [ ] Add a README with local run instructions, controls, and project structure.
- [ ] Reconcile the existing `todo.txt` with this checklist.

### Focused verification

- [ ] Verify equipping, swapping, and unequipping items, including a full inventory.
- [ ] Verify enemy kills award XP exactly once for both direct damage and damage over time.
- [ ] Verify XP overflow and multiple level-ups from one reward.
- [ ] Verify dead players cannot move or cast and can respawn correctly.
- [ ] Verify player and enemy collision against obstacles and world boundaries.
- [ ] Verify HUD placement at device pixel ratios 1 and 2.
- [ ] Verify quest rewards cannot be claimed repeatedly.

Completion target: new spells and enemies can be added without duplicating core gameplay logic.

## 4. Measure and optimize performance

- [ ] Capture browser performance profiles during exploration and a representative fight.
- [ ] Record frame times and identify actual bottlenecks before larger optimizations.
- [ ] Cull offscreen objects using their full visual bounds, including tall trees and roofs.
- [ ] Reduce per-frame render-queue allocations and drawing closures where profiling justifies it.
- [ ] Consider cached building sprites or static drawing commands if static scenery is expensive.
- [ ] Cache frequently used DOM references.
- [ ] Update quest UI only when quest state changes.
- [ ] Avoid rewriting health/mana text and styles when the displayed values are unchanged.
- [ ] Optimize loaded image assets while preserving visual quality.
- [ ] Re-profile after changes and compare against the baseline.
- [ ] Add enemy pathfinding if collision-aware movement reveals persistent navigation problems.

Completion target: predictable frame times on intended devices, supported by measurements.

## 5. Persistence and usability polish

- [x] Validate dropped spell IDs, source slot bounds, and source spell assignments before changing the action bar.

- [ ] Add versioned saves for player progression, equipment, inventory, quests, and action-bar assignments.
- [ ] Handle missing, invalid, and older save data safely.
- [ ] Make the inventory grid adapt to narrow viewports.
- [ ] Limit character-sheet height to the viewport and allow scrolling.
- [ ] Show visible controls for opening the character sheet (C) and spell book (K).
- [ ] Add Escape-to-close behavior for panels.
- [ ] Add descriptive accessible labels to icon-only controls.
- [ ] Provide a keyboard alternative to dragging spells onto the action bar.
- [ ] Verify the complete introductory gameplay loop across intended screen sizes.
