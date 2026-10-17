import { keys, player, runtime } from "./state.js";
import { emit } from "./events.js";

function setMenuOpen(open) {
  if (open && (runtime.gameState !== "playing" || player.hp <= 0 || runtime.activeShop)) return;
  if (runtime.menuOpen === open) return;
  runtime.menuOpen = open;
  for (const key in keys) keys[key] = false;
  runtime.lastTime = 0;
  emit("menu:changed", open);
}

export { setMenuOpen };
