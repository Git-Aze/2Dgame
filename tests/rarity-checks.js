import { RARITIES, getRarity } from "../src/data/rarities.js";
import { getItem } from "../src/data/items.js";
import { SPELLS } from "../src/data/action-definitions.js";
import { player, inventory, enemies, runtime } from "../src/core/state.js";
import { equipItem, unequipItem } from "../src/player/inventory.js";
import { getPlayerStats, getSpellStats } from "../src/player/stats.js";
import { swordAttack, chargeAttack, updateCharge, resetSpellState } from "../src/combat/spells.js";
import { createSave, applySave } from "../src/persistence/saves.js";
import { buildings } from "../src/world/buildings.js";
import { trees } from "../src/world/world-state.js";
import { mapCollision } from "../src/world/collision.js";
import { openShop, closeShop, buyShopItem } from "../src/shops/shops.js";
import { toggleCharacterSheet } from "../src/ui/character-ui.js";

export function runRarityChecks(assert) {
  const snapshot = JSON.stringify(createSave());
  const terrain = [mapCollision.walkable, mapCollision.floorHoles, mapCollision.solid, mapCollision.water, trees, buildings];
  const savedTerrain = terrain.map((list) => [...list]);
  const swords = ["02000", "02001", "02002", "02003", "02004"];
  try {
    assert(Object.keys(RARITIES).join(",") === "common,uncommon,rare,epic,legendary", "Five ordered rarity tiers defined centrally");
    for (const id of ["00001", ...swords, "03000", "04000", "05000", "06000", "07000"]) {
      assert(getItem(id).itemLevel === 1 && Object.hasOwn(RARITIES, getItem(id).rarity), `${id}: valid rarity and item level 1`);
    }
    const shop = buildings[0];
    player.x = shop.x + shop.entrance.x - player.w / 2;
    player.y = shop.y + shop.entrance.y - player.h / 2;
    player.gold = 2000;
    openShop(shop);
    for (const id of swords.slice(1)) {
      const item = getItem(id);
      const label = [...document.querySelectorAll(".shop-item-name")].find((element) => element.textContent.includes(item.name));
      assert(label?.dataset.rarity === item.rarity && label.dataset.tooltip.includes("Item level: 1"), `${id}: shop displays rarity and item level`);
      const gold = player.gold;
      assert(buyShopItem(id) && player.gold === gold - item.buyPrice && inventory.items.includes(id), `${id}: tier sword can be purchased`);
    }
    closeShop();
    terrain.forEach((list) => { list.length = 0; });
    if (document.getElementById("character-sheet").classList.contains("hidden")) toggleCharacterSheet();
    let previousDamage = 0;
    for (const [index, id] of swords.entries()) {
      const item = getItem(id);
      assert(getRarity(item.rarity).tier === index + 1 && item.stats.damage > previousDamage, `${id}: sword rarity and damage progress in order`);
      previousDamage = item.stats.damage;
      const slot = [...document.querySelectorAll(".inventory-item-id")].find((label) => label.textContent === id).closest("button");
      assert(slot.dataset.rarity === item.rarity && slot.dataset.tooltip.includes(getRarity(item.rarity).name) && slot.getAttribute("aria-label").includes("item level 1"), `${id}: inventory has colored rarity, text label, and accessible item description`);
      assert(equipItem(id), `${id}: tier sword equips`);
      const equipment = document.querySelector('[data-equipment-slot="weapon"]');
      equipment.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse", clientX: 200, clientY: 200 }));
      const tooltip = document.getElementById("game-tooltip");
      assert(equipment.dataset.rarity === item.rarity && tooltip.querySelector("span").style.color === getComputedStyle(equipment).borderTopColor && tooltip.textContent.includes("Item level: 1"), `${id}: equipped border and instant tooltip share rarity color`);
      assert(getPlayerStats().weaponDamage === item.stats.damage && getPlayerStats().strength === 10 + item.stats.strength && player.maxHp === 100 + item.stats.strength * 5, `${id}: fixed item stats apply once without level scaling`);
      resetSpellState();
      player.x = 800; player.y = 600;
      const target = enemies[0];
      Object.assign(target, { x: 830, y: 600, hp: 60, alive: true, stunRemaining: 0 });
      runtime.selectedEnemy = target;
      swordAttack();
      assert(target.hp === Math.round((60 - 12 - item.stats.damage - item.stats.strength * 1.1) * 10) / 10 && getSpellStats(SPELLS["00003"]).damage === Math.round((12 + item.stats.damage + item.stats.strength * 1.1) * 10) / 10, `${id}: Sword Strike uses this sword's damage`);
      resetSpellState();
      target.x = 1000;
      chargeAttack();
      assert(Boolean(runtime.activeCharge), `${id}: Charge accepts this sword tier`);
      for (let step = 0; step < 20 && runtime.activeCharge; step++) updateCharge(0.05);
      assert(!runtime.activeCharge && target.stunRemaining === 2, `${id}: Charge reaches target and stuns`);
      const saved = JSON.stringify(createSave());
      applySave(saved);
      assert(inventory.equipment.weapon === id && getItem(id).rarity === item.rarity && getSpellStats(SPELLS["00003"]).damage === Math.round((12 + item.stats.damage + item.stats.strength * 1.1) * 10) / 10, `${id}: save/load preserves sword and derived damage`);
      toggleCharacterSheet();
    }
    player.hp = player.maxHp;
    equipItem("02000");
    assert(player.maxHp === 115 && player.hp === 115, "Swapping legendary for common clamps health to new limits");
    unequipItem("weapon");
    const equipment = document.querySelector('[data-equipment-slot="weapon"]');
    assert(!equipment.dataset.rarity && !equipment.style.getPropertyValue("--rarity-color") && player.maxHp === 100, "Unequipping removes rarity styling and stat bonuses");
    equipItem("00001");
    resetSpellState();
    player.x = 800; player.y = 600;
    runtime.selectedEnemy = enemies[0];
    Object.assign(enemies[0], { x: 830, y: 600, hp: 60, alive: true });
    swordAttack();
    enemies[0].x = 1000;
    chargeAttack();
    assert(enemies[0].hp === 60 && !runtime.activeCharge, "Staff cannot use sword attacks or Charge");
  } finally {
    closeShop();
    terrain.forEach((list, index) => list.splice(0, list.length, ...savedTerrain[index]));
    applySave(snapshot);
  }
}
