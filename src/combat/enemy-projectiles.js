import { enemyProjectiles, isPlaying, player } from "../core/state.js";
import { damagePlayer } from "../player/player.js";
import { spellPathBlocked } from "../world/collision.js";

function launchSlimeball(enemy, damage) {
  const x = enemy.x + enemy.w / 2, y = enemy.y + enemy.h / 2;
  const dx = player.x + player.w / 2 - x, dy = player.y + player.h / 2 - y;
  const distance = Math.hypot(dx, dy);
  const attack = enemy.rangedAttack;
  enemyProjectiles.push({ x, y, dx: distance ? dx / distance : 1, dy: distance ? dy / distance : 0,
    speed: attack.speed, radius: attack.radius, remainingRange: attack.maxRange, damage });
}

// Sweep against the player's expanded rectangle; shots cannot skip the player
// at low frame rates. Return the first contact fraction, or null for no hit.
function playerContact(x, y, dx, dy, radius) {
  let start = 0, end = 1;
  if (!dx) {
    if (x < player.x-radius || x > player.x+player.w+radius) return null;
  } else {
    const a = (player.x-radius-x)/dx, b = (player.x+player.w+radius-x)/dx;
    start = Math.max(start,Math.min(a,b)); end = Math.min(end,Math.max(a,b));
    if (start > end) return null;
  }
  if (!dy) {
    if (y < player.y-radius || y > player.y+player.h+radius) return null;
  } else {
    const a = (player.y-radius-y)/dy, b = (player.y+player.h+radius-y)/dy;
    start = Math.max(start,Math.min(a,b)); end = Math.min(end,Math.max(a,b));
    if (start > end) return null;
  }
  return start;
}

function blocked(x, y, nx, ny, radius) {
  return spellPathBlocked(x,y,nx,ny) ||
    spellPathBlocked(x-radius,y,nx-radius,ny) || spellPathBlocked(x+radius,y,nx+radius,ny) ||
    spellPathBlocked(x,y-radius,nx,ny-radius) || spellPathBlocked(x,y+radius,nx,ny+radius);
}

function updateEnemyProjectiles(dt) {
  if (!isPlaying()) return;
  for (let i = enemyProjectiles.length-1; i >= 0; i--) {
    const shot = enemyProjectiles[i];
    let travel = Math.min(shot.speed * dt, shot.remainingRange), remove = false;
    while (travel > 0) {
      const step = Math.min(travel, 4), dx = shot.dx * step, dy = shot.dy * step;
      const contact = playerContact(shot.x,shot.y,dx,dy,shot.radius);
      const nx = shot.x + dx * (contact ?? 1), ny = shot.y + dy * (contact ?? 1);
      if (blocked(shot.x,shot.y,nx,ny,shot.radius)) { remove = true; break; }
      if (contact !== null) {
        // Remove before applying damage: death clears the entire collection.
        enemyProjectiles.splice(i,1);
        damagePlayer(shot.damage);
        if (!isPlaying()) return;
        remove = false;
        break;
      }
      shot.x = nx; shot.y = ny;
      shot.remainingRange -= step; travel -= step;
    }
    if (remove || shot.remainingRange <= 0) enemyProjectiles.splice(i,1);
  }
}

export { launchSlimeball, updateEnemyProjectiles };
