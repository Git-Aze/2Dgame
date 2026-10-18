import { ctx } from "./canvas.js";
import { runtime } from "../core/state.js";
import { mapCollision } from "../world/collision.js";
import { blocked, TILE, trees } from "../world/world-state.js";
import { buildings, buildingFootprint } from "../world/buildings.js";

// Uses the compiled world-space collision data, inside the camera transform.
// No separate debug geometry to keep in sync when travelling between areas.
function drawCollisionDebug() {
  if (!runtime.debugCollisions) return;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  drawRegions(mapCollision.walkable, "#39ff75");
  drawRegions(mapCollision.water, "#49aaff");
  drawRegions(mapCollision.solid, "#ff5151");
  drawRegions(mapCollision.floorHoles, "#ff5151");
  drawRegions(mapCollision.crossings, "#52ffff");
  drawRegions(mapCollision.solidPassages, "#ffe454");
  ctx.strokeStyle = "#ff5151";
  for (const tree of trees) {
    ctx.strokeRect(tree.x - tree.trunkWidth / 2, tree.y - tree.trunkHeight / 2, tree.trunkWidth, tree.trunkHeight);
  }
  for (const building of buildings) {
    const bounds = buildingFootprint(building);
    ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
  }
  ctx.strokeStyle = "#ef83ff";
  for (const tile of blocked) {
    const separator = tile.indexOf(",");
    ctx.strokeRect(Number(tile.slice(0, separator)) * TILE, Number(tile.slice(separator + 1)) * TILE, TILE, TILE);
  }
  ctx.restore();
}

function drawRegions(regions, color) {
  ctx.strokeStyle = color;
  for (const region of regions) {
    ctx.beginPath();
    for (let i = 0; i < region.points.length; i++) {
      const [x, y] = region.points[i];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
}

export { drawCollisionDebug };
