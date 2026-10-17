// ==================================================
// INVENTORY SYSTEM
// ==================================================
//
// items.js     = defines what items are
// inventory.js = handles owning/equipping items
// game.js      = game/player/combat logic
//
// Inventory and equipment store ITEM IDs only.
// Example: "00002"
// ==================================================

// --------------------------------------------------
// INVENTORY SETTINGS
// --------------------------------------------------

const INVENTORY_SIZE = 20;

// --------------------------------------------------
// PLAYER INVENTORY
// --------------------------------------------------

const inventory = {
  items: [],
  equipment: {
    head: null,
    chest: null,
    weapon: null,
    offhand: null,
    legs: null,
    boots: null,
  },
};

// --------------------------------------------------
// INVENTORY HELPERS
// --------------------------------------------------

function hasInventorySpace() {
  return inventory.items.length < INVENTORY_SIZE;
}

// --------------------------------------------------
// ADD ITEM
// --------------------------------------------------

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

// --------------------------------------------------
// EQUIP ITEM
// --------------------------------------------------

function equipItem(itemId) {
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

  showMessage(`${item.name} equipped.`);
  updateCharacterSheet();
  return true;
}

// --------------------------------------------------
// UNEQUIP ITEM
// --------------------------------------------------

function unequipItem(slot) {
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
  inventory.items.push(itemId);

  if (item) {
    showMessage(`${item.name} unequipped.`);
  }
  updateCharacterSheet();
  return true;
}

// --------------------------------------------------
// GET EQUIPPED ITEM
// --------------------------------------------------

function getEquippedItem(slot) {
  const itemId = inventory.equipment[slot];

  if (!itemId) return null;

  return getItem(itemId);
}

// --------------------------------------------------
// EQUIPMENT STAT BONUSES
// --------------------------------------------------

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

// --------------------------------------------------
// DEBUG / TEST STARTING ITEMS
// --------------------------------------------------

function giveStartingItems() {
  addItem("00001"); // Apprentice Staff
  addItem("00002"); // Iron Sword
  addItem("00003"); // Leather Cap
  addItem("00004"); // Leather Armor
  addItem("00005"); // Wooden Shield
  addItem("00006"); // Leather Pants
  addItem("00007"); // Traveler's Boots
}

// ==================================================
// INVENTORY UI
// ==================================================

function renderInventory() {
  const inventoryGrid = document.getElementById("inventory-grid");

  if (!inventoryGrid) return;

  inventoryGrid.innerHTML = "";

  for (let i = 0; i < INVENTORY_SIZE; i++) {
    const itemId = inventory.items[i];

    const slot = document.createElement("button");

    slot.className = "inventory-slot";

    // ----------------------------------------------
    // EMPTY SLOT
    // ----------------------------------------------

    if (!itemId) {
      slot.classList.add("empty");
      slot.disabled = true;

      inventoryGrid.appendChild(slot);

      continue;
    }

    // ----------------------------------------------
    // ITEM SLOT
    // ----------------------------------------------

    const item = getItem(itemId);

    if (!item) {
      console.error(`Inventory contains unknown item "${itemId}".`);

      inventoryGrid.appendChild(slot);

      continue;
    }

    const icon = document.createElement("span");

    icon.className = "inventory-icon";
    icon.textContent = item.icon;

    const idLabel = document.createElement("span");

    idLabel.className = "inventory-item-id";
    idLabel.textContent = item.id;

    slot.appendChild(icon);
    slot.appendChild(idLabel);

    // Tooltip
    slot.title = createItemTooltip(item);

    // Click item to equip it.
    slot.addEventListener("click", () => {
      equipItem(itemId);
    });

    inventoryGrid.appendChild(slot);
  }
}

function createItemTooltip(item) {
  const lines = [];

  lines.push(item.name);
  lines.push(`ID: ${item.id}`);
  lines.push("");
  lines.push(item.description);

  if (item.stats) {
    lines.push("");

    for (const [stat, value] of Object.entries(item.stats)) {
      const statName = stat.charAt(0).toUpperCase() + stat.slice(1);

      lines.push(`${statName}: +${value}`);
    }
  }

  return lines.join("\n");
}

function renderEquipment() {
  for (const slot of Object.keys(inventory.equipment)) {
    const nameElement = document.getElementById(`equipment-${slot}`);

    const iconElement = document.getElementById(`equipment-icon-${slot}`);

    if (!nameElement || !iconElement) {
      continue;
    }

    const item = getEquippedItem(slot);

    // ----------------------------------------------
    // EMPTY
    // ----------------------------------------------

    if (!item) {
      nameElement.textContent = "Empty";
      iconElement.textContent = "+";

      continue;
    }

    // ----------------------------------------------
    // EQUIPPED ITEM
    // ----------------------------------------------

    nameElement.textContent = item.name;

    iconElement.textContent = item.icon;

    const button = nameElement.closest(".equipment-slot");

    if (button) {
      button.title = createItemTooltip(item) + "\n\nClick to unequip";
    }
  }
}

function setupEquipmentButtons() {
  const equipmentButtons = document.querySelectorAll(".equipment-slot");

  equipmentButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const slot = button.dataset.equipmentSlot;

      if (!slot) return;

      unequipItem(slot);
    });
  });
}
