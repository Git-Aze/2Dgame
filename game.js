const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let cameraX = 0;
let cameraY = 0;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);

  // Draw using CSS pixel coordinates.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const TILE = 32;
const WORLD_W = 72;
const WORLD_H = 48;

const WORLD_PIXEL_W = WORLD_W * TILE;
const WORLD_PIXEL_H = WORLD_H * TILE;

// The ground is one image, while houses remain separate objects.
const groundMapImage = new Image();
groundMapImage.src = "ground_map.png";


// --------------------------------------------------
// PLAYER
// --------------------------------------------------

const player = {
  x: 33 * TILE + 4,
  y: 23 * TILE + 2,
  w: 24,
  h: 28,
  speed: 145,

  // Resources
  hp: 100,
  maxHp: 100,
  mana: 50,
  maxMana: 50,

  // Character information
  name: "Adventurer",
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  gold: 0,
  attributePoints: 0,

  // Attributes
  strength: 10,
  vitality: 10,
  intelligence: 10,
  dexterity: 10,

  // Defensive stats
  armor: 0,

  facing: "down",
  moving: false,
  animTime: 0,
  frame: 0,
  casting: false,
  castTime: 0,
  castTarget: null,
};

const keys = Object.create(null);
const blocked = new Set();
const npcs = [];

const house = { x: 19, y: 5, w: 5, h: 5 };
// Building positions use ground-level footprints; their roofs extend northward.
const villageBuildings = [
  { ...house, kind: "hall", sign: "Elder Hall", roof: "#754b48" },
  { x: 7, y: 4, w: 5, h: 4, kind: "tavern", sign: "Tavern", roof: "#5b4549" },
  { x: 26, y: 5, w: 5, h: 4, kind: "smith", sign: "Smithy", roof: "#51565c" },
  { x: 6, y: 16, w: 5, h: 4, kind: "shop", sign: "General Store", roof: "#695744" },
  { x: 20, y: 17, w: 4, h: 4, kind: "home", sign: "", roof: "#765247" },
];
const clearing = { x: 29 * TILE, y: 12 * TILE };

let questStarted = false;
let questComplete = false;
let lastTime = 0;
function tileKey(x, y) {
  return `${x},${y}`;
}

function blockTile(x, y) {
  blocked.add(tileKey(x, y));
}

function isBlocked(x, y) {
  return blocked.has(tileKey(x, y));
}

// --------------------------------------------------
// WORLD GENERATION
// --------------------------------------------------

for (let x = 0; x < WORLD_W; x++) {
  blockTile(x, 0);
  blockTile(x, WORLD_H - 1);
}

for (let y = 0; y < WORLD_H; y++) {
  blockTile(0, y);
  blockTile(WORLD_W - 1, y);
}

// Building footprints and a clear path around every entrance.
for (const building of villageBuildings) {
  for (let x = building.x; x < building.x + building.w; x++) {
    for (let y = building.y; y < building.y + building.h; y++) {
      blockTile(x, y);
    }
  }
  const doorX = building.x + Math.floor(building.w / 2);
  for (let y = building.y + building.h; y <= building.y + building.h + 1; y++) {
    blocked.delete(tileKey(doorX, y));
  }
}
// Background-image cliffs and waterways will need hand-authored collision
// polygons later; only world boundaries and buildings currently block movement.

// Elder Rowan.
npcs.push({
  x: 34 * TILE + 4,
  y: 25 * TILE,
  name: "Elder Rowan",
  facing: "down",
  animTime: 0,
  frame: 0,
});

// --------------------------------------------------
// PIXEL ART SPRITE GENERATOR
// --------------------------------------------------

// Sprites are drawn on tiny 16x16 canvases.
// They are enlarged with nearest-neighbor scaling
// to preserve the crisp pixel-art appearance.

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

function makeCharacterSprites(kind) {
  const isPlayer = kind === "player";

  const palette = isPlayer
    ? {
        hair: "#493025",
        skin: "#efbd91",
        shirt: "#397bd1",
        shirtShade: "#2455a0",
        pants: "#343a60",
        boots: "#593d2c",
      }
    : {
        hair: "#ded4b5",
        skin: "#e8b992",
        shirt: "#719b55",
        shirtShade: "#466b3c",
        pants: "#66513b",
        boots: "#493a2e",
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
          pixel(s, 7, 8, isPlayer ? "#76b7f2" : "#a5c879", 2, 2);
        }),
      );
    }
  }

  return result;
}

