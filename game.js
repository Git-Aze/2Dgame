const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let cameraX = 0;
let cameraY = 0;
let viewWidth = 0;
let viewHeight = 0;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bounds = canvas.getBoundingClientRect();
  viewWidth = bounds.width;
  viewHeight = bounds.height;

  canvas.width = Math.round(viewWidth * dpr);
  canvas.height = Math.round(viewHeight * dpr);

  // Draw using CSS pixel coordinates.
  ctx.setTransform(canvas.width / viewWidth, 0, 0, canvas.height / viewHeight, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const TILE = WORLD_DATA.tileSize;
const WORLD_W = WORLD_DATA.width;
const WORLD_H = WORLD_DATA.height;

const WORLD_PIXEL_W = WORLD_W * TILE;
const WORLD_PIXEL_H = WORLD_H * TILE;

// The ground is one image; actors and trees are drawn separately.
const groundMapImage = new Image();
groundMapImage.src = WORLD_DATA.background;

const treeImage = new Image();
treeImage.src = WORLD_DATA.tree.image;

// Tile coordinates mark the center of each trunk's ground footprint.
// Keep paths and the starting area open.
const trees = WORLD_DATA.trees.map(([tileX, tileY]) => ({
  ...WORLD_DATA.tree,
  ...worldPosition({ tileX, tileY, offsetX: TILE / 2, offsetY: TILE / 2 }),
}));


// --------------------------------------------------
// PLAYER
// --------------------------------------------------

const player = {
  ...worldPosition(WORLD_DATA.playerSpawn),
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
const initialPlayerState = structuredClone(player);
const initialActionBar = [...actionBarSpells];
let gameState = "start";
const blocked = new Set();
let lastTime = 0;

function isPlaying() {
  return gameState === "playing" && player.hp > 0;
}

function setGameState(state) {
  gameState = state;
  for (const key in keys) keys[key] = false;
  lastTime = 0;
  const overlay = document.getElementById("game-overlay");
  const playing = state === "playing";
  overlay.hidden = playing;
  document.getElementById("game-container").inert = !playing;

  if (playing) {
    document.getElementById("start-game-button").blur();
    return;
  }

  player.moving = false;
  player.casting = false;
  player.castTime = 0;
  player.castTarget = null;
  player.frame = 0;
  selectedEnemy = null;
  document.getElementById("character-sheet").classList.add("hidden");
  document.getElementById("spell-book").classList.add("hidden");
  const dead = state === "dead";
  document.getElementById("game-overlay-title").textContent = dead ? "You died" : document.title;
  document.getElementById("game-overlay-description").textContent = dead
    ? "Press Space to restart. Your adventure will begin again from the start."
    : "Explore Greenfield Village, equip your gear, and battle the creatures nearby.";
  document.getElementById("start-game-button").textContent = dead ? "Restart game" : "Start game";
  document.getElementById("game-overlay-hint").textContent = dead
    ? "Press Space to restart" : "Press Space to start";
  document.getElementById("start-game-button").focus();
}

function startGame() {
  if (gameState === "playing") return;
  if (gameState === "dead") {
    Object.assign(player, structuredClone(initialPlayerState));
    selectedEnemy = null;
    fireballs.length = 0;
    activeIgnites.length = 0;
    enemies.length = 0;
    nextEnemyInstanceId = 1;
    spawnStartingEnemies();
    inventory.items.length = 0;
    for (const slot of Object.keys(inventory.equipment)) inventory.equipment[slot] = null;
    actionBarSpells.splice(0, actionBarSpells.length, ...initialActionBar);
    messageHistory.length = 0;
    document.getElementById("message-log-entries").replaceChildren();
    giveStartingItems();
    updateCharacterSheet();
    updateCharacterFrame();
    updateXPBar();
    renderActionBar();
    resetQuests();
  }
  setGameState("playing");
  acceptQuest("firstSteps");
}
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

for (let edge = 0; edge < WORLD_DATA.collision.boundaryTiles; edge++) {
  for (let x = 0; x < WORLD_W; x++) {
    blockTile(x, edge);
    blockTile(x, WORLD_H - 1 - edge);
  }
  for (let y = 0; y < WORLD_H; y++) {
    blockTile(edge, y);
    blockTile(WORLD_W - 1 - edge, y);
  }
}

// Background water, cliffs and painted tree trunks are defined in world.js.

document.getElementById("location").textContent = WORLD_DATA.name;

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

function collides(x, y, entity = player) {
  const margin = WORLD_DATA.collision.entityMargin;

  if (x + margin < 0 || y + margin < 0 ||
      x + entity.w - margin > WORLD_PIXEL_W ||
      y + entity.h - margin > WORLD_PIXEL_H) return true;

  if (collidesWithMap(x + margin, y + margin,
      x + entity.w - margin, y + entity.h - margin)) return true;

  const left = Math.floor((x + margin) / TILE);
  const right = Math.floor((x + entity.w - margin) / TILE);
  const top = Math.floor((y + margin) / TILE);
  const bottom = Math.floor((y + entity.h - margin) / TILE);

  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (isBlocked(tx, ty)) return true;
    }
  }

  return trees.some((tree) =>
    x + entity.w - margin > tree.x - tree.trunkWidth / 2 &&
    x + margin < tree.x + tree.trunkWidth / 2 &&
    y + entity.h - margin > tree.y - tree.trunkHeight / 2 &&
    y + margin < tree.y + tree.trunkHeight / 2
  );
}

