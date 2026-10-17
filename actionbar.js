// ==========================================
// ACTION BAR SYSTEM
// ==========================================

const ACTION_BAR_SIZE = 10;

// Each slot contains a spell ID or null.
const actionBarSpells = Array(ACTION_BAR_SIZE).fill(null);

// Start with Fireball in slot 1.
actionBarSpells[0] = "fireball";
actionBarSpells[1] = "ignite";

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
    case "fireball":
      castFireball();
      break;

    case "ignite":
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
    const spell = spellId ? SPELLS[spellId] : null;

    let icon = slot.querySelector(".spell-icon");

    if (!icon) {
      icon = document.createElement("span");
      icon.className = "spell-icon";
      slot.appendChild(icon);
    }

    icon.textContent = spell ? (spell.icon ?? "✨") : "";

    const key = index === 9 ? "0" : String(index + 1);

    slot.title = spell
      ? `${spell.name} (${key}) — Right-click to remove`
      : `Empty slot (${key})`;

    slot.draggable = Boolean(spell);
  });
}

// ==========================================
// DRAG AND DROP
// ==========================================

function setupActionBar() {
  const slots = document.querySelectorAll("#action-bar .action-slot");

  slots.forEach((slot, index) => {

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
  window.addEventListener("keydown", (event) => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    const tag = event.target?.tagName;

    if (tag === "INPUT" || tag === "TEXTAREA" ||
        event.target?.isContentEditable) {
      return;
    }

    if (/^[0-9]$/.test(event.key)) {
      const slotIndex = event.key === "0"
        ? 9
        : Number(event.key) - 1;

      castActionBarSlot(slotIndex);
    }
  });

  renderActionBar();
}

setupActionBar();
