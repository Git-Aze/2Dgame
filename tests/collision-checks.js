import { player, enemies } from "../src/core/state.js";
import { collides, moveEntity, movePlayer } from "../src/world/movement.js";
import { mapCollision } from "../src/world/collision.js";
import { trees, blocked, TILE, WORLD_PIXEL_W, WORLD_PIXEL_H } from "../src/world/world-state.js";
import { buildings, buildingFootprint } from "../src/world/buildings.js";
import { updateEnemies, respawnEnemy } from "../src/combat/enemies.js";

export function runCollisionChecks(assert) {
  const actors = [player, ...enemies];
  const savedActors = actors.map((actor) => structuredClone(actor));
  const savedTerrain = [mapCollision.solid, mapCollision.water, mapCollision.crossings, trees, buildings].map((list) => [...list]);
  const savedBlocked = [...blocked];
  const terrain = [mapCollision.solid, mapCollision.water, mapCollision.crossings, trees, buildings];
  const rectangle = (left, top, right, bottom) => ({
    left, top, right, bottom, points: [[left, top], [right, top], [right, bottom], [left, bottom]],
  });
  try {
    for (const actor of actors) {
      assert(!collides(actor.x, actor.y, actor), `${actor.name}: starting footprint is clear`);
      for (const region of [...mapCollision.solid, ...mapCollision.water]) {
        const [x, y] = region.points[0];
        assert(collides(x - actor.w / 2, y - actor.h / 2, actor), `${actor.name}: real map region ${region.id} blocks footprint`);
      }
      for (const tree of trees) {
        assert(collides(tree.x - actor.w / 2, tree.y - actor.h / 2, actor), `${actor.name}: tree trunk blocks footprint`);
      }
      for (const building of buildings) {
        const bounds = buildingFootprint(building);
        assert(collides(bounds.left, bounds.top, actor), `${actor.name}: shop footprint blocks movement`);
      }
      for (const crossing of mapCollision.crossings) {
        const x = crossing.points.reduce((sum, point) => sum + point[0], 0) / crossing.points.length;
        const y = crossing.points.reduce((sum, point) => sum + point[1], 0) / crossing.points.length;
        assert(!collides(x - actor.w / 2, y - actor.h / 2, actor), `${actor.name}: ${crossing.id} center is walkable`);
      }
    }

    // Controlled obstacles isolate movement behavior from unrelated map geometry.
    terrain.forEach((list) => { list.length = 0; });
    for (const actor of actors) {
      const move = (dx, dy) => actor === player ? movePlayer(dx, dy) : moveEntity(actor, dx, dy);
      for (const [x, y, dx, dy] of [[64, 500, -400, 0], [WORLD_PIXEL_W - 100, 500, 400, 0], [900, 64, 0, -400], [900, WORLD_PIXEL_H - 100, 0, 400]]) {
        actor.x = x; actor.y = y;
        move(dx, dy);
        assert(!collides(actor.x, actor.y, actor) && actor.x >= 0 && actor.y >= 0 && actor.x + actor.w <= WORLD_PIXEL_W && actor.y + actor.h <= WORLD_PIXEL_H,
          `${actor.name}: large movement stays inside world and boundary tiles`);
      }
      const fixtures = [
        [mapCollision.solid, rectangle(950, 650, 954, 850), "thin cliff"],
        [mapCollision.water, rectangle(950, 650, 954, 850), "thin river"],
        [trees, { x: 952, y: 750, trunkWidth: 4, trunkHeight: 200 }, "thin trunk"],
        [buildings, { x: 950, y: 650, footprint: { x: 0, y: 0, width: 4, height: 200 } }, "building"],
      ];
      for (const [list, obstacle, label] of fixtures) {
        list.push(obstacle);
        for (const [x, dx, side] of [[880, 300, "left"], [1000, -300, "right"]]) {
          actor.x = x; actor.y = 700;
          move(dx, 0);
          assert(!collides(actor.x, actor.y, actor) && (side === "left" ? actor.x + actor.w - 3 <= 950 : actor.x + 3 >= 954),
            `${actor.name}: cannot tunnel through ${label} from ${side}`);
        }
        for (const [y, dy, side] of [[550, 400, "above"], [900, -400, "below"]]) {
          actor.x = 952 - actor.w / 2; actor.y = y;
          move(0, dy);
          assert(!collides(actor.x, actor.y, actor) && (side === "above" ? actor.y + actor.h - 3 <= 650 : actor.y + 3 >= 850),
            `${actor.name}: cannot tunnel through ${label} from ${side}`);
        }
        actor.x = 880; actor.y = 700;
        move(100, 50);
        assert(actor.x < 950 && near(actor.y, 750) && !collides(actor.x, actor.y, actor), `${actor.name}: slides along ${label}`);
        list.pop();
      }
      blocked.add("29,22");
      assert(collides(29 * TILE, 22 * TILE, actor), `${actor.name}: blocked tile rejects footprint`);
      blocked.delete("29,22");
      mapCollision.water.push(rectangle(950, 600, 1050, 900));
      mapCollision.crossings.push(rectangle(900, 700, 1100, 760));
      actor.x = 900; actor.y = 710;
      move(200, 0);
      assert(near(actor.x, 1100) && !collides(actor.x, actor.y, actor), `${actor.name}: crosses bridge over water`);
      actor.x = 980; actor.y = 710;
      move(0, 150);
      assert(actor.y < 760 && !collides(actor.x, actor.y, actor), `${actor.name}: cannot step sideways from bridge into water`);
      mapCollision.solid.push(rectangle(980, 710, 1000, 730));
      assert(collides(980, 710, actor), `${actor.name}: crossing never overrides solid terrain`);
      mapCollision.solid.length = 0;
      mapCollision.water.length = 0;
      mapCollision.crossings.length = 0;
    }

    // Exercise actual AI movement branches with each enemy type against a wall.
    mapCollision.solid.push(rectangle(950, 0, 954, WORLD_PIXEL_H));
    enemies.forEach((enemy) => { enemy.alive = false; });
    for (const enemy of enemies) {
      for (const state of ["wander", "chase", "return"]) {
        enemy.alive = true; enemy.stunRemaining = 0;
        enemy.x = 880; enemy.y = 700; enemy.spawnX = state === "return" ? 1050 : 880; enemy.spawnY = 700;
        enemy.aiState = state; enemy.wanderTimer = 0; enemy.wanderTargetX = 1050; enemy.wanderTargetY = 700;
        player.x = state === "chase" ? 1050 : 1500; player.y = 700;
        for (let step = 0; step < 100; step++) updateEnemies(0.05);
        assert(enemy.aiState === state && enemy.x + enemy.w - 3 <= 950 && !collides(enemy.x, enemy.y, enemy),
          `${enemy.name}: ${state} AI stops at terrain`);
        enemy.alive = false;
      }
    }
  } finally {
    terrain.forEach((list, index) => list.splice(0, list.length, ...savedTerrain[index]));
    blocked.clear();
    savedBlocked.forEach((tile) => blocked.add(tile));
    actors.forEach((actor, index) => Object.assign(actor, savedActors[index]));
  }
  for (const enemy of enemies) {
    respawnEnemy(enemy);
    assert(!collides(enemy.x, enemy.y, enemy), `${enemy.name}: respawn footprint is clear`);
  }
}

const near = (a, b) => Math.abs(a - b) < 0.00001;
