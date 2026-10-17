import { on } from "./events.js";
import { createItemTooltip } from "./inventory-ui.js";
import { hasInventorySpace } from "./inventory.js";
import { getItem } from "./items.js";
import { buyShopItem, closeShop } from "./shops.js";
import { INVENTORY_SIZE, inventory, player, runtime } from "./state.js";
import { setTooltip } from "./tooltips.js";

function renderShop() {
  if (!runtime.activeShop) return;
  document.getElementById("shop-title").textContent = runtime.activeShop.name;
  document.getElementById("shop-gold").textContent = `Gold: ${player.gold} · Inventory: ${inventory.items.length} / ${INVENTORY_SIZE}`;
  const list = document.getElementById("shop-stock");
  list.replaceChildren();
  for (const id of runtime.activeShop.shop.stock) {
    const item = getItem(id);
    if (!item || !Number.isInteger(item.buyPrice) || item.buyPrice < 0) continue;
    const row = document.createElement("div");
    row.className = "shop-item";
    const label = document.createElement("span");
    label.textContent = `${item.icon} ${item.name}`;
    label.tabIndex = 0;
    setTooltip(label, createItemTooltip(item));
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `Buy · ${item.buyPrice} gold`;
    button.disabled = player.gold < item.buyPrice || !hasInventorySpace();
    button.setAttribute("aria-label", `Buy ${item.name} for ${item.buyPrice} gold`);
    button.addEventListener("click", () => {
      if (buyShopItem(id)) {
        document.getElementById("shop-status").textContent = `Bought ${item.name}.`;
        document.getElementById("close-shop").focus();
      }
    });
    row.append(label, button);
    list.appendChild(row);
  }
  document.getElementById("shop-status").textContent = !hasInventorySpace()
    ? "Inventory full. Close the shop and free a slot before buying."
    : "Hover over an item for its stats. Press E or Escape to close.";
}


let shopPreviousFocus = null;

function setupShopUI() {
  on("shop:changed", renderShop);
  on("shop:opened", () => {
    shopPreviousFocus = document.activeElement;
    document.getElementById("game-container").inert = true;
    document.getElementById("shop-dialog").hidden = false;
    document.getElementById("close-shop").focus();
  });
  on("shop:closed", () => {
    document.getElementById("shop-dialog").hidden = true;
    document.getElementById("game-container").inert = runtime.gameState !== "playing";
    if (runtime.gameState === "playing" && shopPreviousFocus?.isConnected) shopPreviousFocus.focus();
  });
document.getElementById("close-shop").addEventListener("click", closeShop);
document.getElementById("shop-dialog").addEventListener("click", (event) => {
  if (event.target.id === "shop-dialog") closeShop();
});

}

export { setupShopUI };
