import { spawnStartingEnemies } from "./enemies.js";
import { emit, on } from "./events.js";
import { giveStartingItems } from "./inventory.js";
import { messageHistory } from "./messages.js";
import { acceptQuest, resetQuests } from "./quest-system.js";
import { closeShop } from "./shops.js";
import { resetSpellState } from "./spells.js";
import { actionBarSpells, enemies, initialActionBar, initialPlayerState, inventory, keys, player, runtime } from "./state.js";

function setGameState(state) {
  runtime.gameState = state;
  closeShop();
  for (const key in keys) keys[key] = false;
  runtime.lastTime = 0;
  if (state !== "playing") {
    player.moving = false;
    player.casting = false;
    runtime.activeCharge = null;
    player.castReleased = false;
    player.castTime = 0;
    player.castTarget = null;
    player.frame = 0;
    runtime.selectedEnemy = null;
  }
  emit("game:statechanged", state);
}

function startGame() {
  if (runtime.gameState === "playing") return;
  if (runtime.gameState === "dead") {
    Object.assign(player, structuredClone(initialPlayerState));
    runtime.selectedEnemy = null;
    resetSpellState();
    enemies.length = 0;
    runtime.nextEnemyInstanceId = 1;
    spawnStartingEnemies();
    inventory.items.length = 0;
    for (const slot of Object.keys(inventory.equipment)) inventory.equipment[slot] = null;
    actionBarSpells.splice(0, actionBarSpells.length, ...initialActionBar);
    messageHistory.length = 0;
    document.getElementById("message-log-entries").replaceChildren();
    giveStartingItems();
    emit("player:changed");
    resetQuests();
  }
  setGameState("playing");
  acceptQuest("firstSteps");
}


function setupLifecycle() {
  on("player:died", () => setGameState("dead"));
}

export { setGameState, startGame, setupLifecycle };
