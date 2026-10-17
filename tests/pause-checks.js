import { player, runtime, keys, enemies, spellCooldowns, isPlaying } from "../src/core/state.js";
import { update } from "../src/core/update.js";

export function runPauseChecks(assert) {
  const key = (value, repeat = false) => window.dispatchEvent(new KeyboardEvent("keydown", { key: value, repeat, bubbles: true, cancelable: true }));
  const dialog = document.getElementById("pause-menu");
  keys.w = true;
  spellCooldowns["00004"] = 10;
  player.casting = true;
  player.castTime = 0.1;
  key("Escape");
  assert(runtime.menuOpen && !isPlaying() && !dialog.hidden && document.getElementById("game-container").inert, "Escape opens modal and pauses simulation");
  assert(!keys.w && document.activeElement.id === "menu-continue-button", "Pause clears held input and focuses Continue");
  document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
  assert(document.activeElement.id === "menu-restart-button", "Pause menu traps backward keyboard focus");
  document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
  assert(document.activeElement.id === "menu-continue-button", "Pause menu traps forward keyboard focus");
  const snapshot = JSON.stringify({ player, enemies, spellCooldowns });
  key("w"); key("1"); key(" ");
  update(5);
  assert(snapshot === JSON.stringify({ player, enemies, spellCooldowns }) && !keys.w, "Pause freezes movement, enemies, resources, casts, cooldowns and gameplay controls");
  key("Escape", true);
  assert(runtime.menuOpen, "Held Escape does not toggle menu repeatedly");
  document.getElementById("menu-load-button").click();
  assert(!document.getElementById("menu-load-options").hidden && runtime.menuOpen, "Load expands browser/file choices while paused");
  assert(document.getElementById("menu-settings-button").disabled, "Settings is a disabled placeholder");
  document.getElementById("menu-continue-button").click();
  assert(isPlaying() && dialog.hidden && !document.getElementById("game-container").inert && player.casting && player.castTime === 0.1 && runtime.lastTime === 0,
    "Continue resumes without cancelling a paused cast or advancing time");
  key("Escape"); key("Escape");
  assert(isPlaying() && !runtime.menuOpen, "Escape toggles pause off");
  player.casting = false;
  player.castTime = 0;
  delete spellCooldowns["00004"];
  assert(!document.getElementById("save-controls") && dialog.contains(document.getElementById("save-game-button")) && dialog.contains(document.getElementById("export-save-button")), "Save and Export are moved out of HUD into menu");
}
