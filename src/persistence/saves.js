import { player, inventory, questProgress, actionBarSpells, corpses, runtime, initialPlayerState, INVENTORY_SIZE, ACTION_BAR_SIZE } from "../core/state.js";
import { getItem } from "../data/items.js";
import { SPELLS } from "../data/action-definitions.js";
import { QUEST_DEFINITIONS } from "../quests/quests.js";
import { resetAdventure, setGameState } from "../core/lifecycle.js";
import { STAT_RULES, refreshPlayerStats, getPlayerStats } from "../player/stats.js";
import { emit } from "../core/events.js";
import { ENEMY_TYPES } from "../data/enemy-types.js";
import { AREAS } from "../world/world.js";
import { ENEMY_LEVEL_RULES } from "../combat/enemy-stats.js";
import { LOOT_RULES } from "../data/loot-tables.js";
import { getClass, canEquipForClass, canUseAbility } from "../data/classes.js";
import { getSpecializationTree } from "../data/specializations.js";

const SAVE_KEY = "TopDownSoloRPG.save";
const BACKUP_KEY = "TopDownSoloRPG.save.backup";
const SAVE_VERSION = 8;
const MAX_SAVE_SIZE = 1000000;
const LEGACY_ITEM_IDS = Object.freeze({
  "00001": "00001", "00002": "02000", "00003": "03000", "00004": "04000",
  "00005": "05000", "00006": "06000", "00007": "07000",
});
const fields = ["classId", "level", "xp", "gold", "attributePoints", "specializationPoints", "unlockedSkills", "strength", "vitality", "intelligence", "dexterity", "hp", "mana"];
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const itemExists = (id) => typeof id === "string" && /^\d{5}$/.test(id) && Boolean(getItem(id));

function migrateSave(save) {
  if (!object(save) || ![1, 2, 3, 4, 5, 6, 7, SAVE_VERSION].includes(save.version)) throw new Error("Unsupported save version. This game supports versions 1 through 8.");
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
    save.version = 4;
  }
  if (save.version === 4) {
    if (!object(save.quests)) throw new Error("Invalid legacy quest data.");
    if (!Object.hasOwn(save.quests,"stonehorn")) {
      save.quests.stonehorn = { status: save.areaId === "cave-arena" ? "active" : "available", objectives: [0] };
    }
    save.version = 5;
  }
  if (save.version <= 6 && object(save.player)) {
    save.player.specializationPoints = save.player.level - 1;
    save.player.unlockedSkills = [];
    if (save.version === 6) {
      if (Array.isArray(save.actionBar)) {
        const nodes = getSpecializationTree(save.player.classId)?.nodes ?? [];
        save.actionBar = save.actionBar.map(id => nodes.some(node => node.abilityId === id) ? null : id);
      }
      save.version = SAVE_VERSION;
    }
  }
  if (save.version === 7 && object(save.player)) {
    const skills = save.player.unlockedSkills;
    const oldNodes = getSpecializationTree(save.player.classId)?.nodes ?? [];
    if (!Array.isArray(skills) || new Set(skills).size !== skills.length ||
        !Number.isSafeInteger(save.player.specializationPoints) || save.player.specializationPoints < 0 ||
        save.player.specializationPoints + skills.length !== save.player.level - 1 ||
        !skills.every(id => oldNodes.some(node => node.abilityId === id &&
          (id === "00006" || node.prerequisites.every(required => skills.includes(required)))))) {
      throw new Error("Invalid legacy specialization progress.");
    }
    // Cleave was previously a root. Refund that now-inaccessible branch rather
    // than silently granting Charge or rejecting a legitimate older adventure.
    if (save.player.classId === "warrior" && Array.isArray(skills) &&
        !skills.includes("00004") && skills.includes("00006")) {
      const refunded = skills.filter(id => id === "00006" || id === "00007");
      save.player.unlockedSkills = skills.filter(id => !refunded.includes(id));
      save.player.specializationPoints += refunded.length;
      if (Array.isArray(save.actionBar)) save.actionBar = save.actionBar.map(id => refunded.includes(id) ? null : id);
    }
    save.version = SAVE_VERSION;
  }
  return save;
}

