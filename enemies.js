// ==========================================
// ENEMY SYSTEM
// ==========================================

let nextEnemyInstanceId = 1;

// ==========================================
// ENEMY DATABASE
// ==========================================

// Every enemy type has a unique ID.
const ENEMY_TYPES = [
  {
    id: "00001",
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

function drawEnemy(enemy) {
  if (!enemy.alive) return;

  switch (enemy.sprite) {
    case "slime":
      drawSlime(enemy);
      break;

    case "redSlime":
      if (drawSlimeSprite(enemy)) drawEnemyHealthBar(enemy);
      else drawColoredSlime(enemy, "#d84b4b", "#ff8585");
      break;

    case "wolf":
      drawWolf(enemy);
      break;

    default:
      drawSlime(enemy);
  }
  if (enemy.stunRemaining > 0) {
    ctx.save();
    ctx.fillStyle = "#ffe6a3";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`STUN ${enemy.stunRemaining.toFixed(1)}s`, enemy.x + enemy.w / 2, enemy.y - 18);
    ctx.restore();
  }
}

function drawColoredSlime(enemy, bodyColor, highlightColor) {
  const { x, y, w, h } = enemy;

  ctx.fillStyle = bodyColor;
  ctx.fillRect(x + 2, y + 8, w - 4, h - 10);

  ctx.fillStyle = highlightColor;
  ctx.fillRect(x + 5, y + 4, w - 10, h - 8);

  ctx.fillStyle = "#222";
  ctx.fillRect(x + 7, y + 11, 3, 4);
  ctx.fillRect(x + w - 10, y + 11, 3, 4);

  drawEnemyHealthBar(enemy);
}

function drawWolf(enemy) {
  const { x, y, w, h } = enemy;

  // Temporary wolf appearance.
  ctx.fillStyle = "#65594d";
  ctx.fillRect(x + 3, y + 7, w - 6, h - 11);

  ctx.fillStyle = "#a59a87";
  ctx.fillRect(x + 7, y + 4, w - 14, h - 8);

  // Ears.
  ctx.fillStyle = "#65594d";
  ctx.fillRect(x + 5, y + 1, 5, 7);
  ctx.fillRect(x + w - 10, y + 1, 5, 7);

  // Eyes.
  ctx.fillStyle = "#f2d36d";
  ctx.fillRect(x + 8, y + 10, 3, 3);
  ctx.fillRect(x + w - 11, y + 10, 3, 3);

  drawEnemyHealthBar(enemy);
}

function drawEnemyHealthBar(enemy) {
  const barWidth = 36;
  const barHeight = 5;

  const x = enemy.x + enemy.w / 2 - barWidth / 2;
  const y = enemy.y - 10;

  const percentage = Math.max(0, enemy.hp / enemy.maxHp);

  ctx.fillStyle = "#251d20";
  ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

  ctx.fillStyle = "#55df68";
  ctx.fillRect(x, y, barWidth * percentage, barHeight);

  // Target outline.
  if (selectedEnemy === enemy) {
    ctx.strokeStyle = "#ffe36e";
    ctx.lineWidth = 2;

    ctx.strokeRect(enemy.x - 3, enemy.y - 3, enemy.w + 6, enemy.h + 6);
  }
}

// ==========================================
// ACTIVE ENEMIES
// ==========================================

// These are the actual enemies in the world.
const enemies = [];

let selectedEnemy = null;

// All attacks use this path so a death awards XP and quest credit exactly once.
function damageEnemy(enemy, damage, cause) {
  if (!isPlaying() || !enemy || !enemy.alive ||
      !Number.isFinite(damage) || damage <= 0) return 0;
  const dealt = Math.min(enemy.hp, damage);
  enemy.hp = Math.max(0, enemy.hp - damage);
  enemy.hurtTime = 0.25;
  if (enemy.hp <= 0) defeatEnemy(enemy, cause);
  return dealt;
}

function defeatEnemy(enemy, cause) {
  if (!isPlaying() || !enemy || !enemy.alive || enemy.hp > 0) return false;
  enemy.hp = 0;
  enemy.alive = false;
  enemy.respawnTimer = enemy.respawnTime;
  enemy.stunRemaining = 0;
  spellCooldowns["00004"] = 0;
  if (selectedEnemy === enemy) selectedEnemy = null;
  if (player.castTarget === enemy) player.castTarget = null;
  showMessage(cause === "00002"
    ? `${enemy.name} burned to death!` : `${enemy.name} was defeated!`);
  gainXP(enemy.xpReward ?? 0);
  recordQuestEvent({ type: "enemyDefeated", enemyTypeId: enemy.id });
  return true;
}

// ==========================================
// ENEMY DATABASE LOOKUP
// ==========================================

function getEnemyType(enemyId) {
  return ENEMY_TYPES.find((type) => type.id === enemyId) ?? null;
}

// ==========================================
// SPAWN ENEMY
// ==========================================

function spawnEnemy(enemyId, tileX, tileY) {
  const type = getEnemyType(enemyId);

  if (!type) {
    console.error(`Unknown enemy ID: ${enemyId}`);
    return null;
  }

  // Create a new enemy instance from its type.
  const enemy = {
    instanceId: nextEnemyInstanceId++,
    id: type.id,
    name: type.name,

    x: tileX * TILE + (TILE - type.width) / 2,
    y: tileY * TILE + (TILE - type.height) / 2,

    spawnX: tileX * TILE + (TILE - type.width) / 2,
    spawnY: tileY * TILE + (TILE - type.height) / 2,

    respawnTime: type.respawnTime ?? 10,
    respawnTimer: 0,

    w: type.width,
    h: type.height,

    hp: type.maxHp,
    maxHp: type.maxHp,

    speed: type.speed,
    detectionRange: type.detectionRange,

    damage: type.damage,
    attackRange: type.attackRange,
    attackCooldown: type.attackCooldown,
    attackTimer: 0,

    xpReward: type.xpReward,

    sprite: type.sprite,
    spriteTime: 0,
    spriteMoving: false,
    spriteLastX: tileX * TILE + (TILE - type.width) / 2,
    spriteLastY: tileY * TILE + (TILE - type.height) / 2,
    hurtTime: 0,

    alive: true,
    stunRemaining: 0,

    // Wandering configuration.
    wanderRadius: type.wanderRadius ?? 90,
    wanderSpeed: type.wanderSpeed ?? 25,
    wanderPauseMin: type.wanderPauseMin ?? 1,
    wanderPauseMax: type.wanderPauseMax ?? 3,

    // Current AI state.
    aiState: "wander",

    // Current destination.
    wanderTargetX: null,
    wanderTargetY: null,

    // Time until the next wandering movement.
    wanderTimer: Math.random() * 2,
  };

  enemies.push(enemy);

  return enemy;
}

// ==========================================
// STARTING ENEMIES
// ==========================================

function spawnStartingEnemies() {
  for (const spawn of WORLD_DATA.enemySpawns) {
    spawnEnemy(spawn.id, spawn.tileX, spawn.tileY);
  }
}

// ==========================================
// DRAW SLIME
// ==========================================

function drawSlime(enemy) {
  if (!enemy.alive) return;
  if (drawSlimeSprite(enemy)) {
    drawEnemyHealthBar(enemy);
    return;
  }

  const { x, y, w, h } = enemy;

  // Shadow
  ctx.fillStyle = "rgba(25, 35, 20, 0.3)";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h - 1, w / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = "#267541";
  ctx.fillRect(x + 2, y + 9, w - 4, h - 11);

  ctx.fillStyle = "#43b85e";
  ctx.fillRect(x + 4, y + 5, w - 8, h - 9);
  ctx.fillRect(x + 7, y + 2, w - 14, 5);

  // Highlights
  ctx.fillStyle = "#80e58a";
  ctx.fillRect(x + 7, y + 5, 5, 3);
  ctx.fillRect(x + 5, y + 9, 3, 4);

  // Eyes
  ctx.fillStyle = "#173b25";
  ctx.fillRect(x + 7, y + 11, 3, 4);
  ctx.fillRect(x + w - 10, y + 11, 3, 4);

  // Mouth
  ctx.fillRect(x + 11, y + 17, 3, 2);

  // Target outline
  if (selectedEnemy === enemy) {
    ctx.strokeStyle = "#ffe36e";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
  }

  // Health bar
  const barWidth = 36;
  const barHeight = 5;
  const barX = x + w / 2 - barWidth / 2;
  const barY = y - 10;

  ctx.fillStyle = "#251d20";
  ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

  const healthPercent = Math.max(0, enemy.hp / enemy.maxHp);

  ctx.fillStyle =
    healthPercent > 0.5
      ? "#55df68"
      : healthPercent > 0.25
        ? "#e9d64c"
        : "#ed4b4b";

  ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
}

// ==========================================
// ENEMY TARGETING
// ==========================================

function targetEnemyAtScreenPosition(screenX, screenY) {
  if (!isPlaying()) return;
  const bounds = canvas.getBoundingClientRect();
  const worldX = (screenX - bounds.left) * viewWidth / bounds.width + Math.floor(cameraX);
  const worldY = (screenY - bounds.top) * viewHeight / bounds.height + Math.floor(cameraY);

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    if (!enemy.alive) continue;

    if (
      worldX >= enemy.x - 5 &&
      worldX <= enemy.x + enemy.w + 5 &&
      worldY >= enemy.y - 5 &&
      worldY <= enemy.y + enemy.h + 5
    ) {
      selectedEnemy = enemy;

      showMessage(
        `${enemy.name} targeted (${enemy.hp}/${enemy.maxHp} HP).`);

      return;
    }
  }

  selectedEnemy = null;
}

