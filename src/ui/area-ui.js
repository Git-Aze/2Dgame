import { WORLD_DATA } from "../world/world.js";
import { runtime } from "../core/state.js";
import { canvas } from "../rendering/canvas.js";
import { on } from "../core/events.js";

function portalAtScreenPosition(screenX, screenY) {
  const bounds = canvas.getBoundingClientRect();
  const x = (screenX - bounds.left) * runtime.viewWidth / bounds.width + Math.floor(runtime.cameraX);
  const y = (screenY - bounds.top) * runtime.viewHeight / bounds.height + Math.floor(runtime.cameraY);
  return (WORLD_DATA.portals ?? []).find((portal) => x >= portal.x && x <= portal.x + portal.width && y >= portal.y && y <= portal.y + portal.height) ?? null;
}

function setupAreaUI() {
  on("area:changed", () => { document.getElementById("location").textContent = WORLD_DATA.name; });
}

export { setupAreaUI, portalAtScreenPosition };
