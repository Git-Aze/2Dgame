// ==========================================
// SPELL BOOK SYSTEM
// ==========================================

function toggleSpellBook() {
  if (!isPlaying()) return;
  const spellBook = document.getElementById("spell-book");

  if (!spellBook) return;

  const isClosed = spellBook.classList.contains("hidden");

  if (isClosed) {
    renderSpellBook();
    spellBook.classList.remove("hidden");
  } else {
    spellBook.classList.add("hidden");
  }
}

// ==========================================
// RENDER ALL SPELLS
// ==========================================

function renderSpellBook() {
  const spellList = document.getElementById("spell-list");

  if (!spellList) return;

  // Clear previous entries.
  spellList.innerHTML = "";

  // Read all spells defined in spells.js.
  for (const definition of Object.values(SPELLS)) {
    const spell = getSpellStats(definition);
    const entry = document.createElement("div");
    entry.className = "spell-book-entry";

    // Make the spell draggable.
entry.draggable = true;

entry.addEventListener("dragstart", (event) => {
  event.dataTransfer.setData("text/plain", spell.id);
  event.dataTransfer.effectAllowed = "copy";

  entry.classList.add("dragging");
});

entry.addEventListener("dragend", () => {
  entry.classList.remove("dragging");
});

    const icon = document.createElement("div");
    icon.className = "spell-book-icon";
    icon.textContent = spell.icon ?? "✨";

    const details = document.createElement("div");
    details.className = "spell-book-details";

    const name = document.createElement("div");
    name.className = "spell-book-name";
    name.textContent = spell.name;

    const description = document.createElement("div");
    description.className = "spell-book-description";
    description.textContent =
      `${spell.description ?? "No description available."} ${spell.rules ?? ""}`;

    const stats = document.createElement("div");
    stats.className = "spell-book-stats";

    const statParts = [];
    statParts.push(`Range: ${spell.minRange ? `${spell.minRange}–` : ""}${Number.isFinite(spell.range) ? spell.range : "unlimited"}px`, `Cooldown: ${spell.cooldown}s`, "Requires line of sight");

    if (spell.damage !== undefined) {
      statParts.push(`Damage: ${spell.damage}`);
    }
    if (spell.damagePerTick !== undefined) {
      statParts.push(`Damage: ${spell.damagePerTick} every ${spell.tickInterval}s for ${spell.duration}s`);
    }

    if (spell.manaCost !== undefined) {
      statParts.push(`Mana: ${spell.manaCost}`);
    }

    if (spell.requiredWeaponCategory != null) {
      statParts.push(
        `Required weapon: ${getActionWeaponRequirement(spell)}`
      );
    }

    stats.textContent = statParts.join(" | ");

    details.appendChild(name);
    details.appendChild(description);
    details.appendChild(stats);

    entry.appendChild(icon);
    entry.appendChild(details);

    spellList.appendChild(entry);
  }
}

// ==========================================
// INPUT
// ==========================================

// Open and close with K.
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "k" && !event.repeat) {
    event.preventDefault();
    toggleSpellBook();
  }
});

// Close button.
document
  .getElementById("close-spell-book")
  ?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    document.getElementById("spell-book").classList.add("hidden");
  });
