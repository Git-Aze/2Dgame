import { ctx } from "./canvas.js";
import { enemies, runtime } from "../core/state.js";
import { BOSS_RULES } from "../combat/boss.js";

function drawBossWarnings() {
  for (const boss of enemies) {
    const action = boss.bossAction;
    if (!boss.isBoss || !boss.alive || !action || action.type === "charging") continue;
    ctx.save();
    ctx.fillStyle = "rgba(255,45,35,0.22)";
    ctx.strokeStyle = "#ff5144"; ctx.lineWidth = 3;
    if (action.type === "cleave") {
      ctx.beginPath();ctx.arc(action.x,action.y,BOSS_RULES.cleaveRadius,0,Math.PI*2);ctx.fill();ctx.stroke();
    } else {
      ctx.translate(action.x,action.y); ctx.rotate(Math.atan2(action.dy,action.dx));
      const length = Math.min(BOSS_RULES.chargeRange,Math.hypot(action.tx-action.x,action.ty-action.y)+60);
      ctx.fillRect(0,-boss.w/2-8,length,boss.w+16);ctx.strokeRect(0,-boss.w/2-8,length,boss.w+16);
      ctx.beginPath();ctx.moveTo(length-18,-12);ctx.lineTo(length,0);ctx.lineTo(length-18,12);ctx.stroke();
    }
    ctx.restore();
  }
}

function drawBossHealth() {
  const boss = enemies.find(enemy=>enemy.isBoss && enemy.alive && enemy.bossState === "active");
  if (!boss || runtime.gameState !== "playing") return;
  const compact = runtime.viewWidth < 760;
  const width = Math.min(420,runtime.viewWidth-32), x = (runtime.viewWidth-width)/2, y = compact ? 96 : 32;
  const height = compact ? 10 : 16;
  ctx.save();
  ctx.fillStyle = "#21151a";ctx.fillRect(x-2,y-2,width+4,height+4);
  ctx.fillStyle = "#b92935";ctx.fillRect(x,y,width*Math.max(0,boss.hp/boss.maxHp),height);
  ctx.strokeStyle = "#e6b46c";ctx.lineWidth = 1;ctx.strokeRect(x-2,y-2,width+4,height+4);
  ctx.textAlign = "center";ctx.font = "bold 13px Arial";ctx.fillStyle = "#fff3d9";
  ctx.fillText(`${boss.name} - ${Math.ceil(boss.hp)} / ${boss.maxHp}`,runtime.viewWidth/2,compact ? y+9 : y-7);
  ctx.font = "12px Arial";
  if (!compact) ctx.fillText(boss.bossAction?.type === "charge" ? "CHARGE - move out of the lane!" : boss.bossAction?.type === "cleave" ? "CLEAVE - leave the circle!" : boss.hp <= boss.maxHp/2 ? "Enraged - attacks are faster" : "Arena Guardian",runtime.viewWidth/2,y+34);
  ctx.restore();
}

export { drawBossWarnings, drawBossHealth };
