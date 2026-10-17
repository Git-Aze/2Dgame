import { player, inventory, questProgress, actionBarSpells, runtime, initialPlayerState, INVENTORY_SIZE, ACTION_BAR_SIZE } from "../core/state.js";
import { getItem } from "../data/items.js";
import { SPELLS } from "../data/action-definitions.js";
import { QUEST_DEFINITIONS } from "../quests/quests.js";
import { resetAdventure, setGameState } from "../core/lifecycle.js";
import { STAT_RULES, refreshPlayerStats } from "../player/stats.js";
import { collides } from "../world/movement.js";
import { emit } from "../core/events.js";

const SAVE_KEY = "TopDownSoloRPG.save";
const BACKUP_KEY = "TopDownSoloRPG.save.backup";
const SAVE_VERSION = 1;
const fields = ["level", "xp", "gold", "attributePoints", "strength", "vitality", "intelligence", "dexterity", "hp", "mana"];
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const itemExists = (id) => typeof id === "string" && /^\d{5}$/.test(id) && Boolean(getItem(id));

// Parse and validate everything before touching the live adventure. Version 1
// deliberately rejects other versions; add explicit migrations when version 2 exists.
function parseSave(text) {
  if (typeof text !== "string" || text.length > 100000) throw new Error("Save file is missing or too large.");
  let save;
  try { save = JSON.parse(text); } catch { throw new Error("Save file is not valid JSON."); }
  if (!object(save) || save.version !== SAVE_VERSION) throw new Error("Unsupported save version. This game supports version 1.");
  if (save.game !== "TopDownSoloRPG" || typeof save.savedAt !== "string" || !Number.isFinite(Date.parse(save.savedAt))) throw new Error("Invalid save header.");
  const p = save.player;
  if (!object(p) || !integer(p.level, 1, 75)) throw new Error("Invalid player level.");
  let threshold = 100;
  for (let level = 1; level < p.level; level++) threshold = Math.floor(threshold * 1.5);
  if (!integer(p.xp, 0, threshold - 1) || !integer(p.gold, 0, 1000000000) || !integer(p.attributePoints, 0, 1000000)) throw new Error("Invalid player progression.");
  for (const attribute of ["strength", "vitality", "intelligence", "dexterity"]) {
    if (!integer(p[attribute], 10, 1000000)) throw new Error("Invalid character attributes.");
  }
  if (p.strength + p.vitality + p.intelligence + p.dexterity - 40 + p.attributePoints !== (p.level - 1) * 5) throw new Error("Attribute points do not match the player level.");
  if (![p.hp, p.mana].every((value) => Number.isFinite(value) && value >= 0 && value <= 1000000) || p.hp <= 0) throw new Error("Invalid health or mana.");
  if (!object(save.inventory) || !Array.isArray(save.inventory.items) || save.inventory.items.length > INVENTORY_SIZE || !save.inventory.items.every(itemExists)) throw new Error("Invalid inventory items.");
  const equipment = save.inventory.equipment;
  if (!object(equipment) || Object.keys(equipment).length !== Object.keys(inventory.equipment).length) throw new Error("Invalid equipment slots.");
  for (const slot of Object.keys(inventory.equipment)) {
    const id = equipment[slot];
    if (!Object.hasOwn(equipment, slot) || (id !== null && (!itemExists(id) || getItem(id).type !== slot))) throw new Error("Invalid equipped item.");
  }
  const equipmentStrength = Object.values(equipment).reduce((sum, id) => sum + (id ? getItem(id).stats?.strength ?? 0 : 0), 0);
  const maxHp = initialPlayerState.baseMaxHp + Math.max(0, p.strength + equipmentStrength - STAT_RULES.attributeBaseline) * STAT_RULES.healthPerStrength;
  if (p.hp > maxHp || p.mana > initialPlayerState.baseMaxMana) throw new Error("Saved resources exceed character limits.");
  if (!Array.isArray(save.actionBar) || save.actionBar.length !== ACTION_BAR_SIZE || !save.actionBar.every((id) => id === null || (typeof id === "string" && Object.hasOwn(SPELLS, id)))) throw new Error("Invalid action bar.");
  if (!object(save.quests) || Object.keys(save.quests).length !== Object.keys(QUEST_DEFINITIONS).length) throw new Error("Invalid quest data.");
  for (const quest of Object.values(QUEST_DEFINITIONS)) {
    const progress = save.quests[quest.id];
    if (!object(progress) || !["locked", "available", "active", "completed"].includes(progress.status) || !Array.isArray(progress.objectives) || progress.objectives.length !== quest.objectives.length || !progress.objectives.every((count, index) => integer(count, 0, quest.objectives[index].required))) throw new Error("Invalid quest progress.");
    const finished = progress.objectives.every((count, index) => count === quest.objectives[index].required);
    if ((progress.status === "completed") !== finished || (["locked", "available"].includes(progress.status) && progress.objectives.some(Boolean))) throw new Error("Inconsistent quest completion.");
    const unlocked = (quest.prerequisites ?? []).every((id) => save.quests[id]?.status === "completed");
    if ((progress.status === "locked") === unlocked) throw new Error("Inconsistent quest prerequisites.");
  }
  // Whitelist fields rather than spreading imported objects into shared state.
  return {
    version: SAVE_VERSION, game: save.game, savedAt: save.savedAt,
    player: Object.fromEntries(fields.map((key) => [key, p[key]])),
    inventory: { items: [...save.inventory.items], equipment: Object.fromEntries(Object.keys(inventory.equipment).map((slot) => [slot, equipment[slot]])) },
    actionBar: [...save.actionBar],
    quests: Object.fromEntries(Object.keys(QUEST_DEFINITIONS).map((id) => [id, { status: save.quests[id].status, objectives: [...save.quests[id].objectives] }])),
  };
}

