import { ctx } from "./canvas.js";
import { enemyProjectiles } from "../core/state.js";

function drawEnemyProjectiles() {
  ctx.save();
  for (const shot of enemyProjectiles) {
    ctx.fillStyle = "rgba(180,30,35,0.35)";
    ctx.beginPath();
    ctx.arc(shot.x-shot.dx*7,shot.y-shot.dy*7,shot.radius*0.8,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#d52d35";
    ctx.strokeStyle = "#71151d";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(shot.x,shot.y,shot.radius,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffaca4";
    ctx.beginPath(); ctx.arc(shot.x-2,shot.y-2,2,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

export { drawEnemyProjectiles };
