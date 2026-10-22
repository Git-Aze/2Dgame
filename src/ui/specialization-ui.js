import { setTooltip } from "./tooltips.js";
import { player, isPlaying } from "../core/state.js";
import { getSpecializationTree } from "../data/specializations.js";
import { getClass } from "../data/classes.js";
import { SPELLS } from "../data/action-definitions.js";
import { getSpellStats } from "../player/stats.js";
import { getUnlockReason, unlockSkill } from "../player/specializations.js";
import { on } from "../core/events.js";

let previousFocus = null;
function closeSpecializationTree() {
  const panel = document.getElementById("specialization-tree");
  if (panel.classList.contains("hidden")) return;
  if (panel.contains(document.activeElement)) document.activeElement.blur();
  panel.classList.add("hidden"); panel.inert = true;
  if (isPlaying() && previousFocus?.isConnected && !previousFocus.closest(".hidden,[hidden],[inert]")) previousFocus.focus();
}

function renderSpecializationTree() {
  const panel = document.getElementById("specialization-tree");
  if (panel.classList.contains("hidden")) return;
  const focused = panel.contains(document.activeElement) && document.activeElement !== document.getElementById("close-specialization-tree");
  const focusedAbility = focused ? document.activeElement.dataset.abilityId : null;
  const tree = getSpecializationTree(player.classId);
  document.getElementById("specialization-title").textContent = tree?.name ?? `${getClass(player.classId).name} Specialization`;
  document.getElementById("specialization-points").textContent = `Available points: ${player.specializationPoints}`;
  const content = document.getElementById("specialization-nodes");
  const scroll = content.scrollTop;
  content.replaceChildren();
  if (!tree) {
    const message = document.createElement("p");
    message.textContent = "Your class's specialization tree is coming later. Level-up points are saved for future skills.";
    content.append(message);
  } else {
    const canvas = document.createElement("div"); canvas.className = "specialization-map";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100"); svg.setAttribute("preserveAspectRatio", "none");
    svg.classList.add("specialization-links"); svg.setAttribute("aria-hidden", "true");
    for (const node of tree.nodes) for (const prerequisite of node.prerequisites) {
      const parent = tree.nodes.find(entry => entry.abilityId === prerequisite);
      const line = document.createElementNS(svg.namespaceURI, "line");
      line.setAttribute("x1", parent.position[0]); line.setAttribute("y1", parent.position[1]);
      line.setAttribute("x2", node.position[0]); line.setAttribute("y2", node.position[1]);
      const learned = player.unlockedSkills.includes(node.abilityId);
      line.setAttribute("class", learned ? "learned" : player.unlockedSkills.includes(prerequisite) ? "available" : "locked");
      line.dataset.from = prerequisite; line.dataset.to = node.abilityId;
      svg.append(line);
    }
    canvas.append(svg);
    for (const node of tree.nodes) {
      const spell = getSpellStats(SPELLS[node.abilityId]);
      const learned = player.unlockedSkills.includes(spell.id), reason = getUnlockReason(spell.id);
      const button = document.createElement("button"); button.type = "button";
      button.className = `specialization-icon ${learned ? "learned" : reason ? "locked" : "available"}`;
      button.dataset.abilityId = spell.id;
      button.style.left = `${node.position[0]}%`; button.style.top = `${node.position[1]}%`;
      // Keep unavailable nodes focusable so their tooltips remain accessible.
      button.setAttribute("aria-disabled", String(Boolean(reason)));
      const icon = document.createElement("span"); icon.textContent = spell.icon; icon.setAttribute("aria-hidden", "true");
      button.append(icon);
      const lines = [spell.name, spell.description];
      if (spell.damage !== undefined) lines.push(`Damage: ${spell.damage} per hit`);
      if (spell.damagePerTick !== undefined) lines.push(`Damage: ${spell.damagePerTick} every ${spell.tickInterval}s for ${spell.duration}s`);
      lines.push(`Cooldown: ${spell.cooldown}s`, `Mana cost: ${spell.manaCost}`);
      lines.push(spell.target === "self" ? "Target: yourself" : `Range: ${spell.minRange ? `${spell.minRange}-` : ""}${Number.isFinite(spell.range) ? spell.range + "px" : "unlimited"}`);
      if (spell.requiredWeaponClass) lines.push(`Requires: ${spell.requiredWeaponClass}`);
      if (spell.requiredOffhandClass) lines.push(`Requires offhand: ${spell.requiredOffhandClass}`);
      lines.push(spell.rules);
      if (node.prerequisites.length) lines.push(`Prerequisite: ${node.prerequisites.map(id => SPELLS[id].name).join(", ")}`);
      lines.push(learned ? "Learned" : "Cost: 1 specialization point", learned ? "" : reason || "Click to learn.");
      const tooltip = lines.filter(Boolean).join("\n");
      setTooltip(button, tooltip);
      button.setAttribute("aria-label", tooltip);
      button.addEventListener("click", () => unlockSkill(spell.id));
      canvas.append(button);
    }
    content.append(canvas);
  }
  content.scrollTop = scroll;
  if (focused) (focusedAbility ? content.querySelector(`[data-ability-id="${focusedAbility}"]`) : null)?.focus();
}

function toggleSpecializationTree() {
  if (!isPlaying()) return;
  const panel = document.getElementById("specialization-tree");
  if (!panel.classList.contains("hidden")) { closeSpecializationTree(); return; }
  previousFocus = document.activeElement;
  panel.classList.remove("hidden"); panel.inert = false;
  renderSpecializationTree();
  document.getElementById("close-specialization-tree").focus();
}

function setupSpecializationUI() {
  document.getElementById("close-specialization-tree").addEventListener("click", closeSpecializationTree);
  const panel = document.getElementById("specialization-tree");
  panel.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const controls = [...panel.querySelectorAll("button:not(:disabled),[tabindex='0']")];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  on("player:changed", renderSpecializationTree);
  on("game:statechanged", closeSpecializationTree);
  on("area:changed", closeSpecializationTree);
  on("shop:opened", closeSpecializationTree);
  on("menu:changed", open => { if (open) closeSpecializationTree(); });
}

export { toggleSpecializationTree, closeSpecializationTree, setupSpecializationUI };
