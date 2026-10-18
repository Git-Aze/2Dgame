import { corpses, player, runtime, isPlaying } from "../core/state.js";
import { emit, on } from "../core/events.js";
import { getAllItems } from "../data/items.js";
import { LOOT_RULES, LOOT_RARITY_WEIGHTS } from "../data/loot-tables.js";
import { getEnemyLevel } from "../combat/enemy-stats.js";
import { spellPathBlocked } from "../world/collision.js";
import { addItem } from "../player/inventory.js";
import { showMessage } from "../ui/messages.js";

const pools = LOOT_RARITY_WEIGHTS.map((tier) => ({ ...tier, items: getAllItems().filter((item) => item.rarity === tier.rarity) }));
const totalWeight = pools.reduce((sum, tier) => sum + tier.weight, 0);

function rollLoot(level, random = Math.random) {
  const monsterLevel = getEnemyLevel({ level });
  const minGold = monsterLevel * LOOT_RULES.goldMinPerLevel;
  const maxGold = monsterLevel * LOOT_RULES.goldMaxPerLevel;
  const gold = minGold + Math.floor(random() * (maxGold - minGold + 1));
  let itemId = null;
  if (random() < LOOT_RULES.itemChance) {
    let roll = random() * totalWeight;
    for (const tier of pools) {
      if (roll < tier.weight) {
        if (tier.items.length) itemId = tier.items[Math.floor(random() * tier.items.length)].id;
        break;
      }
      roll -= tier.weight;
    }
  }
  return { gold, itemId };
}

function createCorpse(enemy) {
  const corpse = {
    id: runtime.nextCorpseId++, enemyTypeId: enemy.id, level: getEnemyLevel(enemy),
    name: enemy.name, sprite: enemy.sprite, x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h,
    spriteTime: 0, spriteMoving: false, stunRemaining: 0, hurtTime: 0,
    ...rollLoot(getEnemyLevel(enemy)),
  };
  corpses.push(corpse);
  emit("loot:changed");
  return corpse;
}

function corpseAtPosition(x, y) {
  return corpses.findLast((corpse) => x >= corpse.x - 6 && x <= corpse.x + corpse.w + 6 && y >= corpse.y - 6 && y <= corpse.y + corpse.h + 6) ?? null;
}

function playerOverCorpse(corpse) {
  return player.x < corpse.x + corpse.w && player.x + player.w > corpse.x &&
    player.y < corpse.y + corpse.h && player.y + player.h > corpse.y;
}

function corpseUnderPlayer() {
  return corpses.findLast(playerOverCorpse) ?? null;
}

function lootCorpse(corpse) {
  if (!isPlaying() || !corpses.includes(corpse)) return false;
  const px = player.x + player.w / 2, py = player.y + player.h / 2;
  const cx = corpse.x + corpse.w / 2, cy = corpse.y + corpse.h / 2;
  if (Math.hypot(px - cx, py - cy) > LOOT_RULES.clickRange || spellPathBlocked(px, py, cx, cy)) {
    showMessage("Move closer to the corpse to loot it.");
    return false;
  }
  let changed = false;
  if (corpse.gold > 0) {
    player.gold += corpse.gold;
    showMessage(`Looted ${corpse.gold} gold.`);
    corpse.gold = 0;
    changed = true;
  }
  if (corpse.itemId && addItem(corpse.itemId)) {
    corpse.itemId = null;
    changed = true;
  }
  if (!corpse.gold && !corpse.itemId) corpses.splice(corpses.indexOf(corpse), 1);
  if (changed) emit("player:changed");
  emit("loot:changed");
  return changed;
}

function setupLoot() {
  on("enemy:defeated", createCorpse);
}

export { rollLoot, corpseAtPosition, playerOverCorpse, corpseUnderPlayer, lootCorpse, setupLoot };
