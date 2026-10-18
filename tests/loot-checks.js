import { corpses, player, enemies, inventory, runtime, INVENTORY_SIZE } from "../src/core/state.js";
import { rollLoot, lootCorpse, corpseUnderPlayer } from "../src/loot/loot.js";
import { getItem } from "../src/data/items.js";
import { getEnemyDamage } from "../src/combat/enemy-stats.js";
import { damageEnemy, respawnEnemy, updateEnemyRespawns, updateEnemies } from "../src/combat/enemies.js";
import { createSave, parseSave, applySave } from "../src/persistence/saves.js";
import { damagePlayer } from "../src/player/player.js";
import { startGame } from "../src/core/lifecycle.js";
import { setMenuOpen } from "../src/core/pause-menu.js";
import { render } from "../src/rendering/renderer.js";
import { canvas } from "../src/rendering/canvas.js";
import { mapCollision } from "../src/world/collision.js";
import { trees } from "../src/world/world-state.js";
import { buildings } from "../src/world/buildings.js";

export function runLootChecks(assert) {
  const snapshot = JSON.stringify(createSave());
  const terrain = [mapCollision.solid, mapCollision.water, trees, buildings];
  const savedTerrain = terrain.map((list) => [...list]);
  const sequence = (...values) => { let index = 0; return () => values[index++ % values.length]; };
  const withRandom = (random, action) => {
    const original = Math.random;
    try { Math.random = random; return action(); } finally { Math.random = original; }
  };
  const key = (repeat = false) => window.dispatchEvent(new KeyboardEvent("keydown", { key: "e", repeat, bubbles: true, cancelable: true }));
  const kill = (random, cause = "00003", level = 1) => {
    const enemy = enemies[0];
    Object.assign(enemy, { alive: true, hp: 60, x: 830, y: 600, level, stunRemaining: 0 });
    withRandom(random, () => damageEnemy(enemy, 1000, cause));
    return corpses[corpses.length - 1];
  };
  try {
    assert(enemies.every((enemy) => enemy.level === 1), "Current monsters start at level 1");
    assert(getEnemyDamage({ damage: 10, level: 1 }) === 10 && getEnemyDamage({ damage: 10, level: 2 }) === 11 && getEnemyDamage({ damage: 10, level: 5 }) === 14, "Monster damage grows 10% of base per level after level 1");
    assert(rollLoot(1, sequence(0, 0.9)).gold === 1 && rollLoot(1, sequence(0.999, 0.9)).gold === 3 && rollLoot(5, sequence(0, 0.9)).gold === 5 && rollLoot(5, sequence(0.999, 0.9)).gold === 15, "Gold ranges are small and scale from level to three times level");
    let itemDrops = 0;
    for (let roll = 0; roll < 1000; roll++) {
      const loot = rollLoot(1, sequence(0, (roll + 0.5) / 1000, 0, 0));
      if (loot.itemId) itemDrops++;
      if (loot.gold !== 1 || (loot.itemId && !getItem(loot.itemId))) throw new Error("Invalid loot shape");
    }
    assert(itemDrops === 350, "Every death drops gold and exactly 35% of item-chance samples add one item");
    const counts = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
    for (let roll = 0; roll < 10000; roll++) {
      const loot = rollLoot(1, sequence(0, 0, (roll + 0.5) / 10000, 0));
      counts[getItem(loot.itemId).rarity]++;
    }
    assert(Object.values(counts).join(",") === "7000,2000,750,200,50", "Higher rarity has progressively lower odds independent of pool size");
    terrain.forEach((list) => { list.length = 0; });
    enemies.forEach((enemy) => { enemy.alive = false; });
    const enemy = enemies[0];
    Object.assign(enemy, { alive: true, x: 825, y: 600, spawnX: 825, spawnY: 600, level: 3, aiState: "chase", navigation: null, attackTimer: 0 });
    player.x = 800; player.y = 600;
    const hp = player.hp;
    updateEnemies(0.05);
    assert(player.hp === hp - 12, "Actual enemy attack applies monster-level damage scaling");
    player.hp = player.maxHp;
    const corpse = kill(sequence(0, 0.1, 0.999, 0));
    const count = corpses.length, xp = player.xp;
    damageEnemy(enemy, 1000, "00002");
    assert(corpses.length === count && player.xp === xp && corpse.gold === 1 && corpse.itemId === "02004", "Shared death handler rolls exactly once for all damage causes");
    const originalLoot = JSON.stringify([corpse.x, corpse.y, corpse.gold, corpse.itemId]);
    updateEnemyRespawns(enemy.respawnTime + 1);
    assert(enemy.alive && corpses.includes(corpse) && JSON.stringify([corpse.x, corpse.y, corpse.gold, corpse.itemId]) === originalLoot, "Enemy respawn leaves existing corpse and rolled loot intact");
    player.x = 1000; player.y = 600;
    const gold = player.gold;
    assert(!lootCorpse(corpse) && player.gold === gold, "Distant corpse cannot be looted");
    player.x = corpse.x - 35;
    mapCollision.solid.push({ left: 820, top: 580, right: 824, bottom: 650, points: [[820, 580], [824, 580], [824, 650], [820, 650]] });
    assert(!lootCorpse(corpse) && player.gold === gold, "Solid scenery prevents looting through walls");
    mapCollision.solid.length = 0;
    player.x = 1000;
    key();
    assert(corpses.includes(corpse), "E away from corpse does not collect it");
    player.x = corpse.x; player.y = corpse.y;
    assert(corpseUnderPlayer() === corpse, "Corpse overlap identifies E interaction");
    setMenuOpen(true);
    key();
    assert(!lootCorpse(corpse) && corpses.includes(corpse), "Pause menu blocks corpse looting");
    setMenuOpen(false);
    while (inventory.items.length < INVENTORY_SIZE) inventory.items.push("03000");
    key(true);
    assert(corpse.gold === 1, "Held E does not repeatedly loot");
    key();
    assert(player.gold === gold + 1 && corpse.gold === 0 && corpse.itemId === "02004" && corpses.includes(corpse), "Full inventory collects gold but preserves item on corpse");
    key();
    assert(player.gold === gold + 1 && corpse.itemId === "02004", "Repeated full-inventory attempts cannot duplicate gold or reroll items");
    render();
    const bounds = canvas.getBoundingClientRect();
    const screen = (target) => ({
      clientX: bounds.left + (target.x + target.w / 2 - Math.floor(runtime.cameraX)) * bounds.width / runtime.viewWidth,
      clientY: bounds.top + (target.y + target.h / 2 - Math.floor(runtime.cameraY)) * bounds.height / runtime.viewHeight,
    });
    canvas.dispatchEvent(new PointerEvent("pointermove", { ...screen(corpse), pointerType: "mouse", bubbles: true }));
    const tooltip = document.getElementById("game-tooltip");
    assert(!tooltip.hidden && tooltip.textContent.includes("Legendary: Dawnbreaker") && tooltip.textContent.includes("Level 1"), "Corpse hover immediately shows rolled item, rarity, and monster level");
    inventory.items.pop();
    key();
    assert(!corpses.includes(corpse) && inventory.items.includes("02004") && player.gold === gold + 1, "E on corpse collects remaining item and removes corpse");
    assert(!lootCorpse(corpse) && player.gold === gold + 1, "Removed corpse cannot be looted again");
    const clicked = kill(() => 0.9, "00002");
    assert(clicked.gold === 3 && clicked.itemId === null, "DOT death creates gold-only corpse through same loot system");
    player.x = clicked.x - 40; player.y = clicked.y;
    render();
    canvas.dispatchEvent(new MouseEvent("click", { ...screen(clicked), bubbles: true }));
    assert(!corpses.includes(clicked) && player.gold === gold + 4, "Clicking nearby corpse collects gold-only loot and removes corpse");
    const savedCorpse = kill(sequence(0, 0.1, 0.999, 0), "00003", 3);
    assert(savedCorpse.level === 3 && savedCorpse.gold === 3, "Death loot uses the actual monster level");
    const text = JSON.stringify(createSave());
    const savedLoot = JSON.stringify(createSave().corpses);
    applySave(text);
    assert(JSON.stringify(createSave().corpses) === savedLoot && corpses[0].sprite === "slime", "Save/load restores corpse visuals and exact loot without rerolling");
    const oldSave = JSON.parse(text);
    oldSave.version = 2;
    delete oldSave.corpses;
    assert(parseSave(JSON.stringify(oldSave)).version === 4 && parseSave(JSON.stringify(oldSave)).corpses.length === 0, "Version 2 saves migrate safely with no corpses");
    const stable = JSON.stringify(createSave().corpses);
    for (const mutate of [
      (s) => { s.corpses[0].gold = -1; },
      (s) => { s.corpses[0].gold = 1000; },
      (s) => { s.corpses[0].itemId = "99999"; },
      (s) => { s.corpses[0].enemyTypeId = "99999"; },
      (s) => { s.corpses[0].level = 0; },
      (s) => { s.corpses[0].x = -100; },
      (s) => { s.corpses[0].gold = 0; s.corpses[0].itemId = null; },
      (s) => { s.corpses.push({ ...s.corpses[0] }); },
    ]) {
      const invalid = JSON.parse(text);
      mutate(invalid);
      let rejected = false;
      try { applySave(JSON.stringify(invalid)); } catch { rejected = true; }
      assert(rejected && JSON.stringify(createSave().corpses) === stable, "Invalid corpse save rejected before touching live loot");
    }
    enemy.level = 5;
    const scaled = rollLoot(enemy.level, sequence(0.999, 0.9));
    assert(scaled.gold === 15, "Higher monster level increases loot gold");
    damagePlayer(10000);
    assert(!lootCorpse(corpses[0]), "Dead player cannot loot");
    startGame();
    assert(corpses.length === 0 && runtime.nextCorpseId === 1, "Restart clears corpses and resets corpse IDs");
    assert(savedCorpse.id > 0, "Corpse has independent stable identity");
  } finally {
    terrain.forEach((list, index) => list.splice(0, list.length, ...savedTerrain[index]));
    applySave(snapshot);
  }
}
