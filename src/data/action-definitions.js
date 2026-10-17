

const SPELLS = {
  "00001": {
    id: "00001",
    name: "Fireball",
    icon: "🔥",
    description: "Launches a fiery projectile at the selected enemy.",

    damage: 35,
    manaCost: 10,
    range: 320,
    cooldown: 0.5,
    rules: "Movement, damage, Escape, weapon changes, or losing the target interrupt casting before release at no mana cost. Mana and cooldown begin on release. Released projectiles continue independently, stop at solid scenery, and expire after traveling their range.",
    projectileSpeed: 300,
    radius: 7,
    castFrameDuration: 0.12,
    castFrameCount: 4,

    requiredWeaponCategory: "Casting",
  },
  "00002": {
    id: "00002",
    name: "Ignite",
    icon: "♨️",
    description: "Burns the target for 2 damage every second for 10 seconds.",

    damagePerTick: 2,
    manaCost: 15,
    range: 240,
    cooldown: 2,
    rules: "Recasting refreshes the burn to 10 seconds without stacking or delaying the next tick. The burn continues if the target leaves range or line of sight. Mana and cooldown begin immediately.",
    tickInterval: 1,
    duration: 10,

    requiredWeaponCategory: "Casting",
  },
  "00003": {
    id: "00003",
    name: "Sword Strike",
    icon: "⚔️",
    description: "Strike the selected enemy with your equipped Iron Sword.",
    damage: 12,
    manaCost: 0,
    range: 48,
    cooldown: 0.6,
    requiredWeaponCategory: "Melee",
    requiredWeaponId: "00002",
    rules: "Instant melee hit. Damage includes the sword's damage bonus. Requires the Iron Sword, a target in melee range and a clear path. Uses no mana.",
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
    requiredWeaponId: "00002",
    rules: "Requires at least 150 pixels of separation and the Iron Sword. Deals no damage. Terrain stops the charge; other attacks are unavailable while charging. Any enemy death resets its cooldown. Changing weapons or losing the target ends the charge without a cooldown refund.",
  },
};

export { SPELLS };
