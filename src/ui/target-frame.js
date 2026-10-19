import { player, runtime } from "../core/state.js";
import { drawSlimeSprite } from "../rendering/slime-sprites.js";
import { drawBossSprite } from "../rendering/boss-sprites.js";
import { drawWolf } from "../rendering/enemy-renderer.js";

let elements, lastSprite = null, portraitReady = false;

function setText(element, text) {
  if (element.textContent !== text) element.textContent = text;
}

function updateTargetFrame() {
  if (!elements) {
    elements = Object.fromEntries(["frame", "name", "level", "hp-bar", "hp-fill", "hp-text", "portrait-canvas"]
      .map(key => [key, document.getElementById(`target-${key}`)]));
  }
  const target = runtime.selectedEnemy;
  const visible = runtime.gameState === "playing" && player.hp > 0 && target?.alive;
  if (elements.frame.hidden === Boolean(visible)) elements.frame.hidden = !visible;
  if (!visible) return;
  setText(elements.name, target.name);
  setText(elements.level, String(target.level));
  const health = Math.max(0, target.hp), maxHealth = target.maxHp;
  setText(elements["hp-text"], `${Math.ceil(health)} / ${maxHealth}`);
  const width = `${maxHealth > 0 ? Math.min(100, health / maxHealth * 100) : 0}%`;
  if (elements["hp-fill"].style.width !== width) elements["hp-fill"].style.width = width;
  const bar = elements["hp-bar"];
  if (bar.getAttribute("aria-valuenow") !== String(health)) bar.setAttribute("aria-valuenow", health);
  if (bar.getAttribute("aria-valuemax") !== String(maxHealth)) bar.setAttribute("aria-valuemax", maxHealth);
  const label = `${target.name}, level ${target.level}`;
  if (elements.frame.getAttribute("aria-label") !== label) elements.frame.setAttribute("aria-label", label);
  if (lastSprite !== target.sprite || !portraitReady) {
    lastSprite = target.sprite;
    portraitReady = drawPortrait(target);
  }
}

function drawPortrait(target) {
  const canvas = elements["portrait-canvas"], context = canvas.getContext("2d");
  context.clearRect(0, 0, 48, 48);
  context.imageSmoothingEnabled = false;
  // Reuse idle art and the same frame crops as world rendering.
  const portrait = { ...target, x: 0, y: 0, hurtTime: 0, spriteMoving: false,
    spriteTime: 0, stunRemaining: 0, bossAction: null, bossTime: 0 };
  const scale = target.isBoss ? 0.3 : 1.2;
  context.save();
  context.translate(24 - target.w / 2 * scale, 43 - target.h * scale);
  context.scale(scale, scale);
  let ready = true;
  if (target.sprite === "wolf") drawWolf(portrait, context);
  else if (target.isBoss) ready = drawBossSprite(portrait, false, context);
  else ready = drawSlimeSprite(portrait, context);
  context.restore();
  return ready;
}

export { updateTargetFrame };
