// classes/SpriteFactory.js
// Programmatically generates 32×32 pixel-art sprites for agents and office environment.
// Multi-frame animations for walking, idling, working, coffee, couch, conversations, etc.
//
// Call registerAll(scene) in MainScene.preload().
// Call registerAnimations(scene) in MainScene.create().

const S = 32;

// ── Extended color palette ────────────────────────────────────────────────────
const C = {
  transparent: 'rgba(0,0,0,0)',
  black: '#0a0a0f',
  darkGray: '#1a1a2e',
  midGray: '#2d2d44',
  lightGray: '#4a4a6a',
  silver: '#8888aa',
  white: '#e2e8f0',

  // Office environment (warm, professional)
  floorBeige: '#d4c5a9',
  floorBeige2: '#c9b898',
  wallLight: '#b8b8b8',
  wallMid: '#969696',
  wallDark: '#787878',
  doorBrown: '#8b6040',
  deskWood: '#8b5e3c',
  deskWoodDark: '#6a4a1a',
  chairBlue: '#3a4a6a',
  couchBrown: '#7a5030',
  couchLight: '#9a6a40',
  tableWood: '#d4b878',
  whiteboardWhite: '#f5f5f0',
  metalGray: '#909090',
  metalDark: '#606060',
  coffeeBlack: '#2a1a0a',
  plantGreen: '#2a8040',
  plantPot: '#b04020',

  // Agent colors (DeFi theme)
  deployer: '#ff5555',
  deployerDark: '#cc2222',
  distributor: '#44ddcc',
  distributorDark: '#22aaaa',
  swapper: '#ffdd44',
  swapperDark: '#cc9900',
  extractor: '#88eedd',
  extractorDark: '#44bbaa',

  // Character
  skin: '#f5c5a3',
  skinDark: '#d4935f',
  hair: '#2d1b0e',
  hairAlt: '#1a0a00',
  pants: '#334155',
  shoe: '#1e293b',
  eye: '#0a0a0f',
  mouth: '#c87060',
};

// ── Canvas helpers ────────────────────────────────────────────────────────────

function makeCanvas(w = S, h = S) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function px(ctx, x, y, color) {
  if (x < 0 || x >= ctx.canvas.width || y < 0 || y >= ctx.canvas.height) return;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function hline(ctx, x, y, len, color) {
  rect(ctx, x, y, len, 1, color);
}

function vline(ctx, x, y, len, color) {
  rect(ctx, x, y, 1, len, color);
}

// ── Environment tiles ─────────────────────────────────────────────────────────

function drawFloorBeigeA() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  rect(ctx, 0, 0, S, S, C.floorBeige);
  ctx.globalAlpha = 0.3;
  hline(ctx, 0, 0, S, C.wallMid);
  hline(ctx, 0, S - 1, S, C.wallMid);
  vline(ctx, 0, 0, S, C.wallMid);
  vline(ctx, S - 1, 0, S, C.wallMid);
  ctx.globalAlpha = 1;
  return c;
}

function drawFloorBeigeB() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  rect(ctx, 0, 0, S, S, C.floorBeige2);
  ctx.globalAlpha = 0.3;
  hline(ctx, 0, 0, S, C.wallMid);
  hline(ctx, 0, S - 1, S, C.wallMid);
  vline(ctx, 0, 0, S, C.wallMid);
  vline(ctx, S - 1, 0, S, C.wallMid);
  ctx.globalAlpha = 1;
  return c;
}

function drawWallGray() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  rect(ctx, 0, 0, S, S, C.wallMid);
  rect(ctx, 0, 0, S, 4, C.wallLight);
  hline(ctx, 0, S - 1, S, C.wallDark);
  return c;
}

// ── Furniture environment ─────────────────────────────────────────────────────

function drawCoffeeMachine() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  // Base
  rect(ctx, 6, 8, 20, 20, C.metalDark);
  rect(ctx, 8, 10, 16, 16, C.metalGray);
  // Display
  rect(ctx, 10, 12, 12, 6, C.black);
  // Buttons
  px(ctx, 12, 20, C.wallLight);
  px(ctx, 14, 20, C.wallLight);
  px(ctx, 16, 20, C.wallLight);
  px(ctx, 18, 20, C.wallLight);
  // Cup area
  rect(ctx, 10, 24, 12, 4, C.metalGray);
  return c;
}

