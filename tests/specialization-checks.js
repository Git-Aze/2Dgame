import "../src/game.js";
import { player, runtime, inventory, enemies, actionBarSpells, spellCooldowns, questProgress } from "../src/core/state.js";
import { startGame, resetAdventure, setGameState } from "../src/core/lifecycle.js";
import { gainXP, damagePlayer } from "../src/player/player.js";
import { equipItem, unequipItem } from "../src/player/inventory.js";
import { unlockSkill } from "../src/player/specializations.js";
import { canUseAbility } from "../src/data/classes.js";
import { SPELLS } from "../src/data/action-definitions.js";
import { cleaveAttack, rendAttack, shieldWall, chargeAttack, updateCombat, updateSpellCooldowns, resetSpellState } from "../src/combat/spells.js";
import { getDamageTaken, getSpellStats } from "../src/player/stats.js";
import { toggleSpellBook } from "../src/ui/spellbook.js";
import { assignSpellToSlot } from "../src/ui/actionbar.js";
import { setMenuOpen } from "../src/core/pause-menu.js";
import { update } from "../src/core/update.js";
import { createSave, applySave, parseSave } from "../src/persistence/saves.js";
import { emit } from "../src/core/events.js";
import { mapCollision } from "../src/world/collision.js";
import { trees } from "../src/world/world-state.js";
import { buildings } from "../src/world/buildings.js";
import { runWarriorSkillChecks } from "./warrior-skill-checks.js";

