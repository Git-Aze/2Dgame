// One point per node. Prerequisites reference permanent ability IDs.
const SPECIALIZATION_TREES = {
  warrior: {
    name: "Warrior Specialization",
    nodes: [
      { abilityId: "00004", prerequisites: [], slot: 3, position: [50, 15] },
      { abilityId: "00008", prerequisites: ["00004"], slot: 7, position: [25, 48] },
      { abilityId: "00006", prerequisites: ["00004"], slot: 5, position: [75, 48] },
      { abilityId: "00007", prerequisites: ["00006"], slot: 6, position: [75, 81] },
    ],
  },
};

function getSpecializationTree(classId) {
  return Object.hasOwn(SPECIALIZATION_TREES, classId) ? SPECIALIZATION_TREES[classId] : null;
}

export { SPECIALIZATION_TREES, getSpecializationTree };
