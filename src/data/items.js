

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
    rarity: "common",
    itemLevel: 1,
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

  "01000": {
    id: "01000",
    rarity: "common",
    itemLevel: 1,
    buyPrice: 25,
    name: "Short Bow",
    type: "weapon",
    weaponType: "Ranged",
    weaponClass: "Bow",
    range: 280,
    description: "A simple bow for striking enemies from a distance. Uses Ranged Attack; no ammunition required.",
    icon: "\uD83C\uDFF9",
    stats: { damage: 6, dexterity: 2 }
  },

  "01001": {
    id: "01001",
    rarity: "common",
    itemLevel: 1,
    buyPrice: 18,
    name: "Throwing Dagger",
    type: "weapon",
    weaponType: "Ranged",
    weaponClass: "ThrowingDagger",
    range: 180,
    description: "A balanced dagger made for throwing. Uses Ranged Attack; throwing does not consume the equipped weapon.",
    icon: "\uD83D\uDDE1\uFE0F",
    stats: { damage: 4, dexterity: 1 }
  },


  // ==================================================
  // MELEE WEAPONS
  // IDS: 02000 - 02999
  // ==================================================

  "02000": {
    id: "02000",
    rarity: "common",
    itemLevel: 1,
    buyPrice: 30,
    name: "Iron Sword",
    type: "weapon",
    weaponType: "Melee",
    weaponClass: "Sword",

    description: "A dependable iron sword.",

    icon: "⚔️",

    stats: {
      damage: 8,
      strength: 3
    }
  },


  "02001": {
    id: "02001",
    rarity: "uncommon",
    itemLevel: 1,
    buyPrice: 60,
    name: "Guard's Iron Sword",
    type: "weapon",
    weaponType: "Melee",
    weaponClass: "Sword",
    description: "A well-balanced blade issued to village guards.",
    icon: "\u2694\ufe0f",
    stats: { damage: 9, strength: 4 }
  },

  "02002": {
    id: "02002",
    rarity: "rare",
    itemLevel: 1,
    buyPrice: 120,
    name: "Knight's Iron Sword",
    type: "weapon",
    weaponType: "Melee",
    weaponClass: "Sword",
    description: "A finely forged sword made for a seasoned defender.",
    icon: "\u2694\ufe0f",
    stats: { damage: 10, strength: 5, vitality: 1 }
  },

  "02003": {
    id: "02003",
    rarity: "epic",
    itemLevel: 1,
    buyPrice: 240,
    name: "Oathkeeper",
    type: "weapon",
    weaponType: "Melee",
    weaponClass: "Sword",
    description: "An exceptional blade carried by a sworn protector.",
    icon: "\u2694\ufe0f",
    stats: { damage: 12, strength: 6, vitality: 2 }
  },

  "02004": {
    id: "02004",
    rarity: "legendary",
    itemLevel: 1,
    buyPrice: 480,
    name: "Dawnbreaker",
    type: "weapon",
    weaponType: "Melee",
    weaponClass: "Sword",
    description: "A legendary sword whose edge gleams with the first light of dawn.",
    icon: "\u2694\ufe0f",
    stats: { damage: 14, strength: 7, vitality: 3 }
  },

  // ==================================================
  // HEAD
  // IDS: 03000 - 03999
  // ==================================================

  "03000": {
    id: "03000",
    rarity: "common",
    itemLevel: 1,
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
    rarity: "common",
    itemLevel: 1,
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
    rarity: "common",
    itemLevel: 1,
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
    rarity: "common",
    itemLevel: 1,
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
    rarity: "common",
    itemLevel: 1,
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

function getAllItems() {
  return Object.values(ITEMS);
}

export { getItem, getAllItems };
