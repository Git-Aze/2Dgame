import { player, runtime, inventory, enemies, actionBarSpells, spellCooldowns, keys } from "../src/core/state.js";
import { resetAdventure, setGameState } from "../src/core/lifecycle.js";
import { gainXP, damagePlayer } from "../src/player/player.js";
import { equipItem, unequipItem } from "../src/player/inventory.js";
import { unlockSkill } from "../src/player/specializations.js";
import { getSpecializationTree } from "../src/data/specializations.js";
import { getPlayerStats, getSpellStats } from "../src/player/stats.js";
import { SPELLS } from "../src/data/action-definitions.js";
import { shieldBash, whirlwind, executeAttack, warCry, lastStand, updateCombat, resetSpellState } from "../src/combat/spells.js";
import { createSave, applySave, parseSave } from "../src/persistence/saves.js";
import { update } from "../src/core/update.js";
import { emit } from "../src/core/events.js";
import { setMenuOpen } from "../src/core/pause-menu.js";
import { mapCollision } from "../src/world/collision.js";
import { trees } from "../src/world/world-state.js";
import { buildings } from "../src/world/buildings.js";

export function runWarriorSkillChecks(assert) {
  resetAdventure("village", "warrior"); setGameState("playing");
  while (player.level < 10) gainXP(player.xpToNextLevel - player.xp);
  for (const node of getSpecializationTree("warrior").nodes) {
    const firstEmpty = actionBarSpells.indexOf(null);
    assert(unlockSkill(node.abilityId) && actionBarSpells[firstEmpty] === node.abilityId,
      `${node.abilityId}: learning fills the leftmost empty action slot`);
  }
  assert(player.specializationPoints === 0 && player.unlockedSkills.length === 9 && actionBarSpells.filter(Boolean).length === 10,
    "All ten warrior attacks fit on the action bar after nine point unlocks");
  equipItem("02000");
  const original = JSON.stringify(createSave());
  for (const list of Object.values(mapCollision)) list.length = 0;
  trees.length = 0; buildings.length = 0;
  Object.assign(player, { x: 800, y: 800 });
  for (const enemy of enemies) enemy.alive = false;
  const prepare = (enemy, x, hp = 1000) => Object.assign(enemy, { x, y: 802, w: 24, h: 24, hp, maxHp: 1000,
    alive: true, isBoss: false, bossAction: null, stunRemaining: 0, xpReward: 0 });
  let front = prepare(enemies[0], 840);
  runtime.selectedEnemy = front;
  shieldBash();
  assert(front.hp === 1000 && !spellCooldowns["00009"], "Shield Bash fails without shield and spends no cooldown");
  equipItem("05000"); shieldBash();
  const bashDamage = getSpellStats(SPELLS["00009"]).damage;
  assert(front.hp === Math.round((1000-bashDamage)*10)/10 && front.stunRemaining === 1 && spellCooldowns["00009"] === 12,
    "Shield Bash damages, briefly stuns ordinary enemies, and starts cooldown");
  front.hp = 1000; front.stunRemaining = 0; front.isBoss = true; front.bossState = "active";
  front.bossAction = { type: "cleave", interruptible: false, remaining: 1 };
  spellCooldowns["00009"] = 0; shieldBash();
  assert(front.bossAction?.remaining === 1 && !front.stunRemaining && front.hp < 1000,
    "Shield Bash damages protected bosses without cancelling their attacks or stunning them");
  front.bossAction.interruptible = true; spellCooldowns["00009"] = 0; shieldBash();
  assert(front.bossAction === null && front.bossCooldown >= 1, "Explicitly interruptible boss windups can be interrupted");
  resetSpellState(); front = prepare(front, 840);
  const behind = prepare(enemies[1], 760), far = prepare(enemies[2], 900);
  runtime.selectedEnemy = null; whirlwind();
  const whirlDamage = getSpellStats(SPELLS["00010"]).damage;
  assert(front.hp === Math.round((1000-whirlDamage)*10)/10 && behind.hp === front.hp && far.hp === 1000 && spellCooldowns["00010"] === 10,
    "Whirlwind hits nearby enemies on all sides without selecting a target");
  front.hp = 1000; behind.hp = 1000; spellCooldowns["00010"] = 0;
  mapCollision.solid.push({ x: 825, y: 795, w: 5, h: 40, points: [[825,795],[830,795],[830,835],[825,835]] });
  whirlwind(); assert(front.hp === 1000 && behind.hp < 1000, "Whirlwind respects scenery for each enemy");
  mapCollision.solid.length = 0;
  for (const enemy of enemies) enemy.alive = false;
  const oldX = player.x; keys.d = true; update(0.05); keys.d = false;
  assert(player.x > oldX && !player.casting && !runtime.activeCharge, "Whirlwind does not lock player movement");
  resetSpellState(); Object.assign(player, { x: 800, y: 800 }); front = prepare(front, 840, 250); runtime.selectedEnemy = front;
  executeAttack(); assert(front.hp === 250 && !spellCooldowns["00011"], "Execute requires strictly below 25% health and fails without cooldown");
  front.hp = 249; executeAttack();
  assert(front.hp === Math.round((249-getSpellStats(SPELLS["00011"]).damage)*10)/10 && spellCooldowns["00011"] === 6,
    "Execute deals its stronger scaled hit below the health threshold");
  resetSpellState(); runtime.selectedEnemy = null;
  const permanent = getPlayerStats(); player.hp = 60;
  const baseDamage = getSpellStats(SPELLS["00003"]).damage;
  warCry();
  assert(getPlayerStats().strength === Math.round(permanent.strength*1.2*10)/10 && getSpellStats(SPELLS["00003"]).damage > baseDamage && player.hp === 60 && player.warCryRemaining === 8,
    "War Cry adds 20% total Strength and damage without healing or needing a target");
  updateCombat(1); warCry(); assert(player.warCryRemaining === 7, "War Cry cannot refresh while on cooldown");
  setMenuOpen(true); update(3); setMenuOpen(false);
  assert(player.warCryRemaining === 7, "War Cry duration freezes while paused");
  updateCombat(7);
  assert(player.warCryRemaining === 0 && getPlayerStats().strength === permanent.strength && player.maxHp === permanent.maxHp,
    "War Cry expires without permanently modifying attributes or maximum health");
  resetSpellState(); player.hp = 50; lastStand();
  const bonus = Math.round(permanent.maxHp*0.3);
  assert(player.lastStandHealthBonus === bonus && player.maxHp === permanent.maxHp+bonus && player.hp === 50+bonus && spellCooldowns["00013"] === 60,
    "Last Stand adds 30% snapshot maximum health and the same amount of current health");
  lastStand(); assert(player.hp === 50+bonus, "Last Stand does not stack while on cooldown");
  setMenuOpen(true); update(3); setMenuOpen(false);
  assert(player.lastStandRemaining === 8, "Last Stand pauses with gameplay");
  player.hp = 5; updateCombat(8);
  assert(player.hp === 1 && player.maxHp === permanent.maxHp && !player.lastStandHealthBonus, "Last Stand expiry removes temporary health without killing the player");
  resetSpellState(); player.hp = 60; warCry(); lastStand();
  const liveHp = player.hp, liveBonus = player.lastStandHealthBonus;
  const saved = createSave();
  assert(saved.player.hp === 60 && player.hp === liveHp && liveBonus > 0 && !Object.hasOwn(saved.player, "warCryRemaining") && !Object.hasOwn(saved.player, "lastStandHealthBonus"),
    "Saving active buffs normalizes health without changing live health or persisting temporary bonuses");
  const bad = structuredClone(saved); bad.player.hp = permanent.maxHp+1;
  let rejected = false; try { parseSave(JSON.stringify(bad)); } catch { rejected = true; }
  assert(rejected, "Imported saves cannot retain temporary maximum health as permanent health");
  applySave(JSON.stringify(saved));
  assert(player.hp === 60 && player.maxHp === permanent.maxHp && !player.warCryRemaining && !player.lastStandRemaining && player.unlockedSkills.length === 9,
    "Loading removes buffs once, preserves normalized health, and retains all learned skills");
  warCry(); lastStand(); emit("combat:reset");
  assert(player.hp === 60 && player.maxHp === permanent.maxHp && !player.lastStandRemaining && !player.warCryRemaining,
    "Combat reset/travel clears buffs without leaving health bonuses behind");
  spellCooldowns["00013"] = 0; lastStand(); damagePlayer(100000);
  assert(player.hp === 0 && runtime.gameState === "dead" && !player.lastStandRemaining && !player.lastStandHealthBonus,
    "Last Stand never resurrects the player when cleared on death");
  applySave(original);
}
