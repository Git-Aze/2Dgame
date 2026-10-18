// Rarity is separate from item IDs and item level. Stats live on the item;
// displaying rarity must never apply a second hidden stat multiplier.
const RARITIES = Object.freeze({
  common: Object.freeze({ tier: 1, name: "Common", color: "#ffffff" }),
  uncommon: Object.freeze({ tier: 2, name: "Uncommon", color: "#1eff00" }),
  rare: Object.freeze({ tier: 3, name: "Rare", color: "#0070dd" }),
  epic: Object.freeze({ tier: 4, name: "Epic", color: "#a335ee" }),
  legendary: Object.freeze({ tier: 5, name: "Legendary", color: "#ff8000" }),
});

function getRarity(id) {
  return Object.hasOwn(RARITIES, id) ? RARITIES[id] : RARITIES.common;
}

export { RARITIES, getRarity };
