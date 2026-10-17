import { WORLD_DATA, worldPosition } from "../world/world.js";

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
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  gold: 0,
  attributePoints: 0,

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
const fireballs = [];
const activeIgnites = [];
const swordSwings = [];
const spellCooldowns = Object.create(null);
const questProgress = Object.create(null);
const ACTION_BAR_SIZE = 10;

// Each slot contains a spell ID or null.
const actionBarSpells = Array(ACTION_BAR_SIZE).fill(null);

// Start with Fireball in slot 1.
actionBarSpells[0] = "00001";
actionBarSpells[1] = "00002";
actionBarSpells[2] = "00003";
actionBarSpells[3] = "00004";


const initialPlayerState = structuredClone(player);
const initialActionBar = [...actionBarSpells];
const runtime = {
  cameraX: 0, cameraY: 0, viewWidth: 0, viewHeight: 0,
  gameState: "start", lastTime: 0, nextEnemyInstanceId: 1,
  selectedEnemy: null, activeShop: null, activeCharge: null, menuOpen: false,
};
function isPlaying() {
  return runtime.gameState === "playing" && player.hp > 0 && !runtime.activeShop && !runtime.menuOpen;
}

export { player, keys, inventory, INVENTORY_SIZE, enemies, fireballs, activeIgnites, swordSwings, spellCooldowns, questProgress, ACTION_BAR_SIZE, actionBarSpells, initialPlayerState, initialActionBar, runtime, isPlaying };