let checks = 0;
const errors = [];
window.addEventListener("error", event => errors.push(event.message));
const assert = (value, label) => { if (!value) throw Error(label); checks++; };
const rejects = action => { try { action(); return false; } catch { return true; } };
const near = (a,b) => Math.abs(a-b) < 0.00001;
const key = (value, repeat = false) => window.dispatchEvent(new KeyboardEvent("keydown", { key: value, repeat, bubbles: true, cancelable: true }));
const tick = () => new Promise(resolve => { requestAnimationFrame(resolve); setTimeout(resolve, 50); });
const originalRandom = Math.random;
try {
  Math.random = () => 0.99;
  runtime.selectedClassId = "warrior"; startGame(); equipItem("02000");
  const panel = document.getElementById("specialization-tree");
  assert(player.level === 1 && player.specializationPoints === 0 && !player.unlockedSkills.length && actionBarSpells.filter(Boolean).join() === "00003", "Warrior starts with Sword Strike only and no specialization points");
  assert(!unlockSkill("00004") && !unlockSkill("00006"), "Skills cannot be learned without points");
  assignSpellToSlot("00004", 3);
  assert(!actionBarSpells[3], "Locked skill cannot be placed on action bar");
  chargeAttack(); assert(!runtime.activeCharge, "Locked Charge cannot be executed directly");
  key("N"); assert(!panel.classList.contains("hidden") && document.activeElement.id === "close-specialization-tree", "N opens tree and focuses close control");
  key("n", true); assert(!panel.classList.contains("hidden"), "Held N does not toggle repeatedly");
  key("Escape"); assert(panel.classList.contains("hidden") && !runtime.menuOpen, "Escape closes tree before pausing");
  key("Escape"); assert(runtime.menuOpen, "Following Escape opens pause menu"); setMenuOpen(false);
  gainXP(100);
  assert(player.level === 2 && player.specializationPoints === 1, "A level grants one specialization point");
  key("n");
  const lockedCleave = document.querySelector('[data-ability-id="00006"]');
  lockedCleave.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse", clientX: 300, clientY: 200 }));
  assert(!document.getElementById("game-tooltip").hidden && document.getElementById("game-tooltip").textContent.includes("Requires Charge") && document.getElementById("game-tooltip").textContent.includes("Damage:"),
    "Locked icon immediately shows effects, damage, cost and prerequisite on hover");
  lockedCleave.click();
  assert(!player.unlockedSkills.length && player.specializationPoints === 1, "First point must unlock Charge");
  lockedCleave.focus();
  assert(!document.getElementById("game-tooltip").hidden, "Locked nodes expose tooltips on keyboard focus");
  assert(document.querySelectorAll(".specialization-icon").length === 9 && document.querySelectorAll(".specialization-links line").length === 8 && !document.querySelector(".specialization-node"),
    "Tree uses nine icon-only nodes connected by eight prerequisite lines");
  document.querySelector('[data-ability-id="00004"]').click();
  assert(player.unlockedSkills.join() === "00004" && player.specializationPoints === 0 && actionBarSpells[0] === "00004", "First tree selection spends one point and assigns Charge to leftmost empty slot");
  assert(!unlockSkill("00006") && !unlockSkill("00007"), "Repeat clicks and overspending are rejected");
  gainXP(712);
  assert(player.level === 5 && player.specializationPoints === 3, "Multiple levels grant exactly one point each");
  assert(!unlockSkill("00007") && player.specializationPoints === 3, "Rend requires Cleave without consuming points");
  assert(unlockSkill("00008") && unlockSkill("00006") && unlockSkill("00007"), "Charge branches into Shield Wall and Cleave, followed by Rend");
  assert(player.specializationPoints === 0 && player.unlockedSkills.length === 4, "Every learned node costs one point");
  key("n"); toggleSpellBook();
  assert(document.querySelectorAll(".spell-book-entry").length === 5, "Spell book shows Sword Strike and four learned skills");
  document.getElementById("spell-book").classList.add("hidden");
  const saved = JSON.stringify(createSave()); applySave(saved);
  assert(player.unlockedSkills.length === 4 && player.specializationPoints === 0 && actionBarSpells[1] === "00008", "Save/load preserves skills, points and leftmost action assignments");
  const oldBranch = JSON.parse(saved); oldBranch.version = 7;
  oldBranch.player.unlockedSkills = ["00006", "00007"]; oldBranch.player.specializationPoints = 2;
  oldBranch.actionBar = [null, null, "00003", null, null, "00006", "00007", null, null, null];
  const refunded = parseSave(JSON.stringify(oldBranch));
  assert(refunded.version === 8 && refunded.player.specializationPoints === 4 && !refunded.player.unlockedSkills.length && refunded.actionBar.filter(Boolean).join() === "00003",
    "Older Cleave-first builds refund the inaccessible branch without granting free skills");
  const oldValid = JSON.parse(saved); oldValid.version = 7;
  assert(parseSave(JSON.stringify(oldValid)).player.unlockedSkills.length === 4, "Older builds already containing Charge retain all learned skills");
  for (const mutate of [
    save => { save.player.specializationPoints = 1; },
    save => { save.player.unlockedSkills.push("00004"); },
    save => { save.player.unlockedSkills = ["00008"]; save.player.specializationPoints = 3; },
    save => { save.player.unlockedSkills = ["00001"]; save.player.specializationPoints = 3; },
    save => { save.player.unlockedSkills = []; save.player.specializationPoints = 4; save.actionBar[0] = "00004"; },
  ]) { const bad = JSON.parse(saved); mutate(bad); assert(rejects(() => applySave(JSON.stringify(bad))), "Forged skills, prerequisites, points or action assignments are rejected"); }
  const old = JSON.parse(saved); old.version = 6; delete old.player.specializationPoints; delete old.player.unlockedSkills;
  const migrated = parseSave(JSON.stringify(old));
  assert(migrated.version === 8 && !migrated.needsClassSelection && migrated.player.specializationPoints === 4 && !migrated.player.unlockedSkills.length && migrated.actionBar.filter(Boolean).join() === "00003",
    "Version 6 keeps class, refunds all earned points and removes formerly free/locked skills");
  for (const list of Object.values(mapCollision)) list.length = 0;
  trees.length = 0; buildings.length = 0;
  Object.assign(player, { x: 800, y: 800 });
  for (const enemy of enemies) enemy.alive = false;
  const prepare = (enemy, x, y) => Object.assign(enemy, { x, y, w: 24, h: 24, hp: 1000, maxHp: 1000, alive: true, xpReward: 0 });
  const front = prepare(enemies[0], 840, 802), side = prepare(enemies[1], 850, 822), behind = prepare(enemies[2], 760, 802), far = prepare(enemies[3], 900, 802);
  runtime.selectedEnemy = front;
  const cleaveDamage = getSpellStats(SPELLS["00006"]).damage;
  cleaveAttack();
  assert(near(front.hp, 1000-cleaveDamage) && near(side.hp, 1000-cleaveDamage) && behind.hp === 1000 && far.hp === 1000 && spellCooldowns["00006"] === 5,
    "Cleave hits only nearby enemies in its forward cone");
  const hp = front.hp; cleaveAttack(); assert(front.hp === hp, "Cleave cooldown blocks repeat hits");
  spellCooldowns["00006"] = 0;
  mapCollision.solid.push({ points: [[852,825],[858,825],[858,845],[852,845]], x: 852, y: 825, w: 6, h: 20 });
  side.hp = 1000; cleaveAttack();
  assert(side.hp === 1000 && front.hp < hp, "Cleave cannot hit secondary enemies through scenery");
  mapCollision.solid.length = 0;
  resetSpellState();
  const tickDamage = getSpellStats(SPELLS["00007"]).damagePerTick;
  rendAttack(); const beforeBleed = front.hp;
  updateCombat(0.75); updateSpellCooldowns(4); rendAttack(); updateCombat(0.25);
  assert(near(front.hp, beforeBleed-tickDamage), "Rend refresh preserves the next tick and does not stack");
  front.x = 1200; updateCombat(5.75);
  assert(near(front.hp, beforeBleed-tickDamage*6), "Rend ticks six times across refreshed duration even outside melee range");
  const afterBleed = front.hp; updateCombat(5); assert(front.hp === afterBleed, "Expired bleed stops dealing damage");
  front.x = 840;
  resetSpellState(); rendAttack(); const frozen = front.hp;
  setMenuOpen(true); update(2); setMenuOpen(false);
  assert(front.hp === frozen, "Bleed pauses with gameplay");
  updateCombat(1); assert(front.hp < frozen, "Bleed resumes after pause");
  emit("combat:reset"); const cleared = front.hp; updateCombat(2);
  assert(front.hp === cleared, "Area/reset event clears bleeds");
  runtime.selectedEnemy = null;
  shieldWall(); assert(!player.shieldWallRemaining && !spellCooldowns["00008"], "Shield Wall requires an equipped shield without spending cooldown");
  equipItem("05000"); shieldWall();
  assert(player.shieldWallRemaining === 5 && spellCooldowns["00008"] === 30 && getDamageTaken(14, { armor: 4 }) === 6,
    "Shield Wall works without an enemy target and reduces damage by 40% after armor");
  assert(getDamageTaken(2, { armor: 100 }) === 1, "Shield Wall preserves minimum incoming damage");
  setMenuOpen(true); update(2); setMenuOpen(false);
  assert(player.shieldWallRemaining === 5, "Shield Wall duration freezes while paused");
  updateCombat(4.9); assert(player.shieldWallRemaining > 0, "Shield Wall lasts for its advertised duration");
  updateCombat(0.1); assert(near(player.shieldWallRemaining, 0) && getDamageTaken(14, { armor: 4 }) === 10, "Shield Wall expires and restores normal damage");
  spellCooldowns["00008"] = 0; shieldWall(); unequipItem("offhand");
  assert(player.shieldWallRemaining === 0, "Removing shield immediately ends Shield Wall");
  applySave(saved); assert(!player.shieldWallRemaining, "Loading never restores transient defensive buffs");
  resetAdventure("village", "warrior"); setGameState("playing"); gainXP(100);
  actionBarSpells.fill("00003");
  assert(unlockSkill("00004") && actionBarSpells.every(id => id === "00003"), "Learning with a full action bar preserves all existing assignments");
  key("n"); damagePlayer(100000);
  assert(panel.classList.contains("hidden"), "Death closes specialization tree");
  startGame(); assert(!player.unlockedSkills.length && !player.specializationPoints && actionBarSpells.filter(Boolean).join() === "00003", "Fresh restart resets specialization progress");
  resetAdventure("village", "hunter"); setGameState("playing"); gainXP(100);
  assert(player.specializationPoints === 1 && !unlockSkill("00004") && !canUseAbility("00004", "hunter", ["00004"]), "Other classes retain earned points but cannot learn warrior nodes");
  key("n"); assert(document.getElementById("specialization-nodes").textContent.includes("coming later"), "Other classes see an explicit future-tree message"); key("n");
  runWarriorSkillChecks(assert);
  resetAdventure("village", "warrior"); setGameState("playing"); gainXP(100); key("n");
  const frame = window.frameElement, original = [frame.style.width, frame.style.height];
  for (const [width, height] of [[390,480],[320,320]]) {
    frame.style.width = `${width}px`; frame.style.height = `${height}px`; await tick(); await tick();
    const close = document.getElementById("close-specialization-tree").getBoundingClientRect();
    const footer = document.querySelector(".specialization-footer").getBoundingClientRect();
    const content = document.getElementById("specialization-nodes");
    const root = document.querySelector('[data-ability-id="00004"]').getBoundingClientRect();
    const shield = document.querySelector('[data-ability-id="00008"]').getBoundingClientRect();
    const cleave = document.querySelector('[data-ability-id="00006"]').getBoundingClientRect();
    const rend = document.querySelector('[data-ability-id="00007"]').getBoundingClientRect();
    assert(root.top < shield.top && near(shield.top, cleave.top) && shield.left < root.left && root.left < cleave.left && rend.top > cleave.top,
      "Icon layout shows Charge splitting to Shield Wall/Cleave with Rend beneath Cleave");
    assert(close.top >= 8 && close.right <= innerWidth-8 && footer.bottom <= innerHeight-8 && content.scrollHeight > content.clientHeight,
      "Tree fits short/narrow viewports with pinned close/footer and scrolling content");
  }
  frame.style.width = original[0]; frame.style.height = original[1];
  assert(!errors.length, `Browser errors: ${errors.join("; ")}`);
  parent.postMessage({ type: "smoke-results", passed: true, result: `PASS: ${checks} specialization checks` }, location.origin);
} catch (error) {
  parent.postMessage({ type: "smoke-results", passed: false, result: `FAIL after ${checks} specialization checks: ${error.stack}` }, location.origin);
} finally { Math.random = originalRandom; }
