// Match the panels' visual stacking order: the spell book covers the sheet.
function closeTopPanel() {
  for (const id of ["spell-book", "character-sheet"]) {
    const panel = document.getElementById(id);
    if (panel.classList.contains("hidden")) continue;
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
