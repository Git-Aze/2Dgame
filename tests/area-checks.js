import { player, runtime, enemies, corpses, fireballs, spellCooldowns } from "../src/core/state.js";
import { resetAdventure } from "../src/core/lifecycle.js";
import { WORLD_DATA } from "../src/world/world.js";
import { enterArea, interactWithPortal } from "../src/world/areas.js";
import { collides, moveEntity } from "../src/world/movement.js";
import { spellPathBlocked } from "../src/world/collision.js";
import { groundMapImage, trees } from "../src/world/world-state.js";
import { buildings } from "../src/world/buildings.js";
import { createSave, applySave, parseSave } from "../src/persistence/saves.js";
import { damageEnemy } from "../src/combat/enemies.js";
import { canvas } from "../src/rendering/canvas.js";

function runAreaChecks(assert) {
  resetAdventure();
  const villageEnemy = enemies[0];
  const entrance = WORLD_DATA.portals[0];
  assert(!interactWithPortal(entrance), "Distant cave entrance cannot teleport the player");
  Object.assign(player, { x: 2100, y: 275 });
  assert(!collides(player.x, player.y), "Village cave approach is clear");
  player.hp = 75; player.mana = 23; spellCooldowns["00004"] = 12;
  fireballs.push({});
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "e", bubbles: true }));
  assert(runtime.areaId === "cave", "E at nearby village entrance enters cave");
  assert(runtime.areaId === "cave" && WORLD_DATA.id === "cave" && document.getElementById("location").textContent === WORLD_DATA.name, "Cave state and area label update together");
  assert(player.hp === 75 && player.mana === 23 && spellCooldowns["00004"] === 12 && fireballs.length === 0, "Travel preserves resources and cooldowns and clears projectiles");
  assert(!collides(player.x, player.y) && trees.length === 0 && buildings.length === 0, "Cave spawn is clear and village scenery is absent");
  assert(groundMapImage.complete && groundMapImage.naturalWidth === 1536, "Cave background asset loads");
  assert(enemies.length === 5 && enemies.every((enemy) => !collides(enemy.x, enemy.y, enemy)), "Cave enemies spawn on traversable floor");
  assert(collides(50, 50) && collides(1200, 900), "Cave walls and central pool block movement");
  assert(!collides(1490, 910), "Cave water bridge is traversable");
  assert(spellPathBlocked(300, 1200, 300, 200), "Cave walls block attacks through disconnected chambers");
  // Reference-image points are independent of the scaled world and camera.
  const at = (x, y) => ({ x: x * 1.5 - player.w / 2, y: y * 1.5 - player.h / 2, w: player.w, h: player.h });
  for (const [x, y] of [[1100,730],[1200,750],[1200,880],[1300,900],
    [900,420],[960,470],[1050,700],[400,680],[500,820],[1300,425],
    [280,510],[400,540],[890,110],[1220,180],[1290,450],[1400,485],[800,480],[970,610]]) {
    const position = at(x, y);
    assert(collides(position.x, position.y), `Cave wall, bank, water, or chasm at ${x},${y} is blocked`);
  }
  for (const [x, y] of [[200,800],[350,200],[200,480],[500,510],[610,650],
    [690,800],[740,900],[900,940],[1030,900],[1060,802],[1170,802],
    [1310,802],[1390,760],[1350,600],[1190,480],[1320,280],[1000,610],[1030,645],[750,220],[800,780],[900,750]]) {
    const position = at(x, y);
    assert(!collides(position.x, position.y), `Cave floor or bridge at ${x},${y} remains open`);
  }
  const waterApproach = at(1010,610);
  assert(!collides(waterApproach.x, waterApproach.y), "Water-bridge movement check starts on its deck");
  moveEntity(waterApproach, -150, 0);
  assert(waterApproach.x + 3 >= 988 * 1.5, "Movement cannot step sideways off the water bridge");
  const bridgeApproach = at(1170,802);
  assert(!collides(bridgeApproach.x, bridgeApproach.y), "Chasm-bridge movement check starts on its deck");
  moveEntity(bridgeApproach, 0, -150);
  assert(bridgeApproach.y + 3 >= 792 * 1.5, "Movement cannot step off the chasm bridge into the cliff");
  const cliffApproach = at(1200,600);
  assert(!collides(cliffApproach.x, cliffApproach.y), "Chasm movement check starts on chamber floor");
  moveEntity(cliffApproach, 0, 240);
  assert(cliffApproach.y < 690 * 1.5, "Movement from the east chamber stops at the chasm rim");
  // Flood-fill actor-sized positions to verify every chamber is reachable.
  const step = 12, queue = [[player.x, player.y]], visited = new Set([`${player.x},${player.y}`]);
  for (let index = 0; index < queue.length; index++) {
    const [x, y] = queue[index];
    for (const [dx, dy] of [[step,0],[-step,0],[0,step],[0,-step]]) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (!visited.has(key) && !collides(nx, ny)) { visited.add(key); queue.push([nx, ny]); }
    }
  }
  for (const enemy of enemies) assert(queue.some(([x,y]) => Math.hypot(x-enemy.x,y-enemy.y) < 24), `Cave chamber containing ${enemy.name} at ${enemy.x},${enemy.y} is reachable`);
  for (const [x, y] of [[750,220],[800,780],[900,750],[1000,610],[1170,802]]) {
    const destination = at(x, y);
    assert(queue.some(([px,py]) => Math.hypot(px-destination.x,py-destination.y) < 18), `Cave corridor or bridge at ${x},${y} is connected to the entrance`);
  }
  const caveEnemy = enemies[0];
  damageEnemy(caveEnemy, 10000);
  const corpse = corpses[0];
  assert(corpse?.areaId === "cave", "Cave loot records its area");
  Object.assign(player, { x: 280, y: 1130 });
  const exit = WORLD_DATA.portals[0], bounds = canvas.getBoundingClientRect();
  canvas.dispatchEvent(new MouseEvent("click", { bubbles: true,
    clientX: bounds.left + (exit.x + exit.width / 2 - Math.floor(runtime.cameraX)) * bounds.width / runtime.viewWidth,
    clientY: bounds.top + (exit.y + exit.height / 2 - Math.floor(runtime.cameraY)) * bounds.height / runtime.viewHeight }));
  assert(runtime.areaId === "village", "Clicking nearby cave exit returns to village");
  assert(!collides(player.x, player.y) && enemies.includes(villageEnemy), "Return position is clear and village enemy instances persist");
  assert(enterArea("cave") && enemies.includes(caveEnemy) && !caveEnemy.alive && corpses.includes(corpse), "Revisiting cave preserves enemy death and unlooted corpse");
  const save = createSave();
  assert(save.version === 4 && save.areaId === "cave" && save.corpses[0].areaId === "cave", "Save records active area and corpse area");
  applySave(JSON.stringify(save));
  assert(runtime.areaId === "cave" && !collides(player.x, player.y) && corpses[0].areaId === "cave", "Load restores cave at safe spawn with its loot");
  const legacy = { ...save, version: 3 }; delete legacy.areaId;
  assert(parseSave(JSON.stringify(legacy)).areaId === "village", "Older saves migrate to village");
  for (const invalid of [{ ...save, areaId: "missing" }, { ...save, corpses: [{ ...save.corpses[0], areaId: "missing" }] }]) {
    let rejected = false; try { applySave(JSON.stringify(invalid)); } catch { rejected = true; }
    assert(rejected && runtime.areaId === "cave", "Unknown saved areas are rejected before changing live state");
  }
  resetAdventure();
  assert(runtime.areaId === "village" && corpses.length === 0 && !enemies.includes(villageEnemy), "Restart resets area sessions and loot to village");
}
export { runAreaChecks };
