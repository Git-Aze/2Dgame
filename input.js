import { castActionBarSlot } from "./actionbar.js";
import { buildingAtScreenPosition, buildingIsNearby, buildings, interactWithBuilding } from "./buildings.js";
import { canvas } from "./canvas.js";
import { toggleCharacterSheet } from "./character-ui.js";
import { startGame } from "./lifecycle.js";
import { closeShop } from "./shops.js";
import { toggleSpellBook } from "./spellbook.js";
import { cancelCasting } from "./spells.js";
import { isPlaying, keys, player, runtime } from "./state.js";
import { targetEnemyAtScreenPosition } from "./targeting.js";

function setupInput() {
  canvas.addEventListener("click", (event) => {
    if (!isPlaying()) return;
    const building = buildingAtScreenPosition(event.clientX, event.clientY);
    if (building) interactWithBuilding(building);
    else targetEnemyAtScreenPosition(event.clientX, event.clientY);
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (runtime.activeShop) {
      if (key === "e" || key === "escape") {
        event.preventDefault();
        if (!event.repeat) closeShop();
      }
      return;
    }
    if (!isPlaying()) {
      if (key === " " && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        if (!event.repeat) startGame();
      }
      return;
    }

    if (key === "c" && !event.repeat) toggleCharacterSheet();
    if (key === "k" && !event.repeat) {
      event.preventDefault();
      toggleSpellBook();
    }
    if (key === "e" && !event.repeat) {
      const building = buildings.find((candidate) => candidate.shop && buildingIsNearby(candidate));
      if (building) interactWithBuilding(building);
    }
    if (key === "escape" && player.casting) cancelCasting("cancelled.");

    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
      event.preventDefault();
    }
    keys[key] = true;

    const tag = event.target?.tagName;
    if (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey &&
        tag !== "INPUT" && tag !== "TEXTAREA" && !event.target?.isContentEditable && /^[0-9]$/.test(event.key)) {
      castActionBarSlot(event.key === "0" ? 9 : Number(event.key) - 1);
    }
  });
  window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
  });
  window.addEventListener("blur", () => {
    for (const key in keys) keys[key] = false;
  });
}

export { setupInput };