function createSave() {
  if (runtime.gameState !== "playing" || player.hp <= 0) throw new Error("Start or continue an adventure before saving.");
  return parseSave(JSON.stringify({
    version: SAVE_VERSION, game: "TopDownSoloRPG", savedAt: new Date().toISOString(),
    player: Object.fromEntries(fields.map((key) => [key, player[key]])),
    inventory, actionBar: actionBarSpells, quests: questProgress,
  }));
}

function applySave(text) {
  const save = parseSave(text);
  if (collides(initialPlayerState.x, initialPlayerState.y)) throw new Error("The starting position is blocked.");
  // Loading always rebuilds transient combat/world data at the known safe spawn.
  resetAdventure();
  Object.assign(player, save.player);
  player.xpToNextLevel = 100;
  for (let level = 1; level < player.level; level++) player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
  inventory.items.splice(0, inventory.items.length, ...save.inventory.items);
  Object.assign(inventory.equipment, save.inventory.equipment);
  actionBarSpells.splice(0, actionBarSpells.length, ...save.actionBar);
  for (const id of Object.keys(questProgress)) delete questProgress[id];
  Object.assign(questProgress, save.quests);
  refreshPlayerStats();
  runtime.cameraX = 0;
  runtime.cameraY = 0;
  setGameState("playing");
  emit("player:changed");
  emit("resources:changed");
  emit("quests:changed");
  return save;
}

function readSave(storage = window.localStorage) {
  for (const key of [SAVE_KEY, BACKUP_KEY]) {
    const text = storage.getItem(key);
    if (!text) continue;
    try { return { save: parseSave(text), backup: key === BACKUP_KEY }; } catch { /* Try the previous valid save. */ }
  }
  return null;
}

function writeSave(storage = window.localStorage) {
  const save = createSave();
  const previous = storage.getItem(SAVE_KEY);
  if (previous) {
    let backup = null;
    try { backup = parseSave(previous); } catch { /* Preserve the existing backup if the primary is corrupt. */ }
    if (backup) storage.setItem(BACKUP_KEY, JSON.stringify(backup));
  }
  storage.setItem(SAVE_KEY, JSON.stringify(save));
  return save;
}

export { SAVE_KEY, BACKUP_KEY, parseSave, createSave, applySave, readSave, writeSave };
