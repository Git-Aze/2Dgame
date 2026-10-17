import { buildingIsNearby } from "./buildings.js";
import { emit, on } from "./events.js";
import { addItem } from "./inventory.js";
import { getItem } from "./items.js";
import { showMessage } from "./messages.js";
import { cancelCasting } from "./spells.js";
import { isPlaying, keys, player, runtime } from "./state.js";


function openShop(building) {
  if (!isPlaying() || !building.shop || !buildingIsNearby(building)) return;
  runtime.activeShop = building;
  cancelCasting();
  runtime.activeCharge = null;
  for (const key in keys) keys[key] = false;
  player.moving = false;
  player.frame = 0;
  emit("shop:opened");
  emit("shop:changed");
}

function closeShop() {
  if (!runtime.activeShop) return;
  runtime.activeShop = null;
  for (const key in keys) keys[key] = false;
  runtime.lastTime = 0;
  emit("shop:closed");
}

function buyShopItem(itemId) {
  if (runtime.gameState !== "playing" || player.hp <= 0 || !runtime.activeShop ||
      !buildingIsNearby(runtime.activeShop) || !runtime.activeShop.shop.stock.includes(itemId)) return false;
  const item = getItem(itemId);
  if (!item || !Number.isInteger(item.buyPrice) || item.buyPrice < 0) return false;
  if (player.gold < item.buyPrice) {
    showMessage("You do not have enough gold.");
    return false;
  }
  if (!addItem(itemId)) return false;
  player.gold -= item.buyPrice;
  emit("player:changed");
  emit("shop:changed");
  return true;
}



function setupShops() {
  on("shop:requested", openShop);
}

export { openShop, closeShop, buyShopItem, setupShops };