// Migrate parsed data and validate everything before touching the live adventure.
function parseSave(text, legacyClassId = null) {
  if (typeof text !== "string" || text.length > MAX_SAVE_SIZE) throw new Error("Save file is missing or too large.");
  let save;
  try { save = JSON.parse(text); } catch { throw new Error("Save file is not valid JSON."); }
  save = migrateSave(save);
  if (save.game !== "TopDownSoloRPG" || typeof save.savedAt !== "string" || !Number.isFinite(Date.parse(save.savedAt))) throw new Error("Invalid save header.");
  if (!Object.hasOwn(AREAS, save.areaId)) throw new Error("Unknown saved area.");
  if (save.selectedQuestId !== undefined && save.selectedQuestId !== null &&
      (typeof save.selectedQuestId !== "string" || !Object.hasOwn(QUEST_DEFINITIONS,save.selectedQuestId))) throw new Error("Invalid selected quest.");
  const p = save.player;
  const legacy = save.version < 6;
  if (legacy && object(p)) p.classId = legacyClassId;
  if ((!legacy || legacyClassId !== null) && !getClass(p?.classId)) throw new Error("Unknown character class.");
  if (!object(p) || !integer(p.level, 1, 75)) throw new Error("Invalid player level.");
  const nodes = getSpecializationTree(p.classId)?.nodes ?? [];
  if (!integer(p.specializationPoints, 0, p.level - 1) || !Array.isArray(p.unlockedSkills) ||
      new Set(p.unlockedSkills).size !== p.unlockedSkills.length ||
      !p.unlockedSkills.every(id => typeof id === "string" && nodes.some(node => node.abilityId === id && node.prerequisites.every(required => p.unlockedSkills.includes(required)))) ||
      p.specializationPoints + p.unlockedSkills.length !== p.level - 1) throw new Error("Invalid specialization points or learned skills.");
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
    if (!legacy && id !== null && !canEquipForClass(getItem(id), p.classId)) throw new Error("Equipped item is not allowed for this class.");
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
  if (!legacy && save.actionBar.some(id => id !== null && !canUseAbility(id, p.classId, p.unlockedSkills))) throw new Error("Action bar contains an unlearned or foreign ability.");
  if (legacy && legacyClassId !== null) {
    const displaced = Object.values(equipment).filter(id => id && !canEquipForClass(getItem(id), p.classId));
    if (save.inventory.items.length + displaced.length > INVENTORY_SIZE) {
      throw new Error(`This class needs ${displaced.length} free backpack slots for incompatible equipment. Choose another class or free space in the original save before migrating. Nothing was discarded.`);
    }
    for (const slot of Object.keys(equipment)) {
      if (equipment[slot] && !canEquipForClass(getItem(equipment[slot]), p.classId)) {
        save.inventory.items.push(equipment[slot]); equipment[slot] = null;
      }
    }
    save.actionBar = save.actionBar.map(id => canUseAbility(id, p.classId, p.unlockedSkills) ? id : null);
    if (!save.actionBar.some(Boolean)) {
      const definition = getClass(p.classId);
      save.actionBar = Array.from({ length: ACTION_BAR_SIZE }, (_, index) => (definition.actionBar ?? definition.abilities)[index] ?? null);
    }
    const strength = Object.values(equipment).reduce((sum, id) => sum + (id ? getItem(id).stats?.strength ?? 0 : 0), 0);
    p.hp = Math.min(p.hp, initialPlayerState.baseMaxHp + Math.max(0, p.strength + strength - STAT_RULES.attributeBaseline) * STAT_RULES.healthPerStrength);
  }
  // Whitelist fields rather than spreading imported objects into shared state.
  return {
    version: legacy && legacyClassId === null ? 5 : SAVE_VERSION,
    needsClassSelection: legacy && legacyClassId === null,
    game: save.game, savedAt: save.savedAt, areaId: save.areaId,
    selectedQuestId: save.selectedQuestId ?? null,
    player: Object.fromEntries(fields.map((key) => [key, Array.isArray(p[key]) ? [...p[key]] : p[key]])),
    inventory: { items: [...save.inventory.items], equipment: Object.fromEntries(Object.keys(inventory.equipment).map((slot) => [slot, equipment[slot]])) },
    corpses: savedCorpses,
    actionBar: [...save.actionBar],
    quests: Object.fromEntries(Object.keys(QUEST_DEFINITIONS).map((id) => [id, { status: save.quests[id].status, objectives: [...save.quests[id].objectives] }])),
  };
}

function createSave() {
  if (runtime.gameState !== "playing" || player.hp <= 0) throw new Error("Start or continue an adventure before saving.");
  const savedPlayer = Object.fromEntries(fields.map((key) => [key, player[key]]));
  // Temporary health must not become permanent through save/load.
  const healthWithoutLastStand = player.lastStandHealthBonus > 0 ? Math.max(1, player.hp - player.lastStandHealthBonus) : player.hp;
  savedPlayer.hp = Math.min(getPlayerStats({ includeTemporary: false }).maxHp, healthWithoutLastStand);
  return parseSave(JSON.stringify({
    version: SAVE_VERSION, game: "TopDownSoloRPG", savedAt: new Date().toISOString(), areaId: runtime.areaId,
    selectedQuestId: runtime.selectedQuestId,
    player: savedPlayer,
    inventory, actionBar: actionBarSpells, quests: questProgress,
    corpses: corpses.map(({ id, areaId, enemyTypeId, level, x, y, gold, itemId }) => ({ id, areaId, enemyTypeId, level, x, y, gold, itemId })),
  }));
}

function applySave(text, legacyClassId = null) {
  const save = parseSave(text, legacyClassId);
  if (save.needsClassSelection) throw new Error("Choose a class to migrate this saved adventure.");

  // Loading always rebuilds transient combat/world data at the known safe spawn.
  resetAdventure(save.areaId, save.player.classId);
  Object.assign(player, save.player);
  player.xpToNextLevel = 100;
  for (let level = 1; level < player.level; level++) player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
  inventory.items.splice(0, inventory.items.length, ...save.inventory.items);
  Object.assign(inventory.equipment, save.inventory.equipment);
  actionBarSpells.splice(0, actionBarSpells.length, ...save.actionBar);
  for (const id of Object.keys(questProgress)) delete questProgress[id];
  Object.assign(questProgress, save.quests);
  runtime.selectedQuestId = save.selectedQuestId;
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
  emit("area:changed",runtime.areaId);
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
