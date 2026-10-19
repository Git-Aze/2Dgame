import { renderActionBar } from "./actionbar.js";
import { on } from "../core/events.js";
import { renderEquipment, renderInventory } from "./inventory-ui.js";
import { drawImagePortrait, playerSprites } from "../rendering/player-sprites.js";
import { spendAttributePoint } from "../player/player.js";
import { renderSpellBook } from "./spellbook.js";
import { isPlaying, player } from "../core/state.js";
import { STAT_RULES, getPlayerStats } from "../player/stats.js";
import { setTooltip } from "./tooltips.js";

const sheetValueElements = new Map();
function updateXPBar() {
  const xpFill = document.getElementById("xp-bar-fill");
  const xpText = document.getElementById("xp-bar-text");

  if (!xpFill || !xpText) return;

  const percentage = Math.max(
    0,
    Math.min(100, (player.xp / player.xpToNextLevel) * 100),
  );

  xpFill.style.width = `${percentage}%`;

  xpText.textContent = `${player.xp} / ${player.xpToNextLevel} XP`;
}


function toggleCharacterSheet() {
  if (!isPlaying()) return;
  const sheet = document.getElementById("character-sheet");

  if (!sheet) return;

  sheet.classList.toggle("hidden");

  if (!sheet.classList.contains("hidden")) {
    updateCharacterSheet();
    drawCharacterSheetPortrait();
  }
}


function drawCharacterSheetPortrait() {
  const portrait = document.getElementById("sheet-portrait");

  if (!portrait) return;

  const pctx = portrait.getContext("2d");

  pctx.imageSmoothingEnabled = false;

  pctx.clearRect(0, 0, portrait.width, portrait.height);

  pctx.fillStyle = "#28363a";
  pctx.fillRect(0, 0, portrait.width, portrait.height);

  if (drawImagePortrait(portrait)) return;
  const sprite = playerSprites.down[0];

  // 16x16 -> 48x48, centered inside 64x64.
  pctx.drawImage(sprite, 0, 0, 16, 16, 8, 8, 48, 48);
}


function setSheetValue(id, value) {
  if (!sheetValueElements.has(id)) sheetValueElements.set(id, document.getElementById(id));
  const element = sheetValueElements.get(id);
  const text = String(value);
  if (element.textContent === text) return;
  element.textContent = text;
  const row = element.closest(".stat-row");
  if (row?.dataset.tooltip) row.setAttribute("aria-label", `${row.textContent.trim()}. ${row.dataset.tooltip}`);
}


function updateCharacterResources() {
  // Match the HUD's rounding; never rebuild inventory during live updates.
  setSheetValue("sheet-health", `${Math.ceil(player.hp)} / ${player.maxHp}`);
  setSheetValue("sheet-mana", `${Math.ceil(player.mana)} / ${player.maxMana}`);
  setSheetValue("sheet-gold", player.gold);
}


function updateCharacterSheet() {
  const stats = getPlayerStats();
  document.getElementById("sheet-name").textContent = player.name;
  document.getElementById("sheet-level").textContent = `Level ${player.level}`;

  document.getElementById("stat-strength").textContent = stats.strength;

  document.getElementById("stat-vitality").textContent = stats.vitality;

  document.getElementById("stat-intelligence").textContent = stats.intelligence;

  document.getElementById("stat-dexterity").textContent = stats.dexterity;

  document.getElementById("stat-armor").textContent = stats.armor;

  setSheetValue("stat-move-speed", `${stats.moveSpeed.toFixed(1)} px/s`);
  setSheetValue("stat-health-regen", `${stats.healthRegen.toFixed(2)} / s`);
  setSheetValue("stat-mana-regen", `${stats.manaRegen.toFixed(2)} / s`);
  updateCharacterResources();

  document.getElementById("attribute-points").textContent =
    player.attributePoints;

  document.querySelectorAll(".attribute-plus").forEach((button) => {
    button.disabled = player.attributePoints <= 0;
  });
  renderInventory();
  renderEquipment();
  updateStatDescriptions(stats);
  updateCharacterFrame();
  renderActionBar();
  if (!document.getElementById("spell-book").classList.contains("hidden")) renderSpellBook();
}


