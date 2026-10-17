import { buildingFootprint, buildings } from "./buildings.js";
import { collidesWithMap } from "./collision.js";
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


function moveEntity(entity, dx, dy) {
  // Small steps prevent fast movement from skipping thin shorelines or trunks.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (TILE / 4)));
  const stepX = dx / steps;
  const stepY = dy / steps;
  for (let step = 0; step < steps; step++) {
    if (!collides(entity.x + stepX, entity.y, entity)) entity.x += stepX;
    if (!collides(entity.x, entity.y + stepY, entity)) entity.y += stepY;
  }
}


function movePlayer(dx, dy) {
  if (!isPlaying()) return;
  moveEntity(player, dx, dy);
}

export { collides, moveEntity, movePlayer };
