import { on } from "../core/events.js";
import { QUEST_DEFINITIONS } from "../quests/quests.js";
import { questProgress, runtime, keys, isPlaying } from "../core/state.js";
import { getItem } from "../data/items.js";
import { ENEMY_TYPES } from "../data/enemy-types.js";

const groups = [["active", "In progress"], ["available", "Available"], ["locked", "Locked"], ["completed", "Completed"]];
const statusNames = { active: "In progress", available: "Available", locked: "Locked", completed: "Completed" };
let previousFocus = null;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function selectedQuest() {
  if (!Object.hasOwn(QUEST_DEFINITIONS, runtime.selectedQuestId) || !questProgress[runtime.selectedQuestId]) {
    const ids = Object.keys(QUEST_DEFINITIONS);
    runtime.selectedQuestId = ids.find(id => questProgress[id]?.status === "active") ??
      (questProgress.firstSteps?.status === "available" ? "firstSteps" : ids.find(id => questProgress[id]?.status === "available")) ?? ids[0];
  }
  return QUEST_DEFINITIONS[runtime.selectedQuestId];
}

function objectiveText(objective, count) {
  const name = objective.type === "equip" ? getItem(objective.targetId)?.name
    : ENEMY_TYPES.find(type => type.id === objective.targetId)?.name;
  return `${objective.type === "equip" ? "Equip" : "Defeat"} ${name ?? objective.targetId}: ${count} / ${objective.required}`;
}

function prerequisiteText(quest) {
  return `Requires: ${(quest.prerequisites ?? []).map(id => QUEST_DEFINITIONS[id].title).join(", ")}`;
}

function renderTracker() {
  const quest = selectedQuest(), progress = questProgress[quest.id];
  const tracker = document.getElementById("tracked-quest");
  tracker.replaceChildren();
  if (!progress) return;
  tracker.append(element("h3", "tracked-quest-name", quest.title));
  if (progress.status === "locked") tracker.append(element("p", "quest-status", prerequisiteText(quest)));
  else if (progress.status === "available") tracker.append(element("p", "quest-status", quest.startHint ?? "Begins when you start playing"));
  else if (progress.status === "completed") tracker.append(element("p", "quest-complete", "Completed - rewards received"));
  else for (let index = 0; index < quest.objectives.length; index++) {
    tracker.append(element("p", "quest-status", objectiveText(quest.objectives[index], progress.objectives[index])));
  }
}

function renderDetails() {
  const quest = selectedQuest(), progress = questProgress[quest.id];
  const details = document.getElementById("quest-details");
  details.replaceChildren();
  if (!progress) return;
  details.append(element("span", `quest-badge quest-badge-${progress.status}`, statusNames[progress.status]),
    element("h3", "quest-detail-title", quest.title), element("p", "quest-description", quest.description));
  details.append(element("h4", "quest-section-title", "Objectives"));
  if (progress.status === "locked") details.append(element("p", "quest-status", prerequisiteText(quest)));
  if (progress.status === "available") details.append(element("p", "quest-status", quest.startHint ?? "Begins when you start playing"));
  const objectives = element("ul", "quest-objectives");
  quest.objectives.forEach((objective, index) => {
    const count = progress.objectives[index];
    objectives.append(element("li", count >= objective.required ? "quest-objective-complete" : "", objectiveText(objective, count)));
  });
  details.append(objectives, element("h4", "quest-section-title", "Rewards"));
  const rewards = element("div", "quest-reward-box");
  rewards.append(element("strong", "", `${quest.rewards.xp} XP`));
  if (quest.rewards.gold) rewards.append(element("span", "", `${quest.rewards.gold} gold`));
  details.append(rewards);
  if (progress.status === "completed") details.append(element("p", "quest-complete", "Quest complete. Rewards have been received."));
  details.append(element("p", "quest-tracking-note", "Selected for your on-screen tracker"));
}

function selectQuest(id) {
  if (!isPlaying() || !Object.hasOwn(QUEST_DEFINITIONS, id) || !questProgress[id]) return false;
  runtime.selectedQuestId = id;
  document.querySelectorAll("#quest-list .quest-row").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.questId === id));
  });
  renderTracker(); renderDetails();
  document.getElementById("quest-details").scrollTop = 0;
  return true;
}

function renderQuestList() {
  const list = document.getElementById("quest-list");
  const scroll = list.scrollTop;
  const focusedQuest = list.contains(document.activeElement) ? document.activeElement.dataset.questId : null;
  list.replaceChildren();
  selectedQuest();
  for (const [status, label] of groups) {
    const quests = Object.values(QUEST_DEFINITIONS).filter(quest => questProgress[quest.id]?.status === status);
    if (!quests.length) continue;
    const group = element("section", "quest-group");
    group.append(element("h3", "quest-group-title", `${label} (${quests.length})`));
    for (const quest of quests) {
      const button = element("button", "quest-row");
      button.type = "button"; button.dataset.questId = quest.id;
      button.setAttribute("aria-controls", "quest-details");
      button.setAttribute("aria-pressed", String(quest.id === runtime.selectedQuestId));
      button.append(element("span", "quest-row-icon", status === "completed" ? "✓" : status === "locked" ? "◆" : "!"),
        element("span", "quest-row-title", quest.title));
      button.addEventListener("click", () => selectQuest(quest.id));
      group.append(button);
    }
    list.append(group);
  }
  list.scrollTop = scroll;
  if (focusedQuest) list.querySelector(`[data-quest-id="${focusedQuest}"]`)?.focus({ preventScroll: true });
}

function renderQuestUI() {
  renderTracker();
  if (!document.getElementById("quest-log").classList.contains("hidden")) {
    const details = document.getElementById("quest-details"), scroll = details.scrollTop;
    renderQuestList(); renderDetails(); details.scrollTop = scroll;
  }
}

function closeQuestLog() {
  const panel = document.getElementById("quest-log");
  if (panel.classList.contains("hidden")) return;
  if (panel.contains(document.activeElement)) document.activeElement.blur();
  panel.classList.add("hidden"); panel.inert = true;
  document.getElementById("open-quest-log").setAttribute("aria-expanded", "false");
  if (runtime.gameState === "playing" && previousFocus?.isConnected && previousFocus.getClientRects().length && !panel.contains(previousFocus)) previousFocus.focus();
  previousFocus = null;
}

function toggleQuestLog() {
  if (!isPlaying()) return;
  const panel = document.getElementById("quest-log");
  if (!panel.classList.contains("hidden")) { closeQuestLog(); return; }
  previousFocus = document.activeElement;
  panel.classList.remove("hidden"); panel.inert = false;
  renderQuestUI();
  document.getElementById("open-quest-log").setAttribute("aria-expanded", "true");
  for (const key in keys) keys[key] = false;
  panel.querySelector(`[data-quest-id="${runtime.selectedQuestId}"]`)?.focus();
}

function setupQuestUI() {
  document.getElementById("open-quest-log").addEventListener("click", toggleQuestLog);
  document.getElementById("close-quest-log").addEventListener("click", closeQuestLog);
  document.getElementById("quest-log").addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll("button, [tabindex='0']")];
    const first = controls[0], last = controls[controls.length-1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  on("quests:changed", renderQuestUI);
  on("area:changed", closeQuestLog);
  on("shop:opened", closeQuestLog);
  on("game:statechanged", state => { if (state !== "playing") closeQuestLog(); });
}

export { setupQuestUI, toggleQuestLog, closeQuestLog, selectQuest };