function updateStatDescriptions(stats) {
  const descriptions = {
    "stat-move-speed": "Movement speed in world pixels per second, including Dexterity from attributes and equipment. Diagonal movement has the same speed.",
    "stat-health-regen": "Health restored per second while alive, including equipment Vitality. Regeneration stops at maximum health.",
    "stat-mana-regen": "Mana restored per second while playing, including equipment Intelligence. Regeneration stops at maximum mana.",
    "stat-strength": `Strength: +${STAT_RULES.damagePerAttribute} melee damage and +${STAT_RULES.healthPerStrength} maximum health per point above ${STAT_RULES.attributeBaseline}, including equipment bonuses. Current maximum: ${stats.maxHp} HP. Increasing the maximum does not heal you.`,
    "stat-vitality": `Vitality: +${STAT_RULES.healthRegenPerVitality} HP regenerated per second per point, including equipment bonuses, plus ${STAT_RULES.baseHealthRegen} base regeneration. Current: ${stats.healthRegen.toFixed(2)} HP/second while alive. Does not increase maximum health.`,
    "stat-intelligence": `Intelligence: +${STAT_RULES.manaRegenPerIntelligence} mana regenerated per second per point, including equipment bonuses, plus ${STAT_RULES.baseManaRegen} base regeneration. Current: ${stats.manaRegen.toFixed(2)} mana/second. Also grants +${STAT_RULES.damagePerAttribute} casting damage per point above ${STAT_RULES.attributeBaseline}, including Ignite ticks. Does not increase maximum mana.`,
    "stat-dexterity": `Dexterity: +${STAT_RULES.speedPerDexterity * 100}% movement speed per point above ${STAT_RULES.attributeBaseline}, including equipment bonuses. Current: ${stats.moveSpeed.toFixed(1)} pixels/second. Also grants +${STAT_RULES.damagePerAttribute} ranged damage per point above ${STAT_RULES.attributeBaseline}. Does not change casting speed.`,
    "stat-armor": `Armor: each point reduces damage from an enemy attack by 1. Attacks always deal at least 1 damage. Current reduction: ${stats.armor}.`,
    "sheet-health": `Health: reaching zero ends the adventure. Maximum health is increased by Strength. Health regenerates while alive, based on Vitality.`,
    "sheet-mana": `Mana: spent to cast spells and regenerated based on Intelligence. Maximum mana is currently ${player.maxMana}. Hover over an action-bar spell to see its mana cost.`,
    "sheet-gold": "Gold: earned from quest rewards and spent on items at the General Store. Click the shop nearby or press E at its entrance.",
    "attribute-points": "Attribute points: gain 5 per level. Use the + buttons to permanently increase a base attribute by 1 for this adventure.",
    "sheet-level": "Level: earn XP from enemy kills and quests. Each level grants 5 attribute points; the next XP requirement increases by 50% (rounded down).",
  };
  for (const [id, description] of Object.entries(descriptions)) {
    const value = document.getElementById(id);
    const target = value.closest(".stat-row, .attribute-points-row") ?? value;
    setTooltip(target, description);
    target.setAttribute("aria-label", `${target.textContent.trim()}. ${description}`);
    if (!target.hasAttribute("tabindex")) target.tabIndex = 0;
  }
  setTooltip(document.getElementById("character-hp-bar"), descriptions["sheet-health"]);
  setTooltip(document.getElementById("character-mana-bar"), descriptions["sheet-mana"]);
  setTooltip(document.getElementById("xp-bar-container"), descriptions["sheet-level"]);
}


function drawCharacterPortrait() {
  const portraitCanvas = document.getElementById("portrait-canvas");
  if (!portraitCanvas) return;

  const pctx = portraitCanvas.getContext("2d");

  pctx.imageSmoothingEnabled = false;

  // Clear portrait.
  pctx.clearRect(0, 0, portraitCanvas.width, portraitCanvas.height);

  // Portrait background.
  pctx.fillStyle = "#28363a";
  pctx.fillRect(0, 0, portraitCanvas.width, portraitCanvas.height);

  // Slight inner background.
  pctx.fillStyle = "#314247";
  pctx.fillRect(3, 3, 42, 42);

  // Use the player's front-facing idle sprite.
  if (drawImagePortrait(portraitCanvas)) return;
  const sprite = playerSprites.down[0];

  // Draw the 16x16 sprite at 3x size = 48x48.
  pctx.drawImage(sprite, 0, 0, 16, 16, 0, 0, 48, 48);
}


function updateCharacterFrame() {
  const level = document.getElementById("character-level");
  if (level.textContent !== String(player.level)) {
    level.textContent = player.level;
    level.setAttribute("aria-label", `Level ${player.level}`);
  }
  // ======================================
  // HEALTH
  // ======================================

  const hpFill = document.getElementById("character-hp-fill");
  const hpText = document.getElementById("character-hp-text");

  if (hpFill && hpText) {
    const hpPercent = Math.max(
      0,
      Math.min(100, (player.hp / player.maxHp) * 100)
    );

    hpFill.style.width = `${hpPercent}%`;

    hpText.textContent =
      `${Math.ceil(player.hp)} / ${player.maxHp}`;
  }

  // ======================================
  // MANA
  // ======================================

  const manaFill = document.getElementById("character-mana-fill");
  const manaText = document.getElementById("character-mana-text");

  if (manaFill && manaText) {
    const manaPercent = player.maxMana > 0
      ? Math.max(0, Math.min(100, (player.mana / player.maxMana) * 100))
      : 0;

    manaFill.style.width = `${manaPercent}%`;

    manaText.textContent =
      `${Math.ceil(player.mana)} / ${player.maxMana}`;
  }
  if (!document.getElementById("character-sheet").classList.contains("hidden")) {
    updateCharacterResources();
  }
}


function setupCharacterUI() {
  document.getElementById("close-character-sheet").addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById("character-sheet").classList.add("hidden");
  });
  document.querySelectorAll(".attribute-plus").forEach(button => {
    button.addEventListener("click", () => spendAttributePoint(button.dataset.attribute));
  });
  on("player:changed", () => { updateCharacterSheet(); updateXPBar(); });
  on("resources:changed", updateCharacterFrame);
  on("portraits:ready", () => { drawCharacterPortrait(); drawCharacterSheetPortrait(); });
  drawCharacterPortrait();
}

export { toggleCharacterSheet, updateCharacterFrame, setupCharacterUI };