const playerSprites = makeCharacterSprites("player");
const elderSprites = makeCharacterSprites("elder");


// Detailed character image. Save player-sprites.png next to game.js.
const characterImage = new Image();
characterImage.src = "player-sprites.png";
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
characterImage.addEventListener("load", () => {
  drawCharacterPortrait();
  drawCharacterSheetPortrait();
});

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


const messageHistory = [];
const MAX_LOG_MESSAGES = 30;

function showMessage(message) {
  // Add the message to the permanent log.
  const log = document.getElementById("message-log-entries");
  if (!log) return;

  const entry = document.createElement("div");
  entry.className = "message-log-entry";
  entry.textContent = message;

  if (/damage|fireball|slime|defeated|attack/i.test(message)) {
    entry.classList.add("combat");
  } else if (/quest|elder|reward|completed/i.test(message)) {
    entry.classList.add("quest");
  }

  messageHistory.push(entry);

  while (messageHistory.length > MAX_LOG_MESSAGES) {
    messageHistory.shift().remove();
  }
  // Scroll to the bottom after the new message is added.
  const messageLog = document.getElementById("message-log");

  if (messageLog) {
    requestAnimationFrame(() => {
      messageLog.scrollTop = messageLog.scrollHeight;
    });
  }
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function collides(x, y) {
  const margin = 3;

  const left = Math.floor((x + margin) / TILE);
  const right = Math.floor((x + player.w - margin) / TILE);
  const top = Math.floor((y + margin) / TILE);
  const bottom = Math.floor((y + player.h - margin) / TILE);

  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (isBlocked(tx, ty)) return true;
    }
  }

  // The house also blocks the player.
  if (
    x + player.w > house.x * TILE &&
    x < (house.x + house.w) * TILE &&
    y + player.h > house.y * TILE &&
    y < (house.y + house.h) * TILE
  ) {
    return true;
  }

  return false;
}

function movePlayer(dx, dy) {
  if (!collides(player.x + dx, player.y)) {
    player.x += dx;
  }

  if (!collides(player.x, player.y + dy)) {
    player.y += dy;
  }
}

function getPlayerStats() {
  const bonuses = getEquipmentBonuses();

  return {
    strength: (player.strength ?? 10) + bonuses.strength,
    vitality: (player.vitality ?? 10) + bonuses.vitality,
    intelligence: (player.intelligence ?? 10) + bonuses.intelligence,
    dexterity: (player.dexterity ?? 10) + bonuses.dexterity,
    armor: (player.armor ?? 0) + bonuses.armor,
  };
}


function updateXPBar() {
  const xpFill = document.getElementById("xp-bar-fill");
  const xpText = document.getElementById("xp-bar-text");

  if (!xpFill || !xpText) return;

  const percentage = Math.max(
    0,
    Math.min(100, (player.xp / player.xpToNextLevel) * 100),
  );

  xpFill.style.width = `${percentage}%`;

  xpText.textContent = `${player.xp} / ${player.xpToNextLevel} XP`;
}

function gainXP(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  player.xp += amount;

  showMessage(`You gained ${amount} XP.`);

  // Handle leveling up.
  while (player.xp >= player.xpToNextLevel) {
    player.xp -= player.xpToNextLevel;

    player.level++;
    player.attributePoints += 5;

    // Increase XP required for the next level.
    player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);

    showMessage(`Level ${player.level}! You received 5 attribute points.`);
  }

  updateXPBar();

  // Refresh the character sheet if it exists.
  if (typeof updateCharacterSheet === "function") {
    updateCharacterSheet();
  }
}



function toggleCharacterSheet() {
  const sheet = document.getElementById("character-sheet");

  if (!sheet) return;

  sheet.classList.toggle("hidden");

  if (!sheet.classList.contains("hidden")) {
    updateCharacterSheet();
    drawCharacterSheetPortrait();
  }
}

const closeCharacterSheetButton =
  document.getElementById("close-character-sheet");

closeCharacterSheetButton.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();

  document.getElementById("character-sheet").classList.add("hidden");
});

