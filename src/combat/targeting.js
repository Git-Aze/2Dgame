import { canvas } from "../rendering/canvas.js";
import { showMessage } from "../ui/messages.js";
import { enemies, isPlaying, runtime } from "../core/state.js";

function targetEnemyAtScreenPosition(screenX, screenY) {
  if (!isPlaying()) return;
  const bounds = canvas.getBoundingClientRect();
  const worldX = (screenX - bounds.left) * runtime.viewWidth / bounds.width + Math.floor(runtime.cameraX);
  const worldY = (screenY - bounds.top) * runtime.viewHeight / bounds.height + Math.floor(runtime.cameraY);

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    if (!enemy.alive) continue;

    // Large boss art extends above its ground collision footprint.
    const left = enemy.isBoss ? enemy.x+enemy.w/2-90 : enemy.x-5;
    const right = enemy.isBoss ? enemy.x+enemy.w/2+90 : enemy.x+enemy.w+5;
    const top = enemy.isBoss ? enemy.y+enemy.h-180 : enemy.y-5;

    if (
      worldX >= left &&
      worldX <= right &&
      worldY >= top &&
      worldY <= enemy.y + enemy.h + 5
    ) {
      runtime.selectedEnemy = enemy;

      showMessage(
        `${enemy.name} (Level ${enemy.level}) targeted (${enemy.hp}/${enemy.maxHp} HP).`);

      return;
    }
  }

  runtime.selectedEnemy = null;
}

export { targetEnemyAtScreenPosition };
