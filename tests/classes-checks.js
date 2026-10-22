import "../src/game.js";
import { CLASSES, canEquipForClass } from "../src/data/classes.js";
import { getAllItems } from "../src/data/items.js";
import { RARITIES } from "../src/data/rarities.js";
import { player, runtime, inventory, actionBarSpells, questProgress, INVENTORY_SIZE, isPlaying } from "../src/core/state.js";
import { startGame, resetAdventure, setGameState } from "../src/core/lifecycle.js";
import { equipItem } from "../src/player/inventory.js";
import { getActionUnavailableReason } from "../src/combat/spells.js";
import { SPELLS } from "../src/data/action-definitions.js";
import { createSave, parseSave, applySave, readSave, SAVE_KEY } from "../src/persistence/saves.js";
import { loadAdventure } from "../src/ui/save-ui.js";
import { assignSpellToSlot } from "../src/ui/actionbar.js";
import { toggleSpellBook } from "../src/ui/spellbook.js";

let checks = 0;
const errors = [];
window.addEventListener("error", event => errors.push(event.message));
function assert(value, label) { if (!value) throw Error(label); checks++; }
function rejects(action) { try { action(); return false; } catch { return true; } }
const tick = () => new Promise(resolve => { requestAnimationFrame(resolve); setTimeout(resolve, 50); });
try {
  assert(Object.keys(CLASSES).join(",") === "warrior,hunter,mage", "Three production classes");
  const items = getAllItems();
  assert(items.length === 85 && new Set(items.map(item => item.id)).size === 85, "85 distinct items including class armor families");
  for (const item of items) {
    assert(["strength", "dexterity", "intelligence"].includes(item.gearCategory) && item.itemLevel === 1, `${item.id}: explicit category and unchanged item level`);
  }
  for (const definition of Object.values(CLASSES)) {
    setGameState("start");
    const radio = document.querySelector(`input[name="character-class"][value="${definition.id}"]`);
    radio.checked = true; radio.dispatchEvent(new Event("change", { bubbles: true }));
    document.getElementById("start-game-button").click();
    assert(player.classId === definition.id && inventory.items.join() === definition.startingItems.join(), `${definition.name}: selection and starting items`);
    assert(actionBarSpells.filter(Boolean).join() === definition.abilities.join(), `${definition.name}: starting abilities`);
    toggleSpellBook();
    assert(document.querySelectorAll(".spell-book-entry").length === definition.abilities.length, `${definition.name}: spell book contains class abilities only`);
    document.getElementById("spell-book").classList.add("hidden");
    const foreignAction = Object.keys(SPELLS).find(id => !definition.abilities.includes(id));
    const originalSlot = actionBarSpells[9]; assignSpellToSlot(foreignAction, 9);
    assert(actionBarSpells[9] === originalSlot && getActionUnavailableReason(SPELLS[foreignAction]) === "class", "Foreign abilities cannot be assigned or used");
    for (const slot of ["head", "chest", "legs", "boots"]) for (const rarity of Object.keys(RARITIES)) {
      assert(items.filter(item => item.type === slot && item.rarity === rarity && canEquipForClass(item, definition.id)).length === 1,
        `${definition.name}: one ${rarity} ${slot} item`);
    }
    assert(equipItem(definition.startingWeapon) && player.xp === 20 && questProgress.firstSteps.status === "completed" && questProgress.slimeTrouble.status === "active",
      `${definition.name}: starting weapon completes intro and unlocks slime quest`);
    for (const item of items) {
      const before = JSON.stringify(inventory);
      inventory.items.push(item.id);
      const expected = canEquipForClass(item, definition.id), result = equipItem(item.id);
      assert(result === expected, `${definition.name}/${item.id}: equip restriction`);
      if (!expected) {
        inventory.items.pop();
        assert(JSON.stringify(inventory) === before, "Rejected equipment leaves inventory unchanged");
      } else {
        assert(inventory.equipment[item.type] === item.id, "Allowed item equips in correct slot");
        // Keep this fixture's backpack bounded while testing the whole catalog.
        inventory.items.splice(0, inventory.items.length);
      }
    }
    const text = JSON.stringify(createSave());
    applySave(text);
    assert(player.classId === definition.id && createSave().version === 8, `${definition.name}: class and equipment survive save/load`);
    const invalidClass = JSON.parse(text); invalidClass.player.classId = "__proto__";
    assert(rejects(() => applySave(JSON.stringify(invalidClass))), "Unknown class is rejected");
    const invalidGear = JSON.parse(text);
    invalidGear.inventory.equipment.weapon = definition.id === "mage" ? "02000" : "00001";
    assert(rejects(() => applySave(JSON.stringify(invalidGear))), "Imported incompatible equipment is rejected");
    const invalidBar = JSON.parse(text); invalidBar.actionBar[0] = foreignAction;
    assert(rejects(() => applySave(JSON.stringify(invalidBar))), "Imported foreign ability is rejected");
    setGameState("dead"); startGame();
    assert(player.classId === definition.id && inventory.items.join() === definition.startingItems.join(), "Death restart retains the chosen class");
  }
  resetAdventure("village", "warrior"); setGameState("playing");
  equipItem("02000"); equipItem("03000");
  const legacy = createSave(); legacy.version = 5; delete legacy.player.classId;
  legacy.inventory.items = ["00001", "01000"];
  const snapshot = () => { const save = createSave(); delete save.savedAt; return JSON.stringify(save); };
  const text = JSON.stringify(legacy), before = snapshot();
  assert(parseSave(text).needsClassSelection && rejects(() => applySave(text)), "Older saves require a class decision");
  const migrated = parseSave(text, "mage");
  assert(migrated.version === 8 && migrated.inventory.items.includes("02000") && migrated.inventory.items.includes("03000") && !migrated.inventory.equipment.weapon,
    "Migration preserves incompatible equipment in backpack");
  assert(snapshot() === before, "Migration preview never mutates live state");
  const full = structuredClone(legacy); full.inventory.items = Array(INVENTORY_SIZE).fill("00001");
  assert(rejects(() => parseSave(JSON.stringify(full), "mage")) && snapshot() === before,
    "Full backpack migration is rejected without losing items or changing adventure");
  assert(loadAdventure(text) === false && runtime.migratingSave && !document.getElementById("class-migration").hidden, "Legacy loading opens a class selection dialog");
  assert(!isPlaying() && document.getElementById("game-container").inert, "Migration pauses the live adventure and blocks background controls");
  document.getElementById("migration-class").dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
  assert(document.activeElement.id === "cancel-class-migration", "Migration keyboard focus stays in the dialog");
  document.getElementById("cancel-class-migration").dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
  assert(document.activeElement.id === "migration-class", "Migration focus wraps to the class selector");
  document.getElementById("migration-class").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert(!runtime.migratingSave && document.getElementById("class-migration").hidden && player.classId === "warrior", "Escape cancels migration and preserves current hero");
  loadAdventure(JSON.stringify(full));
  document.getElementById("migration-class").value = "mage";
  document.getElementById("confirm-class-migration").click();
  assert(runtime.migratingSave && document.getElementById("migration-status").textContent.includes("Nothing was discarded"), "Full backpack migration explains safe failure");
  document.getElementById("cancel-class-migration").click();
  loadAdventure(text);
  document.getElementById("migration-class").value = "mage";
  document.getElementById("confirm-class-migration").click();
  assert(player.classId === "mage" && !runtime.migratingSave && inventory.items.includes("02000"), "Migration confirmation applies class and preserves gear");
  const storage = { getItem: key => key === SAVE_KEY ? text : null };
  assert(readSave(storage).save.needsClassSelection, "Browser saves retain pending migration until user chooses");
  // Class definitions can be extended without special-case gameplay code.
  CLASSES.testKnight = { ...CLASSES.warrior, id: "testKnight", name: "Test Knight" };
  resetAdventure("village", "testKnight"); setGameState("playing");
  assert(equipItem("02000") && parseSave(JSON.stringify(createSave())).player.classId === "testKnight", "New class definition works with shared equipment and save systems");
  resetAdventure("village", "mage"); delete CLASSES.testKnight;
  setGameState("start");
  const frame = window.frameElement;
  const oldWidth = frame.style.width, oldHeight = frame.style.height;
  for (const [width, height] of [[390, 480], [320, 320]]) {
    frame.style.width = `${width}px`; frame.style.height = `${height}px`;
    await tick(); await tick();
    const panel = document.querySelector("#game-overlay .game-overlay-panel");
    assert(panel.getBoundingClientRect().right <= innerWidth && panel.clientHeight <= innerHeight && panel.scrollHeight >= panel.clientHeight,
      "Class selection fits short/narrow screens with scrollable contents");
    loadAdventure(text);
    await tick(); await tick();
    const cancel = document.getElementById("cancel-class-migration").getBoundingClientRect();
    assert(cancel.bottom <= innerHeight - 8 && cancel.top >= 8, "Migration cancel remains reachable on short/narrow screens");
    document.getElementById("cancel-class-migration").click();
  }
  frame.style.width = oldWidth; frame.style.height = oldHeight;
  assert(!errors.length, `Browser errors: ${errors.join("; ")}`);
  parent.postMessage({ type: "smoke-results", passed: true, result: `PASS: ${checks} class system checks` }, location.origin);
} catch (error) {
  parent.postMessage({ type: "smoke-results", passed: false, result: `FAIL after ${checks} class checks: ${error.stack}` }, location.origin);
}
