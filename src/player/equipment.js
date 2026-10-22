import { player } from "../core/state.js";
import { canEquipForClass, getClass } from "../data/classes.js";
import { getItem } from "../data/items.js";
import { inventory } from "../core/state.js";

function getEquipUnavailableReason(item, classId = player.classId) {
  return canEquipForClass(item, classId) ? "" : `${getClass(classId)?.name ?? "Your class"} cannot equip ${item?.gearCategory ?? "uncategorized"} gear.`;
}

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
    critChance: 0,
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

function meetsWeaponRequirement(action, weapon = getEquippedItem("weapon")) {
  return (!action.requiredWeaponCategory || weapon?.weaponType === action.requiredWeaponCategory) &&
    (!action.requiredWeaponClass || weapon?.weaponClass === action.requiredWeaponClass) &&
    (!action.requiredWeaponId || weapon?.id === action.requiredWeaponId);
}

export { getEquippedItem, getEquipmentBonuses, meetsWeaponRequirement, getEquipUnavailableReason };
