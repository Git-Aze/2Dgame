import { player, inventory, questProgress, actionBarSpells, corpses, runtime, initialPlayerState, INVENTORY_SIZE, ACTION_BAR_SIZE } from "../core/state.js";
import { getItem } from "../data/items.js";
import { SPELLS } from "../data/action-definitions.js";
import { QUEST_DEFINITIONS } from "../quests/quests.js";
import { resetAdventure, setGameState } from "../core/lifecycle.js";
import { STAT_RULES, refreshPlayerStats } from "../player/stats.js";
import { emit } from "../core/events.js";
import { ENEMY_TYPES } from "../data/enemy-types.js";
import { AREAS } from "../world/world.js";
import { ENEMY_LEVEL_RULES } from "../combat/enemy-stats.js";
import { LOOT_RULES } from "../data/loot-tables.js";

const SAVE_KEY = "TopDownSoloRPG.save";
const BACKUP_KEY = "TopDownSoloRPG.save.backup";
const SAVE_VERSION = 4;
const MAX_SAVE_SIZE = 1000000;
const LEGACY_ITEM_IDS = Object.freeze({
  "00001": "00001", "00002": "02000", "00003": "03000", "00004": "04000",
  "00005": "05000", "00006": "06000", "00007": "07000",
});
const fields = ["level", "xp", "gold", "attributePoints", "strength", "vitality", "intelligence", "dexterity", "hp", "mana"];
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const itemExists = (id) => typeof id === "string" && /^\d{5}$/.test(id) && Boolean(getItem(id));

function migrateSave(save) {
  if (!object(save) || ![1, 2, 3, SAVE_VERSION].includes(save.version)) throw new Error("Unsupported save version. This game supports versions 1 through 4.");
  if (save.version === 1) {
    if (!object(save.inventory) || !Array.isArray(save.inventory.items) || !object(save.inventory.equipment)) throw new Error("Invalid legacy inventory.");
    const migrateItem = (id) => {
      if (typeof id !== "string" || !Object.hasOwn(LEGACY_ITEM_IDS, id)) throw new Error("Unknown legacy item ID.");
      return LEGACY_ITEM_IDS[id];
    };
    save.inventory.items = save.inventory.items.map(migrateItem);
    for (const slot of Object.keys(save.inventory.equipment)) {
      if (save.inventory.equipment[slot] !== null) save.inventory.equipment[slot] = migrateItem(save.inventory.equipment[slot]);
    }
    // Ability IDs and quest objective counters belong to separate namespaces.
    save.version = 2;
  }
  if (save.version === 2) {
    save.corpses = [];
    save.version = 3;
  }
  if (save.version === 3) {
    save.areaId = "village";
    if (Array.isArray(save.corpses)) save.corpses.forEach((corpse) => { if (object(corpse)) corpse.areaId = "village"; });
    save.version = SAVE_VERSION;
  }
  return save;
}

