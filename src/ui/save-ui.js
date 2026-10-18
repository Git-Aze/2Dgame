import { on } from "../core/events.js";
import { SAVE_KEY, BACKUP_KEY, MAX_SAVE_SIZE, applySave, createSave, readSave, writeSave } from "../persistence/saves.js";

function setupSaveUI() {
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
      applySave(JSON.stringify(result.save));
      report(result.backup ? "Loaded the previous valid save." : "Saved adventure loaded.");
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
      applySave(await file.text());
      report("Save file loaded. Press Save to store it in this browser.");
    } catch (error) { report(`Could not import: ${error.message}`); }
    finally { input.value = ""; }
  });
  on("game:statechanged", refresh);
  on("menu:changed", refresh);
  window.addEventListener("storage", refresh);
  refresh();
}

export { setupSaveUI };
