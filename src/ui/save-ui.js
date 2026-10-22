import { on } from "../core/events.js";
import { SAVE_KEY, BACKUP_KEY, MAX_SAVE_SIZE, applySave, parseSave, createSave, readSave, writeSave } from "../persistence/saves.js";
import { CLASSES } from "../data/classes.js";
import { runtime, keys } from "../core/state.js";

let pendingLoad = null;
function finishMigration() {
  const pending = pendingLoad;
  pendingLoad = null;
  runtime.migratingSave = false;
  document.getElementById("class-migration").hidden = true;
  for (const id of ["game-overlay", "pause-menu", "game-container"]) document.getElementById(id).inert = pending.inert[id];
  runtime.lastTime = 0;
  if (pending.focus?.isConnected) pending.focus.focus();
}

function loadAdventure(text) {
  const save = parseSave(text);
  if (!save.needsClassSelection) { applySave(text); return true; }
  const ids = ["game-overlay", "pause-menu", "game-container"];
  pendingLoad = { text, focus: document.activeElement,
    inert: Object.fromEntries(ids.map(id => [id, document.getElementById(id).inert])) };
  runtime.migratingSave = true;
  for (const key of Object.keys(keys)) keys[key] = false;
  for (const id of ids) document.getElementById(id).inert = true;
  document.getElementById("migration-status").textContent = "Choose the class you want to keep for this adventure.";
  document.getElementById("class-migration").hidden = false;
  document.getElementById("migration-class").focus();
  return false;
}

function setupSaveUI() {
  const select = document.getElementById("migration-class");
  for (const definition of Object.values(CLASSES)) {
    const option = document.createElement("option");
    option.value = definition.id; option.textContent = `${definition.name} - ${definition.mainStat}`;
    select.append(option);
  }
  document.getElementById("cancel-class-migration").addEventListener("click", finishMigration);
  document.getElementById("confirm-class-migration").addEventListener("click", () => {
    try {
      // Validate before closing the dialog or changing the current adventure.
      parseSave(pendingLoad.text, select.value);
      const text = pendingLoad.text, classId = select.value;
      finishMigration();
      applySave(text, classId);
      report("Saved hero migrated. Press Save to store the class selection in this browser.");
    } catch (error) { document.getElementById("migration-status").textContent = error.message; }
  });
  document.getElementById("class-migration").addEventListener("keydown", event => {
    if (event.key === "Escape" && !event.repeat) { event.preventDefault(); event.stopPropagation(); finishMigration(); }
    if (event.key === "Tab") {
      const first = select, last = document.getElementById("cancel-class-migration");
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  const status = document.getElementById("save-status");
  const overlayStatus = document.getElementById("save-overlay-status");
  const continueButton = document.getElementById("continue-game-button");
  const report = (message) => { status.textContent = message; overlayStatus.textContent = message; };
  const refresh = () => {
    try {
      const result = readSave();
      continueButton.hidden = !result;
      continueButton.textContent = result?.backup ? "Continue from backup" : "Continue";
      if (!result) {
        const hasData = localStorage.getItem(SAVE_KEY) || localStorage.getItem(BACKUP_KEY);
        if (hasData) report("Saved data is invalid or from an unsupported version. Import a valid save or start a new game.");
      }
    } catch { continueButton.hidden = true; report("Browser storage is unavailable. You can still export and import save files."); }
    document.getElementById("menu-load-save-button").disabled = continueButton.hidden;
  };
  document.getElementById("save-game-button").addEventListener("click", () => {
    try { writeSave(); refresh(); report("Progress saved in this browser."); }
    catch (error) { report(`Could not save: ${error.message}`); }
  });
  const loadBrowserSave = () => {
    try {
      const result = readSave();
      if (!result) throw new Error("No valid saved adventure was found.");
      if (loadAdventure(JSON.stringify(result.save))) report(result.backup ? "Loaded the previous valid save." : "Saved adventure loaded.");
    } catch (error) { report(`Could not load: ${error.message}`); }
  };
  continueButton.addEventListener("click", loadBrowserSave);
  document.getElementById("menu-load-save-button").addEventListener("click", loadBrowserSave);
  document.getElementById("export-save-button").addEventListener("click", () => {
    try {
      const blob = new Blob([JSON.stringify(createSave(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "TopDownSoloRPG-save.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      report("Save file exported. Browser save was not changed.");
    } catch (error) { report(`Could not export: ${error.message}`); }
  });
  const input = document.getElementById("import-save-file");
  document.getElementById("import-save-button").addEventListener("click", () => input.click());
  document.getElementById("menu-import-button").addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      if (file.size > MAX_SAVE_SIZE) throw new Error("Save file is too large.");
      if (loadAdventure(await file.text())) report("Save file loaded. Press Save to store it in this browser.");
    } catch (error) { report(`Could not import: ${error.message}`); }
    finally { input.value = ""; }
  });
  on("game:statechanged", refresh);
  on("menu:changed", refresh);
  window.addEventListener("storage", refresh);
  refresh();
}

export { setupSaveUI, loadAdventure };
