import { WORLD_DATA, AREAS, selectWorldDefinition, worldPosition } from "./world.js";
import { resetWorldState } from "./world-state.js";
import { resetMapCollision } from "./collision.js";
import { resetBuildings } from "./buildings.js";
import { collides } from "./movement.js";
import { spawnStartingEnemies } from "../combat/enemies.js";
import { cancelCasting } from "../combat/spells.js";
import { enemies, player, keys, runtime, fireballs, activeIgnites, swordSwings, isPlaying } from "../core/state.js";
import { emit } from "../core/events.js";
import { showMessage } from "../ui/messages.js";

// Enemy instances pause in areas left behind. Corpses are stored separately,
// with an area ID, and remain available across travel and saves.
const areaEnemies = new Map();

function activateWorld(id) {
  selectWorldDefinition(id);
  resetWorldState();
  resetBuildings();
  resetMapCollision();
  runtime.areaId = id;
}

function resetAreaSessions(id = "village") {
  if (!Object.hasOwn(AREAS, id)) throw new Error("Unknown area.");
  areaEnemies.clear();
  activateWorld(id);
}

function enterArea(id, arrival) {
  if (!isPlaying() || !Object.hasOwn(AREAS, id) || id === runtime.areaId) return false;
  const oldArea = runtime.areaId;
  activateWorld(id);
  const spawn = arrival ?? worldPosition(WORLD_DATA.playerSpawn);
  if (collides(spawn.x, spawn.y, player)) {
    activateWorld(oldArea);
    showMessage("That entrance is blocked.");
    return false;
  }
  areaEnemies.set(oldArea, enemies.slice());
  enemies.length = 0;
  if (areaEnemies.has(id)) enemies.push(...areaEnemies.get(id));
  else spawnStartingEnemies();
  for (const enemy of enemies) enemy.navigation = null;
  cancelCasting();
  runtime.selectedEnemy = null;
  runtime.activeCharge = null;
  fireballs.length = 0;
  activeIgnites.length = 0;
  swordSwings.length = 0;
  emit("combat:reset");
  for (const key in keys) keys[key] = false;
  Object.assign(player, { x: spawn.x, y: spawn.y, moving: false, frame: 0, animTime: 0 });
  runtime.cameraX = 0; runtime.cameraY = 0; runtime.lastTime = 0;
  emit("area:changed", id);
  showMessage(`Entered ${WORLD_DATA.name}.`);
  return true;
}

function portalIsNearby(portal) {
  return Math.hypot(player.x + player.w / 2 - portal.x - portal.width / 2,
    player.y + player.h / 2 - portal.y - portal.height / 2) <= 96;
}

function nearbyPortal() {
  return (WORLD_DATA.portals ?? []).find(portalIsNearby) ?? null;
}

function interactWithPortal(portal) {
  if (!isPlaying() || !(WORLD_DATA.portals ?? []).includes(portal)) return false;
  if (!portalIsNearby(portal)) { showMessage("Move closer to the entrance and press E."); return false; }
  return enterArea(portal.targetArea, portal.arrival);
}

export { enterArea, resetAreaSessions, portalIsNearby, nearbyPortal, interactWithPortal };
