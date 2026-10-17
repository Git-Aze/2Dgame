import { canvas } from "./canvas.js";
import { showMessage } from "./messages.js";
import { enemies, isPlaying, runtime } from "./state.js";

function targetEnemyAtScreenPosition(screenX, screenY) {
  if (!isPlaying()) return;
  const bounds = canvas.getBoundingClientRect();
  const worldX = (screenX - bounds.left) * runtime.viewWidth / bounds.width + Math.floor(runtime.cameraX);
  const worldY = (screenY - bounds.top) * runtime.viewHeight / bounds.height + Math.floor(runtime.cameraY);

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    if (!enemy.alive) continue;

    if (
      worldX >= enemy.x - 5 &&
      worldX <= enemy.x + enemy.w + 5 &&
      worldY >= enemy.y - 5 &&
      worldY <= enemy.y + enemy.h + 5
    ) {
      runtime.selectedEnemy = enemy;

      showMessage(
        `${enemy.name} targeted (${enemy.hp}/${enemy.maxHp} HP).`);

      return;
    }
  }

  runtime.selectedEnemy = null;
}

export { targetEnemyAtScreenPosition };
