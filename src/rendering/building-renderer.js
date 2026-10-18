import { buildingIsNearby } from "../world/buildings.js";
import { ctx } from "./canvas.js";
import { isPlaying } from "../core/state.js";
import { corpseUnderPlayer } from "../loot/loot.js";

function drawBuilding(building) {
  if (building.image.complete && building.image.naturalWidth) {
    ctx.drawImage(building.image, Math.round(building.x - building.width / 2),
      Math.round(building.y - building.height), building.width, building.height);
  }
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 12px Arial";
  ctx.fillStyle = "#171f1b";
  ctx.fillRect(building.x - 62, building.y - building.height - 28, 124, 24);
  ctx.fillStyle = "#ffe6a3";
  ctx.fillText(building.name, building.x, building.y - building.height - 12);
  if (building.shop && isPlaying() && buildingIsNearby(building) && !corpseUnderPlayer()) {
    ctx.fillStyle = "#fff0c4";
    ctx.fillText("E · Open shop", building.x, building.y + 57);
  }
  ctx.restore();
}

export { drawBuilding };