function drawCouch64() {
  const c = makeCanvas(64, 32);
  const ctx = c.getContext('2d');
  // Couch body
  rect(ctx, 2, 10, 60, 14, C.couchBrown);
  // Cushions
  rect(ctx, 4, 6, 12, 4, C.couchLight);
  rect(ctx, 22, 6, 12, 4, C.couchLight);
  rect(ctx, 40, 6, 12, 4, C.couchLight);
  // Back
  hline(ctx, 2, 10, 60, C.couchDark || C.couchBrown);
  // Legs
  rect(ctx, 6, 24, 3, 4, C.shoe);
  rect(ctx, 19, 24, 3, 4, C.shoe);
  rect(ctx, 42, 24, 3, 4, C.shoe);
  rect(ctx, 55, 24, 3, 4, C.shoe);
  return c;
}

// ── Agent character drawings ──────────────────────────────────────────────────

/**
 * Draw character walking down (front view).
 * walkPhase: 1 = left foot forward, 2 = right foot forward
 */
function drawAgentWalkDown(bodyColor, bodyDark, hairColor, walkPhase) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  // Shadow
  ctx.globalAlpha = 0.15;
  rect(ctx, 10, 28, 12, 3, '#000020');
  ctx.globalAlpha = 1;

  // Legs (pants)
  const legLX = 11, legRX = 17;
  let legLY = 20, legRY = 20;
  if (walkPhase === 1) { legLY -= 1; legRY += 1; } // left forward
  if (walkPhase === 2) { legRY -= 1; legLY += 1; } // right forward

  rect(ctx, legLX, legLY, 4, 8, C.pants);
  rect(ctx, legRX, legRY, 4, 8, C.pants);
  rect(ctx, legLX, legLY + 8, 4, 2, C.shoe);
  rect(ctx, legRX, legRY + 8, 4, 2, C.shoe);

  // Body
  rect(ctx, 10, 12, 12, 8, bodyColor);
  hline(ctx, 10, 12, 12, bodyDark);

  // Arms
  const armSwing = walkPhase === 1 ? -2 : walkPhase === 2 ? 2 : 0;
  rect(ctx, 7, 14 + armSwing, 3, 6, C.skin);
  rect(ctx, 22, 14 - armSwing, 3, 6, C.skin);

  // Head
  rect(ctx, 11, 3, 10, 8, C.skin);
  rect(ctx, 11, 3, 10, 3, hairColor);

  // Face
  px(ctx, 13, 7, C.eye);
  px(ctx, 18, 7, C.eye);
  px(ctx, 14, 9, C.mouth);

  // Ears
  px(ctx, 10, 6, C.skin);
  px(ctx, 21, 6, C.skin);

  return c;
}

/**
 * Draw character walking up (back view).
 */
function drawAgentWalkUp(bodyColor, bodyDark, hairColor, walkPhase) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  ctx.globalAlpha = 0.15;
  rect(ctx, 10, 28, 12, 3, '#000020');
  ctx.globalAlpha = 1;

  // Legs
  const legLX = 11, legRX = 17;
  let legLY = 20, legRY = 20;
  if (walkPhase === 1) { legLY -= 1; legRY += 1; }
  if (walkPhase === 2) { legRY -= 1; legLY += 1; }

  rect(ctx, legLX, legLY, 4, 8, C.pants);
  rect(ctx, legRX, legRY, 4, 8, C.pants);
  rect(ctx, legLX, legLY + 8, 4, 2, C.shoe);
  rect(ctx, legRX, legRY + 8, 4, 2, C.shoe);

  // Body (back view, narrower)
  rect(ctx, 10, 12, 12, 8, bodyColor);
  hline(ctx, 10, 12, 12, bodyDark);

  // Arms
  rect(ctx, 7, 15, 3, 5, C.skin);
  rect(ctx, 22, 15, 3, 5, C.skin);

  // Head (back of head, hair visible)
  rect(ctx, 11, 3, 10, 8, C.skin);
  rect(ctx, 11, 3, 10, 5, hairColor);

  return c;
}

/**
 * Draw character sitting at desk (typing).
 */
function drawAgentTyping(bodyColor, bodyDark, hairColor, typePhase) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  // Shoulders above desk edge
  rect(ctx, 10, 14, 12, 6, bodyColor);
  hline(ctx, 10, 14, 12, bodyDark);

  // Head (bobbing animation)
  const bobY = typePhase === 0 ? 0 : typePhase === 1 ? 1 : typePhase === 2 ? 0 : -1;
  rect(ctx, 11, 5 + bobY, 10, 8, C.skin);
  rect(ctx, 11, 5 + bobY, 10, 3, hairColor);

  // Eyes
  px(ctx, 13, 9 + bobY, C.eye);
  px(ctx, 18, 9 + bobY, C.eye);

  // Arms forward (at keyboard)
  rect(ctx, 6, 18, 4, 4, C.skin);
  rect(ctx, 22, 18, 4, 4, C.skin);

  // Hands
  rect(ctx, 6, 22, 3, 2, C.skin);
  rect(ctx, 23, 22, 3, 2, C.skin);

  return c;
}

