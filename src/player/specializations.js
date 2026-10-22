import { getSpecializationTree } from "../data/specializations.js";
import { player, isPlaying, actionBarSpells } from "../core/state.js";
import { emit } from "../core/events.js";
import { SPELLS } from "../data/action-definitions.js";
import { showMessage } from "../ui/messages.js";

function getUnlockReason(abilityId) {
  const node = getSpecializationTree(player.classId)?.nodes.find(entry => entry.abilityId === abilityId);
  if (!node) return "Not available to your class.";
  if (player.unlockedSkills.includes(abilityId)) return "Already learned.";
  if (!node.prerequisites.every(id => player.unlockedSkills.includes(id))) {
    return `Requires ${node.prerequisites.map(id => SPELLS[id].name).join(", ")}.`;
  }
  return player.specializationPoints > 0 ? "" : "Gain a level to earn a specialization point.";
}

function unlockSkill(abilityId) {
  if (!isPlaying() || getUnlockReason(abilityId)) return false;
  player.specializationPoints--;
  player.unlockedSkills.push(abilityId);
  if (!actionBarSpells.includes(abilityId)) {
    const slot = actionBarSpells.indexOf(null);
    if (slot >= 0) actionBarSpells[slot] = abilityId;
  }
  showMessage(`Learned ${SPELLS[abilityId].name}! Find it in your spell book (K).`);
  emit("player:changed");
  return true;
}

export { getUnlockReason, unlockSkill };
