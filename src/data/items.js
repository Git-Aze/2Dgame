

// ==================================================
// ITEM DATABASE
// ==================================================
//
// Item IDs are permanent 5-digit strings.
//
// 00001
// 02000
// 03000
// ...
//
// Never reuse an ID after it has been assigned.
// Legacy IDs 00002-00007 are retired; save migration maps them to their
// category ranges. Do not assign those retired IDs to new casting weapons.
// ==================================================

const ITEMS = {

  // ==================================================
  // CASTING WEAPONS
  // IDS: 00001 - 00999
  // ==================================================

  "00001": {
    id: "00001",
    buyPrice: 20,
    name: "Apprentice Staff",
    type: "weapon",
    weaponType: "Casting",

    description: "A simple wooden staff used by novice mages.",

    icon: "🪄",

    stats: {
      damage: 3,
      intelligence: 2
    }
  },

  // ==================================================
  // RANGED WEAPONS
  // IDS: 01000 - 01999
  // ==================================================



  // ==================================================
  // MELEE WEAPONS
  // IDS: 02000 - 02999
  // ==================================================

  "02000": {
    id: "02000",
    buyPrice: 30,
    name: "Iron Sword",
    type: "weapon",
    weaponType: "Melee",

    description: "A dependable iron sword.",

    icon: "⚔️",

    stats: {
      damage: 8,
      strength: 3
    }
  },


  // ==================================================
  // HEAD
  // IDS: 03000 - 03999
  // ==================================================

  "03000": {
    id: "03000",
    buyPrice: 12,
    name: "Leather Cap",
    type: "head",

    description: "A lightweight leather cap.",

    icon: "🪖",

    stats: {
      armor: 2,
      vitality: 1
    }
  },


  // ==================================================
  // CHEST
  // IDS: 04000 - 04999
  // ==================================================

  "04000": {
    id: "04000",
    buyPrice: 25,
    name: "Leather Armor",
    type: "chest",

    description: "Basic armor made from hardened leather.",

    icon: "🥋",

    stats: {
      armor: 5,
      vitality: 2
    }
  },


  // ==================================================
  // OFF HAND
  // IDS: 05000 - 05999
  // ==================================================

  "05000": {
    id: "05000",
    buyPrice: 20,
    name: "Wooden Shield",
    type: "offhand",

    description: "A simple wooden shield.",

    icon: "🛡️",

    stats: {
      armor: 4
    }
  },


  // ==================================================
  // LEGS
  // IDS: 06000 - 06999
  // ==================================================

  "06000": {
    id: "06000",
    buyPrice: 15,
    name: "Leather Pants",
    type: "legs",

    description: "Flexible leather leg protection.",

    icon: "👖",

    stats: {
      armor: 2,
      dexterity: 1
    }
  },


  // ==================================================
  // BOOTS
  // IDS: 07000 - 07999
  // ==================================================

  "07000": {
    id: "07000",
    buyPrice: 12,
    name: "Traveler's Boots",
    type: "boots",

    description: "Well-worn boots made for long journeys.",

    icon: "🥾",

    stats: {
      armor: 1,
      dexterity: 2
    }
  }

};


// ==================================================
// ITEM HELPERS
// ==================================================

function getItem(itemId) {
  return ITEMS[itemId] ?? null;
}

export { getItem };
