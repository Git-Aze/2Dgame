import { closeQuestLog } from "./quest-ui.js";
import { closeSpecializationTree } from "./specialization-ui.js";

// Match the panels' visual stacking order.
function closeTopPanel() {
  for (const id of ["specialization-tree", "quest-log", "spell-book", "character-sheet"]) {
    const panel = document.getElementById(id);
    if (panel.classList.contains("hidden")) continue;
    if (id === "specialization-tree") { closeSpecializationTree(); return true; }
    if (id === "quest-log") { closeQuestLog(); return true; }
    if (panel.contains(document.activeElement)) document.activeElement.blur();
    panel.classList.add("hidden");
    return true;
  }
  return false;
}

function closeMenuLoadOptions() {
  const options = document.getElementById("menu-load-options");
  if (options.hidden) return false;
  options.hidden = true;
  const button = document.getElementById("menu-load-button");
  button.setAttribute("aria-expanded", "false");
  button.focus();
  return true;
}

export { closeTopPanel, closeMenuLoadOptions };
