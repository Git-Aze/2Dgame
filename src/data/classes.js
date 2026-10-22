import { getSpecializationTree } from "./specializations.js";
// Add classes here; shared systems read definitions instead of class-name branches.
const CLASSES = {
  warrior: {
    id: "warrior", name: "Warrior", mainStat: "strength",
    description: "A Strength fighter wielding swords and shields.",
    startingWeapon: "02000",
    startingItems: ["02000", "03000", "04000", "05000", "06010", "07010"],
    abilities: ["00003"],
    actionBar: ["00003", null],
  },
  hunter: {
    id: "hunter", name: "Hunter", mainStat: "dexterity",
    description: "A Dexterity marksman using bows and throwing daggers.",
    startingWeapon: "01000",
    startingItems: ["01000", "01001", "03010", "04010", "06000", "07000"],
    abilities: ["00005"],
    actionBar: ["00005", null, null, null],
  },
  mage: {
    id: "mage", name: "Mage", mainStat: "intelligence",
    description: "An Intelligence caster wielding staves and fire magic.",
    startingWeapon: "00001",
    startingItems: ["00001", "03020", "04020", "06020", "07020"],
    abilities: ["00001", "00002"],
  },
};

function getClass(id) {
  return Object.hasOwn(CLASSES, id) ? CLASSES[id] : null;
}

function canEquipForClass(item, classId) {
  const definition = getClass(classId);
  return Boolean(item && definition && (definition.gearCategories ?? [definition.mainStat]).includes(item.gearCategory));
}

function canUseAbility(id, classId, unlockedSkills = []) {
  return Boolean(getClass(classId)?.abilities.includes(id) ||
    (unlockedSkills.includes(id) && getSpecializationTree(classId)?.nodes.some(node => node.abilityId === id)));
}

export { CLASSES, getClass, canEquipForClass, canUseAbility };