/**
 * Draw character idle standing.
 */
function drawAgentIdle(bodyColor, bodyDark, hairColor, idleFrame) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  // Subtle bob animation
  const bob = idleFrame % 4 === 0 ? 0 : idleFrame % 4 === 1 ? 1 : idleFrame % 4 === 2 ? 0 : -1;

  ctx.globalAlpha = 0.15;
  rect(ctx, 10, 28, 12, 3, '#000020');
  ctx.globalAlpha = 1;

  // Legs (standing still)
  rect(ctx, 11, 20, 4, 8, C.pants);
  rect(ctx, 17, 20, 4, 8, C.pants);
  rect(ctx, 11, 28, 4, 2, C.shoe);
  rect(ctx, 17, 28, 4, 2, C.shoe);

  // Body
  rect(ctx, 10, 12, 12, 8, bodyColor);
  hline(ctx, 10, 12, 12, bodyDark);

  // Arms at sides
  rect(ctx, 7, 15, 3, 6, C.skin);
  rect(ctx, 22, 15, 3, 6, C.skin);

  // Head (with bob)
  rect(ctx, 11, 3 + bob, 10, 8, C.skin);
  rect(ctx, 11, 3 + bob, 10, 3, hairColor);

  // Face
  px(ctx, 13, 7 + bob, C.eye);
  px(ctx, 18, 7 + bob, C.eye);

  return c;
}

/**
 * Draw character with coffee cup.
 */
function drawAgentWithCoffee(bodyColor, bodyDark, hairColor, coffeePhase) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  ctx.globalAlpha = 0.15;
  rect(ctx, 10, 28, 12, 3, '#000020');
  ctx.globalAlpha = 1;

  // Legs
  rect(ctx, 11, 20, 4, 8, C.pants);
  rect(ctx, 17, 20, 4, 8, C.pants);
  rect(ctx, 11, 28, 4, 2, C.shoe);
  rect(ctx, 17, 28, 4, 2, C.shoe);

  // Body
  rect(ctx, 10, 12, 12, 8, bodyColor);

  // Arms holding coffee
  rect(ctx, 10, 16, 4, 5, C.skin); // one arm with cup
  rect(ctx, 7, 18, 3, 4, C.skin);   // other hand

  // Coffee cup in hand
  rect(ctx, 10, 14, 4, 4, C.coffeeBlack);
  rect(ctx, 9, 13, 6, 1, '#8B4513'); // cup rim

  // Head
  rect(ctx, 11, 3, 10, 8, C.skin);
  rect(ctx, 11, 3, 10, 3, hairColor);

  // Face
  px(ctx, 13, 7, C.eye);
  px(ctx, 18, 7, C.eye);

  return c;
}

/**
 * Draw character sitting on couch.
 */
function drawAgentOnCouch(bodyColor, bodyDark, hairColor, couchPhase) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  // Legs extended (sitting)
  rect(ctx, 12, 22, 4, 6, C.pants);
  rect(ctx, 16, 22, 4, 6, C.pants);
  rect(ctx, 12, 28, 4, 2, C.shoe);
  rect(ctx, 16, 28, 4, 2, C.shoe);

  // Torso (leaning back)
  rect(ctx, 10, 14, 12, 8, bodyColor);

  // Arms on couch
  rect(ctx, 6, 16, 4, 5, C.skin);
  rect(ctx, 22, 16, 4, 5, C.skin);

  // Head (lower than standing)
  rect(ctx, 11, 6, 10, 7, C.skin);
  rect(ctx, 11, 6, 10, 3, hairColor);

  px(ctx, 13, 9, C.eye);
  px(ctx, 18, 9, C.eye);

  return c;
}

/**
 * Draw character in conversation pose.
 */
