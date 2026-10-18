const ENEMY_LEVEL_RULES = Object.freeze({ maxLevel: 75, damagePerLevel: 0.1 });

function getEnemyLevel(enemy) {
  return Number.isInteger(enemy.level) ? Math.min(ENEMY_LEVEL_RULES.maxLevel, Math.max(1, enemy.level)) : 1;
}

function getEnemyDamage(enemy) {
  return Math.round(enemy.damage * (1 + (getEnemyLevel(enemy) - 1) * ENEMY_LEVEL_RULES.damagePerLevel) * 10) / 10;
}

export { ENEMY_LEVEL_RULES, getEnemyLevel, getEnemyDamage };
