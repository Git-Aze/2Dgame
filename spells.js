// ==========================================
// SPELL SYSTEM
// ==========================================

const SPELLS = {
  fireball: {
    id: "fireball",
    name: "Fireball",
    icon: "🔥",
    description: "Launches a fiery projectile at the selected enemy.",

    damage: 35,
    manaCost: 10,
    projectileSpeed: 300,
    radius: 7,
    castFrameDuration: 0.12,
    castFrameCount: 4,

    requiredWeaponCategory: "Casting",
  },

  ignite: {
    id: "ignite",
    name: "Ignite",
    icon: "♨️",
    description: "Burns the target for 2 damage every second for 10 seconds.",

    damagePerTick: 2,
    manaCost: 15,
    tickInterval: 1,
    duration: 10,

    requiredWeaponCategory: "Casting",
  },
};

const fireballs = [];

function hasEnoughMana(spell) {
  if (player.mana < spell.manaCost) {
    showMessage(
      `Not enough mana to cast ${spell.name}! ` +
      `Requires ${spell.manaCost} mana.`
    );
    return false;
  }

  return true;
}

function spendMana(spell) {
  player.mana = Math.max(0, player.mana - spell.manaCost);

  // Immediately update the portrait bars.
  updateCharacterFrame();
}

// ==========================================
// DAMAGE OVER TIME EFFECTS
// ==========================================

const activeIgnites = [];

function castIgnite() {
  if (player.casting) return;

  const spell = SPELLS.ignite;

  // Check equipped weapon.
  const weapon = getEquippedItem("weapon");

  if (
    spell.requiredWeaponCategory !== null &&
    (!weapon || weapon.weaponType !== spell.requiredWeaponCategory)
  ) {
    showMessage(
      `${spell.name} requires a ${spell.requiredWeaponCategory} weapon.`
    );
    return;
  }

  // Check target.
  if (!selectedEnemy || !selectedEnemy.alive) {
    selectedEnemy = null;
    showMessage("Select an enemy before casting Ignite.");
    return;
  }

  // Check mana.
  if (!hasEnoughMana(spell)) return;

  // Spend mana.
  spendMana(spell);

  const target = selectedEnemy;

  // Refresh Ignite if the target is already burning.
  const existingEffect = activeIgnites.find(
    (effect) => effect.target === target
  );

  if (existingEffect) {
    existingEffect.elapsed = 0;
    existingEffect.ticksApplied = 0;
    existingEffect.damagePerTick = spell.damagePerTick;
    existingEffect.tickInterval = spell.tickInterval;
    existingEffect.duration = spell.duration;

    showMessage(`${target.name}'s Ignite was refreshed!`);
    return;
  }

  // Apply Ignite.
  activeIgnites.push({
    target,
    elapsed: 0,
    ticksApplied: 0,
    damagePerTick: spell.damagePerTick,
    tickInterval: spell.tickInterval,
    duration: spell.duration,
  });

  showMessage(`${target.name} is burning!`);
}

// ==========================================
// UPDATE IGNITE EFFECTS
// ==========================================

function updateIgnites(dt) {
  for (let i = activeIgnites.length - 1; i >= 0; i--) {
    const effect = activeIgnites[i];
    const target = effect.target;

    // Remove Ignite if the enemy is dead.
    if (!target || !target.alive) {
      activeIgnites.splice(i, 1);
      continue;
    }

    effect.elapsed += dt;

    const totalTicks = Math.floor(effect.duration / effect.tickInterval);

    // Apply each tick that is due.
    while (
      effect.ticksApplied < totalTicks &&
      effect.elapsed >= (effect.ticksApplied + 1) * effect.tickInterval
    ) {
      effect.ticksApplied++;

      target.hp = Math.max(0, target.hp - effect.damagePerTick);
      console.log("IGNITE TICK:", target.name, "HP:", target.hp);

      showMessage(
        `${target.name} takes ${effect.damagePerTick} Ignite damage!`);

      // Check if Ignite killed the enemy.
      if (target.hp <= 0) {
        target.hp = 0;
        target.alive = false;
        target.respawnTimer = target.respawnTime;

        gainXP(target.xpReward ?? 0);

        if (selectedEnemy === target) {
          selectedEnemy = null;
        }

        showMessage(`${target.name} burned to death!`);

        break;
      }
    }

    // Remove expired Ignite effects.
    if (!target.alive || effect.ticksApplied >= totalTicks) {
      activeIgnites.splice(i, 1);
    }
  }
}

// ==========================================
// IGNITE VISUAL EFFECT
// ==========================================

