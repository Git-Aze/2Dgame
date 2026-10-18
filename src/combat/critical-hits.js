import { getPlayerStats, STAT_RULES } from "../player/stats.js";

// Chance uses fractions: an item's stats.critChance of 0.05 adds 5 percentage
// points. Resolve once per direct attack; projectiles retain that result.
function rollPlayerHit(damage, guaranteed = false, random = Math.random) {
  const critical = guaranteed || random() < getPlayerStats().critChance;
  return { damage: Math.round(damage * (critical ? STAT_RULES.criticalDamageMultiplier : 1) * 10) / 10, critical };
}

export { rollPlayerHit };