function moveEntity(entity, dx, dy) {
  // Small steps prevent fast movement from skipping thin shorelines or trunks.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (TILE / 4)));
  const stepX = dx / steps;
  const stepY = dy / steps;
  for (let step = 0; step < steps; step++) {
    if (!collides(entity.x + stepX, entity.y, entity)) entity.x += stepX;
    if (!collides(entity.x, entity.y + stepY, entity)) entity.y += stepY;
  }
}

function movePlayer(dx, dy) {
  if (!isPlaying()) return;
  moveEntity(player, dx, dy);
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
  if (!isPlaying()) return;
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
  if (!isPlaying()) return;
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
  if (!isPlaying()) return;
  targetEnemyAtScreenPosition(event.clientX, event.clientY);
});



// --------------------------------------------------
// INPUT
// --------------------------------------------------

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (!isPlaying()) {
    if (key === " " && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      if (!event.repeat) startGame();
    }
    return;
  }

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
});



window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

window.addEventListener("blur", () => {
  for (const key in keys) keys[key] = false;
});

// --------------------------------------------------
// WORLD RENDERING
// --------------------------------------------------

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
  if (treeImage.complete && treeImage.naturalWidth) {
    for (const tree of trees) {
      layers.push({ depth: tree.y, draw() {
        ctx.drawImage(treeImage,
          Math.round(tree.x - tree.width / 2),
          Math.round(tree.y - tree.height + tree.trunkHeight / 2),
          tree.width, tree.height);
      }});
    }
  }
  layers.push({ depth: player.y + player.h, draw() {
    const castFrame = Math.min(3, Math.floor(player.castTime / CAST_FRAME_DURATION));
    const action = player.casting ? "cast" : player.moving ? "walk" : "idle";
    const frame = player.casting ? castFrame : player.moving ? player.frame % 4 : 0;
    if (!drawImageCharacter(action, player.facing, frame)) {
      drawSprite(playerSprites[player.facing][player.frame], player.x - 4, player.y - 2, 2);
    }
  }});
  for (const enemy of enemies) {
    if (enemy.alive) {
      layers.push({ depth: enemy.y + enemy.h, draw() { drawEnemy(enemy); }});
    }
  }
  layers.sort((a,b) => a.depth - b.depth);
  for (const layer of layers) layer.draw();
}

// Calculate damage.
function damagePlayer(baseDamage) {
  if (!isPlaying()) return 0;
  const stats = getPlayerStats();

  const armor = stats.armor;

  // 1 armor reduces incoming damage by 1.
  // Attacks always deal at least 1 damage.
  const finalDamage = Math.max(1, baseDamage - armor);

  player.hp = Math.max(0, player.hp - finalDamage);

  showMessage(`You take ${finalDamage} damage. (${armor} armor)`);

  if (player.hp <= 0) {
    setGameState("dead");
    updateCharacterFrame();
  }

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
  ctx.fillRect(viewWidth - 155, 12, 143, 35);

  ctx.fillStyle = "#ff7777";
  ctx.font = "14px Arial";
  ctx.fillText(`♥ HP: ${player.hp} / ${player.maxHp}`, viewWidth - 144, 34);

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
  if (!isPlaying()) return;
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

  updateEnemies(dt);
  // A lethal enemy attack must stop combat and regeneration this frame.
  if (!isPlaying()) return;
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
      player.x + player.w / 2 - viewWidth / 2,
      WORLD_PIXEL_W - viewWidth,
    ),
  );

  cameraY = Math.max(
    0,
    Math.min(
      player.y + player.h / 2 - viewHeight / 2,
      WORLD_PIXEL_H - viewHeight,
    ),
  );

  ctx.clearRect(0, 0, viewWidth, viewHeight);
  ctx.imageSmoothingEnabled = false;

  ctx.save();

// Apply the camera transformation.
ctx.translate(-Math.floor(cameraX), -Math.floor(cameraY));

// Draw terrain, enemies, and player.
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
updateCharacterFrame();
resetQuests();
document.getElementById("start-game-button").addEventListener("click", startGame);
setGameState("start");
requestAnimationFrame(loop);
