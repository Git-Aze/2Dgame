// ==========================================
// SPELL SYSTEM
// ==========================================

// Permanent five-digit IDs, independent of item IDs. Never reuse retired IDs.
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

const fireballs = [];
const spellCooldowns = Object.create(null);
const swordSwings = [];
let activeCharge = null;

function chargeAttack() {
  const attack = SPELLS["00004"];
  if (!canCastSpell(attack, selectedEnemy)) return;
  const distance = Math.hypot(selectedEnemy.x + selectedEnemy.w / 2 - player.x - player.w / 2,
    selectedEnemy.y + selectedEnemy.h / 2 - player.y - player.h / 2);
  activeCharge = { target: selectedEnemy, remainingTravel: distance + 64 };
  spellCooldowns["00004"] = attack.cooldown;
}

function updateCharge(dt) {
  if (!activeCharge) return;
  const target = activeCharge.target;
  if (!isPlaying() || !target.alive || getEquippedItem("weapon")?.id !== SPELLS["00004"].requiredWeaponId) {
    activeCharge = null;
    return;
  }
  const dx = target.x + target.w / 2 - player.x - player.w / 2;
  const dy = target.y + target.h / 2 - player.y - player.h / 2;
  const distance = Math.hypot(dx, dy);
  const contactDistance = (player.w + target.w) / 2 + 4;
  const travel = Math.min(SPELLS["00004"].chargeSpeed * dt,
    Math.max(0, distance - contactDistance), activeCharge.remainingTravel);
  const moveX = distance ? dx / distance * travel : 0;
  const moveY = distance ? dy / distance * travel : 0;
  player.facing = Math.abs(dx) > Math.abs(dy)
    ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
  const oldX = player.x, oldY = player.y;
  moveEntity(player, moveX, moveY);
  activeCharge.remainingTravel -= travel;
  if (Math.abs(player.x - oldX - moveX) > 0.01 || Math.abs(player.y - oldY - moveY) > 0.01) {
    activeCharge = null;
    showMessage("Charge stopped by terrain.");
  } else if (distance - travel <= contactDistance + 0.01) {
    target.stunRemaining = Math.max(target.stunRemaining ?? 0, SPELLS["00004"].stunDuration);
    activeCharge = null;
    showMessage(`${target.name} is stunned for ${SPELLS["00004"].stunDuration} seconds!`);
  } else if (activeCharge.remainingTravel <= 0) {
    activeCharge = null;
    showMessage("Charge ended before reaching the target.");
  }
}

function getActionWeaponRequirement(action) {
  return action.requiredWeaponId ? getItem(action.requiredWeaponId).name
    : `${action.requiredWeaponCategory} weapon`;
}

function swordAttack() {
  const attack = getSpellStats(SPELLS["00003"]);
  if (!canCastSpell(attack, selectedEnemy)) return;
  const target = selectedEnemy;
  const x = player.x + player.w / 2, y = player.y + player.h / 2;
  const dx = target.x + target.w / 2 - x, dy = target.y + target.h / 2 - y;
  player.facing = Math.abs(dx) > Math.abs(dy)
    ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
  spellCooldowns["00003"] = attack.cooldown;
  swordSwings.push({ x, y, angle: Math.atan2(dy, dx), elapsed: 0, duration: 0.18 });
  showMessage(`Sword Strike hit ${target.name} for ${attack.damage} damage!`);
  damageEnemy(target, attack.damage, "00003");
}

function drawSwordSwings() {
  for (const swing of swordSwings) {
    const progress = swing.elapsed / swing.duration;
    const angle = swing.angle - 0.8 + progress * 1.6;
    ctx.save();
    ctx.translate(swing.x, swing.y);
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = "#ffe6a3";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 30, angle - 0.7, angle);
    ctx.stroke();
    ctx.strokeStyle = "#f1f6ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 10, Math.sin(angle) * 10);
    ctx.lineTo(Math.cos(angle) * 36, Math.sin(angle) * 36);
    ctx.stroke();
    ctx.restore();
  }
}

function updateSpellCooldowns(dt) {
  for (const id of Object.keys(spellCooldowns)) {
    spellCooldowns[id] = Math.max(0, spellCooldowns[id] - dt);
  }
}

function validateSpellTarget(spell, target) {
  const weapon = getEquippedItem("weapon");
  let reason = "";
  if ((spell.requiredWeaponId && weapon?.id !== spell.requiredWeaponId) ||
      (spell.requiredWeaponCategory && weapon?.weaponType !== spell.requiredWeaponCategory)) {
    reason = `${spell.name} requires ${getActionWeaponRequirement(spell)}.`;
  } else if (!target?.alive) {
    reason = "Select a living enemy before casting.";
  } else {
    const ax = player.x + player.w / 2, ay = player.y + player.h / 2;
    const bx = target.x + target.w / 2, by = target.y + target.h / 2;
    const distance = Math.hypot(bx - ax, by - ay);
    if (distance < (spell.minRange ?? 0)) reason = `${spell.name}: target must be at least ${spell.minRange} pixels away.`;
    else if (distance > spell.range) reason = `${spell.name}: target is out of range.`;
    else if (spellPathBlocked(ax, ay, bx, by)) reason = `${spell.name}: line of sight is blocked.`;
  }
  if (reason) showMessage(reason);
  return !reason;
}

function canCastSpell(spell, target) {
  if (!isPlaying() || player.casting || activeCharge) return false;
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
  activeCharge = null;
  fireballs.length = 0;
  activeIgnites.length = 0;
  swordSwings.length = 0;
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

  const spell = getSpellStats(SPELLS["00002"]);

  if (!canCastSpell(spell, selectedEnemy)) return;

  // Spend mana.
  spendMana(spell);
  spellCooldowns["00002"] = spell.cooldown;

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
      damageEnemy(target, effect.damagePerTick, "00002");

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

const CAST_FRAME_DURATION = SPELLS["00001"].castFrameDuration;
const CAST_FRAME_COUNT = SPELLS["00001"].castFrameCount;

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

  const spell = getSpellStats(SPELLS["00001"]);

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

  const spell = SPELLS["00001"];

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
  if (!player.castReleased && (!validateSpellTarget(SPELLS["00001"], player.castTarget) ||
      !hasEnoughMana(SPELLS["00001"]))) {
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
    spendMana(SPELLS["00001"]);
    spellCooldowns["00001"] = SPELLS["00001"].cooldown;
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
  for (let i = swordSwings.length - 1; i >= 0; i--) {
    swordSwings[i].elapsed += dt;
    if (swordSwings[i].elapsed >= swordSwings[i].duration) swordSwings.splice(i, 1);
  }
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
      damageEnemy(target, fireball.damage, "00001");

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
