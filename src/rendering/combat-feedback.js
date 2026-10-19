import { ctx } from "./canvas.js";
import { combatFeedback } from "../core/state.js";

function drawHitFlash(target) {
  const flash = combatFeedback.flashes.find((entry) => entry.target === target);
  if (!flash) return;
  ctx.save();
  ctx.globalAlpha = Math.min(0.55, flash.remaining / 0.14 * 0.55);
  ctx.fillStyle = flash.incoming ? "#ff6a6a" : "#fff2ca";
  ctx.fillRect(target.x - 1, target.y + 2, target.w + 2, target.h - 2);
  ctx.restore();
}

function drawStunFeedback(enemy) {
  if (!(enemy.stunRemaining > 0)) return;
  ctx.save();
  const centerX = enemy.x + enemy.w / 2;
  ctx.fillStyle = "#ffe38b";
  for (let star = 0; star < 3; star++) {
    const angle = combatFeedback.time * 4 + star * Math.PI * 2 / 3;
    const x = centerX + Math.cos(angle) * (enemy.w / 2 + 4);
    const y = enemy.y - (enemy.isBoss ? 110 : 5) + Math.sin(angle) * 4;
    ctx.beginPath();
    ctx.moveTo(x, y - 4); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 3, y);
    ctx.closePath(); ctx.fill();
  }
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#211b14";
  const label = `STUN ${(Math.ceil(enemy.stunRemaining * 10) / 10).toFixed(1)}s`;
  ctx.strokeText(label, centerX, enemy.y - (enemy.isBoss ? 135 : 32));
  ctx.fillText(label, centerX, enemy.y - (enemy.isBoss ? 135 : 32));
  ctx.restore();
}

function drawCombatFeedback() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#181713";
  for (const number of combatFeedback.numbers) {
    const progress = number.age / number.duration;
    ctx.globalAlpha = Math.min(1, (1 - progress) * 3);
    ctx.font = number.kind === "dot" ? "bold 11px Arial" : "bold 14px Arial";
    ctx.fillStyle = number.kind === "incoming" ? "#ff7777" : number.kind === "dot" ? "#ffa64d" : "#fff0af";
    const text = `-${number.amount}${number.kind === "critical" ? " CRIT!" : number.kind === "dot" ? " DOT" : ""}`;
    const y = number.y - progress * 25;
    ctx.strokeText(text, number.x, y);
    ctx.fillText(text, number.x, y);
  }
  for (let index = 0; index < combatFeedback.notices.length; index++) {
    const notice = combatFeedback.notices[index];
    ctx.globalAlpha = Math.min(1, (1 - notice.age / notice.duration) * 3);
    ctx.font = "bold 12px Arial";
    ctx.fillStyle = notice.kind === "interrupted" ? "#ff9990" : "#ffd98b";
    const y = notice.y - index * 15 - notice.age * 8;
    ctx.strokeText(notice.text, notice.x, y);
    ctx.fillText(notice.text, notice.x, y);
  }
  ctx.restore();
}

export { drawHitFlash, drawStunFeedback, drawCombatFeedback };
