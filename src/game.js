import { setupCastBar, updateCastBar } from "./ui/cast-bar.js";
import { updateTargetFrame } from "./ui/target-frame.js";
import "./ui/tooltips.js";
import { setupActionBar, updateActionBarStatus } from "./ui/actionbar.js";
import { setupCanvas } from "./rendering/canvas.js";
import { setupCharacterUI } from "./ui/character-ui.js";
import { spawnStartingEnemies } from "./combat/enemies.js";
import { emit } from "./core/events.js";
import { setupInput } from "./core/input.js";
import { setupEquipmentButtons } from "./ui/inventory-ui.js";
import { giveStartingItems } from "./player/inventory.js";
import { setGameState, setupLifecycle } from "./core/lifecycle.js";
import { resetQuests } from "./quests/quest-system.js";
import { setupQuestUI } from "./ui/quest-ui.js";
import { render } from "./rendering/renderer.js";
import { setupScreens } from "./ui/screens.js";
import { setupSaveUI } from "./ui/save-ui.js";
import { setupPauseMenu } from "./ui/pause-menu-ui.js";
import { setupShopUI } from "./ui/shop-ui.js";
import { setupShops } from "./shops/shops.js";
import { setupSpellBook } from "./ui/spellbook.js";
import { setupCombat } from "./combat/spells.js";
import { runtime } from "./core/state.js";
import { refreshPlayerStats } from "./player/stats.js";
import { update } from "./core/update.js";
import { WORLD_DATA } from "./world/world.js";
import { setupLoot } from "./loot/loot.js";
import { setupLootUI } from "./ui/loot-ui.js";
import { setupCombatFeedback } from "./combat/feedback.js";
import { setupAreaUI } from "./ui/area-ui.js";
import { setupBossEncounter } from "./combat/boss.js";

// Entry point: initialize modules once, then advance simulation and rendering.
function initializeGame() {
  setupCanvas();
  setupAreaUI();
  setupBossEncounter();
  setupCombat();
  setupCombatFeedback();
  setupLoot();
  setupLootUI();
  setupCharacterUI();
  setupQuestUI();
  setupShopUI();
  setupShops();
  setupLifecycle();
  setupScreens();
  setupPauseMenu();
  setupSaveUI();
  setupActionBar();
  setupCastBar();
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
  updateActionBarStatus();
  updateCastBar();
  updateTargetFrame();
  render();

  requestAnimationFrame(loop);
}


initializeGame();