function drawAgentTalking(bodyColor, bodyDark, hairColor, talkPhase) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  ctx.globalAlpha = 0.15;
  rect(ctx, 10, 28, 12, 3, '#000020');
  ctx.globalAlpha = 1;

  // Legs
  rect(ctx, 11, 20, 4, 8, C.pants);
  rect(ctx, 17, 20, 4, 8, C.pants);
  rect(ctx, 11, 28, 4, 2, C.shoe);
  rect(ctx, 17, 28, 4, 2, C.shoe);

  // Body
  rect(ctx, 10, 12, 12, 8, bodyColor);

  // Arms (gesture variations)
  if (talkPhase === 0) {
    rect(ctx, 7, 15, 3, 6, C.skin);
    rect(ctx, 22, 15, 3, 6, C.skin);
  } else if (talkPhase === 1) {
    // One arm raised
    rect(ctx, 7, 13, 3, 8, C.skin);
    rect(ctx, 22, 15, 3, 6, C.skin);
  } else if (talkPhase === 2) {
    // Both arms wide
    rect(ctx, 5, 14, 3, 7, C.skin);
    rect(ctx, 24, 14, 3, 7, C.skin);
  } else {
    // Nodding pose
    rect(ctx, 7, 15, 3, 6, C.skin);
    rect(ctx, 22, 15, 3, 6, C.skin);
  }

  // Head
  rect(ctx, 11, 3, 10, 8, C.skin);
  rect(ctx, 11, 3, 10, 3, hairColor);

  px(ctx, 13, 7, C.eye);
  px(ctx, 18, 7, C.eye);

  return c;
}

/**
 * Draw agent celebrating.
 */
function drawAgentSuccess(bodyColor, bodyDark, hairColor, successPhase) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  ctx.globalAlpha = 0.15;
  rect(ctx, 10, 28, 12, 3, '#000020');
  ctx.globalAlpha = 1;

  // Legs (jumping or standing)
  const legY = successPhase < 2 ? 20 : 22;
  rect(ctx, 11, legY, 4, 6, C.pants);
  rect(ctx, 17, legY, 4, 6, C.pants);
  rect(ctx, 11, legY + 6, 4, 2, C.shoe);
  rect(ctx, 17, legY + 6, 4, 2, C.shoe);

  // Body
  rect(ctx, 10, 13, 12, 7, bodyColor);

  // Arms raised in celebration
  rect(ctx, 5, 12, 3, 8, C.skin);
  rect(ctx, 24, 12, 3, 8, C.skin);

  // Head
  rect(ctx, 11, 2, 10, 8, C.skin);
  rect(ctx, 11, 2, 10, 3, hairColor);

  // Eyes wide (happy)
  px(ctx, 13, 6, C.eye);
  px(ctx, 18, 6, C.eye);

  return c;
}

// ── Register all textures ────────────────────────────────────────────────────

const AGENTS = {
  deployer: { body: C.deployer, dark: C.deployerDark, hair: C.hairAlt },
  distributor: { body: C.distributor, dark: C.distributorDark, hair: C.hair },
  swapper: { body: C.swapper, dark: C.swapperDark, hair: '#4a3000' },
  extractor: { body: C.extractor, dark: C.extractorDark, hair: C.hair },
};

