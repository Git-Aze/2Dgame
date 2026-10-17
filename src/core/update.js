import { updateCharacterFrame } from "../ui/character-ui.js";
import { updateEnemies, updateEnemyRespawns } from "../combat/enemies.js";
import { movePlayer } from "../world/movement.js";
import { updateHealthRegeneration, updateManaRegeneration } from "../player/player.js";
import { updateSlimeAnimation } from "../rendering/slime-sprites.js";
import { cancelCasting, updateCasting, updateCharge, updateCombat, updateSpellCooldowns } from "../combat/spells.js";
import { isPlaying, keys, player, runtime } from "./state.js";
import { getPlayerStats } from "../player/stats.js";

function update(dt) {
  if (!isPlaying()) return;
  const stats = getPlayerStats();
  updateSpellCooldowns(dt);
  let dx = 0;
  let dy = 0;

  if (keys["w"] || keys["arrowup"]) dy -= 1;
  if (keys["s"] || keys["arrowdown"]) dy += 1;
  if (keys["a"] || keys["arrowleft"]) dx -= 1;
  if (keys["d"] || keys["arrowright"]) dx += 1;

  const charging = runtime.activeCharge !== null;
  if (charging) {
    updateCharge(dt);
    dx = 0;
    dy = 0;
  }

  if (player.casting && (dx !== 0 || dy !== 0)) cancelCasting("you moved.");
  updateCasting(dt);
  player.moving = dx !== 0 || dy !== 0;

  if (player.moving) {
    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;

    if (Math.abs(dx) > Math.abs(dy)) {
      player.facing = dx < 0 ? "left" : "right";
    } else {
      player.facing = dy < 0 ? "up" : "down";
    }

    const speed = stats.moveSpeed;
    movePlayer(dx * speed * dt, dy * speed * dt);

    player.animTime += dt;

    if (player.animTime >= 0.16) {
      player.animTime = 0;
      player.frame = player.frame === 1 ? 2 : 1;
    }
  } else {
    player.frame = 0;
    player.animTime = 0;
  }

  if (charging) {
    player.moving = true;
    player.frame = 1;
  }
  updateEnemies(dt);
  // A lethal enemy attack must stop combat and regeneration this frame.
  if (!isPlaying()) return;
  updateEnemyRespawns(dt);
  updateCombat(dt);
  updateSlimeAnimation(dt);
  updateManaRegeneration(dt, stats);
  updateHealthRegeneration(dt, stats);
  updateCharacterFrame();
}

export { update };
