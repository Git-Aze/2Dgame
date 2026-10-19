import { SPELLS } from "../data/action-definitions.js";
import { showMessage } from "./messages.js";
import { castFireball, castIgnite, chargeAttack, getActionWeaponRequirement, getActionUnavailableReason, swordAttack, rangedAttack } from "../combat/spells.js";
import { ACTION_BAR_SIZE, actionBarSpells, isPlaying, spellCooldowns } from "../core/state.js";
import { getSpellStats } from "../player/stats.js";
import { setTooltip } from "./tooltips.js";

const slotStates = [];
const statusLabels = { paused: "Paused", cooldown: "Cooldown", casting: "Casting", charging: "Charging", weapon: "Weapon", target: "Target",
  "too-close": "Too close", range: "Range", blocked: "Blocked", mana: "Mana" };

function updateActionBarStatus() {
  for (const entry of slotStates) {
    const reason = entry.spell ? getActionUnavailableReason(entry.spell) : "";
    const remaining = entry.spell ? Math.max(0, spellCooldowns[entry.spell.id] ?? 0) : 0;
    const countdown = remaining > 0 ? (remaining >= 10 ? String(Math.ceil(remaining)) : (Math.ceil(remaining * 10) / 10).toFixed(1)) : "";
    if (entry.lastCountdown !== countdown) {
      entry.countdown.textContent = countdown;
      entry.lastCountdown = countdown;
    }
    if (entry.lastReason !== reason) {
      entry.lastReason = reason;
      entry.label.textContent = statusLabels[reason] ?? "";
      if (reason) entry.slot.dataset.unavailable = reason;
      else delete entry.slot.dataset.unavailable;
      entry.slot.setAttribute("aria-disabled", String(!entry.spell || Boolean(reason)));
      entry.slot.setAttribute("aria-label", `${entry.slot.dataset.tooltip}${reason ? `\nUnavailable: ${statusLabels[reason]}` : ""}`);
    }
  }
}

// ==========================================
// ACTION BAR SYSTEM
// ==========================================

// ==========================================
// ASSIGN AND REMOVE SPELLS
// ==========================================

function assignSpellToSlot(spellId, slotIndex) {
  if (!isPlaying()) return;
  if (!Object.hasOwn(SPELLS, spellId)) return;
  if (!Number.isInteger(slotIndex) ||
      slotIndex < 0 || slotIndex >= ACTION_BAR_SIZE) return;

  actionBarSpells[slotIndex] = spellId;

  renderActionBar();
}

function clearActionBarSlot(slotIndex) {
  if (!isPlaying()) return;
  actionBarSpells[slotIndex] = null;
  renderActionBar();
}

// ==========================================
// CAST ASSIGNED SPELL
// ==========================================

function castActionBarSlot(slotIndex) {
  if (!isPlaying()) return;
  const spellId = actionBarSpells[slotIndex];

  if (!spellId) return;

  switch (spellId) {
    case "00005":
      rangedAttack();
      break;
    case "00004":
      chargeAttack();
      break;
    case "00003":
      swordAttack();
      break;
    case "00001":
      castFireball();
      break;

    case "00002":
      castIgnite();
      break;

    default:
      showMessage(
        `${SPELLS[spellId]?.name ?? spellId} cannot be cast yet.`
      );
      break;
  }
}

// ==========================================
// RENDER ACTION BAR
// ==========================================

function renderActionBar() {
  const slots = document.querySelectorAll("#action-bar .action-slot");

  slots.forEach((slot, index) => {
    const spellId = actionBarSpells[index];
    const spell = spellId ? getSpellStats(SPELLS[spellId]) : null;
    if (slotStates[index]) {
      slotStates[index].spell = spell;
      slotStates[index].lastReason = null;
    }

    let icon = slot.querySelector(".spell-icon");

    if (!icon) {
      icon = document.createElement("span");
      icon.className = "spell-icon";
      slot.appendChild(icon);
    }

    icon.textContent = spell ? (spell.icon ?? "✨") : "";

    const key = index === 9 ? "0" : String(index + 1);

    setTooltip(slot, spell ? createActionTooltip(spell, key) : `Empty slot (${key})`);
    slot.setAttribute("aria-label", slot.dataset.tooltip);

    slot.draggable = Boolean(spell);
  });
  updateActionBarStatus();
}

