import { drawBuilding } from "./building-renderer.js";
import { buildings } from "../world/buildings.js";
import { ctx } from "./canvas.js";
import { drawEnemy } from "./enemy-renderer.js";
import { drawCorpse } from "./corpse-renderer.js";
import { drawHitFlash, drawCombatFeedback } from "./combat-feedback.js";
import { drawPortalPrompt } from "./portal-renderer.js";
import { drawImageCharacter, drawSprite, playerSprites } from "./player-sprites.js";
import { CAST_FRAME_DURATION, drawFireball, drawIgniteEffects, drawSwordSwings } from "../combat/spells.js";
import { enemies, corpses, fireballs, player, runtime } from "../core/state.js";
import { WORLD_PIXEL_H, WORLD_PIXEL_W, groundMapImage, treeImage, trees } from "../world/world-state.js";

function drawWorld() {
  // Draw the complete background image in world coordinates.
  // The original image is 1536x1024 (3:2), matching our 72x48-tile world.
  if (groundMapImage.complete && groundMapImage.naturalWidth) {
    ctx.drawImage(groundMapImage, 0, 0, WORLD_PIXEL_W, WORLD_PIXEL_H);
  } else {
    ctx.fillStyle = "#537c3d";
    ctx.fillRect(0, 0, WORLD_PIXEL_W, WORLD_PIXEL_H);
  }

  const layers = [];
  for (const corpse of corpses) {
    if (corpse.areaId !== runtime.areaId) continue;
    layers.push({ depth: corpse.y + corpse.h, draw() { drawCorpse(corpse); }});
  }
  for (const building of buildings) {
    layers.push({ depth: building.y, draw() { drawBuilding(building); }});
  }
  if (treeImage.complete && treeImage.naturalWidth) {
    for (const tree of trees) {
      layers.push({ depth: tree.y, draw() {
        ctx.drawImage(treeImage,
          Math.round(tree.x - tree.width / 2),
          Math.round(tree.y - tree.height + tree.trunkHeight / 2),
          tree.width, tree.height);
      }});
    }
  }
  layers.push({ depth: player.y + player.h, draw() {
    const castFrame = Math.min(3, Math.floor(player.castTime / CAST_FRAME_DURATION));
    const action = player.casting ? "cast" : player.moving ? "walk" : "idle";
    const frame = player.casting ? castFrame : player.moving ? player.frame % 4 : 0;
    if (!drawImageCharacter(action, player.facing, frame)) {
      drawSprite(playerSprites[player.facing][player.frame], player.x - 4, player.y - 2, 2);
    }
    drawHitFlash(player);
  }});
  for (const enemy of enemies) {
    if (enemy.alive) {
      layers.push({ depth: enemy.y + enemy.h, draw() { drawEnemy(enemy); }});
    }
  }
  layers.sort((a,b) => a.depth - b.depth);
  for (const layer of layers) layer.draw();
}


function render() {
  runtime.cameraX = Math.max(
    0,
    Math.min(
      player.x + player.w / 2 - runtime.viewWidth / 2,
      WORLD_PIXEL_W - runtime.viewWidth,
    ),
  );

  runtime.cameraY = Math.max(
    0,
    Math.min(
      player.y + player.h / 2 - runtime.viewHeight / 2,
      WORLD_PIXEL_H - runtime.viewHeight,
    ),
  );

  ctx.clearRect(0, 0, runtime.viewWidth, runtime.viewHeight);
  ctx.imageSmoothingEnabled = false;

  ctx.save();

  ctx.translate(-Math.floor(runtime.cameraX), -Math.floor(runtime.cameraY));
  drawWorld();
  for (const fireball of fireballs) {
    drawFireball(fireball);
  }
  drawIgniteEffects();
  drawSwordSwings();
  drawCombatFeedback();
  drawPortalPrompt();
  ctx.restore();
}

export { render };
