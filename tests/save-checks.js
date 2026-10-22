import { SAVE_KEY, BACKUP_KEY, createSave, parseSave, applySave, readSave, writeSave } from "../src/persistence/saves.js";
import { player, inventory, questProgress, actionBarSpells, runtime, corpses, fireballs, spellCooldowns, enemies, keys, initialPlayerState } from "../src/core/state.js";
import { equipItem, unequipItem } from "../src/player/inventory.js";
import { gainXP, damagePlayer } from "../src/player/player.js";
import { startGame } from "../src/core/lifecycle.js";
import { setMenuOpen } from "../src/core/pause-menu.js";

export async function runSaveChecks(assert) {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const rejects = (action) => { try { action(); return false; } catch { return true; } };
  assert(readSave(storage) === null, "Missing save is handled safely");
  gainXP(500);
  equipItem("00001");
  player.gold = 123;
  player.hp = 61;
  player.mana = 23;
  actionBarSpells[7] = "00004";
  questProgress.slimeTrouble.objectives[0] = 2;
  const save = writeSave(storage);
  const text = JSON.stringify(save);
  assert(save.version === 8 && save.player.level === 4 && save.player.xp === 45 && save.inventory.equipment.weapon === "00001", "Versioned save captures exact progression and equipment");
  assert(!text.includes("xpToNextLevel") && !text.includes("cameraX") && !text.includes("casting"), "Save excludes derived and transient data");
  player.gold = 124;
  writeSave(storage);
  assert(JSON.parse(storage.getItem(BACKUP_KEY)).player.gold === 123 && readSave(storage).save.player.gold === 124, "Saving preserves previous valid snapshot as backup");
  data.set(SAVE_KEY, "broken JSON");
  assert(readSave(storage).backup && readSave(storage).save.player.gold === 123, "Corrupt primary recovers valid backup");
  data.set(BACKUP_KEY, "{}");
  assert(readSave(storage) === null, "Two invalid saves safely disable continuation");
  const unchanged = () => JSON.stringify({ player, inventory, questProgress, actionBarSpells, corpses });
  const before = unchanged();
  for (const mutate of [
    (s) => { s.version = 0; }, (s) => { s.version = 9; },
    (s) => { s.player.gold = -1; }, (s) => { s.player.level = 0; },
    (s) => { s.player.xp = 999999; }, (s) => { s.player.hp = 0; },
    (s) => { s.player.attributePoints = 999; },
    (s) => { s.player.hp = 1000; }, (s) => { s.player.mana = 1000; },
    (s) => { s.inventory.items.push("99999"); },
    (s) => { s.inventory.items.push("00002"); },
    (s) => { s.inventory.items = Array(21).fill("00001"); },
    (s) => { s.inventory.equipment.head = "02000"; },
    (s) => { delete s.inventory.equipment.boots; },
    (s) => { s.actionBar[0] = "__proto__"; },
    (s) => { s.actionBar.pop(); },
    (s) => { s.quests.firstSteps.status = "active"; },
    (s) => { s.quests.slimeTrouble.objectives[0] = 4; },
    (s) => { delete s.quests.firstSteps; },
  ]) {
    const invalid = JSON.parse(text);
    mutate(invalid);
    assert(rejects(() => applySave(JSON.stringify(invalid))) && unchanged() === before, "Invalid save rejected without changing adventure");
  }
  assert(rejects(() => parseSave("not JSON")) && rejects(() => parseSave("x".repeat(100001))), "Malformed and oversized files rejected");
  const fullStorage = { getItem: storage.getItem, setItem: () => { throw new Error("Quota exceeded"); } };
  assert(rejects(() => writeSave(fullStorage)) && unchanged() === before, "Storage failures leave gameplay unchanged");
  const references = [player, inventory.items, inventory.equipment, actionBarSpells, questProgress];
  player.x = 900; player.y = 700;
  player.casting = true;
  keys.w = true;
  fireballs.push({});
  spellCooldowns["00004"] = 20;
  enemies[0].alive = false;
  applySave(text);
  assert(references.every((ref, index) => ref === [player, inventory.items, inventory.equipment, actionBarSpells, questProgress][index]), "Loading preserves shared object ownership");
  assert(player.gold === 123 && player.hp === 61 && player.mana === 23 && player.level === 4 && player.xp === 45 && player.xpToNextLevel === 337, "Loading restores resources and recalculates threshold");
  assert(player.x === initialPlayerState.x && player.y === initialPlayerState.y && enemies.every((enemy) => enemy.alive), "Loading uses safe spawn and fresh enemies");
  assert(!player.casting && !keys.w && fireballs.length === 0 && Object.keys(spellCooldowns).length === 0 && !runtime.selectedEnemy && !runtime.activeCharge, "Loading clears transient combat and input state");
  assert(inventory.equipment.weapon === "00001" && actionBarSpells[7] === "00004" && questProgress.slimeTrouble.objectives[0] === 2, "Loading restores inventory, action bar, and partial quest progress");
  assert(JSON.stringify(createSave().player) === JSON.stringify(save.player), "Save/load/save round trip preserves progression");
  const legacy = JSON.parse(text);
  legacy.version = 1;
  legacy.inventory.items = ["00001", "00003", "00003"];
  legacy.inventory.equipment = { weapon: "00002", head: "00003", chest: "00004", offhand: "00005", legs: "00006", boots: "00007" };
  const migrated = parseSave(JSON.stringify(legacy), "adventurer");
  assert(migrated.version === 8 && migrated.inventory.items.join(",") === "00001,03000,03000", "Legacy saves migrate backpack IDs while preserving duplicates and order");
  assert(migrated.inventory.equipment.weapon === "02000" && migrated.inventory.equipment.head === "03000" && migrated.inventory.equipment.chest === "04000" && migrated.inventory.equipment.offhand === "05000" && migrated.inventory.equipment.legs === "06000" && migrated.inventory.equipment.boots === "07000", "Legacy equipment migrates every category ID");
  assert(JSON.stringify(migrated.actionBar) === JSON.stringify(legacy.actionBar) && JSON.stringify(migrated.quests) === JSON.stringify(legacy.quests), "Migration leaves ability IDs and quest progress unchanged");
  assert(JSON.stringify(parseSave(JSON.stringify(migrated))) === JSON.stringify(migrated), "Migrated save can be read again without remapping IDs");
  applySave(JSON.stringify(legacy), "adventurer");
  assert(inventory.equipment.weapon === "02000" && player.gold === 123 && player.xp === 45 && questProgress.firstSteps.status === "completed", "Loading a version 1 file restores migrated equipment and preserves rewards");
  const invalidLegacy = structuredClone(legacy);
  invalidLegacy.inventory.items.push("02000");
  const afterMigration = unchanged();
  assert(rejects(() => applySave(JSON.stringify(invalidLegacy))) && unchanged() === afterMigration, "Unknown or mixed-version legacy IDs are rejected before changing the adventure");
  applySave(text);
  data.set(SAVE_KEY, "broken JSON");
  data.set(BACKUP_KEY, JSON.stringify(legacy));
  assert(readSave(storage).backup && readSave(storage).save.inventory.equipment.weapon === "02000", "Legacy backup is migrated during recovery");
  data.set(SAVE_KEY, JSON.stringify(legacy));
  assert(!readSave(storage).backup && readSave(storage).save.needsClassSelection, "Legacy browser save migrates on reading");
  writeSave(storage);
  assert(JSON.parse(storage.getItem(SAVE_KEY)).version === 8 && JSON.parse(storage.getItem(BACKUP_KEY)).inventory.equipment.weapon === "02000", "Saving writes current IDs and a migrated backup");
  unequipItem("weapon");
  equipItem("00001");
  assert(player.xp === 45 && player.gold === 123 && questProgress.firstSteps.status === "completed", "Completed quests never grant rewards again after loading");
  const browserPrevious = [SAVE_KEY, BACKUP_KEY].map((key) => localStorage.getItem(key));
  try {
    setMenuOpen(true);
    document.getElementById("save-game-button").click();
    assert(readSave().save.player.gold === 123 && document.getElementById("save-status").textContent.includes("saved"), "Save button stores progress and reports success");
    assert(runtime.menuOpen, "Saving keeps the game paused");
    player.gold = 999;
    document.getElementById("menu-load-button").click();
    document.getElementById("menu-load-save-button").click();
    assert(!runtime.menuOpen && player.gold === 123, "Menu Load restores browser save and resumes gameplay");
    damagePlayer(10000);
    assert(!document.getElementById("continue-game-button").hidden, "Continue is available after death with valid save");
    document.getElementById("continue-game-button").click();
    assert(runtime.gameState === "playing" && player.gold === 123 && player.hp === 61, "Continue button restores saved adventure after death");
    damagePlayer(10000);
    startGame();
    assert(player.gold === 0 && readSave().save.player.gold === 123, "New adventure leaves existing browser save untouched");
    damagePlayer(10000);
    const input = document.getElementById("import-save-file");
    const importFile = async (contents) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([contents], "save.json", { type: "application/json" }));
      input.files = transfer.files;
      input.dispatchEvent(new Event("change"));
      for (let attempt = 0; attempt < 100 && input.value; attempt++) await new Promise((resolve) => setTimeout(resolve, 10));
    };
    await importFile("invalid JSON");
    assert(runtime.gameState === "dead" && player.gold === 0 && document.getElementById("save-overlay-status").textContent.includes("Could not import"), "Invalid imported file reports error without changing adventure");
    await importFile(text);
    assert(runtime.gameState === "playing" && player.gold === 123 && inventory.equipment.weapon === "00001", "JSON file import restores adventure through actual file input");
    assert(readSave().save.player.gold === 123, "Import leaves browser snapshot untouched");
    setMenuOpen(true);
    await importFile("invalid JSON");
    assert(runtime.menuOpen && document.getElementById("save-status").textContent.includes("Could not import"), "Invalid menu import leaves gameplay paused");
    await importFile(text);
    assert(!runtime.menuOpen && player.gold === 123, "Valid menu import restores adventure and closes pause menu");
    let exported = null;
    const originalURL = URL.createObjectURL;
    const originalClick = HTMLAnchorElement.prototype.click;
    try {
      setMenuOpen(true);
      URL.createObjectURL = (blob) => { exported = blob; return originalURL(blob); };
      HTMLAnchorElement.prototype.click = function () { assert(this.download === "TopDownSoloRPG-save.json", "Export uses named JSON download"); };
      document.getElementById("export-save-button").click();
      assert(exported?.type === "application/json" && parseSave(await exported.text()).player.gold === 123, "Exported JSON is a valid portable save");
    } finally {
      URL.createObjectURL = originalURL;
      HTMLAnchorElement.prototype.click = originalClick;
    }
    document.getElementById("menu-restart-button").click();
    assert(!runtime.menuOpen && runtime.gameState === "playing" && player.level === 1 && player.gold === 0 && questProgress.firstSteps.status === "active" && readSave().save.player.gold === 123,
      "Menu Restart begins fresh adventure and preserves stored save");
  } finally {
    [SAVE_KEY, BACKUP_KEY].forEach((key, index) => {
      if (browserPrevious[index] === null) localStorage.removeItem(key);
      else localStorage.setItem(key, browserPrevious[index]);
    });
  }
}