function drawCharacterSheetPortrait() {
  const portrait = document.getElementById("sheet-portrait");

  if (!portrait) return;

  const pctx = portrait.getContext("2d");

  pctx.imageSmoothingEnabled = false;

  pctx.clearRect(0, 0, portrait.width, portrait.height);

  pctx.fillStyle = "#28363a";
  pctx.fillRect(0, 0, portrait.width, portrait.height);

  if (drawImagePortrait(portrait)) return;
  const sprite = playerSprites.down[0];

  // 16x16 -> 48x48, centered inside 64x64.
  pctx.drawImage(sprite, 0, 0, 16, 16, 8, 8, 48, 48);
}

const SPENDABLE_ATTRIBUTES = [
  "strength",
  "vitality",
  "intelligence",
  "dexterity",
];

function spendAttributePoint(attribute) {
  // Validate the attribute.
  if (!SPENDABLE_ATTRIBUTES.includes(attribute)) return;

  // Check available points.
  if (player.attributePoints <= 0) return;

  // Increase the base attribute.
  player[attribute] += 1;

  // Spend one point.
  player.attributePoints -= 1;

  // Refresh the character sheet.
  updateCharacterSheet();
}

function updateCharacterSheet() {
  const stats = getPlayerStats();
  document.getElementById("sheet-name").textContent = player.name;
  document.getElementById("sheet-level").textContent = `Level ${player.level}`;

  document.getElementById("stat-strength").textContent = stats.strength;

  document.getElementById("stat-vitality").textContent = stats.vitality;

  document.getElementById("stat-intelligence").textContent = stats.intelligence;

  document.getElementById("stat-dexterity").textContent = stats.dexterity;

  document.getElementById("stat-armor").textContent = stats.armor;

  document.getElementById("sheet-health").textContent =
    `${player.hp} / ${player.maxHp}`;

  document.getElementById("sheet-mana").textContent =
    `${player.mana} / ${player.maxMana}`;

  document.getElementById("sheet-gold").textContent = player.gold;

  document.getElementById("attribute-points").textContent =
    player.attributePoints;

  document.querySelectorAll(".attribute-plus").forEach((button) => {
    button.disabled = player.attributePoints <= 0;
  });
  renderInventory();
  renderEquipment();
}

canvas.addEventListener("click", (event) => {
  targetEnemyAtScreenPosition(event.clientX, event.clientY);
});



// --------------------------------------------------
// INPUT AND NPC INTERACTION
// --------------------------------------------------

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "c" && !event.repeat) {
    toggleCharacterSheet();
  }

  if (
    [
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      " ",
    ].includes(key)
  ) {
    event.preventDefault();
  }

  keys[key] = true;

  if (key === "e" && !event.repeat) {
    interact();
  }
});



window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

window.addEventListener("blur", () => {
  for (const key in keys) keys[key] = false;
});

function nearbyNPC() {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;

  return npcs.find((npc) => {
    const nx = npc.x + 16;
    const ny = npc.y + 16;
    return Math.hypot(px - nx, py - ny) < 54;
  });
}

function interact() {
  const npc = nearbyNPC();

  if (!npc) {
    showMessage("There is nobody nearby to talk to.");
    return;
  }

  if (!questStarted) {
    questStarted = true;
    showMessage("Elder Rowan: Welcome! Find the golden clearing to the east.");
  } else if (!questComplete) {
    showMessage(
      "Elder Rowan: Follow the path east to find the golden clearing.",
    );
  } else {
    showMessage("Elder Rowan: You found it! Thank you, traveler.");
  }
}

// --------------------------------------------------
// WORLD RENDERING
// --------------------------------------------------

