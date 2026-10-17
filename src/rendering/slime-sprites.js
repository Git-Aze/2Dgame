import { ctx } from "./canvas.js";
import { enemies } from "../core/state.js";

// Supplied sheet: four frames per row. Clip body outlines because the PNG
// includes a baked background. This also works when opening index.html locally.
const greenSlimeImage = new Image();
greenSlimeImage.src = new URL("../../assets/images/green_slime.png", import.meta.url).href;
const redSlimeImage = new Image();
redSlimeImage.src = new URL("../../assets/images/red_slime.png", import.meta.url).href;
// The red sheet is transparent and has different frame spacing from the green.
const RED_SLIME_FRAMES = {
  idle: [[160,65,280,190],[530,65,280,190],[905,65,280,190],[1300,65,285,190]],
  walk: [[100,270,330,180],[515,265,335,185],[905,265,340,185],[1300,270,390,180]],
  hurt: [[110,450,360,215],[530,450,310,215],[880,450,340,215],[1290,450,390,215]],
};
const GREEN_SLIME_ROWS = {
  idle: { y: 80, outline: [[52,164],[52,112],[66,82],[86,52],[116,24],[172,24],[202,43],[225,69],[240,102],[252,132],[246,154],[231,170],[82,170]] },
  walk: { y: 320, outline: [[22,119],[22,70],[42,42],[63,21],[109,21],[147,39],[180,67],[216,89],[254,112],[274,137],[246,154],[71,157],[40,146]] },
  hurt: { y: 540, outline: [[42,157],[51,128],[67,101],[82,76],[112,49],[157,38],[192,48],[219,71],[245,103],[278,134],[278,157],[257,176],[68,176]] },
};

function drawSlimeSprite(enemy) {
  const image = enemy.sprite === "redSlime" ? redSlimeImage : greenSlimeImage;
  if (!image.complete || !image.naturalWidth) return false;
  const action = enemy.hurtTime > 0 ? "hurt" : enemy.spriteMoving ? "walk" : "idle";
  const frame = enemy.stunRemaining > 0 ? 0 : Math.floor(enemy.spriteTime / 0.16) % 4;
  if (enemy.sprite === "redSlime") {
    const [x, y, width, height] = RED_SLIME_FRAMES[action][frame];
    const scale = 0.11;
    ctx.drawImage(image, x, y, width, height,
      Math.round(enemy.x + enemy.w / 2 - 140 * scale),
      Math.round(enemy.y + enemy.h - height * scale), width * scale, height * scale);
    return true;
  }
  const row = GREEN_SLIME_ROWS[action];
  const scale = 0.14;
  ctx.save();
  ctx.translate(Math.round(enemy.x + enemy.w / 2 - 160 * scale),
    Math.round(enemy.y + enemy.h - 170 * scale));
  ctx.scale(scale, scale);
  ctx.beginPath();
  row.outline.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(greenSlimeImage, 112 + frame * 320, row.y, 320, 220, 0, 0, 320, 220);
  ctx.restore();
  return true;
}

function updateSlimeAnimation(dt) {
  for (const enemy of enemies) {
    if (enemy.sprite !== "slime" && enemy.sprite !== "redSlime") continue;
    const moving = enemy.x !== enemy.spriteLastX || enemy.y !== enemy.spriteLastY;
    if (moving !== enemy.spriteMoving && enemy.stunRemaining <= 0) enemy.spriteTime = 0;
    enemy.spriteMoving = moving;
    enemy.spriteLastX = enemy.x;
    enemy.spriteLastY = enemy.y;
    if (enemy.alive && enemy.stunRemaining <= 0) enemy.spriteTime += dt;
    enemy.hurtTime = Math.max(0, enemy.hurtTime - dt);
  }
}

export { greenSlimeImage, redSlimeImage, drawSlimeSprite, updateSlimeAnimation };
