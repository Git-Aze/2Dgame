import { canUseAbility } from "../data/classes.js";
import { SPELLS } from "../data/action-definitions.js";
import { ctx } from "../rendering/canvas.js";
import { spellPathBlocked } from "../world/collision.js";
import { damageEnemy } from "./enemies.js";
import { rollPlayerHit } from "./critical-hits.js";
import { getEquippedItem, meetsWeaponRequirement } from "../player/equipment.js";
import { emit, on } from "../core/events.js";
import { getItem } from "../data/items.js";
import { showMessage } from "../ui/messages.js";
import { moveEntity } from "../world/movement.js";
import { enemies, activeIgnites, fireballs, enemyProjectiles, isPlaying, player, runtime, spellCooldowns, swordSwings } from "../core/state.js";
import { getSpellStats } from "../player/stats.js";
import { blocked } from "../world/world-state.js";

// ==========================================
// SPELL SYSTEM
// ==========================================

// Permanent five-digit IDs, independent of item IDs. Never reuse retired IDs.
const activeRends = [];
function clearWarriorEffects() {
  activeRends.length = 0;
  player.shieldWallRemaining = 0;
}

function cleaveAttack() {
  const spell = getSpellStats(SPELLS["00006"]);
  if (!canCastSpell(spell, runtime.selectedEnemy)) return;
  const x = player.x + player.w / 2, y = player.y + player.h / 2;
  const angle = Math.atan2(runtime.selectedEnemy.y + runtime.selectedEnemy.h / 2 - y,
    runtime.selectedEnemy.x + runtime.selectedEnemy.w / 2 - x);
  player.facing = Math.abs(Math.cos(angle)) > Math.abs(Math.sin(angle))
    ? (Math.cos(angle) < 0 ? "left" : "right") : (Math.sin(angle) < 0 ? "up" : "down");
  spellCooldowns[spell.id] = spell.cooldown;
  swordSwings.push({ x, y, angle, elapsed: 0, duration: 0.25, radius: spell.range });
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dx = enemy.x + enemy.w / 2 - x, dy = enemy.y + enemy.h / 2 - y;
    const distance = Math.hypot(dx, dy);
    if (distance > spell.range || (distance > 0 && (dx * Math.cos(angle) + dy * Math.sin(angle)) / distance < 0.5) ||
        spellPathBlocked(x, y, x + dx, y + dy)) continue;
    const hit = rollPlayerHit(spell.damage);
    damageEnemy(enemy, hit.damage, spell.id, hit.critical);
  }
}

function rendAttack() {
  const spell = getSpellStats(SPELLS["00007"]);
  if (!canCastSpell(spell, runtime.selectedEnemy)) return;
  const target = runtime.selectedEnemy;
  spellCooldowns[spell.id] = spell.cooldown;
  const existing = activeRends.find(effect => effect.target === target);
  if (existing) {
    existing.remaining = spell.duration; existing.damage = spell.damagePerTick;
  } else activeRends.push({ target, remaining: spell.duration, elapsed: 0, damage: spell.damagePerTick });
  showMessage(`${target.name} is bleeding!`);
}

function shieldWall() {
  const spell = SPELLS["00008"];
  if (!canCastSpell(spell, null)) return;
  spellCooldowns[spell.id] = spell.cooldown;
  player.shieldWallRemaining = spell.duration;
  showMessage("Shield Wall: 40% damage reduction for 5 seconds.");
}

function updateWarriorEffects(dt) {
  player.shieldWallRemaining = getEquippedItem("offhand")?.offhandClass === "Shield"
    ? Math.max(0, player.shieldWallRemaining - dt) : 0;
  for (let i = activeRends.length - 1; i >= 0; i--) {
    const effect = activeRends[i];
    if (!effect.target.alive) { activeRends.splice(i, 1); continue; }
    effect.elapsed += Math.min(dt, effect.remaining);
    effect.remaining = Math.max(0, effect.remaining - dt);
    while (effect.elapsed + 1e-9 >= 1 && effect.target.alive) {
      effect.elapsed -= 1;
      damageEnemy(effect.target, effect.damage, "00007");
    }
    if (effect.remaining <= 0 || !effect.target.alive) activeRends.splice(i, 1);
  }
}

