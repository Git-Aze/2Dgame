import { WORLD_DATA, worldPosition } from "./world.js";

const TILE = WORLD_DATA.tileSize;
const WORLD_W = WORLD_DATA.width;
const WORLD_H = WORLD_DATA.height;

const WORLD_PIXEL_W = WORLD_W * TILE;
const WORLD_PIXEL_H = WORLD_H * TILE;

// The ground is one image; actors and trees are drawn separately.
const groundMapImage = new Image();
groundMapImage.src = WORLD_DATA.background;

const treeImage = new Image();
treeImage.src = WORLD_DATA.tree.image;

// Tile coordinates mark the center of each trunk's ground footprint.
// Keep paths and the starting area open.
const trees = WORLD_DATA.trees.map(([tileX, tileY]) => ({
  ...WORLD_DATA.tree,
  ...worldPosition({ tileX, tileY, offsetX: TILE / 2, offsetY: TILE / 2 }),
}));


const blocked = new Set();
function tileKey(x, y) {
  return `${x},${y}`;
}


function blockTile(x, y) {
  blocked.add(tileKey(x, y));
}


function isBlocked(x, y) {
  return blocked.has(tileKey(x, y));
}

for (let edge = 0; edge < WORLD_DATA.collision.boundaryTiles; edge++) {
  for (let x = 0; x < WORLD_W; x++) {
    blockTile(x, edge);
    blockTile(x, WORLD_H - 1 - edge);
  }
  for (let y = 0; y < WORLD_H; y++) {
    blockTile(edge, y);
    blockTile(WORLD_W - 1 - edge, y);
  }
}

export { TILE, WORLD_PIXEL_W, WORLD_PIXEL_H, groundMapImage, treeImage, trees, blocked, isBlocked };
