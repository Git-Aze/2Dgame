import { targetEnemyAtScreenPosition } from "../src/combat/targeting.js";
// Runs only from tests/smoke.html, never in the normal game entry point.
import "../src/game.js";
import { player, runtime, enemies, inventory, keys, actionBarSpells, spellCooldowns, fireballs, activeIgnites, questProgress, isPlaying, INVENTORY_SIZE } from "../src/core/state.js";
import { startGame } from "../src/core/lifecycle.js";
import { getPlayerStats, getSpellStats } from "../src/player/stats.js";
import { equipItem, unequipItem } from "../src/player/inventory.js";
import { getItem } from "../src/data/items.js";
import { emit } from "../src/core/events.js";
import { gainXP, damagePlayer, spendAttributePoint, updateHealthRegeneration, updateManaRegeneration } from "../src/player/player.js";
import { damageEnemy, updateEnemies, respawnEnemy } from "../src/combat/enemies.js";
import { SPELLS } from "../src/data/action-definitions.js";
import { castFireball, castIgnite, swordAttack, chargeAttack, updateCharge, updateCasting, updateCombat, updateIgnites, updateSpellCooldowns, resetSpellState } from "../src/combat/spells.js";
import { toggleCharacterSheet, updateCharacterFrame } from "../src/ui/character-ui.js";
import { toggleSpellBook } from "../src/ui/spellbook.js";
import { assignSpellToSlot } from "../src/ui/actionbar.js";
import { collides, movePlayer } from "../src/world/movement.js";
import { mapCollision, spellPathBlocked } from "../src/world/collision.js";
import { trees, WORLD_PIXEL_W, WORLD_PIXEL_H } from "../src/world/world-state.js";
import { buildings, buildingIsNearby, buildingFootprint } from "../src/world/buildings.js";
import { openShop, closeShop, buyShopItem } from "../src/shops/shops.js";
import { greenSlimeImage, redSlimeImage } from "../src/rendering/slime-sprites.js";
import { canvas, resizeCanvas } from "../src/rendering/canvas.js";
import { render } from "../src/rendering/renderer.js";
import { update } from "../src/core/update.js";
import { runCollisionChecks } from "./collision-checks.js";
import { runNavigationChecks } from "./navigation-checks.js";
import { runSaveChecks } from "./save-checks.js";
import { runRarityChecks } from "./rarity-checks.js";
import { runAttributeDamageChecks } from "./attribute-damage-checks.js";
import { runLootChecks } from "./loot-checks.js";
import { runCombatFeedbackChecks } from "./combat-feedback-checks.js";
import { runPauseChecks } from "./pause-checks.js";
import { runAreaChecks } from "./area-checks.js";

let checks = 0;
const errors = [];
window.addEventListener("error", (event) => errors.push(event.message));
function assert(condition, label) {
  if (!condition) throw new Error(label);
  checks++;
}
const near = (a, b) => Math.abs(a - b) < 0.00001;
const text = (id) => document.getElementById(id).textContent;
const key = (value) => window.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true }));
let restoreTerrain = () => {};