function drawIgniteEffects() {
  const time = performance.now() / 1000;

  for (const effect of activeIgnites) {
    const target = effect.target;

    if (!target || !target.alive) continue;

    const centerX = target.x + target.w / 2;
    const bottomY = target.y + target.h;

    ctx.save();

    for (let i = 0; i < 5; i++) {
      const offsetX = Math.sin(time * 6 + i * 2) * 5;
      const flameHeight = 12 + Math.sin(time * 9 + i * 3) * 5;

      const x = centerX + (i - 2) * 5 + offsetX;
      const y = bottomY - 5;

      ctx.fillStyle =
        i % 2 === 0 ? "#ff6600" : "#ffcc00";

      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x, y - flameHeight);
      ctx.lineTo(x + 4, y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

const CAST_FRAME_DURATION = SPELLS.fireball.castFrameDuration;
const CAST_FRAME_COUNT = SPELLS.fireball.castFrameCount;

// ==========================================
// FIREBALL PROJECTILE
// ==========================================

function drawFireball(fireball) {
  const x = fireball.x;
  const y = fireball.y;

  // Orange glow.
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#ff4b16";
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Flame trail.
  ctx.fillStyle = "#e74716";
  ctx.beginPath();
  ctx.moveTo(x - 3, y + 3);
  ctx.lineTo(x - 15, y + 7);
  ctx.lineTo(x - 10, y);
  ctx.lineTo(x - 16, y - 5);
  ctx.lineTo(x - 3, y - 3);
  ctx.closePath();
  ctx.fill();

  // Outer flame.
  ctx.fillStyle = "#ff642b";
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();

  // Inner core.
  ctx.fillStyle = "#ffbd42";
  ctx.beginPath();
  ctx.arc(x + 1, y - 1, 5, 0, Math.PI * 2);
  ctx.fill();

  // White-hot center.
  ctx.fillStyle = "#fff3b0";
  ctx.fillRect(x - 2, y - 3, 4, 4);
}

function launchFireball(target) {
  if (!target || !target.alive) return;

  const spell = SPELLS.fireball;

  fireballs.push({
    x: player.x + player.w / 2,
    y: player.y + player.h / 2,
    target,
    speed: spell.projectileSpeed,
    damage: spell.damage,
    radius: spell.radius,
  });
}

// ==========================================
// CASTING
// ==========================================

function castFireball() {
  if (player.casting) return;

  const spell = SPELLS.fireball;

  // Check equipped weapon.
  if (spell.requiredWeaponCategory !== null) {
    const weapon = getEquippedItem("weapon");

    if (!weapon || weapon.weaponType !== spell.requiredWeaponCategory) {
      showMessage(
        `${spell.name} requires a ${spell.requiredWeaponCategory} weapon to cast.`
      );
      return;
    }
  }

  // Check target.
  if (!selectedEnemy || !selectedEnemy.alive) {
    selectedEnemy = null;
    showMessage("Click an enemy before casting Fireball.");
    return;
  }

  // Check mana.
  if (!hasEnoughMana(spell)) return;

  // Spend mana only after all checks pass.
  spendMana(spell);

  // Face the selected enemy.
  const dx = selectedEnemy.x - player.x;
  const dy = selectedEnemy.y - player.y;

  player.facing =
    Math.abs(dx) > Math.abs(dy)
      ? dx < 0
        ? "left"
        : "right"
      : dy < 0
        ? "up"
        : "down";

  // Begin Fireball casting animation.
  player.casting = true;
  player.castTime = 0;
  player.castTarget = selectedEnemy;
  player.moving = false;
  player.frame = 0;
}

function updateCasting(dt) {
  if (!player.casting) return;

  const previousFrame = Math.min(
    CAST_FRAME_COUNT - 1,
    Math.floor(player.castTime / CAST_FRAME_DURATION),
  );

  player.castTime += dt;

  const currentFrame = Math.min(
    CAST_FRAME_COUNT - 1,
    Math.floor(player.castTime / CAST_FRAME_DURATION),
  );

  // Release the spell on the final casting frame.
  if (
    previousFrame < CAST_FRAME_COUNT - 1 &&
    currentFrame === CAST_FRAME_COUNT - 1
  ) {
    launchFireball(player.castTarget);
    player.castTarget = null;
  }

  if (player.castTime >= CAST_FRAME_COUNT * CAST_FRAME_DURATION) {
    player.casting = false;
    player.castTime = 0;
    player.castTarget = null;
    player.frame = 0;
  }
}

// ==========================================
// SPELL COLLISION AND DAMAGE
// ==========================================

function updateCombat(dt) {
  // Update damage-over-time effects.
  updateIgnites(dt);

  for (let i = fireballs.length - 1; i >= 0; i--) {
    const fireball = fireballs[i];
    const target = fireball.target;

    if (!target || !target.alive) {
      fireballs.splice(i, 1);
      continue;
    }

    const targetX = target.x + target.w / 2;
    const targetY = target.y + target.h / 2;

    const dx = targetX - fireball.x;
    const dy = targetY - fireball.y;
    const distance = Math.hypot(dx, dy);
    const travel = fireball.speed * dt;

    if (distance <= travel + target.w / 2) {
      target.hp = Math.max(0, target.hp - fireball.damage);

      showMessage(
        `Fireball hit ${target.name} for ${fireball.damage} damage!`);

      fireballs.splice(i, 1);

      if (target.hp <= 0 && target.alive) {
        target.hp = 0;
        target.alive = false;
        target.respawnTimer = target.respawnTime;

        gainXP(target.xpReward ?? 0);

        if (selectedEnemy === target) {
          selectedEnemy = null;
        }

        showMessage(`${target.name} was defeated!`);
      } else if (target.alive) {
        showMessage(`${target.name}: ${target.hp}/${target.maxHp} HP`);
      }
    } else {
      fireball.x += (dx / distance) * travel;
      fireball.y += (dy / distance) * travel;
    }
  }
}
