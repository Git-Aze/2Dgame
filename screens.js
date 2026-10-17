import { on } from "./events.js";
import { startGame } from "./lifecycle.js";

function setupScreens() {
  document.getElementById("start-game-button").addEventListener("click", startGame);
  on("game:statechanged", (state) => {
    const playing = state === "playing";
    document.getElementById("game-overlay").hidden = playing;
    document.getElementById("game-container").inert = !playing;
    const button = document.getElementById("start-game-button");
    if (playing) {
      button.blur();
      return;
    }
    document.getElementById("character-sheet").classList.add("hidden");
    document.getElementById("spell-book").classList.add("hidden");
    const dead = state === "dead";
    document.getElementById("game-overlay-title").textContent = dead ? "You died" : document.title;
    document.getElementById("game-overlay-description").textContent = dead
      ? "Press Space to restart. Your adventure will begin again from the start."
      : "Explore Greenfield Village, equip your gear, and battle the creatures nearby.";
    button.textContent = dead ? "Restart game" : "Start game";
    document.getElementById("game-overlay-hint").textContent = dead ? "Press Space to restart" : "Press Space to start";
    button.focus();
  });
}

export { setupScreens };
