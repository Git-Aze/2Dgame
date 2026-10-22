

const BASE_CAST_TIME = 1.5;

const SPELLS = {
  "00001": {
    id: "00001",
    name: "Fireball",
    icon: "🔥",
    description: "Launches a fiery projectile. Casting on a burning target guarantees a critical hit for double damage, even if the burn expires before impact.",

    damage: 35,
    manaCost: 10,
    range: 320,
    cooldown: 0.5,
    rules: "Taking damage pushes casting progress back by one sixth of its total duration per hit, down to zero. Movement, weapon changes, or losing the target interrupt casting before release at no mana cost. Mana and cooldown begin on release. Released projectiles continue independently, stop at solid scenery, and expire after traveling their range.",
    projectileSpeed: 300,
    radius: 7,

    requiredWeaponCategory: "Casting",
  },
  "00002": {
    id: "00002",
    name: "Ignite",
    icon: "♨️",
    description: "Burns the target every second for 10 seconds. Tick damage scales with Intelligence.",

    damagePerTick: 2,
    manaCost: 15,
    range: 240,
    cooldown: 2,
    rules: "Recasting refreshes the burn to 10 seconds without stacking or delaying the next tick. The burn continues if the target leaves range or line of sight. Taking damage pushes casting progress back by one sixth of its total duration per hit, down to zero. Movement, weapon changes, or losing the target interrupt casting at no mana cost. Mana and cooldown begin on cast completion.",
    tickInterval: 1,
    duration: 10,

    requiredWeaponCategory: "Casting",
  },
  "00003": {
    id: "00003",
    name: "Sword Strike",
    icon: "⚔️",
    description: "Strike the selected enemy with your equipped sword.",
    damage: 12,
    manaCost: 0,
    range: 48,
    cooldown: 0.6,
    requiredWeaponCategory: "Melee",
    requiredWeaponClass: "Sword",
    rules: "Instant melee hit. Damage includes the sword's damage bonus and Strength scaling. Requires a sword of any rarity, a target in melee range and a clear path. Uses no mana.",
  },
  "00004": {
    id: "00004",
    name: "Charge",
    icon: "💨",
    description: "Rush toward the selected enemy and stun it for 2 seconds on contact.",
    manaCost: 0,
    minRange: 150,
    range: Infinity,
    cooldown: 20,
    chargeSpeed: 650,
    stunDuration: 2,
    requiredWeaponCategory: "Melee",
    requiredWeaponClass: "Sword",
    rules: "Requires at least 150 pixels of separation and a sword of any rarity. Deals no damage. Terrain stops the charge; other attacks are unavailable while charging. Any enemy death resets its cooldown. Losing a sword or the target ends the charge without a cooldown refund.",
  },
  "00005": {
    id: "00005",
    name: "Ranged Attack",
    icon: "\uD83C\uDFF9",
    description: "Shoot an arrow or throw your equipped dagger at the selected enemy.",
    damage: 8,
    manaCost: 0,
    range: 280,
    useWeaponRange: true,
    cooldown: 0.8,
    projectileSpeed: 500,
    requiredWeaponCategory: "Ranged",
    rules: "Damage includes ranged weapon damage and Dexterity scaling. Bow range: 280 pixels; throwing dagger range: 180 pixels. Solid scenery blocks the projectile. Uses no mana or ammunition and does not consume the weapon.",
  },
  "00006": {
    id: "00006", name: "Cleave", icon: "\u2694\ufe0f",
    description: "Sweep a 120-degree cone toward your target, hitting nearby enemies in front of you.",
    damage: 16, manaCost: 0, range: 70, cooldown: 5,
    requiredWeaponCategory: "Melee", requiredWeaponClass: "Sword",
    rules: "Instant attack. Each enemy needs a clear path and rolls its own critical hit. Scales with Strength and sword damage.",
  },
  "00007": {
    id: "00007", name: "Rend", icon: "\ud83e\ude78",
    description: "Wound your target, causing physical bleed damage each second for 6 seconds.",
    damagePerTick: 4, tickInterval: 1, duration: 6, manaCost: 0, range: 48, cooldown: 4,
    requiredWeaponCategory: "Melee", requiredWeaponClass: "Sword",
    rules: "Instant application. Bleed scales with Strength, does not crit, and continues outside melee range. Reapplying refreshes duration without stacking or delaying the next tick.",
  },
  "00008": {
    id: "00008", name: "Shield Wall", icon: "\ud83d\udee1\ufe0f",
    description: "Reduce incoming damage by 40% for 5 seconds.",
    manaCost: 0, range: 0, cooldown: 30, duration: 5, target: "self",
    requiredWeaponCategory: "Melee", requiredWeaponClass: "Sword", requiredOffhandClass: "Shield",
    rules: "Instant defensive skill. Requires a sword and shield, but no enemy target. Reduction applies after armor, with at least 1 damage per hit. Removing your shield ends the effect. Pauses with gameplay.",
  },
};

export { BASE_CAST_TIME, SPELLS };
