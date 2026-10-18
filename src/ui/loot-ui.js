import { canvas } from "../rendering/canvas.js";
import { runtime, isPlaying } from "../core/state.js";
import { on } from "../core/events.js";
import { corpseAtPosition } from "../loot/loot.js";
import { getItem } from "../data/items.js";
import { getRarity } from "../data/rarities.js";
import { setTooltip, showTooltip } from "./tooltips.js";
import { setItemAppearance } from "./item-appearance.js";

function corpseAtScreenPosition(screenX, screenY) {
  const bounds = canvas.getBoundingClientRect();
  return corpseAtPosition((screenX - bounds.left) * runtime.viewWidth / bounds.width + Math.floor(runtime.cameraX),
    (screenY - bounds.top) * runtime.viewHeight / bounds.height + Math.floor(runtime.cameraY));
}

function setupLootUI() {
  let hovered = null;
  const clear = () => {
    if (!hovered) return;
    hovered = null;
    setTooltip(canvas, "");
    setItemAppearance(canvas, null);
    canvas.style.cursor = "";
  };
  canvas.addEventListener("pointermove", (event) => {
    const corpse = isPlaying() ? corpseAtScreenPosition(event.clientX, event.clientY) : null;
    if (!corpse) { clear(); return; }
    if (corpse !== hovered) {
      hovered = corpse;
      const item = corpse.itemId ? getItem(corpse.itemId) : null;
      const lines = [`${corpse.name} corpse (Level ${corpse.level})`];
      if (corpse.gold) lines.push(`${corpse.gold} gold`);
      if (item) lines.push(`${getRarity(item.rarity).name}: ${item.name}`, `Item level: ${item.itemLevel}`);
      lines.push("Click nearby to loot, or stand on the corpse and press E.");
      setItemAppearance(canvas, item);
      setTooltip(canvas, lines.join("\n"));
      canvas.style.cursor = "pointer";
      showTooltip(canvas, event.clientX, event.clientY);
    } else if (document.getElementById("game-tooltip").hidden) showTooltip(canvas, event.clientX, event.clientY);
  });
  canvas.addEventListener("pointerleave", clear);
  on("loot:changed", clear);
  on("game:statechanged", clear);
  on("menu:changed", clear);
  on("area:changed", clear);
}

export { corpseAtScreenPosition, setupLootUI };
