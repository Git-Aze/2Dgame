import { player, runtime, enemies, inventory } from "../src/core/state.js";
import { resetAdventure } from "../src/core/lifecycle.js";
import { WORLD_DATA } from "../src/world/world.js";
import { collides, moveEntity } from "../src/world/movement.js";
import { enterArea, interactWithPortal } from "../src/world/areas.js";
import { groundMapImage } from "../src/world/world-state.js";
import { canvas } from "../src/rendering/canvas.js";
import { createSave, applySave } from "../src/persistence/saves.js";

function runCaveArenaChecks(assert) {
  resetAdventure();
  enterArea("cave");
  const caveEnemy = enemies[0], items = inventory.items.join(",");
  const entrance = WORLD_DATA.portals.find((portal) => portal.targetArea === "cave-arena");
  assert(entrance && !interactWithPortal(entrance), "Arena entrance exists inside cave and requires proximity");
  Object.assign(player, { x: 1998, y: 316 });
  assert(!collides(player.x, player.y), "Cave arena approach is on reachable floor");
  player.hp = 73; player.mana = 21;
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "e", bubbles: true }));
  assert(runtime.areaId === "cave-arena" && WORLD_DATA.name === "Cave Arena", "E at cave opening enters arena");
  assert(enemies.length === 1 && enemies[0].isBoss, "Arena contains its boss");
  assert(groundMapImage.complete && groundMapImage.naturalWidth === 1536 && groundMapImage.src.endsWith("/cave_boss_area.png"), "Arena loads supplied ground map");
  assert(!collides(player.x, player.y), "Arena entry spawn is clear");
  assert(player.hp === 73 && player.mana === 21 && inventory.items.join(",") === items, "Arena travel preserves character and inventory");
  const at = (x, y) => ({ x: x * 1.5 - player.w / 2, y: y * 1.5 - player.h / 2, w: player.w, h: player.h });
  for (const [x,y] of [[200,200],[300,600],[600,750],[940,750],[760,60],[600,170],[930,170],
    [350,470],[1200,480],[500,590],[1020,590],[1300,400],[230,400],
    [430,280],[1000,630],[850,900],[760,70]]) {
    const point = at(x,y);
    assert(collides(point.x,point.y), `Arena wall, cliff, water, or rock at ${x},${y} blocks movement`);
  }
  const destinations = [[770,930],[770,810],[770,700],[770,500],[450,450],[1080,450],[770,265],[770,190],[400,380],[970,580],[750,900],[450,330],[820,900],[770,115]];
  for (const [x,y] of destinations) {
    const point = at(x,y);
    assert(!collides(point.x,point.y), `Arena floor or stairs at ${x},${y} is open`);
  }
  const queue = [[player.x,player.y]], seen = new Set([`${player.x},${player.y}`]);
  for (let i=0;i<queue.length;i++) {
    const [x,y] = queue[i];
    for (const [dx,dy] of [[12,0],[-12,0],[0,12],[0,-12]]) {
      const nx=x+dx, ny=y+dy, key=`${nx},${ny}`;
      if (!seen.has(key) && !collides(nx,ny)) { seen.add(key); queue.push([nx,ny]); }
    }
  }
  for (const [x,y] of destinations) {
    const point = at(x,y);
    assert(queue.some(([px,py])=>Math.hypot(px-point.x,py-point.y)<18), `Arena floor at ${x},${y} connects to entrance`);
  }
  const wallApproach = at(450,450);
  moveEntity(wallApproach,-600,0);
  assert(wallApproach.x > 300 * 1.5, "Walking west stops at arena wall");
  Object.assign(player, { x: 1140, y: 1380 });
  const exit=WORLD_DATA.portals[0], bounds=canvas.getBoundingClientRect();
  canvas.dispatchEvent(new MouseEvent("click",{bubbles:true,
    clientX:bounds.left+(exit.x+exit.width/2-Math.floor(runtime.cameraX))*bounds.width/runtime.viewWidth,
    clientY:bounds.top+(exit.y+exit.height/2-Math.floor(runtime.cameraY))*bounds.height/runtime.viewHeight}));
  assert(runtime.areaId === "cave" && !collides(player.x,player.y) && enemies.includes(caveEnemy), "Clicked arena exit returns safely to same cave enemies");
  assert(enterArea("cave-arena") && enemies.length === 1 && enemies[0].isBoss, "Revisiting arena restores its boss");
  applySave(JSON.stringify(createSave()));
  assert(runtime.areaId === "cave-arena" && enemies.length === 1 && !collides(player.x,player.y), "Saving and loading restores arena at safe entrance");
  resetAdventure();
}

export { runCaveArenaChecks };