function chargeAttack() {
  const attack = SPELLS["00004"];
  if (!canCastSpell(attack, runtime.selectedEnemy)) return;
  const distance = Math.hypot(runtime.selectedEnemy.x + runtime.selectedEnemy.w / 2 - player.x - player.w / 2,
    runtime.selectedEnemy.y + runtime.selectedEnemy.h / 2 - player.y - player.h / 2);
  runtime.activeCharge = { target: runtime.selectedEnemy, remainingTravel: distance + 64 };
  spellCooldowns["00004"] = attack.cooldown;
}

function updateCharge(dt) {
  if (!runtime.activeCharge) return;
  const target = runtime.activeCharge.target;
  if (!isPlaying() || !target.alive || !meetsWeaponRequirement(SPELLS["00004"])) {
    runtime.activeCharge = null;
    return;
  }
  const dx = target.x + target.w / 2 - player.x - player.w / 2;
  const dy = target.y + target.h / 2 - player.y - player.h / 2;
  const distance = Math.hypot(dx, dy);
  const contactDistance = (player.w + target.w) / 2 + 4;
  const travel = Math.min(SPELLS["00004"].chargeSpeed * dt,
    Math.max(0, distance - contactDistance), runtime.activeCharge.remainingTravel);
  const moveX = distance ? dx / distance * travel : 0;
  const moveY = distance ? dy / distance * travel : 0;
  player.facing = Math.abs(dx) > Math.abs(dy)
    ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
  const oldX = player.x, oldY = player.y;
  moveEntity(player, moveX, moveY);
  runtime.activeCharge.remainingTravel -= travel;
  if (Math.abs(player.x - oldX - moveX) > 0.01 || Math.abs(player.y - oldY - moveY) > 0.01) {
    runtime.activeCharge = null;
    showMessage("Charge stopped by terrain.");
    emit("combat:notice", { text: "Charge blocked" });
  } else if (distance - travel <= contactDistance + 0.01) {
    target.stunRemaining = Math.max(target.stunRemaining ?? 0, SPELLS["00004"].stunDuration);
    runtime.activeCharge = null;
    showMessage(`${target.name} is stunned for ${SPELLS["00004"].stunDuration} seconds!`);
  } else if (runtime.activeCharge.remainingTravel <= 0) {
    runtime.activeCharge = null;
    showMessage("Charge ended before reaching the target.");
    emit("combat:notice", { text: "Charge ended" });
  }
}

function getActionWeaponRequirement(action) {
  return action.requiredWeaponId ? getItem(action.requiredWeaponId).name
    : action.requiredWeaponClass ? `a ${action.requiredWeaponClass.toLowerCase()}`
    : `${action.requiredWeaponCategory} weapon`;
}

function swordAttack() {
  const attack = getSpellStats(SPELLS["00003"]);
  if (!canCastSpell(attack, runtime.selectedEnemy)) return;
  const target = runtime.selectedEnemy;
  const x = player.x + player.w / 2, y = player.y + player.h / 2;
  const dx = target.x + target.w / 2 - x, dy = target.y + target.h / 2 - y;
  player.facing = Math.abs(dx) > Math.abs(dy)
    ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
  spellCooldowns["00003"] = attack.cooldown;
  swordSwings.push({ x, y, angle: Math.atan2(dy, dx), elapsed: 0, duration: 0.18 });
  const hit = rollPlayerHit(attack.damage);
  showMessage(`Sword Strike ${hit.critical ? "critically hit" : "hit"} ${target.name} for ${hit.damage} damage!`);
  damageEnemy(target, hit.damage, "00003", hit.critical);
}

