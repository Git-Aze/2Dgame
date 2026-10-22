import { BASE_CAST_TIME } from "../data/action-definitions.js";
import { getEquipmentBonuses, getEquippedItem, meetsWeaponRequirement } from "./equipment.js";
import { player } from "../core/state.js";

// Balance rules shared by gameplay and stat explanations.
const STAT_RULES = Object.freeze({
  attributeBaseline: 10,
  damagePerAttribute: 1.1,
  healthPerStrength: 5,
  speedPerDexterity: 0.02,
  baseHealthRegen: 0.2,
  healthRegenPerVitality: 0.02,
  baseManaRegen: 2,
  manaRegenPerIntelligence: 0.1,
  minimumIncomingDamage: 1,
  baseCritChance: 0.05,
  criticalDamageMultiplier: 2,
});

function getPlayerStats({ includeTemporary = true } = {}) {
  const bonuses = getEquipmentBonuses();
  const baseStrength = player.strength + bonuses.strength;
  const strength = includeTemporary && player.warCryRemaining > 0 ? Math.round(baseStrength * 1.2 * 10) / 10 : baseStrength;
  const vitality = player.vitality + bonuses.vitality;
  const intelligence = player.intelligence + bonuses.intelligence;
  const dexterity = player.dexterity + bonuses.dexterity;
  return {
    strength, vitality, intelligence, dexterity,
    armor: player.armor + bonuses.armor,
    weaponDamage: bonuses.damage,
    critChance: Math.max(0, Math.min(1, STAT_RULES.baseCritChance + bonuses.critChance)),
    maxHp: Math.round((player.baseMaxHp + Math.max(0, strength - STAT_RULES.attributeBaseline) * STAT_RULES.healthPerStrength +
      (includeTemporary && player.lastStandRemaining > 0 ? player.lastStandHealthBonus : 0)) * 10) / 10,
    maxMana: player.baseMaxMana,
    moveSpeed: player.speed * (1 + Math.max(0, dexterity - STAT_RULES.attributeBaseline) * STAT_RULES.speedPerDexterity),
    healthRegen: STAT_RULES.baseHealthRegen + vitality * STAT_RULES.healthRegenPerVitality,
    manaRegen: STAT_RULES.baseManaRegen + intelligence * STAT_RULES.manaRegenPerIntelligence,
  };
}

// Resource limits change when equipment or attributes change, without healing.
function refreshPlayerStats() {
  const stats = getPlayerStats();
  player.maxHp = stats.maxHp;
  player.maxMana = stats.maxMana;
  player.hp = Math.max(0, Math.min(player.hp, stats.maxHp));
  player.mana = Math.max(0, Math.min(player.mana, stats.maxMana));
  return stats;
}

function getSpellStats(spell, stats = getPlayerStats()) {
  const weapon = getEquippedItem("weapon");
  const attribute = { Melee: "strength", Casting: "intelligence", Ranged: "dexterity" }[spell.requiredWeaponCategory];
  const attributeDamage = attribute ? Math.max(0, stats[attribute] - STAT_RULES.attributeBaseline) * STAT_RULES.damagePerAttribute : 0;
  const weaponDamage = weapon && meetsWeaponRequirement(spell, weapon) ? stats.weaponDamage : 0;
  const roundDamage = (value) => Math.round(value * 10) / 10;
  return {
    ...spell,
    castTime: spell.castTime ?? (spell.requiredWeaponCategory === "Casting" ? BASE_CAST_TIME : 0),
    // Equipment attributes are included once. DOT scales with its attribute,
    // while direct hits also include matching weapon damage. Round to tenths.
    ...(spell.damage !== undefined ? {
      damage: roundDamage(spell.damage + weaponDamage + attributeDamage),
      critChance: stats.critChance,
    } : {}),
    ...(spell.damagePerTick !== undefined ? { damagePerTick: roundDamage(spell.damagePerTick + attributeDamage) } : {}),
    ...(spell.useWeaponRange && weapon?.weaponType === "Ranged" ? { range: weapon.range } : {}),
  };
}

function getDamageTaken(baseDamage, stats = getPlayerStats()) {
  const afterArmor = Math.max(STAT_RULES.minimumIncomingDamage, baseDamage - stats.armor);
  return player.shieldWallRemaining > 0
    ? Math.max(STAT_RULES.minimumIncomingDamage, Math.round(afterArmor * 0.6 * 10) / 10) : afterArmor;
}

export { STAT_RULES, getPlayerStats, refreshPlayerStats, getSpellStats, getDamageTaken };