// Three-quarter-view scenery: the Y position of an object's feet controls overlap.
function drawVillageBuilding(b) {
  const x = b.x * TILE, y = b.y * TILE;
  const w = b.w * TILE, h = b.h * TILE;
  const front = y + h;
  const roofTop = y - 58;
  ctx.fillStyle = "rgba(10,16,12,.34)";
  ctx.fillRect(x - 10, front - 8, w + 22, 16);
  // Stone foundation and side wall.
  ctx.fillStyle = "#403e39";
  ctx.fillRect(x - 4, y + 26, w + 8, h - 18);
  ctx.fillStyle = "#9c917b";
  ctx.fillRect(x + 3, y + 28, w - 6, h - 30);
  ctx.fillStyle = "#6b6258";
  ctx.fillRect(x + w - 19, y + 28, 16, h - 30);
  // Timber supports and horizontal beams.
  ctx.fillStyle = "#4e3b31";
  for (let xx = x + 6; xx < x + w; xx += 32) ctx.fillRect(xx, y + 32, 5, h - 35);
  ctx.fillRect(x + 2, y + 54, w - 4, 6);
  ctx.fillRect(x + 2, front - 12, w - 4, 6);
  // Sloping roof in 3/4 perspective.
  ctx.fillStyle = "#292c2e";
  ctx.beginPath();
  ctx.moveTo(x - 17, y + 32); ctx.lineTo(x + 20, roofTop);
  ctx.lineTo(x + w - 18, roofTop); ctx.lineTo(x + w + 18, y + 32);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = b.roof;
  ctx.beginPath();
  ctx.moveTo(x - 11, y + 28); ctx.lineTo(x + 23, roofTop + 6);
  ctx.lineTo(x + w - 21, roofTop + 6); ctx.lineTo(x + w + 10, y + 28);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(26,21,20,.28)";
  ctx.lineWidth = 3;
  for (let yy = roofTop + 19; yy < y + 27; yy += 12) {
    ctx.beginPath(); ctx.moveTo(x + 15 - (yy - roofTop) * .27, yy);
    ctx.lineTo(x + w - 13 + (yy - roofTop) * .27, yy); ctx.stroke();
  }
  // Door and lit windows on the south wall.
  const doorX = x + Math.floor(w / 2) - 13;
  ctx.fillStyle = "#332820"; ctx.fillRect(doorX - 3, front - 53, 32, 49);
  ctx.fillStyle = "#77543b"; ctx.fillRect(doorX + 1, front - 48, 24, 44);
  ctx.fillStyle = "#dfb96b"; ctx.fillRect(doorX + 20, front - 25, 3, 3);
  for (const wx of [x + 22, x + w - 41]) {
    if (Math.abs(wx - doorX) < 34) continue;
    ctx.fillStyle = "#44382d"; ctx.fillRect(wx - 3, front - 65, 27, 28);
    ctx.fillStyle = "#c4a66b"; ctx.fillRect(wx + 1, front - 61, 19, 20);
    ctx.fillStyle = "#5b4a35"; ctx.fillRect(wx + 9, front - 61, 3, 20);
  }
  if (b.sign) {
    ctx.fillStyle = "#3d2b21";
    ctx.fillRect(x + 8, front - 33, 48, 16);
    ctx.fillStyle = "#e7cf9e";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.fillText(b.sign, x + 32, front - 22);
  }
}

function drawWorld() {
  // Draw the complete background image in world coordinates.
  // The original image is 1536x1024 (3:2), matching our 72x48-tile world.
  if (groundMapImage.complete && groundMapImage.naturalWidth) {
    ctx.drawImage(groundMapImage, 0, 0, WORLD_PIXEL_W, WORLD_PIXEL_H);
  } else {
    ctx.fillStyle = "#537c3d";
    ctx.fillRect(0, 0, WORLD_PIXEL_W, WORLD_PIXEL_H);
  }

  const layers = [];
  for (const b of villageBuildings) {
    layers.push({ depth: (b.y + b.h) * TILE - 8, draw() { drawVillageBuilding(b); }});
  }
  for (const npc of npcs) {
    layers.push({ depth: npc.y + 28, draw() {
      drawSprite(elderSprites[npc.facing][npc.frame], npc.x, npc.y, 2);
      ctx.fillStyle = "#fff"; ctx.font = "12px Arial";
      ctx.textAlign = "center"; ctx.fillText(npc.name, npc.x + 16, npc.y - 7);
    }});
  }
  layers.push({ depth: player.y + player.h, draw() {
    const castFrame = Math.min(3, Math.floor(player.castTime / CAST_FRAME_DURATION));
    const action = player.casting ? "cast" : player.moving ? "walk" : "idle";
    const frame = player.casting ? castFrame : player.moving ? player.frame % 4 : 0;
    if (!drawImageCharacter(action, player.facing, frame)) {
      drawSprite(playerSprites[player.facing][player.frame], player.x - 4, player.y - 2, 2);
    }
  }});
  layers.sort((a,b) => a.depth - b.depth);
  for (const layer of layers) layer.draw();
  drawEnemies();
}

