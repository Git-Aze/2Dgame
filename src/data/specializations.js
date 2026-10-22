// One point per node. Prerequisites reference permanent ability IDs.
const SPECIALIZATION_TREES = {
  warrior: {
    name: "Warrior Specialization",
    nodes: [
      { abilityId: "00004", prerequisites: [], position: [50, 8] },
      { abilityId: "00008", prerequisites: ["00004"], position: [25, 27] },
      { abilityId: "00006", prerequisites: ["00004"], position: [75, 27] },
      { abilityId: "00009", prerequisites: ["00008"], position: [10, 48] },
      { abilityId: "00007", prerequisites: ["00006"], position: [68, 48] },
      { abilityId: "00010", prerequisites: ["00006"], position: [90, 48] },
      { abilityId: "00013", prerequisites: ["00008"], position: [25, 65] },
      { abilityId: "00012", prerequisites: ["00008"], position: [43, 83] },
      { abilityId: "00011", prerequisites: ["00007"], position: [68, 83] },
    ],
  },
};

function getSpecializationTree(classId) {
  return Object.hasOwn(SPECIALIZATION_TREES, classId) ? SPECIALIZATION_TREES[classId] : null;
}

export { SPECIALIZATION_TREES, getSpecializationTree };
