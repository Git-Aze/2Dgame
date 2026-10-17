// ==================================================
// ITEM DATABASE
// ==================================================
//
// Item IDs are permanent 5-digit strings.
//
// 00001
// 00002
// 00003
// ...
//
// Never reuse an ID after it has been assigned.
// ==================================================

const ITEMS = {

  // ==================================================
  // WEAPONS
  // ==================================================

  "00001": {
    id: "00001",
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

  "00002": {
    id: "00002",
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
  // ==================================================

  "00003": {
    id: "00003",
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
  // ==================================================

  "00004": {
    id: "00004",
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
  // ==================================================

  "00005": {
    id: "00005",
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
  // ==================================================

  "00006": {
    id: "00006",
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
  // ==================================================

  "00007": {
    id: "00007",
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