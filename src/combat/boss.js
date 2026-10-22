import { enemies, player, runtime, questProgress, activeIgnites, fireballs, isPlaying } from "../core/state.js";
import { on } from "../core/events.js";
import { acceptQuest } from "../quests/quest-system.js";
import { damagePlayer } from "../player/player.js";
import { getEnemyDamage } from "./enemy-stats.js";
import { navigateEnemy } from "../world/navigation.js";
import { collides } from "../world/movement.js";
import { spellPathBlocked } from "../world/collision.js";
import { showMessage } from "../ui/messages.js";

const BOSS_RULES = Object.freeze({
  engageY: 1050, retreatY: 1120, cleaveRadius: 95,
  cleaveWindup: 0.9, chargeWindup: 1.2, chargeSpeed: 420, chargeRange: 420,
});

function resetBoss(boss) {
  for (let i=activeIgnites.length-1;i>=0;i--) if (activeIgnites[i].target === boss) activeIgnites.splice(i,1);
  for (let i=fireballs.length-1;i>=0;i--) if (fireballs[i].target === boss) fireballs.splice(i,1);
  if (runtime.activeCharge?.target === boss) runtime.activeCharge = null;
  boss.x = boss.spawnX; boss.y = boss.spawnY;
  boss.hp = questProgress.stonehorn?.status === "completed" ? 0 : boss.maxHp;
  boss.alive = boss.hp > 0;
  boss.bossState = "idle"; boss.bossAction = null; boss.bossTime = 0;
  boss.bossCooldown = 1; boss.attackTimer = 0; boss.stunRemaining = 0;
  boss.hurtTime = 0; boss.navigation = null;
  boss.spriteMoving = false; boss.facingLeft = false;
}

function syncBossEncounter() {
  if (runtime.areaId !== "cave-arena") return;
  for (const boss of enemies) if (boss.isBoss) resetBoss(boss);
  if (runtime.gameState === "playing") acceptQuest("stonehorn");
}

function engageBoss(boss) {
  if (boss.bossState === "active") return;
  acceptQuest("stonehorn");
  boss.bossState = "active";
  showMessage("Stonehorn awakens! Watch the red attack warnings. Retreat to the entrance to reset the fight.");
}

function updateBoss(boss, dt) {
  if (!isPlaying() || !boss.alive) return;
  if (!boss.bossState) resetBoss(boss);
  boss.bossTime += dt;
  boss.spriteMoving = false;
  boss.hurtTime = Math.max(0, boss.hurtTime - dt);
  if (player.y > BOSS_RULES.retreatY && boss.bossState === "active") {
    resetBoss(boss); showMessage("Stonehorn returns to his post. The encounter has reset."); return;
  }
  if (boss.bossState === "idle") {
    if (player.y < BOSS_RULES.engageY) engageBoss(boss);
    else return;
  }
  if (boss.stunRemaining > 0) {
    boss.stunRemaining = Math.max(0, boss.stunRemaining - dt);
    return;
  }
  const x = boss.x + boss.w / 2, y = boss.y + boss.h / 2;
  const px = player.x + player.w / 2, py = player.y + player.h / 2;
  boss.facingLeft = px < x;
  if (boss.bossAction) {
    const action = boss.bossAction;
    if (action.type === "charging") {
      let travel = Math.min(BOSS_RULES.chargeSpeed * dt, action.travel);
      while (travel > 0) {
        const step = Math.min(4, travel);
        const nx = boss.x + action.dx * step, ny = boss.y + action.dy * step;
        if (collides(nx, ny, boss)) { action.travel = 0; break; }
        boss.x = nx; boss.y = ny;
        action.travel -= step; travel -= step;
        if (!action.hit && Math.hypot(px-boss.x-boss.w/2, py-boss.y-boss.h/2) <= (boss.w+player.w)/2 + 8 &&
            !spellPathBlocked(boss.x+boss.w/2,boss.y+boss.h/2,px,py)) {
          action.hit = true;
          damagePlayer(getEnemyDamage(boss) * 1.5);
          if (!isPlaying()) return;
        }
      }
      if (action.travel <= 0) finishAttack(boss);
      return;
    }
    action.remaining = Math.max(0, action.remaining - dt);
    if (action.remaining > 0) return;
    if (action.type === "cleave") {
      if (Math.hypot(px-action.x,py-action.y) <= BOSS_RULES.cleaveRadius &&
          !spellPathBlocked(action.x,action.y,px,py)) damagePlayer(getEnemyDamage(boss));
      if (!isPlaying()) return;
      finishAttack(boss);
    } else {
      action.type = "charging";
      action.travel = Math.min(BOSS_RULES.chargeRange, Math.hypot(action.tx-action.x,action.ty-action.y)+60);
      action.hit = false;
    }
    return;
  }
  boss.bossCooldown = Math.max(0,boss.bossCooldown-dt);
  const distance = Math.hypot(px-x,py-y);
  const blocked = spellPathBlocked(x,y,px,py);
  if (boss.bossCooldown <= 0 && !blocked &&
      (distance <= BOSS_RULES.cleaveRadius || (distance > 140 && distance <= BOSS_RULES.chargeRange))) {
    const type = distance > 140 ? "charge" : "cleave";
    const duration = (type === "charge" ? BOSS_RULES.chargeWindup : BOSS_RULES.cleaveWindup) * (boss.hp <= boss.maxHp/2 ? 0.75 : 1);
    boss.bossAction = { type, interruptible: false, remaining: duration, duration, x, y, tx: px, ty: py,
      dx: distance ? (px-x)/distance : 1, dy: distance ? (py-y)/distance : 0 };
    boss.navigation = null;
    showMessage(type === "charge" ? "Stonehorn prepares to charge! Move out of the marked lane." : "Stonehorn raises his axe! Leave the marked circle.");
  } else {
    const previousX=boss.x,previousY=boss.y;
    navigateEnemy(boss,px-boss.w/2,py-boss.h/2,boss.speed,dt,blocked ? 0 : 75);
    boss.spriteMoving = boss.x !== previousX || boss.y !== previousY;
  }
}

function finishAttack(boss) {
  boss.bossAction = null;
  boss.bossCooldown = boss.hp <= boss.maxHp/2 ? 0.9 : 1.5;
}

function setupBossEncounter() {
  on("area:changed",syncBossEncounter);
  on("player:died",()=>{ for (const boss of enemies) if (boss.isBoss) resetBoss(boss); });
  on("enemy:hurt",({target})=>{ if (target.isBoss && target.alive) engageBoss(target); });
}

export { BOSS_RULES, updateBoss, resetBoss, syncBossEncounter, setupBossEncounter };
