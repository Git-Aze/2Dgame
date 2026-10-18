// Weights are conditional on an item dropping, independent of tier pool sizes.
const LOOT_RULES = Object.freeze({ itemChance: 0.35, goldMinPerLevel: 1, goldMaxPerLevel: 3, clickRange: 64 });
const LOOT_RARITY_WEIGHTS = Object.freeze([
  Object.freeze({ rarity: "common", weight: 7000 }),
  Object.freeze({ rarity: "uncommon", weight: 2000 }),
  Object.freeze({ rarity: "rare", weight: 750 }),
  Object.freeze({ rarity: "epic", weight: 200 }),
  Object.freeze({ rarity: "legendary", weight: 50 }),
]);

export { LOOT_RULES, LOOT_RARITY_WEIGHTS };