// ==========================================
// ENEMY AI
// ==========================================

function updateEnemies(dt) {
  const playerCenterX = player.x + player.w / 2;
  const playerCenterY = player.y + player.h / 2;

  for (const enemy of enemies) {
    if (!enemy.alive) continue;

    if (enemy.stunRemaining > 0) {
      enemy.stunRemaining = Math.max(0, enemy.stunRemaining - dt);
      continue;
    }

    // Update attack cooldown.
    if (enemy.attackTimer > 0) {
      enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
    }

    const enemyCenterX = enemy.x + enemy.w / 2;
    const enemyCenterY = enemy.y + enemy.h / 2;

    const dx = playerCenterX - enemyCenterX;
    const dy = playerCenterY - enemyCenterY;

    const distanceToPlayer = Math.hypot(dx, dy);

    // Distance from enemy to its original spawn point.
    const distanceFromSpawn = Math.hypot(
      enemy.x - enemy.spawnX,
      enemy.y - enemy.spawnY,
    );

    // Don't allow enemies to chase forever.
    const maxChaseDistance = enemy.wanderRadius + enemy.detectionRange;

    // ======================================
    // STATE: WANDER
    // ======================================

    if (enemy.aiState === "wander") {
      // Player detected.
      if (
        distanceToPlayer <= enemy.detectionRange &&
        distanceFromSpawn <= maxChaseDistance
      ) {
        enemy.aiState = "chase";
        enemy.wanderTargetX = null;
        enemy.wanderTargetY = null;
      } else {
        updateEnemyWander(enemy, dt);
      }
    }

    // ======================================
    // STATE: CHASE
    // ======================================

    if (enemy.aiState === "chase") {
      // Stop chasing if player escapes.
      if (
        distanceToPlayer > enemy.detectionRange * 1.5 ||
        distanceFromSpawn > maxChaseDistance
      ) {
        enemy.aiState = "return";
        continue;
      }

      // Move toward player.
      if (distanceToPlayer > enemy.attackRange && distanceToPlayer > 0) {
        const moveDistance = Math.min(
          enemy.speed * dt,
          distanceToPlayer - enemy.attackRange,
        );

        moveEntity(enemy, (dx / distanceToPlayer) * moveDistance,
          (dy / distanceToPlayer) * moveDistance);
      }

      // Attack player when close enough.
      if (
        distanceToPlayer <= enemy.attackRange &&
        enemy.attackTimer <= 0 &&
        player.hp > 0
      ) {
        damagePlayer(enemy.damage);

        enemy.attackTimer = enemy.attackCooldown;

        if (player.hp <= 0) {
          showMessage("You have been defeated!");
          return;
        }
      }
    }

    // ======================================
    // STATE: RETURN
    // ======================================

    if (enemy.aiState === "return") {
      updateEnemyReturn(enemy, dt);
    }
  }
}

