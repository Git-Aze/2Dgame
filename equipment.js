import { getItem } from "./items.js";
import { inventory } from "./state.js";

function getEquippedItem(slot) {
  const itemId = inventory.equipment[slot];

  if (!itemId) return null;

  return getItem(itemId);
}


function getEquipmentBonuses() {
  const bonuses = {
    strength: 0,
    vitality: 0,
    intelligence: 0,
    dexterity: 0,
    armor: 0,
    damage: 0,
  };

  for (const itemId of Object.values(inventory.equipment)) {
    if (!itemId) continue;

    const item = getItem(itemId);

    if (!item || !item.stats) continue;

    for (const [stat, value] of Object.entries(item.stats)) {
      if (bonuses[stat] !== undefined) {
        bonuses[stat] += value;
      }
    }
  }

  return bonuses;
}

export { getEquippedItem, getEquipmentBonuses };
