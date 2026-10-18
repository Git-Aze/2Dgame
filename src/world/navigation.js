import { collides, moveEntity } from "./movement.js";
import { spellPathBlocked } from "./collision.js";
import { TILE, WORLD_PIXEL_W, WORLD_PIXEL_H } from "./world-state.js";

const CELL = TILE / 2;
const COLUMNS = Math.floor(WORLD_PIXEL_W / CELL) + 1;
const ROWS = Math.floor(WORLD_PIXEL_H / CELL) + 1;
const NODE_COUNT = COLUMNS * ROWS;
const MAX_VISITS = 4096;
const REPATH_INTERVAL = 0.6;
// Reuse search storage. Walkability is checked anew per search so footprints
// and changed scenery always use the same collision rules as movement.
const costs = new Float64Array(NODE_COUNT);
const parents = new Int32Array(NODE_COUNT);
const visited = new Uint32Array(NODE_COUNT);
const closed = new Uint32Array(NODE_COUNT);
const walkable = new Int8Array(NODE_COUNT);
const heap = [];
let searchId = 0;

function push(index, score) {
  const entry = { index, score };
  let position = heap.length;
  heap.push(entry);
  while (position > 0) {
    const parent = (position - 1) >> 1;
    if (heap[parent].score <= score) break;
    heap[position] = heap[parent];
    position = parent;
  }
  heap[position] = entry;
}

function pop() {
  const first = heap[0];
  const last = heap.pop();
  if (heap.length) {
    let position = 0;
    while (position * 2 + 1 < heap.length) {
      let child = position * 2 + 1;
      if (child + 1 < heap.length && heap[child + 1].score < heap[child].score) child++;
      if (last.score <= heap[child].score) break;
      heap[position] = heap[child];
      position = child;
    }
    heap[position] = last;
  }
  return first.index;
}

function clearSegment(entity, ax, ay, bx, by) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)) / 4));
  if (collides(ax, ay, entity)) return false;
  let previousX = ax, previousY = ay;
  for (let step = 1; step <= steps; step++) {
    const x = ax + (bx - ax) * step / steps;
    const y = ay + (by - ay) * step / steps;
    // Movement resolves axes separately. Validate those intermediate positions
    // too, particularly when leaving a bridge beside a water corner.
    if (collides(x, y, entity) || collides(x, previousY, entity) || collides(previousX, y, entity)) return false;
    previousX = x;
    previousY = y;
  }
  return true;
}

function clearAttackLine(entity, x, y, targetX, targetY) {
  return !spellPathBlocked(x + entity.w / 2, y + entity.h / 2,
    targetX + entity.w / 2, targetY + entity.h / 2);
}

