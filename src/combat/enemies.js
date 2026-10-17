import { ENEMY_TYPES } from "../data/enemy-types.js";
import { showMessage } from "../ui/messages.js";
import { moveEntity } from "../world/movement.js";
import { damagePlayer, gainXP } from "../player/player.js";
import { recordQuestEvent } from "../quests/quest-system.js";
import { enemies, isPlaying, player, runtime, spellCooldowns } from "../core/state.js";
import { TILE } from "../world/world-state.js";
import { WORLD_DATA } from "../world/world.js";

// Enemy AI, spawning, damage and death handling.

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
  if (runtime.selectedEnemy === enemy) runtime.selectedEnemy = null;
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
    instanceId: runtime.nextEnemyInstanceId++,
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

export { damageEnemy, spawnStartingEnemies, updateEnemies, respawnEnemy, updateEnemyRespawns };
