

const ENEMY_TYPES = [
  {
    id: "00001",
    level: 1,
    name: "Green Slime",

    // Health
    maxHp: 60,

    // Movement
    speed: 55,
    detectionRange: 180,
    respawnTime: 20,
    wanderRadius: 90,
    wanderSpeed: 25,
    wanderPauseMin: 1,
    wanderPauseMax: 3,

    // Combat
    damage: 10,
    attackRange: 30,
    attackCooldown: 1.2,

    // Rewards
    xpReward: 25,

    // Appearance
    sprite: "slime",
    width: 24,
    height: 24,
  },

  {
    id: "00002",
    level: 1,
    name: "Red Slime",

    maxHp: 100,

    speed: 70,
    detectionRange: 200,
    respawnTime: 30,
    wanderRadius: 90,
    wanderSpeed: 25,
    wanderPauseMin: 1,
    wanderPauseMax: 3,

    damage: 15,
    attackRange: 30,
    attackCooldown: 1,

    xpReward: 40,

    sprite: "redSlime",
    width: 24,
    height: 24,
  },

  {
    id: "00003",
    level: 1,
    name: "Wolf",

    maxHp: 120,

    speed: 110,
    detectionRange: 250,
    respawnTime: 40,
    wanderRadius: 90,
    wanderSpeed: 25,
    wanderPauseMin: 1,
    wanderPauseMax: 3,

    damage: 20,
    attackRange: 35,
    attackCooldown: 0.9,

    xpReward: 60,

    sprite: "wolf",
    width: 28,
    height: 24,
  },
];

export { ENEMY_TYPES };
