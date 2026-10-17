import { canvas } from "./canvas.js";
import { emit } from "./events.js";
import { showMessage } from "./messages.js";
import { isPlaying, player, runtime } from "./state.js";
import { WORLD_DATA, worldPosition } from "./world.js";

// Add houses through WORLD_DATA.buildings; rendering and collision are shared.
const buildingImages = new Map();
function createBuilding(definition) {
  if (!buildingImages.has(definition.image)) {
    const image = new Image();
    image.src = definition.image;
    buildingImages.set(definition.image, image);
  }
  return { ...definition, ...worldPosition(definition), image: buildingImages.get(definition.image) };
}
const buildings = (WORLD_DATA.buildings ?? []).map(createBuilding);

function buildingFootprint(building) {
  return {
    left: building.x + building.footprint.x,
    top: building.y + building.footprint.y,
    right: building.x + building.footprint.x + building.footprint.width,
    bottom: building.y + building.footprint.y + building.footprint.height,
  };
}

function buildingIsNearby(building) {
  return Math.hypot(player.x + player.w / 2 - building.x - building.entrance.x,
    player.y + player.h / 2 - building.y - building.entrance.y) <= building.interactionRange;
}

function interactWithBuilding(building) {
  if (!isPlaying()) return;
  if (!buildingIsNearby(building)) {
    showMessage(`Move closer to the entrance of ${building.name}.`);
    return;
  }
  if (building.shop) emit("shop:requested", building);
}


function buildingAtScreenPosition(screenX, screenY) {
  const bounds = canvas.getBoundingClientRect();
  const x = (screenX - bounds.left) * runtime.viewWidth / bounds.width + Math.floor(runtime.cameraX);
  const y = (screenY - bounds.top) * runtime.viewHeight / bounds.height + Math.floor(runtime.cameraY);
  return buildings.findLast((building) => x >= building.x - building.width / 2 &&
    x <= building.x + building.width / 2 && y >= building.y - building.height && y <= building.y + 42);
}

export { buildings, buildingFootprint, buildingIsNearby, interactWithBuilding, buildingAtScreenPosition };
