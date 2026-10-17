// Called on quest transitions and progress changes, never from the game loop.
function renderQuestLog() {
  const list = document.getElementById("quest-list");
  list.replaceChildren();
  for (const quest of Object.values(QUEST_DEFINITIONS)) {
    const progress = questProgress[quest.id];
    if (!progress || progress.status === "locked") continue;
    const entry = document.createElement("section");
    const title = document.createElement("h3");
    title.textContent = quest.title;
    const description = document.createElement("p");
    description.textContent = quest.description;
    const status = document.createElement("p");
    status.className = "quest-status";
    status.textContent = progress.status === "completed"
      ? "Completed — rewards received"
      : progress.status === "available" ? "Begins when you start playing"
      : quest.objectives.map((objective, index) =>
          `${progress.objectives[index]} / ${objective.required} ${objective.type === "equip" ? "equipped" : "defeated"}`).join(" · ");
    const rewards = document.createElement("p");
    rewards.className = "quest-rewards";
    rewards.textContent = `Reward: ${quest.rewards.xp} XP` +
      (quest.rewards.gold ? ` · ${quest.rewards.gold} gold` : "");
    entry.append(title, description, status, rewards);
    list.appendChild(entry);
  }
}
