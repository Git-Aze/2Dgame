import { emit } from "../core/events.js";
import { getItem } from "../data/items.js";
import { showMessage } from "../ui/messages.js";
import { recordQuestEvent } from "../quests/quest-system.js";
import { cancelCasting } from "../combat/spells.js";
import { INVENTORY_SIZE, inventory, isPlaying } from "../core/state.js";
import { refreshPlayerStats } from "./stats.js";

function hasInventorySpace() {
  return inventory.items.length < INVENTORY_SIZE;
}


function addItem(itemId) {
  const item = getItem(itemId);

  if (!item) {
    console.error(`Item "${itemId}" does not exist.`);
    return false;
  }

  if (!hasInventorySpace()) {
    showMessage("Your inventory is full.");
    return false;
  }

  inventory.items.push(itemId);

  showMessage(`${item.name} added to your inventory.`);

  return true;
}


function equipItem(itemId) {
  if (!isPlaying()) return false;
  const item = getItem(itemId);

  if (!item) {
    console.error(`Item "${itemId}" does not exist.`);
    return false;
  }

  // Player must actually own the item.
  const inventoryIndex = inventory.items.indexOf(itemId);

  if (inventoryIndex === -1) {
    console.error(
      `Cannot equip "${itemId}" because it is not in the inventory.`,
    );

    return false;
  }

  const slot = item.type;

  // Make sure this item type corresponds to
  // a valid equipment slot.
  if (!(slot in inventory.equipment)) {
    showMessage(`${item.name} cannot be equipped.`);
    return false;
  }

  const currentlyEquipped = inventory.equipment[slot];

  // Remove new item from backpack.
  inventory.items.splice(inventoryIndex, 1);

  // Return old equipment to backpack.
  if (currentlyEquipped) {
    inventory.items.push(currentlyEquipped);
  }

  // Equip new item.
  inventory.equipment[slot] = itemId;
  if (slot === "weapon") cancelCasting("weapon changed.");
  refreshPlayerStats();

  showMessage(`${item.name} equipped.`);
  emit("player:changed");
  recordQuestEvent({ type: "itemEquipped", itemId });
  return true;
}


function unequipItem(slot) {
  if (!isPlaying()) return false;
  if (!(slot in inventory.equipment)) {
    return false;
  }

  const itemId = inventory.equipment[slot];

  if (!itemId) {
    return false;
  }

  if (!hasInventorySpace()) {
    showMessage("Your inventory is full.");
    return false;
  }

  const item = getItem(itemId);

  inventory.equipment[slot] = null;
  if (slot === "weapon") cancelCasting("weapon changed.");
  refreshPlayerStats();
  inventory.items.push(itemId);

  if (item) {
    showMessage(`${item.name} unequipped.`);
  }
  emit("player:changed");
  return true;
}


function giveStartingItems() {
  addItem("00001"); // Apprentice Staff
  addItem("02000"); // Iron Sword
  addItem("03000"); // Leather Cap
  addItem("04000"); // Leather Armor
  addItem("05000"); // Wooden Shield
  addItem("06000"); // Leather Pants
  addItem("07000"); // Traveler's Boots
}

export { hasInventorySpace, addItem, equipItem, unequipItem, giveStartingItems };
