import { navigateEnemy } from "../src/world/navigation.js";
import { collides } from "../src/world/movement.js";
import { mapCollision } from "../src/world/collision.js";
import { trees, WORLD_PIXEL_H } from "../src/world/world-state.js";
import { buildings, buildingFootprint } from "../src/world/buildings.js";
import { player, enemies } from "../src/core/state.js";
import { updateEnemies, respawnEnemy } from "../src/combat/enemies.js";

export function runNavigationChecks(assert) {
  const terrain = [mapCollision.walkable, mapCollision.floorHoles, mapCollision.solid, mapCollision.water, mapCollision.crossings, trees, buildings];
  const savedTerrain = terrain.map((list) => [...list]);
  const savedPlayer = structuredClone(player);
  const savedEnemies = enemies.map((enemy) => structuredClone(enemy));
  const rectangle = (left, top, right, bottom) => ({ left, top, right, bottom, points: [[left, top], [right, top], [right, bottom], [left, bottom]] });
  const walk = (actor, x, y, speed = 100) => {
    let safe = true;
    let result;
    for (let step = 0; step < 400; step++) {
      result = navigateEnemy(actor, x, y, speed, 0.05);
      safe &&= !collides(actor.x, actor.y, actor);
      if (result === "arrived") break;
    }
    return safe && result === "arrived" && Math.hypot(actor.x - x, actor.y - y) < 0.1;
  };
  try {
    // First check the actual shop footprint and nearby map geometry.
    const shopBounds = buildingFootprint(buildings[0]);
    for (const type of enemies.filter((enemy, index, all) => all.findIndex((other) => other.id === enemy.id) === index)) {
      const actor = { w: type.w, h: type.h, x: shopBounds.left - 50, y: shopBounds.top - 10, aiState: "return", navigation: null };
      assert(!collides(actor.x, actor.y, actor) && walk(actor, shopBounds.right + 40, actor.y), `${type.name}: routes around actual General Store without entering terrain`);
    }
    terrain.forEach((list) => { list.length = 0; });
    for (const type of enemies.filter((enemy, index, all) => all.findIndex((other) => other.id === enemy.id) === index)) {
      for (const [list, obstacle, label] of [
        [trees, { x: 980, y: 720, trunkWidth: 32, trunkHeight: 60 }, "tree"],
        [buildings, { x: 950, y: 660, footprint: { x: 0, y: 0, width: 80, height: 100 } }, "house"],
        [mapCollision.solid, rectangle(950, 660, 1030, 760), "cliff"],
        [mapCollision.water, rectangle(950, 660, 1030, 760), "water"],
      ]) {
        list.push(obstacle);
        const actor = { w: type.w, h: type.h, x: 880, y: 700, aiState: "wander", navigation: null };
        assert(walk(actor, 1100, 700), `${type.name}: finds a collision-free detour around ${label}`);
        list.pop();
      }
      mapCollision.water.push(rectangle(950, 400, 1050, 1000));
      mapCollision.crossings.push(rectangle(900, 690, 1100, 750));
      const actor = { w: type.w, h: type.h, x: 880, y: 790, aiState: "return", navigation: null };
      const crossed = walk(actor, 1100, 790);
      assert(crossed, `${type.name}: finds bridge instead of entering river ${crossed ? "" : JSON.stringify(actor)}`);
      mapCollision.water.length = 0;
      mapCollision.crossings.length = 0;
    }
    mapCollision.solid.push(rectangle(950, 0, 1030, WORLD_PIXEL_H));
    const stranded = { w: 28, h: 24, x: 880, y: 700, aiState: "chase", navigation: null };
    for (let step = 0; step < 10; step++) navigateEnemy(stranded, 1100, 700, 100, 0.05);
    assert(stranded.x === 880 && stranded.y === 700 && !collides(stranded.x, stranded.y, stranded), "Unreachable destination leaves enemy safely in place");
    mapCollision.solid.length = 0;
    assert(walk(stranded, 1100, 700), "Unreachable route is retried and recovers when route opens");
    const changingRoute = { w: 28, h: 24, x: 880, y: 700, aiState: "chase", navigation: null };
    navigateEnemy(changingRoute, 1100, 700, 100, 0.05);
    mapCollision.solid.push(rectangle(950, 660, 1030, 760));
    assert(walk(changingRoute, 1100, 700), "Enemy safely replans if an obstacle appears across its cached route");
    assert(walk(changingRoute, 880, 820), "Enemy updates route when destination moves");
    mapCollision.solid.splice(0, mapCollision.solid.length,
      rectangle(950, 640, 970, 800), rectangle(1070, 640, 1090, 800), rectangle(950, 780, 1090, 800));
    const outside = { w: 28, h: 24, x: 1020, y: 840, aiState: "return", navigation: null };
    assert(walk(outside, 1020, 720), "Enemy can move away from its goal to enter a U-shaped enclosure through the opening");
    mapCollision.solid.length = 0;

    enemies.forEach((enemy) => { enemy.alive = false; });
    for (const enemy of enemies) {
      for (const mode of ["wander", "chase", "return"]) {
        mapCollision.solid.push(rectangle(950, 660, 1030, 760));
        Object.assign(enemy, { x: 880, y: 700, spawnX: mode === "return" ? 1100 : 880, spawnY: 700,
          alive: true, stunRemaining: 0, attackTimer: 1000, detectionRange: 400, wanderRadius: 400,
          aiState: mode, navigation: null, wanderTargetX: 1100, wanderTargetY: 700, wanderTimer: 0 });
        player.x = mode === "chase" ? 1100 : 1700;
        player.y = 700;
        let safe = true;
        let arrived = false;
        for (let step = 0; step < 600; step++) {
          updateEnemies(0.05);
          safe &&= !collides(enemy.x, enemy.y, enemy);
          const distance = Math.hypot(enemy.x + enemy.w / 2 - 1112, enemy.y + enemy.h / 2 - 712);
          arrived = mode === "chase" ? distance <= enemy.attackRange + 2 : Math.hypot(enemy.x - 1100, enemy.y - 700) < 3;
          if (arrived) break;
        }
        assert(safe && arrived, `${enemy.name}: ${mode} AI reaches destination around obstacle`);
        enemy.stunRemaining = 2;
        const x = enemy.x, y = enemy.y;
        updateEnemies(1);
        assert(enemy.x === x && enemy.y === y && enemy.stunRemaining === 1, `${enemy.name}: stun suspends navigation`);
        enemy.alive = false;
        mapCollision.solid.length = 0;
      }
      enemy.aiState = "chase";
      enemy.alive = true;
      enemy.stunRemaining = 0;
      enemy.x = enemy.spawnX + enemy.wanderRadius + enemy.detectionRange + 10;
      updateEnemies(0.05);
      assert(enemy.aiState === "return", `${enemy.name}: navigation preserves chase leash`);
      respawnEnemy(enemy);
      assert(enemy.navigation === null && enemy.x === enemy.spawnX && enemy.y === enemy.spawnY, `${enemy.name}: respawn clears old route`);
      enemy.alive = false;
    }
    // Close-range melee must not reach through a thin solid obstruction.
    const enemy = enemies[0];
    Object.assign(enemy, { alive: true, x: 900, y: 700, spawnX: 900, spawnY: 700, aiState: "chase", navigation: null, attackTimer: 0, stunRemaining: 0 });
    player.x = 928; player.y = 700;
    mapCollision.solid.push(rectangle(922, 650, 926, 800));
    const hp = player.hp;
    updateEnemies(0.05);
    assert(player.hp === hp, "Enemies cannot melee through a tree or wall while finding a route");
  } finally {
    terrain.forEach((list, index) => list.splice(0, list.length, ...savedTerrain[index]));
    Object.assign(player, savedPlayer);
    enemies.forEach((enemy, index) => Object.assign(enemy, savedEnemies[index]));
  }
}