function createActionTooltip(spell, key) {
  const lines = [`${spell.name} (${key})`, `ID: ${spell.id}`, spell.description];
  if (spell.damage !== undefined) lines.push(`Damage: ${spell.damage} per hit`);
  if (spell.critChance !== undefined) lines.push(`Critical chance: ${Math.round(spell.critChance * 10000) / 100}%. Critical hits deal double damage.`);
  if (spell.damagePerTick !== undefined) {
    const ticks = Math.floor(spell.duration / spell.tickInterval);
    lines.push(`Damage: ${spell.damagePerTick} every ${spell.tickInterval}s for ${spell.duration}s (${ticks * spell.damagePerTick} total)`);
  }
  lines.push(`Mana cost: ${spell.manaCost}`);
  lines.push(`Range: ${spell.minRange ? `${spell.minRange}–` : ""}${Number.isFinite(spell.range) ? spell.range : "unlimited"} pixels · Cooldown: ${spell.cooldown}s`);
  lines.push("Requires line of sight. Cliffs and tree trunks block spells; water does not.");
  lines.push(spell.rules);
  if (spell.castTime) {
    lines.push(`Cast time: ${spell.castTime}s`);
  } else {
    lines.push("Cast time: instant");
  }
  if (spell.requiredWeaponCategory) lines.push(`Requires: ${getActionWeaponRequirement(spell)}`);
  lines.push("Select an enemy to cast. Right-click to remove.");
  return lines.filter(Boolean).join("\n");
}

// ==========================================
// DRAG AND DROP
// ==========================================

function setupActionBar() {
  const slots = document.querySelectorAll("#action-bar .action-slot");

  slots.forEach((slot, index) => {
    const countdown = document.createElement("span");
    countdown.className = "action-cooldown";
    countdown.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.className = "action-status";
    label.setAttribute("aria-hidden", "true");
    slot.append(countdown, label);
    slotStates[index] = { slot, countdown, label, spell: null, lastCountdown: null, lastReason: null };

    // Click to cast.
    slot.addEventListener("click", (event) => {
      event.stopPropagation();
      castActionBarSlot(index);
    });

    // Allow dropping spells onto slots.
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      slot.classList.add("drag-over");
    });

    slot.addEventListener("dragleave", () => {
      slot.classList.remove("drag-over");
    });

    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();

      slot.classList.remove("drag-over");

      if (!isPlaying()) return;

      if (!event.dataTransfer) return;

      const spellId = event.dataTransfer.getData("text/plain");

      if (!Object.hasOwn(SPELLS, spellId)) return;

      const sourceIndexText =
        event.dataTransfer.getData("application/x-action-slot");

      if (sourceIndexText !== "") {
        // Only accept the decimal slot format written by dragstart.
        if (!/^(0|[1-9][0-9]*)$/.test(sourceIndexText)) return;

        const sourceIndex = Number(sourceIndexText);

        if (!Number.isInteger(sourceIndex) ||
            sourceIndex < 0 || sourceIndex >= ACTION_BAR_SIZE) return;
        if (actionBarSpells[sourceIndex] !== spellId) return;
        if (sourceIndex === index) return;

        // Swap assignments when dragging between action-bar slots.
        const destinationSpell = actionBarSpells[index];

        actionBarSpells[index] = spellId;
        actionBarSpells[sourceIndex] = destinationSpell;

        renderActionBar();
      } else {
        // Dragged from Spell Book.
        assignSpellToSlot(spellId, index);
      }
    });

    // Drag spells from one action-bar slot to another.
    slot.addEventListener("dragstart", (event) => {
      const spellId = actionBarSpells[index];

      if (!spellId) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.setData("text/plain", spellId);
      event.dataTransfer.setData(
        "application/x-action-slot",
        String(index)
      );

      event.dataTransfer.effectAllowed = "move";
    });

    // Right-click to remove a spell.
    slot.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      clearActionBarSlot(index);
    });
  });

  // Number keys 1–9 and 0.


}

export { assignSpellToSlot, castActionBarSlot, renderActionBar, updateActionBarStatus, setupActionBar };
