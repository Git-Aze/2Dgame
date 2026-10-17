import { emit } from "./events.js";
import { showMessage } from "./messages.js";
import { isPlaying, player } from "./state.js";
import { getDamageTaken, getPlayerStats, refreshPlayerStats } from "./stats.js";

const SPENDABLE_ATTRIBUTES = ["strength", "vitality", "intelligence", "dexterity"];
function gainXP(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  player.xp += amount;

  showMessage(`You gained ${amount} XP.`);

  // Handle leveling up.
  while (player.xp >= player.xpToNextLevel) {
    player.xp -= player.xpToNextLevel;

    player.level++;
    player.attributePoints += 5;

    // Increase XP required for the next level.
    player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);

    showMessage(`Level ${player.level}! You received 5 attribute points.`);
  }

  emit("player:changed");
}


function spendAttributePoint(attribute) {
  if (!isPlaying()) return;
  // Validate the attribute.
  if (!SPENDABLE_ATTRIBUTES.includes(attribute)) return;

  // Check available points.
  if (player.attributePoints <= 0) return;

  // Increase the base attribute.
  player[attribute] += 1;

  // Spend one point.
  player.attributePoints -= 1;
  refreshPlayerStats();

  // Refresh the character sheet.
  emit("player:changed");
}


function damagePlayer(baseDamage) {
  if (!isPlaying()) return 0;
  const stats = getPlayerStats();

  const armor = stats.armor;

  // 1 armor reduces incoming damage by 1.
  // Attacks always deal at least 1 damage.
  const finalDamage = getDamageTaken(baseDamage, stats);

  player.hp = Math.max(0, player.hp - finalDamage);
  emit("player:hurt");

  showMessage(`You take ${finalDamage} damage. (${armor} armor)`);

  if (player.hp <= 0) {
    emit("player:died");
    emit("resources:changed");
  }

  return finalDamage;
}


function updateManaRegeneration(dt, stats = getPlayerStats()) {
  if (player.mana >= player.maxMana) {
    player.mana = player.maxMana;
    return;
  }

  player.mana = Math.min(
    player.maxMana,
    player.mana + stats.manaRegen * dt
  );
}


function updateHealthRegeneration(dt, stats = getPlayerStats()) {
  if (player.hp <= 0 || player.hp >= player.maxHp) {
    return;
  }

  player.hp = Math.min(
    player.maxHp,
    player.hp + stats.healthRegen * dt
  );
}

export { gainXP, spendAttributePoint, damagePlayer, updateManaRegeneration, updateHealthRegeneration };
