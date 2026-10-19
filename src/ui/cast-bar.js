import { player, runtime } from "../core/state.js";
import { SPELLS } from "../data/action-definitions.js";
import { on } from "../core/events.js";

let bar, fill, icon, name, time;
let lastSpell = null, lastTime = "";
let lastProgress = -1;

function updateCastBar() {
  if (!bar) return;
  const spell = SPELLS[player.castSpellId];
  const visible = player.casting && spell && runtime.gameState === "playing";
  if (bar.hidden === Boolean(visible)) bar.hidden = !visible;
  if (!visible) return;
  if (lastSpell !== spell.id) {
    lastSpell = spell.id;
    name.textContent = spell.name;
    icon.textContent = spell.icon;
    bar.setAttribute("aria-label", `Casting ${spell.name}`);
  }
  const progress = Math.min(1, player.castTime / player.castDuration);
  if (progress !== lastProgress) {
    lastProgress = progress;
    fill.style.transform = `scaleX(${progress})`;
  }
  const remaining = Math.max(0, player.castDuration - player.castTime).toFixed(1);
  const label = `${remaining} / ${player.castDuration.toFixed(1)}s`;
  if (label !== lastTime) {
    lastTime = label;
    time.textContent = label;
    bar.setAttribute("aria-valuemax", player.castDuration);
    bar.setAttribute("aria-valuenow", player.castTime.toFixed(1));
    bar.setAttribute("aria-valuetext", `${spell.name}: ${remaining} seconds remaining`);
  }
}

function setupCastBar() {
  bar = document.getElementById("cast-bar");
  fill = document.getElementById("cast-bar-fill");
  icon = document.getElementById("cast-bar-icon");
  name = document.getElementById("cast-bar-name");
  time = document.getElementById("cast-bar-time");
  // Follow the actual action-bar height, including narrow-screen slot sizes.
  const actionBar = document.getElementById("action-bar");
  const position = () => {
    bar.style.bottom = `${actionBar.offsetParent.clientHeight - actionBar.offsetTop + 10}px`;
  };
  new ResizeObserver(position).observe(actionBar);
  window.addEventListener("resize", position);
  on("casting:changed", updateCastBar);
  position();
  updateCastBar();
}

export { setupCastBar, updateCastBar };
