import { runtime } from "../src/core/state.js";
import { resetAdventure } from "../src/core/lifecycle.js";
import { setMenuOpen } from "../src/core/pause-menu.js";
import { enterArea } from "../src/world/areas.js";
import { mapCollision } from "../src/world/collision.js";
import { render } from "../src/rendering/renderer.js";
import { canvas, ctx } from "../src/rendering/canvas.js";
import { createSave } from "../src/persistence/saves.js";

function runCollisionDebugChecks(assert) {
  const press = (options = {}, target = window) => {
    const event = new KeyboardEvent("keydown", { key: "m", ctrlKey: true, bubbles: true, cancelable: true, ...options });
    target.dispatchEvent(event);
    return event;
  };
  resetAdventure();
  runtime.debugCollisions = false;
  press({ ctrlKey: false });
  assert(!runtime.debugCollisions, "M alone does not enable collision debug");
  assert(press().defaultPrevented && runtime.debugCollisions, "Ctrl+M enables overlay and consumes browser shortcut");
  press({ repeat: true });
  assert(runtime.debugCollisions, "Holding Ctrl+M does not flicker the overlay");
  setMenuOpen(true);
  press();
  assert(!runtime.debugCollisions && runtime.menuOpen, "Ctrl+M toggles while paused without closing menu");
  setMenuOpen(false);
  const input = document.createElement("input");
  document.body.appendChild(input);
  press({}, input);
  input.remove();
  assert(!runtime.debugCollisions, "Typing shortcut in editable control does not toggle debug");
  const pixels = () => ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const equal = (a,b) => a.every((value,index) => value === b[index]);
  for (const area of ["village", "cave", "cave-arena"]) {
    if (area !== runtime.areaId) enterArea(area);
    const geometry = JSON.stringify(mapCollision);
    runtime.debugCollisions = false;
    render();
    const before = pixels();
    press();
    render();
    assert(!equal(before, pixels()), `Collision borders render in ${area} with current camera`);
    assert(JSON.stringify(mapCollision) === geometry, `Debug rendering preserves ${area} collision geometry`);
    press();
    render();
    assert(equal(before, pixels()), `Toggling off restores normal ${area} rendering`);
  }
  press();
  enterArea("cave");
  assert(runtime.debugCollisions && runtime.areaId === "cave", "Overlay remains enabled across area changes");
  assert(!Object.hasOwn(createSave(), "debugCollisions"), "Debug visibility is excluded from saves");
  runtime.debugCollisions = false;
  resetAdventure();
}

export { runCollisionDebugChecks };
