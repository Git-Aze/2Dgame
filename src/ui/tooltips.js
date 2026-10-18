

import { getRarity } from "../data/rarities.js";

// One immediate tooltip for all dynamically created controls and stat rows.
const tooltip = document.createElement("div");
tooltip.id = "game-tooltip";
tooltip.role = "tooltip";
tooltip.hidden = true;
document.body.appendChild(tooltip);

let tooltipTarget = null;
let tooltipX = 0;
let tooltipY = 0;

function renderTooltipContent(target, text) {
  tooltip.textContent = "";
  tooltip.style.borderColor = "";
  if (target.dataset.rarity) {
    const color = getRarity(target.dataset.rarity).color;
    const firstBreak = text.indexOf("\n");
    const name = document.createElement("span");
    name.style.color = color;
    name.textContent = firstBreak < 0 ? text : text.slice(0, firstBreak);
    tooltip.append(name);
    if (firstBreak >= 0) tooltip.append(document.createTextNode(text.slice(firstBreak)));
    tooltip.style.borderColor = color;
  } else tooltip.textContent = text;
}

function positionTooltip() {
  const gap = 12;
  const bounds = tooltip.getBoundingClientRect();
  let x = tooltipX + gap;
  let y = tooltipY + gap;
  if (y + bounds.height > window.innerHeight - gap) y = tooltipY - bounds.height - gap;
  x = Math.max(gap, Math.min(x, window.innerWidth - bounds.width - gap));
  y = Math.max(gap, Math.min(y, window.innerHeight - bounds.height - gap));
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideTooltip() {
  if (tooltipTarget) {
    const ids = (tooltipTarget.getAttribute("aria-describedby") ?? "")
      .split(/\s+/).filter((id) => id && id !== tooltip.id);
    if (ids.length) tooltipTarget.setAttribute("aria-describedby", ids.join(" "));
    else tooltipTarget.removeAttribute("aria-describedby");
  }
  tooltipTarget = null;
  tooltip.hidden = true;
}

function setTooltip(element, text) {
  element.removeAttribute("title");
  if (text) element.dataset.tooltip = text;
  else delete element.dataset.tooltip;
  if (tooltipTarget === element) {
    if (!text) hideTooltip();
    else {
      renderTooltipContent(element, text);
      positionTooltip();
    }
  }
}

function showTooltip(target, x, y) {
  if (!target || target.closest("[inert], [hidden], .hidden")) return;
  hideTooltip();
  tooltipTarget = target;
  tooltipX = x;
  tooltipY = y;
  renderTooltipContent(target, target.dataset.tooltip);
  const describedBy = target.getAttribute("aria-describedby");
  target.setAttribute("aria-describedby", describedBy ? `${describedBy} ${tooltip.id}` : tooltip.id);
  tooltip.hidden = false;
  positionTooltip();
}

document.addEventListener("pointerover", (event) => {
  if (event.pointerType === "touch") return;
  const target = event.target.closest("[data-tooltip]");
  if (target && target !== tooltipTarget) showTooltip(target, event.clientX, event.clientY);
});
document.addEventListener("pointermove", (event) => {
  if (!tooltipTarget || event.pointerType === "touch") return;
  tooltipX = event.clientX;
  tooltipY = event.clientY;
  positionTooltip();
});
document.addEventListener("pointerout", (event) => {
  if (tooltipTarget && !tooltipTarget.contains(event.relatedTarget)) hideTooltip();
});
document.addEventListener("focusin", (event) => {
  const target = event.target.closest("[data-tooltip]");
  if (!target) return;
  const bounds = target.getBoundingClientRect();
  showTooltip(target, bounds.left, bounds.bottom);
});
document.addEventListener("focusout", hideTooltip);
document.addEventListener("pointerdown", hideTooltip);
document.addEventListener("dragstart", hideTooltip);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideTooltip();
});
document.addEventListener("scroll", hideTooltip, true);
window.addEventListener("resize", hideTooltip);
window.addEventListener("blur", hideTooltip);
new MutationObserver(() => {
  if (tooltipTarget && (!tooltipTarget.isConnected ||
      tooltipTarget.closest("[inert], [hidden], .hidden"))) hideTooltip();
}).observe(document.body, { subtree: true, childList: true, attributes: true,
  attributeFilter: ["class", "hidden", "inert"] });

export { setTooltip, showTooltip };
