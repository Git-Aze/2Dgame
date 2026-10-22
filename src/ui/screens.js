import { on } from "../core/events.js";
import { startGame } from "../core/lifecycle.js";
import { CLASSES } from "../data/classes.js";
import { runtime } from "../core/state.js";

function setupScreens() {
  const choices = document.getElementById("class-options");
  for (const definition of Object.values(CLASSES)) {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio"; radio.name = "character-class"; radio.value = definition.id;
    radio.checked = runtime.selectedClassId === definition.id;
    radio.addEventListener("change", () => {
      runtime.selectedClassId = definition.id;
      document.getElementById("class-description").textContent = definition.description;
    });
    label.append(radio, document.createTextNode(definition.name));
    choices.append(label);
    if (radio.checked) document.getElementById("class-description").textContent = definition.description;
  }
  document.getElementById("start-game-button").addEventListener("click", startGame);
  on("game:statechanged", (state) => {
    const playing = state === "playing";
    document.getElementById("game-overlay").hidden = playing;
    document.getElementById("game-container").inert = !playing;
    const button = document.getElementById("start-game-button");
    if (playing) {
      if (document.getElementById("game-overlay").contains(document.activeElement)) document.activeElement.blur();
      return;
    }
    document.getElementById("character-sheet").classList.add("hidden");
    document.getElementById("spell-book").classList.add("hidden");
    const dead = state === "dead";
    document.getElementById("class-selection").hidden = dead;
    document.getElementById("game-overlay-title").textContent = dead ? "You died" : document.title;
    document.getElementById("game-overlay-description").textContent = dead
      ? "Press Space to restart. Your adventure will begin again from the start."
      : "Explore Greenfield Village, equip your gear, and battle the creatures nearby.";
    button.textContent = dead ? "Restart game" : "New game";
    document.getElementById("game-overlay-hint").textContent = dead ? "Press Space to restart" : "Press Space to start";
    button.focus();
  });
}

export { setupScreens };