try {
  assert(runtime.gameState === "start" && !isPlaying(), "Start state");
  assert(!window.player && !window.SPELLS && !window.startGame, "No implicit gameplay globals");
  assert(enemies.length === 5 && inventory.items.length === 7, "Initial entities/items");
  assert(inventory.items.join(",") === "00001,02000,03000,04000,05000,06000,07000", "Starting items follow category ID ranges");
  assert(["00002", "00003", "00004", "00005", "00006", "00007"].every((id) => getItem(id) === null), "Retired item IDs are no longer valid live items");
  const spawnX = player.x;
  keys.d = true;
  update(1);
  assert(player.x === spawnX, "Simulation paused before start");
  document.getElementById("start-game-button").click();
  assert(isPlaying(), "Start button");
  assert(questProgress.firstSteps.status === "active" && questProgress.slimeTrouble.status === "locked", "Initial quest chain");
  assert(!collides(player.x, player.y), "Clear spawn");
  runCollisionChecks(assert);
  runNavigationChecks(assert);
  key("c");
  assert(!document.getElementById("character-sheet").classList.contains("hidden"), "Character keyboard control");
  assert(equipItem("00001"), "Equip staff");
  assert(player.xp === 20 && questProgress.firstSteps.status === "completed" && questProgress.slimeTrouble.status === "active", "Equipment quest reward/unlock");
  assert(getSpellStats(SPELLS["00001"]).damage === 40.2, "Casting weapon damage");
  player.attributePoints = 2;
  spendAttributePoint("strength");
  spendAttributePoint("dexterity");
  assert(player.maxHp === 105 && near(getPlayerStats().moveSpeed, 147.9), "Attribute effects");
  equipItem("03000");
  const stats = getPlayerStats();
  player.hp = 50;
  player.mana = 10;
  updateHealthRegeneration(1, stats);
  updateManaRegeneration(1, stats);
  updateCharacterFrame();
  assert(near(player.hp, 50.42) && near(player.mana, 13.2), "Equipment regeneration");
  assert(text("sheet-health") === text("character-hp-text") && text("sheet-mana") === text("character-mana-text"), "Live sheet/HUD parity");
  const row = document.getElementById("stat-strength").closest(".stat-row");
  row.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse", clientX: 200, clientY: 200 }));
  assert(!document.getElementById("game-tooltip").hidden, "Instant stat tooltip");
  key("c");
  key("k");
  assert(!document.getElementById("spell-book").classList.contains("hidden") && document.querySelectorAll(".spell-book-entry").length === 5, "Spell book input/rendering");
  key("k");
  assignSpellToSlot("00004", 4);
  const slots = document.querySelectorAll("#action-bar .action-slot");
  const transfer = new DataTransfer();
  transfer.setData("text/plain", "00004");
  transfer.setData("application/x-action-slot", "4");
  slots[5].dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  assert(actionBarSpells[5] === "00004" && actionBarSpells[4] === null, "Action-bar swap");
  transfer.setData("application/x-action-slot", "9999");
  slots[4].dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  assert(actionBarSpells[4] === null && actionBarSpells.length === 10, "Invalid drop rejected");

  // Isolate combat geometry, then restore the real map before shop checks.
  const savedSolid = mapCollision.solid.splice(0);
  const savedWater = mapCollision.water.splice(0);
  const savedTrees = trees.splice(0);
  const savedBuildings = buildings.splice(0);
  restoreTerrain = () => {
    mapCollision.solid.push(...savedSolid);
    mapCollision.water.push(...savedWater);
    trees.push(...savedTrees);
    buildings.push(...savedBuildings);
    restoreTerrain = () => {};
  };
  const target = enemies[0];
  function combatSetup(distance = 100) {
    resetSpellState();
    for (const input in keys) keys[input] = false;
    player.x = 900; player.y = 700; player.hp = 100; player.mana = 50;
    target.x = 900 + distance; target.y = 702; target.hp = 60; target.alive = true; target.stunRemaining = 0;
    runtime.selectedEnemy = target;
  }
  combatSetup(400);
  castFireball();
  assert(!player.casting && player.mana === 50, "Spell range rejection");
  combatSetup();
  trees.push({ x: 950, y: 714, trunkWidth: 20, trunkHeight: 30 });
  castFireball();
  assert(!player.casting && spellPathBlocked(912, 714, 1012, 714), "Tree line of sight");
  trees.length = 0;
  castFireball();
  assert(player.casting && player.mana === 50, "Cast reservation without early mana cost");
  damagePlayer(1);
  assert(!player.casting && player.mana === 50, "Damage interrupts casting");
  combatSetup();
  castFireball(); updateCasting(0.36);
  assert(fireballs.length === 1 && player.mana === 40 && spellCooldowns["00001"] === 0.5, "Fireball release");
  updateCasting(0.2); updateCombat(0.4);
  assert(target.hp === 19.8, "Projectile damage");
  combatSetup(); target.hp = 2;
  castIgnite(); updateIgnites(0.75); updateSpellCooldowns(2); castIgnite(); updateIgnites(0.25);
  assert(!target.alive && activeIgnites.length === 0, "Ignite refresh preserves next tick");
  const xpAfterKill = player.xp;
  damageEnemy(target, 1000, "00001");
  assert(player.xp === xpAfterKill, "Exactly-once kill XP");
  combatSetup(30); equipItem("02000");
  player.mana = 0; swordAttack();
  assert(target.hp === 35.6 && player.mana === 0, "Sword damage and zero mana cost");
  swordAttack(); assert(target.hp === 35.6, "Sword cooldown");
  combatSetup(149); chargeAttack(); assert(!runtime.activeCharge, "Charge minimum range");
  combatSetup(200); chargeAttack();
  assert(runtime.activeCharge && spellCooldowns["00004"] === 20, "Charge start");
  for (let i = 0; i < 20 && runtime.activeCharge; i++) updateCharge(0.05);
  assert(!runtime.activeCharge && target.stunRemaining === 2, "Charge contact/stun");
  const targetX = target.x, health = player.hp;
  updateEnemies(1);
  assert(target.x === targetX && player.hp === health && target.stunRemaining === 1, "Stunned AI");
  damageEnemy(target, 1000, "00003");
  assert(spellCooldowns["00004"] === 0, "Enemy death resets Charge");
  for (const slime of enemies.filter((enemy) => enemy.id === "00001")) {
    if (!slime.alive) respawnEnemy(slime);
    damageEnemy(slime, 1000, "00003");
  }
  assert(questProgress.slimeTrouble.status === "completed" && player.gold === 20, "Quest kill/reward integration");
  const gold = player.gold;
  damageEnemy(target, 1000, "00003");
  assert(player.gold === gold, "No repeated quest reward");
  restoreTerrain();

  const shop = buildings[0];
  assert(shop.x === WORLD_PIXEL_W / 2 && shop.y === WORLD_PIXEL_H / 2 && shop.image.naturalWidth > 0, "Shop image/placement");
  const footprint = buildingFootprint(shop);
  assert(collides(footprint.left + 5, footprint.top + 5), "Building collision");
  player.x = shop.x + shop.entrance.x - player.w / 2;
  player.y = shop.y + shop.entrance.y - player.h / 2;
  assert(buildingIsNearby(shop) && !collides(player.x, player.y), "Shop entrance");
  key("e");
  assert(runtime.activeShop === shop && !isPlaying(), "Shop keyboard interaction/pause");
  const enemyX = enemies[3].x;
  update(1);
  assert(enemies[3].x === enemyX, "Simulation paused in shop");
  player.gold = 50;
  const itemCount = inventory.items.length;
  assert(buyShopItem("00001") && player.gold === 30 && inventory.items.length === itemCount + 1, "Purchase transaction");
  player.gold = 0;
  assert(!buyShopItem("00001"), "Insufficient gold");
  player.gold = 50;
  while (inventory.items.length < INVENTORY_SIZE) inventory.items.push("03000");
  assert(!buyShopItem("00001") && player.gold === 50, "Full inventory does not spend gold");
  key("escape");
  assert(!runtime.activeShop && !runtime.menuOpen && isPlaying(), "Escape closes shop without opening pause menu");
  key("escape");
  assert(runtime.menuOpen && !isPlaying(), "Next Escape opens pause menu after shop closes");
  document.getElementById("menu-continue-button").click();
  closeShop(); assert(isPlaying(), "Close shop resumes game");
  assert(greenSlimeImage.naturalWidth > 0 && redSlimeImage.naturalWidth > 0, "Both slime sprite sheets loaded");
  render();
  const enemy = enemies[3], bounds = canvas.getBoundingClientRect();
  targetEnemyAtScreenPosition(bounds.left + enemy.x + enemy.w / 2 - Math.floor(runtime.cameraX), bounds.top + enemy.y + enemy.h / 2 - Math.floor(runtime.cameraY));
  assert(runtime.selectedEnemy === enemy, "Canvas targeting");
  Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 2 });
  resizeCanvas();
  assert(canvas.width === Math.round(runtime.viewWidth * 2), "DPR scaling");
  damagePlayer(10000);
  assert(runtime.gameState === "dead" && !isPlaying(), "Death state");
  const deadX = player.x;
  movePlayer(10, 0); swordAttack(); update(1);
  assert(player.x === deadX && !player.casting, "Dead input/simulation restrictions");
  key(" ");
  assert(isPlaying() && player.hp === 100 && player.mana === 50 && player.gold === 0 && player.maxHp === 100, "Space restart/resources");
  assert(enemies.length === 5 && inventory.items.length === 7 && Object.keys(spellCooldowns).length === 0, "Restart combat/inventory reset");
  assert(questProgress.firstSteps.status === "active" && questProgress.slimeTrouble.status === "locked", "Restart quest chain");

  // Exercise the real inventory/equipment buttons, checking ownership and UI together.
  toggleCharacterSheet();
  const ownedItems = () => [...inventory.items, ...Object.values(inventory.equipment).filter(Boolean)].sort().join(",");
  const startingItems = ownedItems();
  const clickInventoryItem = (id) => {
    const label = [...document.querySelectorAll(".inventory-item-id")].find((element) => element.textContent === id);
    assert(Boolean(label), `Inventory button exists for ${id}`);
    label.closest("button").click();
  };
  for (const id of ["00001", "03000", "04000", "05000", "06000", "07000"]) {
    const item = getItem(id);
    clickInventoryItem(id);
    assert(inventory.equipment[item.type] === id && text(`equipment-${item.type}`) === item.name && ownedItems() === startingItems,
      `Equip ${item.type} updates ownership and UI`);
  }
  assert(inventory.items.length === 1 && getPlayerStats().armor === 14 && near(getPlayerStats().moveSpeed, 153.7), "All equipment bonuses combine");
  clickInventoryItem("02000");
  assert(inventory.equipment.weapon === "02000" && inventory.items.length === 1 && inventory.items[0] === "00001" && ownedItems() === startingItems,
    "Weapon swap returns staff without losing or duplicating items");
  assert(player.maxHp === 115 && getPlayerStats().intelligence === 10 && text("equipment-weapon") === "Iron Sword", "Swap replaces bonuses and equipment label");
  player.hp = 115;
  clickInventoryItem("00001");
  assert(player.maxHp === 100 && player.hp === 100 && getPlayerStats().strength === 10, "Removing sword clamps health and removes strength bonus");
  for (const slot of Object.keys(inventory.equipment)) {
    document.querySelector(`[data-equipment-slot="${slot}"]`).click();
    assert(inventory.equipment[slot] === null && text(`equipment-${slot}`) === "Empty" && ownedItems() === startingItems,
      `Unequip ${slot} returns item and clears UI`);
  }
  assert(inventory.items.length === 7 && getPlayerStats().armor === 0 && getPlayerStats().moveSpeed === 145, "Unequipping restores base stats");
  assert(!unequipItem("weapon") && !unequipItem("unknown") && ownedItems() === startingItems, "Empty and invalid slots leave ownership unchanged");

  equipItem("00001");
  while (inventory.items.length < INVENTORY_SIZE) inventory.items.push("03000");
  emit("player:changed");
  const fullItems = ownedItems();
  const fullSnapshot = JSON.stringify(inventory);
  document.querySelector('[data-equipment-slot="weapon"]').click();
  assert(JSON.stringify(inventory) === fullSnapshot && text("equipment-weapon") === "Apprentice Staff", "Full backpack blocks unequip without changing inventory or UI");
  clickInventoryItem("02000");
  assert(inventory.items.length === INVENTORY_SIZE && inventory.equipment.weapon === "02000" && ownedItems() === fullItems,
    "Full backpack allows weapon swap without item loss");
  clickInventoryItem("03000");
  assert(inventory.items.length === INVENTORY_SIZE - 1 && inventory.equipment.head === "03000" && ownedItems() === fullItems,
    "Full backpack allows equipping an empty slot");
  document.querySelector('[data-equipment-slot="weapon"]').click();
  assert(inventory.items.length === INVENTORY_SIZE && inventory.equipment.weapon === null && ownedItems() === fullItems,
    "Unequip succeeds when exactly one backpack slot is free");
  clickInventoryItem("03000");
  assert(inventory.items.length === INVENTORY_SIZE && inventory.equipment.head === "03000" && ownedItems() === fullItems,
    "Swapping identical item copies preserves quantities");
  damagePlayer(10000);
  startGame();
  gainXP(99);
  assert(player.level === 1 && player.xp === 99 && player.xpToNextLevel === 100 && player.attributePoints === 0, "XP below threshold does not level up");
  gainXP(1);
  assert(player.level === 2 && player.xp === 0 && player.xpToNextLevel === 150 && player.attributePoints === 5, "Exact threshold grants one level and five points");
  gainXP(151);
  assert(player.level === 3 && player.xp === 1 && player.xpToNextLevel === 225 && player.attributePoints === 10, "XP overflow carries into the next level");
  damagePlayer(10000);
  startGame();
  gainXP(500);
  // Level costs: 100 + 150 + 225 = 475, leaving 25 XP at level 4.
  assert(player.level === 4 && player.xp === 25 && player.xpToNextLevel === 337 && player.attributePoints === 15,
    "One reward grants three levels, exact overflow, and five points per level");
  assert(text("xp-bar-text") === "25 / 337 XP" && near(parseFloat(document.getElementById("xp-bar-fill").style.width), 25 / 337 * 100),
    "XP bar shows final overflow and threshold after multiple levels");
  assert(text("sheet-level") === "Level 4" && text("attribute-points") === "15", "Character sheet reflects all awarded levels and points");
  gainXP(312);
  assert(player.level === 5 && player.xp === 0 && player.xpToNextLevel === 505 && player.attributePoints === 20,
    "Carried XP contributes to next level and thresholds round down");
  const progression = () => JSON.stringify([player.level, player.xp, player.xpToNextLevel, player.attributePoints]);
  const beforeInvalidXP = progression();
  for (const amount of [0, -1, NaN, Infinity, -Infinity, "100", undefined, null]) gainXP(amount);
  assert(progression() === beforeInvalidXP && text("xp-bar-text") === "0 / 505 XP", "Invalid XP rewards leave progression and HUD unchanged");
  damagePlayer(10000);
  startGame();
  assert(player.level === 1 && player.xp === 0 && player.xpToNextLevel === 100 && player.attributePoints === 0 && text("xp-bar-text") === "0 / 100 XP",
    "Restart resets level, XP overflow, threshold, points, and HUD");
  runPauseChecks(assert);
  await runSaveChecks(assert);
  runRarityChecks(assert);
  runAttributeDamageChecks(assert);
  runLootChecks(assert);
  runCombatFeedbackChecks(assert);
  runAreaChecks(assert);
  render();
  assert(errors.length === 0, `Browser errors: ${errors.join("; ")}`);
  const result = `PASS: ${checks} gameplay checks`;
  document.body.dataset.smokeResult = result;
  parent.postMessage({ type: "smoke-results", passed: true, result }, location.origin);
} catch (error) {
  restoreTerrain();
  const result = `FAIL after ${checks} checks: ${error.stack}`;
  document.body.dataset.smokeResult = result;
  parent.postMessage({ type: "smoke-results", passed: false, result }, location.origin);
}
