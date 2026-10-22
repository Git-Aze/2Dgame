import { getClass } from "../data/classes.js";
import { spawnStartingEnemies } from "../combat/enemies.js";
import { emit, on } from "./events.js";
import { giveStartingItems } from "../player/inventory.js";
import { messageHistory } from "../ui/messages.js";
import { acceptQuest, resetQuests } from "../quests/quest-system.js";
import { closeShop } from "../shops/shops.js";
import { setMenuOpen } from "./pause-menu.js";
import { resetSpellState } from "../combat/spells.js";
import { resetAreaSessions } from "../world/areas.js";
import { WORLD_DATA, worldPosition } from "../world/world.js";
import { actionBarSpells, enemies, corpses, enemyProjectiles, initialActionBar, initialPlayerState, inventory, keys, player, runtime } from "./state.js";

function setGameState(state) {
  runtime.gameState = state;
  setMenuOpen(false);
  closeShop();
  for (const key in keys) keys[key] = false;
  runtime.lastTime = 0;
  if (state !== "playing") {
    resetSpellState();
    enemyProjectiles.length = 0;
    player.moving = false;
    player.casting = false;
    runtime.activeCharge = null;
    player.castReleased = false;
    player.castTime = 0;
    player.castDuration = 0;
    player.castSpellId = null;
    player.castTarget = null;
    player.frame = 0;
    runtime.selectedEnemy = null;
  }
  emit("game:statechanged", state);
}

function resetAdventure(areaId = "village", classId = player.classId) {
  const definition = getClass(classId);
  if (!definition) throw new Error("Unknown character class.");
  resetAreaSessions(areaId);
  closeShop();
  Object.assign(player, structuredClone(initialPlayerState));
  player.classId = classId;
  Object.assign(player, worldPosition(WORLD_DATA.playerSpawn));
  runtime.selectedEnemy = null;
  runtime.selectedQuestId = null;
  resetSpellState();
  enemies.length = 0;
  corpses.length = 0;
  runtime.nextCorpseId = 1;
  runtime.nextEnemyInstanceId = 1;
  spawnStartingEnemies();
  inventory.items.length = 0;
  for (const slot of Object.keys(inventory.equipment)) inventory.equipment[slot] = null;
  actionBarSpells.splice(0, actionBarSpells.length, ...Array.from({ length: initialActionBar.length }, (_, index) => (definition.actionBar ?? definition.abilities)[index] ?? null));
  messageHistory.length = 0;
  document.getElementById("message-log-entries").replaceChildren();
  giveStartingItems();
  emit("player:changed");
  resetQuests();
  emit("area:changed", areaId);
}

function startGame() {
  if (runtime.gameState === "playing") return;
  if (runtime.gameState === "dead") resetAdventure("village", player.classId);
  else resetAdventure("village", runtime.selectedClassId);
  setGameState("playing");
  acceptQuest("firstSteps");
}


function setupLifecycle() {
  on("player:died", () => setGameState("dead"));
}

export { setGameState, startGame, resetAdventure, setupLifecycle };
