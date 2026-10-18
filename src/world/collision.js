import { buildingFootprint, buildings } from "./buildings.js";
import { trees } from "./world-state.js";
import { WORLD_DATA } from "./world.js";

// Compile reference-image coordinates once, rather than during each movement.
function compileMapCollision() {
  const settings = WORLD_DATA.collision;
  const scaleX = WORLD_DATA.width * WORLD_DATA.tileSize / settings.referenceWidth;
  const scaleY = WORLD_DATA.height * WORLD_DATA.tileSize / settings.referenceHeight;
  function compile(region) {
    const points = region.points.map(([x, y]) => [x * scaleX, y * scaleY]);
    return {
      id: region.id,
      points,
      left: Math.min(...points.map(([x]) => x)),
      right: Math.max(...points.map(([x]) => x)),
      top: Math.min(...points.map(([, y]) => y)),
      bottom: Math.max(...points.map(([, y]) => y)),
    };
  }
  const trunks = settings.backgroundTrunks.map(([x, y], index) => ({
    id: `background-tree-${index}`,
    points: [
      [x - settings.backgroundTrunkWidth / 2, y - settings.backgroundTrunkHeight / 2],
      [x + settings.backgroundTrunkWidth / 2, y - settings.backgroundTrunkHeight / 2],
      [x + settings.backgroundTrunkWidth / 2, y + settings.backgroundTrunkHeight / 2],
      [x - settings.backgroundTrunkWidth / 2, y + settings.backgroundTrunkHeight / 2],
    ],
  }));
  return {
    water: settings.water.map(compile),
    solid: [...settings.solid, ...trunks].map(compile),
    crossings: settings.crossings.map(compile),
    walkable: (settings.walkable ?? []).map(compile),
    floorHoles: (settings.floorHoles ?? []).map(compile),
    solidPassages: (settings.solidPassages ?? []).map(compile),
  };
}
const mapCollision = compileMapCollision();

function resetMapCollision() {
  const compiled = compileMapCollision();
  for (const key of Object.keys(compiled)) mapCollision[key].splice(0, mapCollision[key].length, ...compiled[key]);
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) {
      inside = !inside;
    }
  }
  return inside;
}

function segmentIntersectsRect(ax, ay, bx, by, left, top, right, bottom) {
  // Clip a line segment against the rectangle on both axes.
  let start = 0;
  let end = 1;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0) {
    if (ax < left || ax > right) return false;
  } else {
    const a = (left - ax) / dx;
    const b = (right - ax) / dx;
    start = Math.max(start, Math.min(a, b));
    end = Math.min(end, Math.max(a, b));
    if (start > end) return false;
  }
  if (dy === 0) {
    if (ay < top || ay > bottom) return false;
  } else {
    const a = (top - ay) / dy;
    const b = (bottom - ay) / dy;
    start = Math.max(start, Math.min(a, b));
    end = Math.min(end, Math.max(a, b));
    if (start > end) return false;
  }
  return true;
}

function polygonIntersectsRect(region, left, top, right, bottom) {
  if (right < region.left || left > region.right ||
      bottom < region.top || top > region.bottom) return false;
  const points = region.points;
  if (pointInPolygon(left, top, points) || pointInPolygon(right, top, points) ||
      pointInPolygon(left, bottom, points) || pointInPolygon(right, bottom, points)) {
    return true;
  }
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    if (segmentIntersectsRect(...points[j], ...points[i], left, top, right, bottom)) {
      return true;
    }
  }
  return false;
}

