import { WORLD_DATA, worldPosition } from "../world/world.js";
import { getClass } from "../data/classes.js";

// Shared mutable data. Modules mutate objects, never imported scalar bindings.
const player = {
  ...worldPosition(WORLD_DATA.playerSpawn),
  w: 24,
  h: 28,
  speed: 145,

  // Resources
  hp: 100,
  baseMaxHp: 100,
  maxHp: 100,
  mana: 50,
  baseMaxMana: 50,
  maxMana: 50,

  // Character information
  name: "Adventurer",
  classId: "mage",
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  gold: 0,
  attributePoints: 0,
  specializationPoints: 0,
  unlockedSkills: [],
  shieldWallRemaining: 0,
  warCryRemaining: 0,
  lastStandRemaining: 0,
  lastStandHealthBonus: 0,

  // Attributes
  strength: 10,
  vitality: 10,
  intelligence: 10,
  dexterity: 10,

  // Defensive stats
  armor: 0,

  facing: "down",
  moving: false,
  animTime: 0,
  frame: 0,
  casting: false,
  castReleased: false,
  castTime: 0,
  castDuration: 0,
  castSpellId: null,
  castGuaranteedCritical: false,
  castTarget: null,
};

const keys = Object.create(null);
const inventory = {
  items: [],
  equipment: {
    head: null,
    chest: null,
    weapon: null,
    offhand: null,
    legs: null,
    boots: null,
  },
};
const INVENTORY_SIZE = 20;
const enemies = [];
const corpses = [];
const combatFeedback = { numbers: [], notices: [], flashes: [], time: 0 };
const fireballs = [];
const enemyProjectiles = [];
const activeIgnites = [];
const swordSwings = [];
const spellCooldowns = Object.create(null);
const questProgress = Object.create(null);
const ACTION_BAR_SIZE = 10;

// Each slot contains a spell ID or null.
const startingClass = getClass(player.classId);
const actionBarSpells = Array.from({ length: ACTION_BAR_SIZE },
  (_, index) => (startingClass.actionBar ?? startingClass.abilities)[index] ?? null);


const initialPlayerState = structuredClone(player);
const initialActionBar = [...actionBarSpells];
const runtime = {
  selectedClassId: player.classId,
  migratingSave: false,
  cameraX: 0, cameraY: 0, viewWidth: 0, viewHeight: 0,
  gameState: "start", areaId: "village", lastTime: 0, nextEnemyInstanceId: 1, nextCorpseId: 1,
  selectedEnemy: null, activeShop: null, activeCharge: null, menuOpen: false,
  debugCollisions: false,
  selectedQuestId: null,
};
function isPlaying() {
  return runtime.gameState === "playing" && player.hp > 0 && !runtime.activeShop && !runtime.menuOpen && !runtime.migratingSave;
}

export { player, keys, inventory, INVENTORY_SIZE, enemies, corpses, combatFeedback, fireballs, enemyProjectiles, activeIgnites, swordSwings, spellCooldowns, questProgress, ACTION_BAR_SIZE, actionBarSpells, initialPlayerState, initialActionBar, runtime, isPlaying };
