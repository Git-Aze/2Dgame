import { ctx } from "./canvas.js";
import { drawSlimeSprite } from "./slime-sprites.js";
import { getItem } from "../data/items.js";
import { getRarity } from "../data/rarities.js";
import { playerOverCorpse } from "../loot/loot.js";
import { drawBossSprite } from "./boss-sprites.js";

function drawCorpse(corpse) {
  const x = corpse.x + corpse.w / 2, y = corpse.y + corpse.h;
  ctx.save();
  const bossCorpse = corpse.sprite === "stonehorn";
  if (!bossCorpse) {
  ctx.translate(x, y);
  ctx.scale(1.15, 0.4);
  ctx.translate(-x, -y);
  }
  ctx.globalAlpha = 0.7;
  if (bossCorpse ? !drawBossSprite(corpse,true) : corpse.sprite === "wolf" || !drawSlimeSprite(corpse)) {
    ctx.fillStyle = corpse.sprite === "wolf" ? "#65594d" : corpse.sprite === "redSlime" ? "#b84949" : "#438e48";
    ctx.fillRect(corpse.x, corpse.y + 5, corpse.w, corpse.h - 5);
    ctx.fillStyle = "#211d1a";
    ctx.fillRect(corpse.x + 5, corpse.y + 10, 4, 3);
    ctx.fillRect(corpse.x + corpse.w - 9, corpse.y + 10, 4, 3);
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = corpse.itemId ? getRarity(getItem(corpse.itemId).rarity).color : "#e8c65a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y - 3, corpse.w / 2 + 6, 7, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (playerOverCorpse(corpse)) {
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff0c4";
    ctx.strokeStyle = "#171b16";
    ctx.lineWidth = 3;
    ctx.strokeText("E: Loot", x, y + 17);
    ctx.fillText("E: Loot", x, y + 17);
  }
  ctx.restore();
}

export { drawCorpse };
