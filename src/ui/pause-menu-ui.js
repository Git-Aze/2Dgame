import { on } from "../core/events.js";
import { setMenuOpen } from "../core/pause-menu.js";
import { setGameState, startGame } from "../core/lifecycle.js";
import { runtime, player } from "../core/state.js";

function setupPauseMenu() {
  const dialog = document.getElementById("pause-menu");
  let previousFocus = null;
  on("menu:changed", (open) => {
    dialog.hidden = !open;
    document.getElementById("game-container").inert = open || runtime.gameState !== "playing";
    document.getElementById("menu-load-options").hidden = true;
    document.getElementById("menu-load-button").setAttribute("aria-expanded", "false");
    if (open) {
      previousFocus = document.activeElement;
      document.getElementById("menu-continue-button").focus();
    } else if (runtime.gameState === "playing" && previousFocus?.isConnected && !dialog.contains(previousFocus)) previousFocus.focus();
    else document.activeElement?.blur();
  });
  document.getElementById("menu-continue-button").addEventListener("click", () => setMenuOpen(false));
  document.getElementById("menu-restart-button").addEventListener("click", () => {
    runtime.selectedClassId = player.classId;
    setGameState("start");
    startGame();
  });
  document.getElementById("menu-load-button").addEventListener("click", (event) => {
    const options = document.getElementById("menu-load-options");
    options.hidden = !options.hidden;
    event.currentTarget.setAttribute("aria-expanded", String(!options.hidden));
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const buttons = [...dialog.querySelectorAll("button:not(:disabled)")].filter((button) => button.getClientRects().length);
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
}

export { setupPauseMenu };
