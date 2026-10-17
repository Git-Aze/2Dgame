import { ctx } from "./canvas.js";
import { emit } from "../core/events.js";
import { player } from "../core/state.js";

function makeSprite(draw) {
  const sprite = document.createElement("canvas");
  sprite.width = 16;
  sprite.height = 16;

  const s = sprite.getContext("2d");
  s.imageSmoothingEnabled = false;

  draw(s);
  return sprite;
}

function pixel(s, x, y, color, w = 1, h = 1) {
  s.fillStyle = color;
  s.fillRect(x, y, w, h);
}

// Four directional player designs.
// Frames are generated for each direction and
// two walking steps, with a separate idle frame.

function makeCharacterSprites() {
  const palette = {
    hair: "#493025",
    skin: "#efbd91",
    shirt: "#397bd1",
    shirtShade: "#2455a0",
    pants: "#343a60",
    boots: "#593d2c",
  };

  const directions = ["down", "up", "left", "right"];
  const result = {};

  for (const dir of directions) {
    result[dir] = [];

    for (let frame = 0; frame < 3; frame++) {
      result[dir].push(
        makeSprite((s) => {
          const p = palette;
          const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;

          // Legs and boots.
          if (dir === "left" || dir === "right") {
            pixel(s, 5 + step, 11, p.pants, 3, 3);
            pixel(s, 8 - step, 11, p.pants, 3, 3);
            pixel(s, 4 + step, 14, p.boots, 4, 2);
            pixel(s, 8 - step, 14, p.boots, 4, 2);
          } else {
            pixel(s, 5 + step, 11, p.pants, 2, 3);
            pixel(s, 9 - step, 11, p.pants, 2, 3);
            pixel(s, 4 + step, 14, p.boots, 4, 2);
            pixel(s, 8 - step, 14, p.boots, 4, 2);
          }

          // Body.
          pixel(s, 4, 7, p.shirtShade, 8, 5);
          pixel(s, 5, 7, p.shirt, 6, 4);

          // Arms swing while walking.
          const armY = frame === 0 ? 8 : frame === 1 ? 7 : 9;
          pixel(s, 3, armY, p.skin, 2, 4);
          pixel(s, 11, 8 + (frame === 2 ? 1 : 0), p.skin, 2, 4);

          // Head.
          pixel(s, 5, 2, p.skin, 6, 5);

          if (dir === "down") {
            pixel(s, 5, 1, p.hair, 6, 2);
            pixel(s, 4, 2, p.hair, 2, 3);
            pixel(s, 10, 2, p.hair, 2, 3);

            // Eyes.
            pixel(s, 6, 4, "#30251e");
            pixel(s, 9, 4, "#30251e");
          } else if (dir === "up") {
            pixel(s, 4, 1, p.hair, 8, 5);
            pixel(s, 5, 5, p.hair, 6, 2);
          } else {
            pixel(s, 4, 1, p.hair, 8, 2);
            pixel(s, dir === "left" ? 4 : 10, 2, p.hair, 2, 4);
            pixel(s, dir === "left" ? 5 : 9, 4, "#30251e");
          }

          // Tiny clothing highlight.
          pixel(s, 7, 8, "#76b7f2", 2, 2);
        }),
      );
    }
  }

  return result;
}

const playerSprites = makeCharacterSprites();


// Detailed character image loaded relative to this module.
const characterImage = new Image();
characterImage.src = new URL("../../assets/images/player-sprites.png", import.meta.url).href;
const characterDirections = { down: 0, left: 1, right: 2, up: 3 };

function drawImageCharacter(action, direction, frame) {
  if (!characterImage.complete || !characterImage.naturalWidth) return false;
  const group = { idle: 0, walk: 1, cast: 2, attack: 3 }[action];
  const row = characterDirections[direction] ?? 0;
  const column = group * 4 + (frame % 4);
  // Sprite visual is taller than the old 16px character; collision box stays unchanged.
  ctx.drawImage(
    characterImage,
    column * 96,
    row * 128,
    96,
    128,
    Math.round(player.x - 13),
    Math.round(player.y - 24),
    50,
    58,
  );
  return true;
}

function drawImagePortrait(canvasElement) {
  if (
    !canvasElement ||
    !characterImage.complete ||
    !characterImage.naturalWidth
  )
    return false;
  const pctx = canvasElement.getContext("2d");
  pctx.imageSmoothingEnabled = false;
  pctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  pctx.fillStyle = "#28363a";
  pctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
  pctx.drawImage(
    characterImage,
    0,
    0,
    96,
    128,
    0,
    0,
    canvasElement.width,
    canvasElement.height,
  );
  return true;
}
characterImage.addEventListener("load", () => emit("portraits:ready"));

// --------------------------------------------------
// DRAWING HELPERS
// --------------------------------------------------

function drawSprite(sprite, x, y, scale = 2) {
  ctx.drawImage(
    sprite,
    Math.round(x),
    Math.round(y),
    sprite.width * scale,
    sprite.height * scale,
  );
}

export { playerSprites, drawImageCharacter, drawImagePortrait, drawSprite };