function findPath(entity, targetX, targetY, stopDistance) {
  heap.length = 0;
  walkable.fill(0);
  searchId++;
  if (searchId === 0xffffffff) { visited.fill(0); closed.fill(0); searchId = 1; }
  const heuristic = (x, y) => Math.max(0, Math.hypot(targetX - x, targetY - y) - stopDistance);
  const canStand = (gx, gy) => {
    if (gx < 0 || gy < 0 || gx >= COLUMNS || gy >= ROWS) return false;
    const index = gy * COLUMNS + gx;
    if (!walkable[index]) walkable[index] = collides(gx * CELL, gy * CELL, entity) ? -1 : 1;
    return walkable[index] === 1;
  };
  // The actor can start between nodes. Connect only locally reachable nodes.
  const startX = Math.round(entity.x / CELL), startY = Math.round(entity.y / CELL);
  for (let gy = startY - 1; gy <= startY + 1; gy++) {
    for (let gx = startX - 1; gx <= startX + 1; gx++) {
      if (!canStand(gx, gy) || !clearSegment(entity, entity.x, entity.y, gx * CELL, gy * CELL)) continue;
      const index = gy * COLUMNS + gx;
      visited[index] = searchId;
      costs[index] = Math.hypot(gx * CELL - entity.x, gy * CELL - entity.y);
      parents[index] = -1;
      push(index, costs[index] + heuristic(gx * CELL, gy * CELL));
    }
  }
  let visits = 0;
  while (heap.length && visits < MAX_VISITS) {
    const index = pop();
    if (closed[index] === searchId) continue;
    closed[index] = searchId;
    visits++;
    const gx = index % COLUMNS, gy = Math.floor(index / COLUMNS);
    const x = gx * CELL, y = gy * CELL;
    const distance = Math.hypot(targetX - x, targetY - y);
    const reached = stopDistance > 0
      ? distance <= stopDistance && clearAttackLine(entity, x, y, targetX, targetY)
      : distance <= CELL * 1.5 && clearSegment(entity, x, y, targetX, targetY);
    if (reached) {
      const path = [];
      if (stopDistance === 0) path.push({ x: targetX, y: targetY });
      for (let node = index; node !== -1; node = parents[node]) {
        path.push({ x: (node % COLUMNS) * CELL, y: Math.floor(node / COLUMNS) * CELL });
      }
      path.reverse();
      return path;
    }
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || !canStand(gx + dx, gy + dy)) continue;
        // Do not squeeze diagonally between touching obstacles.
        if (dx && dy && (!canStand(gx + dx, gy) || !canStand(gx, gy + dy))) continue;
        const next = (gy + dy) * COLUMNS + gx + dx;
        if (closed[next] === searchId) continue;
        const cost = costs[index] + Math.hypot(dx, dy) * CELL;
        if (visited[next] === searchId && cost >= costs[next]) continue;
        if (!clearSegment(entity, x, y, (gx + dx) * CELL, (gy + dy) * CELL)) continue;
        visited[next] = searchId;
        costs[next] = cost;
        parents[next] = index;
        push(next, cost + heuristic((gx + dx) * CELL, (gy + dy) * CELL));
      }
    }
  }
  return null;
}

// Returns moving, arrived, or blocked. Targets use entity top-left coordinates.
function navigateEnemy(enemy, targetX, targetY, speed, dt, stopDistance = 0) {
  let navigation = enemy.navigation;
  if (!navigation || navigation.mode !== enemy.aiState) {
    navigation = enemy.navigation = { mode: enemy.aiState, path: null, index: 0, remaining: 0, targetX, targetY };
  }
  navigation.remaining = Math.max(0, navigation.remaining - dt);
  const movedTarget = Math.hypot(targetX - navigation.targetX, targetY - navigation.targetY) >= CELL;
  if (navigation.remaining === 0 || (movedTarget && navigation.remaining <= REPATH_INTERVAL / 2)) {
    navigation.targetX = targetX;
    navigation.targetY = targetY;
    navigation.remaining = REPATH_INTERVAL;
    navigation.index = 0;
    const dx = targetX - enemy.x, dy = targetY - enemy.y;
    const distance = Math.hypot(dx, dy);
    const travel = Math.max(0, distance - stopDistance);
    const x = distance ? enemy.x + dx / distance * travel : enemy.x;
    const y = distance ? enemy.y + dy / distance * travel : enemy.y;
    if (clearSegment(enemy, enemy.x, enemy.y, x, y) && (!stopDistance || clearAttackLine(enemy, x, y, targetX, targetY))) {
      navigation.path = [{ x, y }];
    } else navigation.path = findPath(enemy, targetX, targetY, stopDistance);
  }
  if (!navigation.path) return "blocked";
  let budget = speed * dt;
  while (navigation.index < navigation.path.length) {
    const waypoint = navigation.path[navigation.index];
    const dx = waypoint.x - enemy.x, dy = waypoint.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 0.01) { navigation.index++; continue; }
    if (budget <= 0) break;
    const travel = Math.min(budget, distance, 4);
    const oldX = enemy.x, oldY = enemy.y;
    moveEntity(enemy, dx / distance * travel, dy / distance * travel);
    budget -= travel;
    if (Math.hypot(enemy.x - oldX, enemy.y - oldY) < travel - 0.01) {
      navigation.remaining = 0;
      return "moving";
    }
  }
  if (navigation.index < navigation.path.length) return "moving";
  if (Math.hypot(targetX - enemy.x, targetY - enemy.y) <= stopDistance + 0.01 &&
      (!stopDistance || clearAttackLine(enemy, enemy.x, enemy.y, targetX, targetY))) return "arrived";
  // A target can move a little within its current cell. Refresh the final leg.
  navigation.remaining = 0;
  return "moving";
}

export { navigateEnemy };
