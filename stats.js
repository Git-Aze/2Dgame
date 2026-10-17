// Balance rules shared by gameplay and stat explanations.
const STAT_RULES = Object.freeze({
  attributeBaseline: 10,
  healthPerStrength: 5,
  speedPerDexterity: 0.02,
  baseHealthRegen: 0.2,
  healthRegenPerVitality: 0.02,
  baseManaRegen: 2,
  manaRegenPerIntelligence: 0.1,
  minimumIncomingDamage: 1,
});

function getPlayerStats() {
  const bonuses = getEquipmentBonuses();
  const strength = player.strength + bonuses.strength;
  const vitality = player.vitality + bonuses.vitality;
  const intelligence = player.intelligence + bonuses.intelligence;
  const dexterity = player.dexterity + bonuses.dexterity;
  return {
    strength, vitality, intelligence, dexterity,
    armor: player.armor + bonuses.armor,
    weaponDamage: bonuses.damage,
    maxHp: player.baseMaxHp + Math.max(0, strength - STAT_RULES.attributeBaseline) * STAT_RULES.healthPerStrength,
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
  return {
    ...spell,
    // Direct attacks use matching weapons; DOT keeps its base tick damage.
    ...(spell.damage !== undefined ? {
      damage: spell.damage + (weapon?.weaponType === spell.requiredWeaponCategory &&
        (!spell.requiredWeaponId || weapon.id === spell.requiredWeaponId) ? stats.weaponDamage : 0),
    } : {}),
  };
}

function getDamageTaken(baseDamage, stats = getPlayerStats()) {
  return Math.max(STAT_RULES.minimumIncomingDamage, baseDamage - stats.armor);
}
