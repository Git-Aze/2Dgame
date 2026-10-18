import { WORLD_DATA, AREAS, worldPosition } from "./world.js";

const TILE = WORLD_DATA.tileSize;
let WORLD_PIXEL_W = WORLD_DATA.width * TILE;
let WORLD_PIXEL_H = WORLD_DATA.height * TILE;
const groundImages = new Map(Object.entries(AREAS).map(([id, area]) => {
  const image = new Image();
  image.src = area.background;
  return [id, image];
}));
let groundMapImage = groundImages.get(WORLD_DATA.id);
const treeImage = new Image();
treeImage.src = AREAS.village.tree.image;
const trees = [];
const blocked = new Set();

function isBlocked(x, y) {
  return blocked.has(x + "," + y);
}

function resetWorldState() {
  WORLD_PIXEL_W = WORLD_DATA.width * TILE;
  WORLD_PIXEL_H = WORLD_DATA.height * TILE;
  groundMapImage = groundImages.get(WORLD_DATA.id);
  trees.splice(0, trees.length, ...(WORLD_DATA.trees ?? []).map(([tileX, tileY]) => ({
    ...WORLD_DATA.tree,
    ...worldPosition({ tileX, tileY, offsetX: TILE / 2, offsetY: TILE / 2 }),
  })));
  blocked.clear();
  for (let edge = 0; edge < WORLD_DATA.collision.boundaryTiles; edge++) {
    for (let x = 0; x < WORLD_DATA.width; x++) {
      blocked.add(x + "," + edge);
      blocked.add(x + "," + (WORLD_DATA.height - 1 - edge));
    }
    for (let y = 0; y < WORLD_DATA.height; y++) {
      blocked.add(edge + "," + y);
      blocked.add((WORLD_DATA.width - 1 - edge) + "," + y);
    }
  }
}
resetWorldState();

export { TILE, WORLD_PIXEL_W, WORLD_PIXEL_H, groundMapImage, treeImage, trees, blocked, isBlocked, resetWorldState };