// ==========================================
// ENEMY RESPAWN SYSTEM
// ==========================================

function respawnEnemy(enemy) {
  // Reset enemy AI.
  enemy.aiState = "wander";

  enemy.wanderTargetX = null;
  enemy.wanderTargetY = null;

  enemy.wanderTimer = randomRange(enemy.wanderPauseMin, enemy.wanderPauseMax);
  // Restore the original spawn position.
  enemy.x = enemy.spawnX;
  enemy.y = enemy.spawnY;

  // Restore health.
  enemy.hp = enemy.maxHp;

  // Reset combat state.
  enemy.attackTimer = 0;
  enemy.spriteTime = 0;
  enemy.spriteMoving = false;
  enemy.spriteLastX = enemy.x;
  enemy.spriteLastY = enemy.y;
  enemy.hurtTime = 0;
  enemy.stunRemaining = 0;

  // Mark enemy as alive again.
  enemy.alive = true;

  // Reset respawn timer.
  enemy.respawnTimer = 0;

  console.log(`${enemy.name} (${enemy.instanceId}) respawned!`);
}

function updateEnemyRespawns(dt) {
  for (const enemy of enemies) {
    // Only update dead enemies.
    if (enemy.alive) continue;

    // Count down the respawn timer.
    enemy.respawnTimer -= dt;

    // Respawn when timer reaches zero.
    if (enemy.respawnTimer <= 0) {
      respawnEnemy(enemy);
    }
  }
}

