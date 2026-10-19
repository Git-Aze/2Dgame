

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

  "00008": {
    id: "00008",
    rarity: "uncommon",
    itemLevel: 1,
    buyPrice: 40,
    name: "Adept's Staff",
    type: "weapon",
    weaponType: "Casting",

    description: "Uncommon equipment with improved fixed stats.",

    icon: "🪄",

    stats: { damage: 4, intelligence: 3 }
  },

  "00009": {
    id: "00009",
    rarity: "rare",
    itemLevel: 1,
    buyPrice: 80,
    name: "Magister's Staff",
    type: "weapon",
    weaponType: "Casting",

    description: "Rare equipment with improved fixed stats.",

    icon: "🪄",

    stats: { damage: 5, intelligence: 4, vitality: 1 }
  },

  "00010": {
    id: "00010",
    rarity: "epic",
    itemLevel: 1,
    buyPrice: 160,
    name: "Emberweave",
    type: "weapon",
    weaponType: "Casting",

    description: "Epic equipment with improved fixed stats.",

    icon: "🪄",

    stats: { damage: 7, intelligence: 5, vitality: 2 }
  },

  "00011": {
    id: "00011",
    rarity: "legendary",
    itemLevel: 1,
    buyPrice: 320,
    name: "Starcaller",
    type: "weapon",
    weaponType: "Casting",

    description: "Legendary equipment with improved fixed stats.",

    icon: "🪄",

    stats: { damage: 9, intelligence: 6, vitality: 3 }
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

  "01002": {
    id: "01002",
    rarity: "uncommon",
    itemLevel: 1,
    buyPrice: 50,
    name: "Hunter's Bow",
    type: "weapon",
    weaponType: "Ranged",
    weaponClass: "Bow",
    range: 280,
    description: "Uncommon equipment with improved fixed stats.",
    icon: "\uD83C\uDFF9",
    stats: { damage: 7, dexterity: 3 }
  },

  "01003": {
    id: "01003",
    rarity: "rare",
    itemLevel: 1,
    buyPrice: 100,
    name: "Ranger's Bow",
    type: "weapon",
    weaponType: "Ranged",
    weaponClass: "Bow",
    range: 280,
    description: "Rare equipment with improved fixed stats.",
    icon: "\uD83C\uDFF9",
    stats: { damage: 8, dexterity: 4, vitality: 1 }
  },

  "01004": {
    id: "01004",
    rarity: "epic",
    itemLevel: 1,
    buyPrice: 200,
    name: "Windpiercer",
    type: "weapon",
    weaponType: "Ranged",
    weaponClass: "Bow",
    range: 280,
    description: "Epic equipment with improved fixed stats.",
    icon: "\uD83C\uDFF9",
    stats: { damage: 10, dexterity: 5, vitality: 2 }
  },

  "01005": {
    id: "01005",
    rarity: "legendary",
    itemLevel: 1,
    buyPrice: 400,
    name: "Skywarden",
    type: "weapon",
    weaponType: "Ranged",
    weaponClass: "Bow",
    range: 280,
    description: "Legendary equipment with improved fixed stats.",
    icon: "\uD83C\uDFF9",
    stats: { damage: 12, dexterity: 6, vitality: 3 }
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

  "01006": {
    id: "01006",
    rarity: "uncommon",
    itemLevel: 1,
    buyPrice: 36,
    name: "Balanced Throwing Dagger",
    type: "weapon",
    weaponType: "Ranged",
    weaponClass: "ThrowingDagger",
    range: 180,
    description: "Uncommon equipment with improved fixed stats.",
    icon: "\uD83D\uDDE1\uFE0F",
    stats: { damage: 5, dexterity: 2 }
  },

  "01007": {
    id: "01007",
    rarity: "rare",
    itemLevel: 1,
    buyPrice: 72,
    name: "Scout's Throwing Dagger",
    type: "weapon",
    weaponType: "Ranged",
    weaponClass: "ThrowingDagger",
    range: 180,
    description: "Rare equipment with improved fixed stats.",
    icon: "\uD83D\uDDE1\uFE0F",
    stats: { damage: 6, dexterity: 3, vitality: 1 }
  },

  "01008": {
    id: "01008",
    rarity: "epic",
    itemLevel: 1,
    buyPrice: 144,
    name: "Shadowflight",
    type: "weapon",
    weaponType: "Ranged",
    weaponClass: "ThrowingDagger",
    range: 180,
    description: "Epic equipment with improved fixed stats.",
    icon: "\uD83D\uDDE1\uFE0F",
    stats: { damage: 8, dexterity: 4, vitality: 2 }
  },

  "01009": {
    id: "01009",
    rarity: "legendary",
    itemLevel: 1,
    buyPrice: 288,
    name: "Nightfall",
    type: "weapon",
    weaponType: "Ranged",
    weaponClass: "ThrowingDagger",
    range: 180,
    description: "Legendary equipment with improved fixed stats.",
    icon: "\uD83D\uDDE1\uFE0F",
    stats: { damage: 10, dexterity: 5, vitality: 3 }
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

  "03001": {
    id: "03001",
    rarity: "uncommon",
    itemLevel: 1,
    buyPrice: 24,
    name: "Reinforced Leather Cap",
    type: "head",

    description: "Uncommon equipment with improved fixed stats.",

    icon: "🪖",

    stats: { armor: 3, vitality: 2 }
  },

  "03002": {
    id: "03002",
    rarity: "rare",
    itemLevel: 1,
    buyPrice: 48,
    name: "Warden's Helm",
    type: "head",

    description: "Rare equipment with improved fixed stats.",

    icon: "🪖",

    stats: { armor: 4, strength: 1, vitality: 3 }
  },

  "03003": {
    id: "03003",
    rarity: "epic",
    itemLevel: 1,
    buyPrice: 96,
    name: "Ironbark Crown",
    type: "head",

    description: "Epic equipment with improved fixed stats.",

    icon: "🪖",

    stats: { armor: 6, strength: 2, vitality: 4 }
  },

  "03004": {
    id: "03004",
    rarity: "legendary",
    itemLevel: 1,
    buyPrice: 192,
    name: "Crown of the Guardian",
    type: "head",

    description: "Legendary equipment with improved fixed stats.",

    icon: "🪖",

    stats: { armor: 8, strength: 3, vitality: 5 }
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

  "04001": {
    id: "04001",
    rarity: "uncommon",
    itemLevel: 1,
    buyPrice: 50,
    name: "Reinforced Leather Armor",
    type: "chest",

    description: "Uncommon equipment with improved fixed stats.",

    icon: "🥋",

    stats: { armor: 6, vitality: 3 }
  },

  "04002": {
    id: "04002",
    rarity: "rare",
    itemLevel: 1,
    buyPrice: 100,
    name: "Warden's Armor",
    type: "chest",

    description: "Rare equipment with improved fixed stats.",

    icon: "🥋",

    stats: { armor: 7, strength: 1, vitality: 4 }
  },

  "04003": {
    id: "04003",
    rarity: "epic",
    itemLevel: 1,
    buyPrice: 200,
    name: "Ironbark Vest",
    type: "chest",

    description: "Epic equipment with improved fixed stats.",

    icon: "🥋",

    stats: { armor: 9, strength: 2, vitality: 5 }
  },

  "04004": {
    id: "04004",
    rarity: "legendary",
    itemLevel: 1,
    buyPrice: 400,
    name: "Vest of the Guardian",
    type: "chest",

    description: "Legendary equipment with improved fixed stats.",

    icon: "🥋",

    stats: { armor: 11, strength: 3, vitality: 6 }
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

  "05001": {
    id: "05001",
    rarity: "uncommon",
    itemLevel: 1,
    buyPrice: 40,
    name: "Reinforced Wooden Shield",
    type: "offhand",

    description: "Uncommon equipment with improved fixed stats.",

    icon: "🛡️",

    stats: { armor: 5, vitality: 1 }
  },

  "05002": {
    id: "05002",
    rarity: "rare",
    itemLevel: 1,
    buyPrice: 80,
    name: "Warden's Shield",
    type: "offhand",

    description: "Rare equipment with improved fixed stats.",

    icon: "🛡️",

    stats: { armor: 6, strength: 1, vitality: 2 }
  },

  "05003": {
    id: "05003",
    rarity: "epic",
    itemLevel: 1,
    buyPrice: 160,
    name: "Ironbark Bulwark",
    type: "offhand",

    description: "Epic equipment with improved fixed stats.",

    icon: "🛡️",

    stats: { armor: 8, strength: 2, vitality: 3 }
  },

  "05004": {
    id: "05004",
    rarity: "legendary",
    itemLevel: 1,
    buyPrice: 320,
    name: "Aegis of the Guardian",
    type: "offhand",

    description: "Legendary equipment with improved fixed stats.",

    icon: "🛡️",

    stats: { armor: 10, strength: 3, vitality: 4 }
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

  "06001": {
    id: "06001",
    rarity: "uncommon",
    itemLevel: 1,
    buyPrice: 30,
    name: "Reinforced Leather Pants",
    type: "legs",

    description: "Uncommon equipment with improved fixed stats.",

    icon: "👖",

    stats: { armor: 3, dexterity: 2 }
  },

  "06002": {
    id: "06002",
    rarity: "rare",
    itemLevel: 1,
    buyPrice: 60,
    name: "Ranger's Leggings",
    type: "legs",

    description: "Rare equipment with improved fixed stats.",

    icon: "👖",

    stats: { armor: 4, dexterity: 3, vitality: 1 }
  },

  "06003": {
    id: "06003",
    rarity: "epic",
    itemLevel: 1,
    buyPrice: 120,
    name: "Windstride Leggings",
    type: "legs",

    description: "Epic equipment with improved fixed stats.",

    icon: "👖",

    stats: { armor: 6, dexterity: 4, vitality: 2 }
  },

  "06004": {
    id: "06004",
    rarity: "legendary",
    itemLevel: 1,
    buyPrice: 240,
    name: "Leggings of the Pathfinder",
    type: "legs",

    description: "Legendary equipment with improved fixed stats.",

    icon: "👖",

    stats: { armor: 8, dexterity: 5, vitality: 3 }
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
  },

  "07001": {
    id: "07001",
    rarity: "uncommon",
    itemLevel: 1,
    buyPrice: 24,
    name: "Scout's Boots",
    type: "boots",

    description: "Uncommon equipment with improved fixed stats.",

    icon: "🥾",

    stats: { armor: 2, dexterity: 3 }
  },

  "07002": {
    id: "07002",
    rarity: "rare",
    itemLevel: 1,
    buyPrice: 48,
    name: "Ranger's Boots",
    type: "boots",

    description: "Rare equipment with improved fixed stats.",

    icon: "🥾",

    stats: { armor: 3, dexterity: 4, vitality: 1 }
  },

  "07003": {
    id: "07003",
    rarity: "epic",
    itemLevel: 1,
    buyPrice: 96,
    name: "Windstride Boots",
    type: "boots",

    description: "Epic equipment with improved fixed stats.",

    icon: "🥾",

    stats: { armor: 5, dexterity: 5, vitality: 2 }
  },

  "07004": {
    id: "07004",
    rarity: "legendary",
    itemLevel: 1,
    buyPrice: 192,
    name: "Boots of the Pathfinder",
    type: "boots",

    description: "Legendary equipment with improved fixed stats.",

    icon: "🥾",

    stats: { armor: 7, dexterity: 6, vitality: 3 }
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