// Migrate parsed data and validate everything before touching the live adventure.
function parseSave(text) {
  if (typeof text !== "string" || text.length > MAX_SAVE_SIZE) throw new Error("Save file is missing or too large.");
  let save;
  try { save = JSON.parse(text); } catch { throw new Error("Save file is not valid JSON."); }
  save = migrateSave(save);
  if (save.game !== "TopDownSoloRPG" || typeof save.savedAt !== "string" || !Number.isFinite(Date.parse(save.savedAt))) throw new Error("Invalid save header.");
  if (!Object.hasOwn(AREAS, save.areaId)) throw new Error("Unknown saved area.");
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
  if (!Array.isArray(save.corpses) || save.corpses.length > 1000) throw new Error("Invalid corpse data.");
  const corpseIds = new Set();
  const savedCorpses = save.corpses.map((corpse) => {
    if (!object(corpse) || !integer(corpse.id, 1, 1000000000) || corpseIds.has(corpse.id)) throw new Error("Invalid corpse ID.");
    corpseIds.add(corpse.id);
    const area = AREAS[corpse.areaId];
    const type = ENEMY_TYPES.find((entry) => entry.id === corpse.enemyTypeId);
    if (!Object.hasOwn(AREAS, corpse.areaId) || !type || !integer(corpse.level, 1, ENEMY_LEVEL_RULES.maxLevel) ||
        !Number.isFinite(corpse.x) || !Number.isFinite(corpse.y) || corpse.x < 0 || corpse.y < 0 ||
        corpse.x + type.width > area.width * area.tileSize || corpse.y + type.height > area.height * area.tileSize ||
        !integer(corpse.gold, 0, corpse.level * LOOT_RULES.goldMaxPerLevel) ||
        (corpse.itemId !== null && !itemExists(corpse.itemId)) || (!corpse.gold && !corpse.itemId)) throw new Error("Invalid corpse loot or position.");
    return { id: corpse.id, areaId: corpse.areaId, enemyTypeId: type.id, level: corpse.level,
      x: corpse.x, y: corpse.y, gold: corpse.gold, itemId: corpse.itemId };
  });
  // Whitelist fields rather than spreading imported objects into shared state.
  return {
    version: SAVE_VERSION, game: save.game, savedAt: save.savedAt, areaId: save.areaId,
    player: Object.fromEntries(fields.map((key) => [key, p[key]])),
    inventory: { items: [...save.inventory.items], equipment: Object.fromEntries(Object.keys(inventory.equipment).map((slot) => [slot, equipment[slot]])) },
    corpses: savedCorpses,
    actionBar: [...save.actionBar],
    quests: Object.fromEntries(Object.keys(QUEST_DEFINITIONS).map((id) => [id, { status: save.quests[id].status, objectives: [...save.quests[id].objectives] }])),
  };
}

function createSave() {
  if (runtime.gameState !== "playing" || player.hp <= 0) throw new Error("Start or continue an adventure before saving.");
  return parseSave(JSON.stringify({
    version: SAVE_VERSION, game: "TopDownSoloRPG", savedAt: new Date().toISOString(), areaId: runtime.areaId,
    player: Object.fromEntries(fields.map((key) => [key, player[key]])),
    inventory, actionBar: actionBarSpells, quests: questProgress,
    corpses: corpses.map(({ id, areaId, enemyTypeId, level, x, y, gold, itemId }) => ({ id, areaId, enemyTypeId, level, x, y, gold, itemId })),
  }));
}

function applySave(text) {
  const save = parseSave(text);

  // Loading always rebuilds transient combat/world data at the known safe spawn.
  resetAdventure(save.areaId);
  Object.assign(player, save.player);
  player.xpToNextLevel = 100;
  for (let level = 1; level < player.level; level++) player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
  inventory.items.splice(0, inventory.items.length, ...save.inventory.items);
  Object.assign(inventory.equipment, save.inventory.equipment);
  actionBarSpells.splice(0, actionBarSpells.length, ...save.actionBar);
  for (const id of Object.keys(questProgress)) delete questProgress[id];
  Object.assign(questProgress, save.quests);
  for (const corpse of save.corpses) {
    const type = ENEMY_TYPES.find((entry) => entry.id === corpse.enemyTypeId);
    corpses.push({ ...corpse, name: type.name, sprite: type.sprite, w: type.width, h: type.height,
      spriteTime: 0, spriteMoving: false, stunRemaining: 0, hurtTime: 0 });
  }
  runtime.nextCorpseId = Math.max(0, ...corpses.map((corpse) => corpse.id)) + 1;
  refreshPlayerStats();
  runtime.cameraX = 0;
  runtime.cameraY = 0;
  setGameState("playing");
  emit("player:changed");
  emit("resources:changed");
  emit("quests:changed");
  emit("loot:changed");
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

export { SAVE_KEY, BACKUP_KEY, MAX_SAVE_SIZE, parseSave, createSave, applySave, readSave, writeSave };