// ==========================================
// ENEMY WANDERING AI
// ==========================================

// Generate a random number between min and max.
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

// Pick a random position around the spawn point.
function chooseWanderTarget(enemy) {
  const angle = Math.random() * Math.PI * 2;

  // sqrt gives a more even distribution across the area.
  const distance = Math.sqrt(Math.random()) * enemy.wanderRadius;

  enemy.wanderTargetX = enemy.spawnX + Math.cos(angle) * distance;

  enemy.wanderTargetY = enemy.spawnY + Math.sin(angle) * distance;
}

// Make an enemy wander near its spawn point.
function updateEnemyWander(enemy, dt) {
  // Enemy is resting.
  if (enemy.wanderTimer > 0) {
    enemy.wanderTimer -= dt;
    return;
  }

  // Choose a new destination if needed.
  if (enemy.wanderTargetX === null || enemy.wanderTargetY === null) {
    chooseWanderTarget(enemy);
  }

  const dx = enemy.wanderTargetX - enemy.x;
  const dy = enemy.wanderTargetY - enemy.y;

  const distance = Math.hypot(dx, dy);

  // Reached the destination.
  if (distance < 3) {
    enemy.wanderTargetX = null;
    enemy.wanderTargetY = null;

    enemy.wanderTimer = randomRange(enemy.wanderPauseMin, enemy.wanderPauseMax);

    return;
  }

  // Move toward the destination.
  const moveDistance = Math.min(enemy.wanderSpeed * dt, distance);

  moveEntity(enemy, (dx / distance) * moveDistance,
    (dy / distance) * moveDistance);
}

// Return to the spawn area after chasing.
function updateEnemyReturn(enemy, dt) {
  const dx = enemy.spawnX - enemy.x;
  const dy = enemy.spawnY - enemy.y;

  const distance = Math.hypot(dx, dy);

  // Reached the spawn location.
  if (distance < 5) {
    enemy.x = enemy.spawnX;
    enemy.y = enemy.spawnY;

    enemy.aiState = "wander";
    enemy.wanderTargetX = null;
    enemy.wanderTargetY = null;

    enemy.wanderTimer = randomRange(enemy.wanderPauseMin, enemy.wanderPauseMax);

    return;
  }

  // Move back toward spawn.
  const moveDistance = Math.min(enemy.speed * dt, distance);

  moveEntity(enemy, (dx / distance) * moveDistance,
    (dy / distance) * moveDistance);
}