export function registerAll(scene) {
  // Floor and walls
  scene.textures.addCanvas('floor_beige_a', drawFloorBeigeA());
  scene.textures.addCanvas('floor_beige_b', drawFloorBeigeB());
  scene.textures.addCanvas('wall_gray', drawWallGray());

  // Furniture
  scene.textures.addCanvas('coffee_machine', drawCoffeeMachine());
  scene.textures.addCanvas('couch_64x32', drawCouch64());

  // Legacy workstation sprites (kept for backward compatibility)
  scene.textures.addCanvas('workstation_deployer', (() => {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d');
    rect(ctx, 0, 0, 32, 32, C.darkGray);
    return c;
  })());
  scene.textures.addCanvas('workstation_distributor', (() => {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d');
    rect(ctx, 0, 0, 32, 32, C.darkGray);
    return c;
  })());
  scene.textures.addCanvas('workstation_swapper', (() => {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d');
    rect(ctx, 0, 0, 32, 32, C.darkGray);
    return c;
  })());
  scene.textures.addCanvas('workstation_extractor', (() => {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext('2d');
    rect(ctx, 0, 0, 32, 32, C.darkGray);
    return c;
  })());

  // Legacy wall and floor
  scene.textures.addCanvas('floor_tile', drawFloorBeigeA());
  scene.textures.addCanvas('wall_tile', drawWallGray());

  // Agent animation frames
  for (const [name, pal] of Object.entries(AGENTS)) {
    // Walk down (front view)
    scene.textures.addCanvas(`agent_${name}_walk_down0`, drawAgentWalkDown(pal.body, pal.dark, pal.hair, 1));
    scene.textures.addCanvas(`agent_${name}_walk_down1`, drawAgentWalkDown(pal.body, pal.dark, pal.hair, 2));

    // Walk up (back view)
    scene.textures.addCanvas(`agent_${name}_walk_up0`, drawAgentWalkUp(pal.body, pal.dark, pal.hair, 1));
    scene.textures.addCanvas(`agent_${name}_walk_up1`, drawAgentWalkUp(pal.body, pal.dark, pal.hair, 2));

    // Idle (frame 0 is default)
    scene.textures.addCanvas(`agent_${name}_idle`, drawAgentIdle(pal.body, pal.dark, pal.hair, 0));
    scene.textures.addCanvas(`agent_${name}_idle0`, drawAgentIdle(pal.body, pal.dark, pal.hair, 0));
    scene.textures.addCanvas(`agent_${name}_idle1`, drawAgentIdle(pal.body, pal.dark, pal.hair, 1));
    scene.textures.addCanvas(`agent_${name}_idle2`, drawAgentIdle(pal.body, pal.dark, pal.hair, 2));
    scene.textures.addCanvas(`agent_${name}_idle3`, drawAgentIdle(pal.body, pal.dark, pal.hair, 3));

    // Typing (work poses)
    scene.textures.addCanvas(`agent_${name}_work0`, drawAgentTyping(pal.body, pal.dark, pal.hair, 0));
    scene.textures.addCanvas(`agent_${name}_work1`, drawAgentTyping(pal.body, pal.dark, pal.hair, 1));
    scene.textures.addCanvas(`agent_${name}_work2`, drawAgentTyping(pal.body, pal.dark, pal.hair, 2));

    // Coffee
    scene.textures.addCanvas(`agent_${name}_coffee0`, drawAgentWithCoffee(pal.body, pal.dark, pal.hair, 0));

    // Couch
    scene.textures.addCanvas(`agent_${name}_couch0`, drawAgentOnCouch(pal.body, pal.dark, pal.hair, 0));

    // Talking
    scene.textures.addCanvas(`agent_${name}_talk0`, drawAgentTalking(pal.body, pal.dark, pal.hair, 0));
    scene.textures.addCanvas(`agent_${name}_talk1`, drawAgentTalking(pal.body, pal.dark, pal.hair, 1));
    scene.textures.addCanvas(`agent_${name}_talk2`, drawAgentTalking(pal.body, pal.dark, pal.hair, 2));

    // Success
    scene.textures.addCanvas(`agent_${name}_success0`, drawAgentSuccess(pal.body, pal.dark, pal.hair, 0));
    scene.textures.addCanvas(`agent_${name}_success1`, drawAgentSuccess(pal.body, pal.dark, pal.hair, 1));
  }
}

/**
 * Register Phaser animations (call in MainScene.create()).
 */
export function registerAnimations(scene) {
  for (const [name] of Object.entries(AGENTS)) {
    scene.anims.create({
      key: `${name}_walk_down`,
      frames: [{ key: `agent_${name}_walk_down0` }, { key: `agent_${name}_walk_down1` }],
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: `${name}_walk_up`,
      frames: [{ key: `agent_${name}_walk_up0` }, { key: `agent_${name}_walk_up1` }],
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: `${name}_idle`,
      frames: [
        { key: `agent_${name}_idle0` },
        { key: `agent_${name}_idle1` },
        { key: `agent_${name}_idle2` },
        { key: `agent_${name}_idle3` },
      ],
      frameRate: 2,
      repeat: -1,
    });

    scene.anims.create({
      key: `${name}_type`,
      frames: [
        { key: `agent_${name}_work0` },
        { key: `agent_${name}_work1` },
        { key: `agent_${name}_work2` },
      ],
      frameRate: 6,
      repeat: -1,
    });

    scene.anims.create({
      key: `${name}_talk`,
      frames: [
        { key: `agent_${name}_talk0` },
        { key: `agent_${name}_talk1` },
        { key: `agent_${name}_talk2` },
      ],
      frameRate: 4,
      repeat: -1,
    });

    scene.anims.create({
      key: `${name}_success`,
      frames: [
        { key: `agent_${name}_success0` },
        { key: `agent_${name}_success1` },
        { key: `agent_${name}_success0` },
      ],
      frameRate: 8,
      repeat: 2,
    });
  }
}

export { C, S };
