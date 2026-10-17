import { emit } from "./events.js";
import { showMessage } from "./messages.js";
import { gainXP } from "./player.js";
import { QUEST_DEFINITIONS } from "./quests.js";
import { isPlaying, player, questProgress } from "./state.js";

function resetQuests() {
  for (const id of Object.keys(questProgress)) delete questProgress[id];
  for (const quest of Object.values(QUEST_DEFINITIONS)) {
    questProgress[quest.id] = {
      status: quest.prerequisites?.length ? "locked" : "available",
      objectives: quest.objectives.map(() => 0),
    };
  }
  emit("quests:changed");
}

function acceptQuest(id) {
  if (!isPlaying() || !Object.hasOwn(QUEST_DEFINITIONS, id)) return false;
  const progress = questProgress[id];
  if (!progress || progress.status !== "available") return false;
  if (!(QUEST_DEFINITIONS[id].prerequisites ?? []).every((requiredId) =>
      questProgress[requiredId]?.status === "completed")) return false;
  progress.status = "active";
  showMessage(`Quest started: ${QUEST_DEFINITIONS[id].title}.`);
  emit("quests:changed");
  return true;
}

function completeQuest(id) {
  if (!isPlaying() || !Object.hasOwn(QUEST_DEFINITIONS, id)) return false;
  const quest = QUEST_DEFINITIONS[id];
  const progress = questProgress[id];
  if (!progress || progress.status !== "active" ||
      !quest.objectives.every((objective, index) =>
        progress.objectives[index] >= objective.required)) return false;

  // Mark complete before granting rewards so repeated events cannot pay twice.
  progress.status = "completed";
  player.gold += quest.rewards.gold;
  gainXP(quest.rewards.xp);
  showMessage(`Quest completed: ${quest.title}! +${quest.rewards.xp} XP, +${quest.rewards.gold} gold.`);
  for (const next of Object.values(QUEST_DEFINITIONS)) {
    if (questProgress[next.id].status === "locked" &&
        next.prerequisites.every((requiredId) => questProgress[requiredId]?.status === "completed")) {
      questProgress[next.id].status = "available";
      acceptQuest(next.id);
    }
  }
  emit("quests:changed");
  return true;
}

function recordQuestEvent(event) {
  if (!isPlaying()) return;
  const objectiveType = event.type === "enemyDefeated" ? "kill"
    : event.type === "itemEquipped" ? "equip" : null;
  if (!objectiveType) return;
  const targetId = objectiveType === "kill" ? event.enemyTypeId : event.itemId;
  let changed = false;
  for (const quest of Object.values(QUEST_DEFINITIONS)) {
    const progress = questProgress[quest.id];
    if (!progress || progress.status !== "active") continue;
    quest.objectives.forEach((objective, index) => {
      if (objective.type === objectiveType && objective.targetId === targetId &&
          progress.objectives[index] < objective.required) {
        progress.objectives[index]++;
        changed = true;
      }
    });
    // Completion renders the whole log, including any earlier progress changes.
    if (completeQuest(quest.id)) changed = false;
  }
  if (changed) emit("quests:changed");
}

export { resetQuests, acceptQuest, recordQuestEvent };
