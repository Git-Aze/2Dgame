import { getEquippedItem } from "../player/equipment.js";
import { equipItem, unequipItem } from "../player/inventory.js";
import { getItem } from "../data/items.js";
import { getRarity } from "../data/rarities.js";
import { setItemAppearance } from "./item-appearance.js";
import { INVENTORY_SIZE, inventory } from "../core/state.js";
import { setTooltip } from "./tooltips.js";

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
    setItemAppearance(slot, item);
    slot.setAttribute("aria-label", `${getRarity(item.rarity).name} ${item.name}, item level ${item.itemLevel}. Equip item.`);
    setTooltip(slot, createItemTooltip(item));

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
  const rarity = getRarity(item.rarity);
  lines.push(`${rarity.name} (Tier ${rarity.tier})`);
  lines.push(`Item level: ${item.itemLevel}`);
  if (item.range) lines.push(`Weapon range: ${item.range} pixels`);
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
      setItemAppearance(nameElement.closest(".equipment-slot"), null);
      nameElement.textContent = "Empty";
      iconElement.textContent = "+";
      setTooltip(nameElement.closest(".equipment-slot"), "Empty equipment slot");

      continue;
    }

    // ----------------------------------------------
    // EQUIPPED ITEM
    // ----------------------------------------------

    nameElement.textContent = item.name;

    iconElement.textContent = item.icon;

    const button = nameElement.closest(".equipment-slot");

    if (button) {
      setItemAppearance(button, item);
      setTooltip(button, createItemTooltip(item) + "\n\nClick to unequip");
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

export { renderInventory, createItemTooltip, renderEquipment, setupEquipmentButtons };