function collidesWithMap(left, top, right, bottom) {
  if (mapCollision.walkable.length) {
    const stepsX = Math.max(1, Math.ceil((right - left) / 8));
    const stepsY = Math.max(1, Math.ceil((bottom - top) / 8));
    for (let y = 0; y <= stepsY; y++) {
      for (let x = 0; x <= stepsX; x++) {
        const px = left + (right - left) * x / stepsX, py = top + (bottom - top) * y / stepsY;
        if (!mapCollision.walkable.some((region) => px >= region.left && px <= region.right && py >= region.top && py <= region.bottom && pointInPolygon(px, py, region.points))) return true;
      }
    }
  }
  const inPassage = mapCollision.solidPassages.some(({ points }) =>
    pointInPolygon(left, top, points) && pointInPolygon(right, top, points) &&
    pointInPolygon(left, bottom, points) && pointInPolygon(right, bottom, points));
  if (!inPassage && mapCollision.solid.some((region) =>
    polygonIntersectsRect(region, left, top, right, bottom))) return true;
  if (mapCollision.floorHoles.some((region) => polygonIntersectsRect(region, left, top, right, bottom))) return true;

  // A traced floor can already exclude all water. Keep its water regions for
  // spell visibility and debug drawing without clipping that floor a second time.
  if (mapCollision.walkable.length && WORLD_DATA.collision.waterBlocksMovement === false) return false;

  // Crossings are convex polygons. All four corners must be inside so actors
  // cannot step sideways off a bridge or dock into the water.
  const onCrossing = mapCollision.crossings.some(({ points }) =>
    pointInPolygon(left, top, points) && pointInPolygon(right, top, points) &&
    pointInPolygon(left, bottom, points) && pointInPolygon(right, bottom, points));
  return !onCrossing && mapCollision.water.some((region) =>
    polygonIntersectsRect(region, left, top, right, bottom));
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  if (Math.max(ax, bx) < Math.min(cx, dx) || Math.min(ax, bx) > Math.max(cx, dx) ||
      Math.max(ay, by) < Math.min(cy, dy) || Math.min(ay, by) > Math.max(cy, dy)) return false;
  const cross = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
  const a = cross(ax, ay, bx, by, cx, cy);
  const b = cross(ax, ay, bx, by, dx, dy);
  const c = cross(cx, cy, dx, dy, ax, ay);
  const d = cross(cx, cy, dx, dy, bx, by);
  return ((a <= 0 && b >= 0) || (a >= 0 && b <= 0)) &&
    ((c <= 0 && d >= 0) || (c >= 0 && d <= 0));
}

// Water is passable for spells. Solid scenery uses the same footprints as movement.
function spellPathBlocked(ax, ay, bx, by) {
  if (mapCollision.walkable.length) {
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 4));
    for (let i = 0; i <= steps; i++) {
      const x = ax + (bx - ax) * i / steps, y = ay + (by - ay) * i / steps;
      const contains = (region) => x >= region.left && x <= region.right && y >= region.top && y <= region.bottom && pointInPolygon(x, y, region.points);
      if (!mapCollision.water.some(contains) &&
          (!mapCollision.walkable.some(contains) || mapCollision.floorHoles.some(contains))) return true;
    }
  }
  for (const building of buildings) {
    const bounds = buildingFootprint(building);
    if (segmentIntersectsRect(ax, ay, bx, by, bounds.left, bounds.top, bounds.right, bounds.bottom)) return true;
  }
  for (const region of mapCollision.solid) {
    if (!segmentIntersectsRect(ax, ay, bx, by, region.left, region.top, region.right, region.bottom)) continue;
    if (pointInPolygon(ax, ay, region.points) || pointInPolygon(bx, by, region.points)) return true;
    for (let i = 0, j = region.points.length - 1; i < region.points.length; j = i++) {
      if (segmentsIntersect(ax, ay, bx, by, ...region.points[j], ...region.points[i])) return true;
    }
  }
  return trees.some((tree) => segmentIntersectsRect(ax, ay, bx, by,
    tree.x - tree.trunkWidth / 2, tree.y - tree.trunkHeight / 2,
    tree.x + tree.trunkWidth / 2, tree.y + tree.trunkHeight / 2));
}

export { mapCollision, collidesWithMap, spellPathBlocked, resetMapCollision };