function rangedAttack() {
  const attack = getSpellStats(SPELLS["00005"]);
  if (!canCastSpell(attack, runtime.selectedEnemy)) return;
  const target = runtime.selectedEnemy;
  const x = player.x + player.w / 2, y = player.y + player.h / 2;
  const dx = target.x + target.w / 2 - x, dy = target.y + target.h / 2 - y;
  player.facing = Math.abs(dx) > Math.abs(dy)
    ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
  fireballs.push({ x, y, target, speed: attack.projectileSpeed, ...rollPlayerHit(attack.damage),
    remainingRange: attack.range, spellId: attack.id, weaponClass: getEquippedItem("weapon").weaponClass });
  spellCooldowns[attack.id] = attack.cooldown;
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
    ctx.arc(0, 0, swing.radius ?? 30, angle - 0.7, angle);
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

function getTargetProblem(spell, target) {
  if (!canUseAbility(spell.id, player.classId, player.unlockedSkills)) return "class";
  if (!meetsWeaponRequirement(spell)) return "weapon";
  if (spell.requiredOffhandClass && getEquippedItem("offhand")?.offhandClass !== spell.requiredOffhandClass) return "shield";
  if (spell.target === "self") return "";
  if (!target?.alive) return "target";
  const ax = player.x + player.w / 2, ay = player.y + player.h / 2;
  const bx = target.x + target.w / 2, by = target.y + target.h / 2;
  const distance = Math.hypot(bx - ax, by - ay);
  if (distance < (spell.minRange ?? 0)) return "too-close";
  if (distance > spell.range) return "range";
  if (spellPathBlocked(ax, ay, bx, by)) return "blocked";
  return "";
}

function getActionUnavailableReason(spell, target = runtime.selectedEnemy) {
  if (!isPlaying()) return "paused";
  if (spellCooldowns[spell.id] > 0) return "cooldown";
  if (player.casting) return "casting";
  if (runtime.activeCharge) return "charging";
  const problem = getTargetProblem(spell, target);
  if (problem) return problem;
  return player.mana < spell.manaCost ? "mana" : "";
}

function validateSpellTarget(spell, target) {
  const problem = getTargetProblem(spell, target);
  if (!problem) return true;
  const reason = problem === "class" ? `${spell.name} is not learned or is not available to your class.`
    : problem === "shield" ? `${spell.name} requires a shield.`
    : problem === "weapon" ? `${spell.name} requires ${getActionWeaponRequirement(spell)}.`
    : problem === "target" ? "Select a living enemy before casting."
    : problem === "too-close" ? `${spell.name}: target must be at least ${spell.minRange} pixels away.`
    : problem === "range" ? `${spell.name}: target is out of range.` : `${spell.name}: line of sight is blocked.`;
  showMessage(reason);
  emit("combat:notice", { text: problem === "class" ? "Skill locked" : problem === "shield" ? "Shield required" : problem === "weapon" ? "Wrong weapon" : problem === "target" ? "No target"
    : problem === "too-close" ? "Too close" : problem === "range" ? "Out of range" : "Blocked" });
  return false;
}

function canCastSpell(spell, target) {
  if (!isPlaying() || player.casting || runtime.activeCharge) return false;
  if (spellCooldowns[spell.id] > 0) {
    showMessage(`${spell.name} is on cooldown (${spellCooldowns[spell.id].toFixed(1)}s).`);
    emit("combat:notice", { text: "Not ready" });
    return false;
  }
  return validateSpellTarget(spell, target) && hasEnoughMana(spell);
}

function cancelCasting(reason = "") {
  player.castGuaranteedCritical = false;
  if (!player.casting) return;
  player.casting = false;
  player.castTime = 0;
  player.castDuration = 0;
  player.castSpellId = null;
  player.castTarget = null;
  player.castReleased = false;
  player.frame = 0;
  emit("casting:changed");
  if (reason) {
    showMessage(`Casting interrupted: ${reason}`);
    emit("combat:notice", { text: "Interrupted", kind: "interrupted" });
  }
}

function resetSpellState() {
  clearWarriorEffects();
  runtime.activeCharge = null;
  fireballs.length = 0;
  enemyProjectiles.length = 0;
  activeIgnites.length = 0;
  swordSwings.length = 0;
  for (const id of Object.keys(spellCooldowns)) delete spellCooldowns[id];
  cancelCasting();
  emit("combat:reset");
}

function hasEnoughMana(spell) {
  if (player.mana < spell.manaCost) {
    showMessage(
      `Not enough mana to cast ${spell.name}! ` +
      `Requires ${spell.manaCost} mana.`
    );
    emit("combat:notice", { text: "Not enough mana" });
    return false;
  }

  return true;
}

function spendMana(spell) {
  player.mana = Math.max(0, player.mana - spell.manaCost);

  // Immediately update the portrait bars.
  emit("resources:changed");
}

// ==========================================
// DAMAGE OVER TIME EFFECTS
// ==========================================


function castIgnite() {
  beginCasting("00002");
}

function applyIgnite(target, spell) {
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

// ==========================================
// FIREBALL PROJECTILE
// ==========================================

function drawFireball(fireball) {
  const x = fireball.x;
  const y = fireball.y;
  if (fireball.spellId === "00005") {
    const target = fireball.target;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(target.y + target.h / 2 - y, target.x + target.w / 2 - x));
    ctx.strokeStyle = "#b99a64";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-12, 0); ctx.lineTo(4, 0); ctx.stroke();
    ctx.fillStyle = "#d9e5e5";
    ctx.beginPath();
    ctx.moveTo(9, 0); ctx.lineTo(-1, -4); ctx.lineTo(fireball.weaponClass === "Bow" ? 2 : -4, 0); ctx.lineTo(-1, 4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    return;
  }

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
    ...rollPlayerHit(spell.damage, player.castGuaranteedCritical),
    radius: spell.radius,
    remainingRange: spell.range,
  });
}

