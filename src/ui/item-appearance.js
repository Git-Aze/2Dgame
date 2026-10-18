import { getRarity } from "../data/rarities.js";

function setItemAppearance(element, item) {
  if (!item) {
    delete element.dataset.rarity;
    element.style.removeProperty("--rarity-color");
    return;
  }
  element.dataset.rarity = item.rarity;
  element.style.setProperty("--rarity-color", getRarity(item.rarity).color);
}

export { setItemAppearance };
