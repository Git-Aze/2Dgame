import { buildingFootprint, buildings } from "./buildings.js";
import { collidesWithMap, mapCollision } from "./collision.js";
import { isPlaying, player } from "../core/state.js";
import { TILE, WORLD_PIXEL_H, WORLD_PIXEL_W, isBlocked, trees } from "./world-state.js";
import { WORLD_DATA } from "./world.js";

function collides(x, y, entity = player) {
  const margin = WORLD_DATA.collision.entityMargin;

  if (x + margin < 0 || y + margin < 0 ||
      x + entity.w - margin > WORLD_PIXEL_W ||
      y + entity.h - margin > WORLD_PIXEL_H) return true;

  if (collidesWithMap(x + margin, y + margin,
      x + entity.w - margin, y + entity.h - margin)) return true;
  if (buildings.some((building) => {
    const bounds = buildingFootprint(building);
    return x + entity.w - margin > bounds.left && x + margin < bounds.right &&
      y + entity.h - margin > bounds.top && y + margin < bounds.bottom;
  })) return true;

  const left = Math.floor((x + margin) / TILE);
  const right = Math.floor((x + entity.w - margin) / TILE);
  const top = Math.floor((y + margin) / TILE);
  const bottom = Math.floor((y + entity.h - margin) / TILE);

  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (isBlocked(tx, ty)) return true;
    }
  }

  return trees.some((tree) =>
    x + entity.w - margin > tree.x - tree.trunkWidth / 2 &&
    x + margin < tree.x + tree.trunkWidth / 2 &&
    y + entity.h - margin > tree.y - tree.trunkHeight / 2 &&
    y + margin < tree.y + tree.trunkHeight / 2
  );
}


function slideAlongBorders(entity, dx, dy) {
  let bestX = 0, bestY = 0, bestProgress = 0;
  const distance = Math.hypot(dx, dy);
  const centerX = entity.x + entity.w / 2, centerY = entity.y + entity.h / 2;
  const reach = Math.hypot(entity.w, entity.h) / 2 + distance + 1;
  function consider(x, y) {
    const progress = x * dx + y * dy;
    if (progress <= bestProgress + 0.000001 ||
        collides(entity.x + x, entity.y + y, entity) ||
        collides(entity.x + x / 2, entity.y + y / 2, entity)) return;
    bestX = x; bestY = y; bestProgress = progress;
  }
  // Axis candidates handle rectangular scenery. Polygon tangents also let
  // cardinal input slide along sloping cave walls and shorelines.
  consider(dx, 0);
  consider(0, dy);
  for (const regions of [mapCollision.walkable, mapCollision.floorHoles, mapCollision.solid, mapCollision.water,
    mapCollision.crossings, mapCollision.solidPassages]) {
    for (const region of regions) {
      if (centerX + reach < region.left || centerX - reach > region.right ||
          centerY + reach < region.top || centerY - reach > region.bottom) continue;
      const points = region.points;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const ax = points[j][0], ay = points[j][1];
        const tx = points[i][0] - ax, ty = points[i][1] - ay;
        const lengthSquared = tx * tx + ty * ty;
        if (!lengthSquared) continue;
        const nearest = Math.max(0, Math.min(1, ((centerX - ax) * tx + (centerY - ay) * ty) / lengthSquared));
        if (Math.hypot(centerX - ax - nearest * tx, centerY - ay - nearest * ty) > reach) continue;
        const projection = (dx * tx + dy * ty) / lengthSquared;
        consider(tx * projection, ty * projection);
      }
    }
  }
  entity.x += bestX;
  entity.y += bestY;
}

function moveEntity(entity, dx, dy, slide = false) {
  // Small steps prevent fast movement from skipping thin shorelines or trunks.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (slide ? 4 : TILE / 4)));
  const stepX = dx / steps;
  const stepY = dy / steps;
  for (let step = 0; step < steps; step++) {
    if (slide) {
      if (!collides(entity.x + stepX, entity.y + stepY, entity)) {
        entity.x += stepX;
        entity.y += stepY;
      } else slideAlongBorders(entity, stepX, stepY);
      continue;
    }
    if (!collides(entity.x + stepX, entity.y, entity)) entity.x += stepX;
    if (!collides(entity.x, entity.y + stepY, entity)) entity.y += stepY;
  }
}


function movePlayer(dx, dy) {
  if (!isPlaying()) return;
  moveEntity(player, dx, dy, true);
}

export { collides, moveEntity, movePlayer };