// ==========================================
// CASTING
// ==========================================

function castFireball() {
  beginCasting("00001");
}

function beginCasting(spellId) {
  const spell = getSpellStats(SPELLS[spellId]);
  const target = runtime.selectedEnemy;
  if (!canCastSpell(spell, target)) return;
  const dx = target.x - player.x, dy = target.y - player.y;
  player.facing = Math.abs(dx) > Math.abs(dy)
    ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
  player.casting = true;
  player.castReleased = false;
  player.castTime = 0;
  player.castDuration = spell.castTime;
  player.castSpellId = spellId;
  player.castTarget = target;
  player.castGuaranteedCritical = spellId === "00001" && activeIgnites.some((effect) => effect.target === target && effect.remaining > 0);
  player.moving = false;
  player.frame = 0;
  emit("casting:changed");
}

function updateCasting(dt) {
  if (!player.casting || !isPlaying()) return;
  const definition = SPELLS[player.castSpellId];
  if (!definition || !validateSpellTarget(definition, player.castTarget) || !hasEnoughMana(definition)) {
    cancelCasting("target, weapon or mana is no longer valid.");
    return;
  }
  player.castTime = Math.min(player.castDuration, player.castTime + dt);
  if (player.castTime + 1e-9 < player.castDuration) return;
  const spell = getSpellStats(definition);
  spendMana(spell);
  spellCooldowns[spell.id] = spell.cooldown;
  if (spell.id === "00001") launchFireball(player.castTarget);
  else if (spell.id === "00002") applyIgnite(player.castTarget, spell);
  cancelCasting();
}
// ==========================================
// SPELL COLLISION AND DAMAGE
// ==========================================

function updateCombat(dt) {
  updateWarriorEffects(dt);
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
      showMessage(`${SPELLS[fireball.spellId ?? "00001"].name} was blocked by scenery.`);
      emit("combat:notice", { text: "Blocked", target: { x: fireball.x, y: fireball.y, w: 0, h: 0 } });
      continue;
    }

    if (distance <= travel + target.w / 2) {
      showMessage(
        `${SPELLS[fireball.spellId ?? "00001"].name} ${fireball.critical ? "critically hit" : "hit"} ${target.name} for ${fireball.damage} damage!`);
      damageEnemy(target, fireball.damage, fireball.spellId ?? "00001", fireball.critical);

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

function setupCombat() {
  on("combat:reset", clearWarriorEffects);
  on("player:hurt", () => {
    if (!player.casting || player.castReleased || player.hp <= 0) return;
    player.castTime = Math.max(0, player.castTime - player.castDuration / 6);
    emit("casting:changed");
  });
}

export { cleaveAttack, rendAttack, shieldWall, chargeAttack, updateCharge, getActionWeaponRequirement, getActionUnavailableReason, swordAttack, rangedAttack, drawSwordSwings, updateSpellCooldowns, cancelCasting, resetSpellState, castIgnite, updateIgnites, drawIgniteEffects, drawFireball, castFireball, updateCasting, updateCombat, setupCombat };
