import { ctx } from "./canvas.js";
import { nearbyPortal } from "../world/areas.js";
import { corpseUnderPlayer } from "../loot/loot.js";
import { isPlaying } from "../core/state.js";

function drawPortalPrompt() {
  if (!isPlaying() || corpseUnderPlayer()) return;
  const portal = nearbyPortal();
  if (!portal) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 12px Arial";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#141610";
  ctx.fillStyle = "#ffe6a3";
  const label = `E: ${portal.label}`;
  const x = portal.x + portal.width / 2, y = portal.y + portal.height + 20;
  ctx.strokeText(label, x, y); ctx.fillText(label, x, y);
  ctx.restore();
}

export { drawPortalPrompt };
