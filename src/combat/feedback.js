import { combatFeedback, player, isPlaying } from "../core/state.js";
import { on } from "../core/events.js";

function clearCombatFeedback() {
  combatFeedback.numbers.length = 0;
  combatFeedback.notices.length = 0;
  combatFeedback.flashes.length = 0;
  combatFeedback.time = 0;
}

function addDamage({ target, amount, cause, critical = false }, incoming = false) {
  if (!(amount > 0)) return;
  const numbers = combatFeedback.numbers;
  const kind = incoming ? "incoming" : critical ? "critical" : cause === "00002" ? "dot" : "direct";
  let lane = 0;
  while (lane < 5 && numbers.some((number) => number.target === target && number.lane === lane)) lane++;
  const combined = lane === 5 ? numbers.findLast((number) => number.target === target && number.kind === kind && number.age < 0.2) : null;
  if (combined) {
    combined.amount = Math.round((combined.amount + amount) * 10) / 10;
    combined.age = 0;
  } else {
    if (lane === 5) {
      const oldest = numbers.findIndex((number) => number.target === target);
      lane = numbers[oldest].lane;
      numbers.splice(oldest, 1);
    }
    if (numbers.length >= 64) numbers.shift();
    numbers.push({ target, lane, amount: Math.round(amount * 10) / 10, kind,
      x: target.x + target.w / 2 + (lane % 2 ? 1 : -1) * Math.ceil(lane / 2) * 20,
      y: target.y - (incoming ? 28 : 55) - lane * 14, age: 0, duration: 0.9 });
  }
  let flash = combatFeedback.flashes.find((entry) => entry.target === target);
  if (!flash) {
    if (combatFeedback.flashes.length >= 24) combatFeedback.flashes.shift();
    flash = { target, incoming, remaining: 0 };
    combatFeedback.flashes.push(flash);
  }
  flash.remaining = 0.14;
}

function addNotice({ text, kind = "blocked", target = player }) {
  const notices = combatFeedback.notices;
  if (notices.some((entry) => entry.text === text && entry.age < 0.2)) return;
  if (notices.length >= 4) notices.shift();
  notices.push({ text, kind, x: target.x + target.w / 2, y: target.y - 60, age: 0, duration: 1 });
}

function updateCombatFeedback(dt) {
  if (!isPlaying()) return;
  combatFeedback.time += dt;
  expire(combatFeedback.numbers, dt);
  expire(combatFeedback.notices, dt);
  for (let index = combatFeedback.flashes.length - 1; index >= 0; index--) {
    combatFeedback.flashes[index].remaining -= dt;
    if (combatFeedback.flashes[index].remaining <= 0) combatFeedback.flashes.splice(index, 1);
  }
}

function expire(list, dt) {
  for (let index = list.length - 1; index >= 0; index--) {
    list[index].age += dt;
    if (list[index].age >= list[index].duration) list.splice(index, 1);
  }
}

function setupCombatFeedback() {
  on("enemy:hurt", (hit) => addDamage(hit));
  on("player:hurt", (hit) => { if (hit) addDamage(hit, true); });
  on("combat:notice", addNotice);
  on("combat:reset", clearCombatFeedback);
  on("player:died", clearCombatFeedback);
}

export { setupCombatFeedback, updateCombatFeedback };
