import { player } from "../core/state.js";
import { getClass } from "../data/classes.js";
import { getItem } from "../data/items.js";

// Definitions are separate from each adventure's changing quest progress.
const QUEST_DEFINITIONS = {
  stonehorn: {
    id: "stonehorn", title: "The Arena Guardian",
    description: "Defeat Stonehorn in Cave Arena. Avoid his marked axe cleave and charge. Loot his corpse for a guaranteed Rare Knight's Iron Sword.",
    startHint: "Enter Cave Arena to begin",
    objectives: [{ type: "kill", targetId: "00004", required: 1 }],
    rewards: { xp: 150, gold: 50 },
  },
  firstSteps: {
    id: "firstSteps",
    title: "Ready for Adventure",
    get description() { return `Press C to open your character sheet, then equip your ${getItem(getClass(player.classId).startingWeapon).name}.`; },
    objectives: [{ type: "equip", get targetId() { return getClass(player.classId).startingWeapon; }, required: 1 }],
    rewards: { xp: 20, gold: 0 },
  },
  slimeTrouble: {
    id: "slimeTrouble",
    title: "Slime Trouble",
    description: "Defeat three green slimes.",
    prerequisites: ["firstSteps"],
    objectives: [{ type: "kill", targetId: "00001", required: 3 }],
    rewards: { xp: 75, gold: 20 },
  },
};

export { QUEST_DEFINITIONS };
