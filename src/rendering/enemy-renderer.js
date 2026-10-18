import { ctx } from "./canvas.js";
import { drawSlimeSprite } from "./slime-sprites.js";
import { runtime } from "../core/state.js";
import { drawHitFlash, drawStunFeedback } from "./combat-feedback.js";

function drawEnemy(enemy) {
  if (!enemy.alive) return;

  switch (enemy.sprite) {
    case "slime":
      drawSlime(enemy);
      break;

    case "redSlime":
      if (drawSlimeSprite(enemy)) drawEnemyHealthBar(enemy);
      else drawColoredSlime(enemy, "#d84b4b", "#ff8585");
      break;

    case "wolf":
      drawWolf(enemy);
      break;

    default:
      drawSlime(enemy);
  }
  drawHitFlash(enemy);
  ctx.save();
  ctx.font = "10px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff0c4";
  ctx.fillText(`Lv ${enemy.level}`, enemy.x + enemy.w / 2, enemy.y - 17);
  ctx.restore();
  drawStunFeedback(enemy);
}


function drawColoredSlime(enemy, bodyColor, highlightColor) {
  const { x, y, w, h } = enemy;

  ctx.fillStyle = bodyColor;
  ctx.fillRect(x + 2, y + 8, w - 4, h - 10);

  ctx.fillStyle = highlightColor;
  ctx.fillRect(x + 5, y + 4, w - 10, h - 8);

  ctx.fillStyle = "#222";
  ctx.fillRect(x + 7, y + 11, 3, 4);
  ctx.fillRect(x + w - 10, y + 11, 3, 4);

  drawEnemyHealthBar(enemy);
}


function drawWolf(enemy) {
  const { x, y, w, h } = enemy;

  // Temporary wolf appearance.
  ctx.fillStyle = "#65594d";
  ctx.fillRect(x + 3, y + 7, w - 6, h - 11);

  ctx.fillStyle = "#a59a87";
  ctx.fillRect(x + 7, y + 4, w - 14, h - 8);

  // Ears.
  ctx.fillStyle = "#65594d";
  ctx.fillRect(x + 5, y + 1, 5, 7);
  ctx.fillRect(x + w - 10, y + 1, 5, 7);

  // Eyes.
  ctx.fillStyle = "#f2d36d";
  ctx.fillRect(x + 8, y + 10, 3, 3);
  ctx.fillRect(x + w - 11, y + 10, 3, 3);

  drawEnemyHealthBar(enemy);
}


function drawEnemyHealthBar(enemy) {
  const barWidth = 36;
  const barHeight = 5;

  const x = enemy.x + enemy.w / 2 - barWidth / 2;
  const y = enemy.y - 10;

  const percentage = Math.max(0, enemy.hp / enemy.maxHp);

  ctx.fillStyle = "#251d20";
  ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

  ctx.fillStyle = "#55df68";
  ctx.fillRect(x, y, barWidth * percentage, barHeight);

  // Target outline.
  if (runtime.selectedEnemy === enemy) {
    ctx.strokeStyle = "#ffe36e";
    ctx.lineWidth = 2;

    ctx.strokeRect(enemy.x - 3, enemy.y - 3, enemy.w + 6, enemy.h + 6);
  }
}


function drawSlime(enemy) {
  if (!enemy.alive) return;
  if (drawSlimeSprite(enemy)) {
    drawEnemyHealthBar(enemy);
    return;
  }

  const { x, y, w, h } = enemy;

  // Shadow
  ctx.fillStyle = "rgba(25, 35, 20, 0.3)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 1, w / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = "#267541";
  ctx.fillRect(x + 2, y + 9, w - 4, h - 11);

  ctx.fillStyle = "#43b85e";
  ctx.fillRect(x + 4, y + 5, w - 8, h - 9);
  ctx.fillRect(x + 7, y + 2, w - 14, 5);

  // Highlights
  ctx.fillStyle = "#80e58a";
  ctx.fillRect(x + 7, y + 5, 5, 3);
  ctx.fillRect(x + 5, y + 9, 3, 4);

  // Eyes
  ctx.fillStyle = "#173b25";
  ctx.fillRect(x + 7, y + 11, 3, 4);
  ctx.fillRect(x + w - 10, y + 11, 3, 4);

  // Mouth
  ctx.fillRect(x + 11, y + 17, 3, 2);

  // Target outline
  if (runtime.selectedEnemy === enemy) {
    ctx.strokeStyle = "#ffe36e";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  }

  // Health bar
  const barWidth = 36;
  const barHeight = 5;
  const barX = x + w / 2 - barWidth / 2;
  const barY = y - 10;

  ctx.fillStyle = "#251d20";
  ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

  const healthPercent = Math.max(0, enemy.hp / enemy.maxHp);

  ctx.fillStyle =
    healthPercent > 0.5
      ? "#55df68"
      : healthPercent > 0.25
        ? "#e9d64c"
        : "#ed4b4b";

  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
}

export { drawEnemy };