// Calculate damage.
function damagePlayer(baseDamage) {
  const stats = getPlayerStats();

  const armor = stats.armor;

  // 1 armor reduces incoming damage by 1.
  // Attacks always deal at least 1 damage.
  const finalDamage = Math.max(1, baseDamage - armor);

  player.hp = Math.max(0, player.hp - finalDamage);

  showMessage(`You take ${finalDamage} damage. (${armor} armor)`);

  return finalDamage;
}

function drawCharacterPortrait() {
  const portraitCanvas = document.getElementById("portrait-canvas");
  if (!portraitCanvas) return;

  const pctx = portraitCanvas.getContext("2d");

  pctx.imageSmoothingEnabled = false;

  // Clear portrait.
  pctx.clearRect(0, 0, portraitCanvas.width, portraitCanvas.height);

  // Portrait background.
  pctx.fillStyle = "#28363a";
  pctx.fillRect(0, 0, portraitCanvas.width, portraitCanvas.height);

  // Slight inner background.
  pctx.fillStyle = "#314247";
  pctx.fillRect(3, 3, 42, 42);

  // Use the player's front-facing idle sprite.
  if (drawImagePortrait(portraitCanvas)) return;
  const sprite = playerSprites.down[0];

  // Draw the 16x16 sprite at 3x size = 48x48.
  pctx.drawImage(sprite, 0, 0, 16, 16, 0, 0, 48, 48);
}

// --------------------------------------------------
// SCREEN UI
// --------------------------------------------------

function drawUI() {
  ctx.textAlign = "left";

  // Health panel.
  ctx.fillStyle = "rgba(20, 25, 28, 0.85)";
  ctx.fillRect(canvas.width - 155, 12, 143, 35);

  ctx.fillStyle = "#ff7777";
  ctx.font = "14px Arial";
  ctx.fillText(`♥ HP: ${player.hp} / ${player.maxHp}`, canvas.width - 144, 34);

  // Interaction prompt.
  if (nearbyNPC()) {
    ctx.fillStyle = "rgba(20, 25, 28, 0.9)";
    ctx.fillRect(canvas.width / 2 - 50, canvas.height - 76, 100, 32);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("E  Talk", canvas.width / 2, canvas.height - 55);
  }

}

// ==========================================
// MANA REGENERATION SYSTEM
// ==========================================

const BASE_MANA_REGEN = 2;
const MANA_REGEN_PER_INTELLIGENCE = 0.1;

// Calculate mana regeneration based on Intelligence.
function getManaRegenRate() {
  const intelligence = player.intelligence;

  return BASE_MANA_REGEN +
    intelligence * MANA_REGEN_PER_INTELLIGENCE;
}

// Regenerate mana every frame.
function updateManaRegeneration(dt) {
  if (player.mana >= player.maxMana) {
    player.mana = player.maxMana;
    return;
  }

  const regenRate = getManaRegenRate();

  player.mana = Math.min(
    player.maxMana,
    player.mana + regenRate * dt
  );
}

// ==========================================
// HEALTH REGENERATION SYSTEM
// ==========================================

const BASE_HEALTH_REGEN = 0.2; // 1 HP every 5 seconds
const HEALTH_REGEN_PER_VITALITY = 0.02;

// Calculate regeneration based on Vitality.
function getHealthRegenRate() {
  // Use the same attributes object as your character sheet.
  const vitality = player.vitality;

  return (
    BASE_HEALTH_REGEN +
    vitality * HEALTH_REGEN_PER_VITALITY
  );
}

// Regenerate health every frame.
function updateHealthRegeneration(dt) {
  if (player.hp <= 0 || player.hp >= player.maxHp) {
    return;
  }

  const regenRate = getHealthRegenRate();

  player.hp = Math.min(
    player.maxHp,
    player.hp + regenRate * dt
  );
}

function updateCharacterFrame() {
  // ======================================
  // HEALTH
  // ======================================

  const hpFill = document.getElementById("character-hp-fill");
  const hpText = document.getElementById("character-hp-text");

  if (hpFill && hpText) {
    const hpPercent = Math.max(
      0,
      Math.min(100, (player.hp / player.maxHp) * 100)
    );

    hpFill.style.width = `${hpPercent}%`;

    hpText.textContent =
      `${Math.ceil(player.hp)} / ${player.maxHp}`;
  }

  // ======================================
  // MANA
  // ======================================

  const manaFill = document.getElementById("character-mana-fill");
  const manaText = document.getElementById("character-mana-text");

  if (manaFill && manaText) {
    const manaPercent = player.maxMana > 0
      ? Math.max(0, Math.min(100, (player.mana / player.maxMana) * 100))
      : 0;

    manaFill.style.width = `${manaPercent}%`;

    manaText.textContent =
      `${Math.ceil(player.mana)} / ${player.maxMana}`;
  }
}

