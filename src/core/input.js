import { castActionBarSlot } from "../ui/actionbar.js";
import { buildingAtScreenPosition, buildingIsNearby, buildings, interactWithBuilding } from "../world/buildings.js";
import { canvas } from "../rendering/canvas.js";
import { toggleCharacterSheet } from "../ui/character-ui.js";
import { startGame } from "./lifecycle.js";
import { closeShop } from "../shops/shops.js";
import { toggleSpellBook } from "../ui/spellbook.js";
import { closeTopPanel, closeMenuLoadOptions } from "../ui/panels.js";
import { setMenuOpen } from "./pause-menu.js";
import { isPlaying, keys, runtime } from "./state.js";
import { targetEnemyAtScreenPosition } from "../combat/targeting.js";
import { corpseAtScreenPosition } from "../ui/loot-ui.js";
import { corpseUnderPlayer, lootCorpse } from "../loot/loot.js";
import { nearbyPortal, interactWithPortal } from "../world/areas.js";
import { portalAtScreenPosition } from "../ui/area-ui.js";

function setupInput() {
  canvas.addEventListener("click", (event) => {
    if (!isPlaying()) return;
    const corpse = corpseAtScreenPosition(event.clientX, event.clientY);
    if (corpse) { lootCorpse(corpse); return; }
    const portal = portalAtScreenPosition(event.clientX, event.clientY);
    if (portal) { interactWithPortal(portal); return; }
    const building = buildingAtScreenPosition(event.clientX, event.clientY);
    if (building) interactWithBuilding(building);
    else targetEnemyAtScreenPosition(event.clientX, event.clientY);
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "m" && event.ctrlKey && !event.altKey && !event.metaKey &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName) && !event.target?.isContentEditable) {
      event.preventDefault();
      if (!event.repeat) runtime.debugCollisions = !runtime.debugCollisions;
      return;
    }
    // Let focused controls handle Space themselves (including Continue/import).
    if (key === " " && event.target?.tagName === "BUTTON" && event.target.id !== "start-game-button") return;
    if (key === "escape" && runtime.gameState === "playing") {
      event.preventDefault();
      if (!event.repeat) {
        if (runtime.menuOpen) {
          if (!closeMenuLoadOptions()) setMenuOpen(false);
        } else if (runtime.activeShop) closeShop();
        else if (!closeTopPanel()) setMenuOpen(true);
      }
      return;
    }
    if (runtime.menuOpen) return;
    if (runtime.activeShop) {
      if (key === "e") {
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
      const corpse = corpseUnderPlayer();
      if (corpse) { event.preventDefault(); lootCorpse(corpse); return; }
      const portal = nearbyPortal();
      if (portal) { event.preventDefault(); interactWithPortal(portal); return; }
      const building = buildings.find((candidate) => candidate.shop && buildingIsNearby(candidate));
      if (building) interactWithBuilding(building);
    }

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
