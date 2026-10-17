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
    range: 320,
    cooldown: 0.5,
    rules: "Movement, damage, Escape, weapon changes, or losing the target interrupt casting before release at no mana cost. Mana and cooldown begin on release. Released projectiles continue independently, stop at solid scenery, and expire after traveling their range.",
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
    range: 240,
    cooldown: 2,
    rules: "Recasting refreshes the burn to 10 seconds without stacking or delaying the next tick. The burn continues if the target leaves range or line of sight. Mana and cooldown begin immediately.",
    tickInterval: 1,
    duration: 10,

    requiredWeaponCategory: "Casting",
  },
};

const fireballs = [];
const spellCooldowns = Object.create(null);

function updateSpellCooldowns(dt) {
  for (const id of Object.keys(spellCooldowns)) {
    spellCooldowns[id] = Math.max(0, spellCooldowns[id] - dt);
  }
}

function validateSpellTarget(spell, target) {
  const weapon = getEquippedItem("weapon");
  let reason = "";
  if (spell.requiredWeaponCategory && weapon?.weaponType !== spell.requiredWeaponCategory) {
    reason = `${spell.name} requires a ${spell.requiredWeaponCategory} weapon.`;
  } else if (!target?.alive) {
    reason = "Select a living enemy before casting.";
  } else {
    const ax = player.x + player.w / 2, ay = player.y + player.h / 2;
    const bx = target.x + target.w / 2, by = target.y + target.h / 2;
    if (Math.hypot(bx - ax, by - ay) > spell.range) reason = `${spell.name}: target is out of range.`;
    else if (spellPathBlocked(ax, ay, bx, by)) reason = `${spell.name}: line of sight is blocked.`;
  }
  if (reason) showMessage(reason);
  return !reason;
}

function canCastSpell(spell, target) {
  if (!isPlaying() || player.casting) return false;
  if (spellCooldowns[spell.id] > 0) {
    showMessage(`${spell.name} is on cooldown (${spellCooldowns[spell.id].toFixed(1)}s).`);
    return false;
  }
  return validateSpellTarget(spell, target) && hasEnoughMana(spell);
}

function cancelCasting(reason = "") {
  if (!player.casting) return;
  player.casting = false;
  player.castTime = 0;
  player.castTarget = null;
  player.castReleased = false;
  player.frame = 0;
  if (reason) showMessage(`Casting interrupted: ${reason}`);
}

function resetSpellState() {
  fireballs.length = 0;
  activeIgnites.length = 0;
  for (const id of Object.keys(spellCooldowns)) delete spellCooldowns[id];
  cancelCasting();
}

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
  if (!isPlaying()) return;
  if (player.casting) return;

  const spell = getSpellStats(SPELLS.ignite);

  if (!canCastSpell(spell, selectedEnemy)) return;

  // Spend mana.
  spendMana(spell);
  spellCooldowns.ignite = spell.cooldown;

  const target = selectedEnemy;

  // Refresh Ignite if the target is already burning.
  const existingEffect = activeIgnites.find(
    (effect) => effect.target === target
  );

  if (existingEffect) {
    existingEffect.remaining = spell.duration;
    existingEffect.damagePerTick = spell.damagePerTick;
    existingEffect.tickInterval = spell.tickInterval;
    existingEffect.duration = spell.duration;

    showMessage(`${target.name}'s Ignite was refreshed!`);
    return;
  }

  // Apply Ignite.
  activeIgnites.push({
    target,
    tickTimer: 0,
    remaining: spell.duration,
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

    const elapsed = Math.min(dt, effect.remaining);
    effect.remaining = Math.max(0, effect.remaining - dt);
    effect.tickTimer += elapsed;

    // Apply each tick that is due.
    while (
      effect.tickTimer + 1e-9 >= effect.tickInterval
    ) {
      effect.tickTimer = Math.max(0, effect.tickTimer - effect.tickInterval);

      showMessage(
        `${target.name} takes ${effect.damagePerTick} Ignite damage!`);
      damageEnemy(target, effect.damagePerTick, "ignite");

      // Check if Ignite killed the enemy.
      if (!target.alive) {
        break;
      }
    }

    // Remove expired Ignite effects.
    if (!target.alive || effect.remaining <= 0) {
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

  const spell = getSpellStats(SPELLS.fireball);

  fireballs.push({
    x: player.x + player.w / 2,
    y: player.y + player.h / 2,
    target,
    speed: spell.projectileSpeed,
    damage: spell.damage,
    radius: spell.radius,
    remainingRange: spell.range,
  });
}

// ==========================================
// CASTING
// ==========================================

function castFireball() {
  if (!isPlaying()) return;
  if (player.casting) return;

  const spell = SPELLS.fireball;

  if (!canCastSpell(spell, selectedEnemy)) return;

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
  player.castReleased = false;
  player.castTime = 0;
  player.castTarget = selectedEnemy;
  player.moving = false;
  player.frame = 0;
}

function updateCasting(dt) {
  if (!player.casting) return;
  if (!player.castReleased && (!validateSpellTarget(SPELLS.fireball, player.castTarget) ||
      !hasEnoughMana(SPELLS.fireball))) {
    cancelCasting("target, weapon or mana is no longer valid.");
    return;
  }

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
    spendMana(SPELLS.fireball);
    spellCooldowns.fireball = SPELLS.fireball.cooldown;
    launchFireball(player.castTarget);
    player.castReleased = true;
    player.castTarget = null;
  }

  if (player.castTime >= CAST_FRAME_COUNT * CAST_FRAME_DURATION) {
    player.casting = false;
    player.castReleased = false;
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
    const travel = Math.min(fireball.speed * dt, fireball.remainingRange);

    // Sweep the traveled segment so projectiles cannot skip thin obstacles.
    const step = distance <= travel + target.w / 2 ? distance : Math.min(distance, travel);
    const nextX = distance ? fireball.x + dx / distance * step : fireball.x;
    const nextY = distance ? fireball.y + dy / distance * step : fireball.y;
    if (spellPathBlocked(fireball.x, fireball.y, nextX, nextY)) {
      fireballs.splice(i, 1);
      showMessage("Fireball was blocked by scenery.");
      continue;
    }

    if (distance <= travel + target.w / 2) {
      showMessage(
        `Fireball hit ${target.name} for ${fireball.damage} damage!`);
      damageEnemy(target, fireball.damage, "fireball");

      fireballs.splice(i, 1);

      if (target.alive) {
        showMessage(`${target.name}: ${target.hp}/${target.maxHp} HP`);
      }
    } else {
      fireball.x += (dx / distance) * travel;
      fireball.y += (dy / distance) * travel;
      fireball.remainingRange = Math.max(0, fireball.remainingRange - travel);
      if (fireball.remainingRange <= 0) fireballs.splice(i, 1);
    }
  }
}
