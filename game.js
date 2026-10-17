import "./tooltips.js";
import { setupActionBar } from "./actionbar.js";
import { setupCanvas } from "./canvas.js";
import { setupCharacterUI } from "./character-ui.js";
import { spawnStartingEnemies } from "./enemies.js";
import { emit } from "./events.js";
import { setupInput } from "./input.js";
import { setupEquipmentButtons } from "./inventory-ui.js";
import { giveStartingItems } from "./inventory.js";
import { setGameState, setupLifecycle } from "./lifecycle.js";
import { resetQuests } from "./quest-system.js";
import { setupQuestUI } from "./quest-ui.js";
import { render } from "./renderer.js";
import { setupScreens } from "./screens.js";
import { setupShopUI } from "./shop-ui.js";
import { setupShops } from "./shops.js";
import { setupSpellBook } from "./spellbook.js";
import { setupCombat } from "./spells.js";
import { runtime } from "./state.js";
import { refreshPlayerStats } from "./stats.js";
import { update } from "./update.js";
import { WORLD_DATA } from "./world.js";

// Entry point: initialize modules once, then advance simulation and rendering.
function initializeGame() {
  setupCanvas();
  setupCombat();
  setupCharacterUI();
  setupQuestUI();
  setupShopUI();
  setupShops();
  setupLifecycle();
  setupScreens();
  setupActionBar();
  setupSpellBook();
  setupInput();
  document.getElementById("location").textContent = WORLD_DATA.name;
  spawnStartingEnemies();
  giveStartingItems();
  setupEquipmentButtons();
  refreshPlayerStats();
  emit("player:changed");
  resetQuests();
  setGameState("start");
  requestAnimationFrame(loop);
}

function loop(timestamp) {
  const dt = runtime.lastTime ? Math.min((timestamp - runtime.lastTime) / 1000, 0.05) : 0;

  runtime.lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(loop);
}


initializeGame();