// --------------------------------------------------
// GAME UPDATE
// --------------------------------------------------

function update(dt) {
  updateCasting(dt);
  let dx = 0;
  let dy = 0;

  if (keys["w"] || keys["arrowup"]) dy -= 1;
  if (keys["s"] || keys["arrowdown"]) dy += 1;
  if (keys["a"] || keys["arrowleft"]) dx -= 1;
  if (keys["d"] || keys["arrowright"]) dx += 1;

  // Don't interrupt the spell animation with movement.
  if (player.casting) {
    dx = 0;
    dy = 0;
  }
  player.moving = dx !== 0 || dy !== 0;

  if (player.moving) {
    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;

    if (Math.abs(dx) > Math.abs(dy)) {
      player.facing = dx < 0 ? "left" : "right";
    } else {
      player.facing = dy < 0 ? "up" : "down";
    }

    movePlayer(dx * player.speed * dt, dy * player.speed * dt);

    player.animTime += dt;

    if (player.animTime >= 0.16) {
      player.animTime = 0;
      player.frame = player.frame === 1 ? 2 : 1;
    }
  } else {
    player.frame = 0;
    player.animTime = 0;
  }

  // Animate NPCs gently while they idle.
  for (const npc of npcs) {
    npc.animTime += dt;

    if (npc.animTime >= 0.65) {
      npc.animTime = 0;
      npc.frame = npc.frame === 0 ? 1 : 0;
    }
  }

  // Quest completion.
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;

  if (
    questStarted &&
    !questComplete &&
    Math.hypot(px - (clearing.x + 16), py - (clearing.y + 16)) < 46
  ) {
    questComplete = true;
    showMessage("Quest complete! Return to Elder Rowan.");
  }
  const questTitle = document.getElementById("quest-title");
  const questDescription = document.getElementById("quest-description");

  if (questTitle && questDescription) {
    if (questComplete) {
      questTitle.textContent = "Quest Complete!";
      questDescription.textContent =
        "Return to Elder Rowan to report your discovery.";
    } else if (questStarted) {
      questTitle.textContent = "The Golden Clearing";
      questDescription.textContent =
        "Travel east and find the golden clearing.";
    } else {
      questTitle.textContent = "A New Adventure";
      questDescription.textContent = "Talk to Elder Rowan to begin your quest.";
    }
  }

  updateEnemies(dt);
  updateEnemyRespawns(dt);
  updateCombat(dt);
  updateManaRegeneration(dt);
  updateHealthRegeneration(dt);
  updateCharacterFrame();
}

// --------------------------------------------------
// CAMERA AND MAIN LOOP
// --------------------------------------------------

function render() {
  cameraX = Math.max(
    0,
    Math.min(
      player.x + player.w / 2 - window.innerWidth / 2,
      WORLD_PIXEL_W - window.innerWidth,
    ),
  );

  cameraY = Math.max(
    0,
    Math.min(
      player.y + player.h / 2 - window.innerHeight / 2,
      WORLD_PIXEL_H - window.innerHeight,
    ),
  );

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.imageSmoothingEnabled = false;

  ctx.save();

// Apply the camera transformation.
ctx.translate(-Math.floor(cameraX), -Math.floor(cameraY));

// Draw terrain, enemies, NPCs, and player.
drawWorld();

// Draw Fireball projectiles.
for (const fireball of fireballs) {
  drawFireball(fireball);
}

// Draw Ignite flames using world coordinates.
drawIgniteEffects();

// Restore screen coordinates.
ctx.restore();

// Draw the UI.
drawUI();
}

function loop(timestamp) {
  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0;

  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

document.querySelectorAll(".attribute-plus").forEach((button) => {
  button.addEventListener("click", () => {
    spendAttributePoint(button.dataset.attribute);
  });
});

drawCharacterPortrait();

// ==================================================
// INVENTORY INITIALIZATION
// ==================================================

spawnStartingEnemies();
giveStartingItems();
setupEquipmentButtons();
renderInventory();
renderEquipment();
updateXPBar();
requestAnimationFrame(loop);
