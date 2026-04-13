// classes/SpriteFactory.js
// Programmatically draws all 32×32 pixel-art sprites needed for the
// DeFi office scene and registers them as named Phaser textures.
//
// Call SpriteFactory.registerAll(scene) in MainScene.preload().
// Sprite keys:
//   Agents (4 directions × idle/walk frames):
//     'agent_deployer_idle', 'agent_deployer_walk0', 'agent_deployer_walk1'
//     (same pattern for distributor, swapper, extractor)
//   Workstations:
//     'workstation_deployer', 'workstation_distributor',
//     'workstation_swapper',  'workstation_extractor'
//   Environment:
//     'floor_tile', 'wall_tile', 'desk_chair', 'monitor_glow'

const S = 32; // sprite size

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  // Neutrals
  transparent:  'rgba(0,0,0,0)',
  black:        '#0a0a0f',
  darkGray:     '#1a1a2e',
  midGray:      '#2d2d44',
  lightGray:    '#4a4a6a',
  silver:       '#8888aa',
  white:        '#e2e8f0',

  // Floor / wall
  floorA:       '#151525',
  floorB:       '#1a1a30',
  wallDark:     '#0d0d1a',
  wallAccent:   '#1e1e3f',
  gridLine:     '#1f1f35',

  // Desk / furniture
  deskTop:      '#1e293b',
  deskFront:    '#172033',
  deskLeg:      '#0f172a',
  chairSeat:    '#374151',
  chairBack:    '#1f2937',
  chairLeg:     '#111827',

  // Monitors
  monitorFrame: '#111827',
  monitorBevel: '#1f2937',
  screenOff:    '#0a0a14',
  screenBlue:   '#1a4eff',
  screenGreen:  '#00ff88',
  screenAmber:  '#ffaa00',
  glowBlue:     'rgba(26,78,255,0.25)',
  glowGreen:    'rgba(0,255,136,0.18)',

  // Agent colors
  deployer:     '#ff5555',
  deployerDark: '#cc2222',
  deployerShad: '#881111',
  distributor:  '#44ddcc',
  distributorDark: '#22aaaa',
  distributorShad: '#116666',
  swapper:      '#ffdd44',
  swapperDark:  '#cc9900',
  swapperShad:  '#886600',
  extractor:    '#88eedd',
  extractorDark:'#44bbaa',
  extractorShad:'#228877',

  // Skin tones
  skin:         '#f5c5a3',
  skinDark:     '#d4935f',
  hair:         '#2d1b0e',
  hairAlt:      '#1a0a00',
  shirt:        '#e2e8f0',
  shirtShad:    '#94a3b8',

  // Glow neons
  neonBlue:     '#00aaff',
  neonGreen:    '#00ff88',
  neonPurple:   '#aa44ff',
  neonOrange:   '#ff6600',
};

// ── Low-level canvas helpers ──────────────────────────────────────────────────

/** Create an offscreen 32×32 canvas. */
function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  return c;
}

/** Plot a single pixel at (x,y) using a CSS color string. */
function px(ctx, x, y, color) {
  if (x < 0 || x >= S || y < 0 || y >= S) return;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

/** Fill a rectangular block of pixels. */
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Draw a horizontal line. */
function hline(ctx, x, y, len, color) {
  rect(ctx, x, y, len, 1, color);
}

/** Draw a vertical line. */
function vline(ctx, x, y, len, color) {
  rect(ctx, x, y, 1, len, color);
}

// ── Floor tile ────────────────────────────────────────────────────────────────

function drawFloorTile() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  rect(ctx, 0, 0, S, S, C.floorA);
  // subtle grid lines
  ctx.globalAlpha = 0.35;
  hline(ctx, 0, 0, S, C.gridLine);
  hline(ctx, 0, S - 1, S, C.gridLine);
  vline(ctx, 0, 0, S, C.gridLine);
  vline(ctx, S - 1, 0, S, C.gridLine);
  // slight diagonal shimmer
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < S; i += 4) {
    px(ctx, i, i, C.silver);
  }
  ctx.globalAlpha = 1;
  return c;
}

// ── Wall tile ─────────────────────────────────────────────────────────────────

function drawWallTile() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  rect(ctx, 0, 0, S, S, C.wallDark);
  // brick-like accent strip at top
  rect(ctx, 0, 0, S, 4, C.wallAccent);
  // subtle border
  hline(ctx, 0, S - 1, S, '#0f0f1f');
  return c;
}

// ── Workstation helpers ───────────────────────────────────────────────────────

/**
 * Draw a desk + monitor + chair into ctx.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} screenColor  CSS color for the active screen
 * @param {string} glowColor    CSS color for screen ambient glow
 * @param {string} accentColor  CSS color for decorative accent (LED strip etc.)
 */
function drawWorkstation(ctx, screenColor, glowColor, accentColor) {
  // ── floor shadow ──
  ctx.globalAlpha = 0.2;
  rect(ctx, 4, 26, 26, 6, '#000020');
  ctx.globalAlpha = 1;

  // ── chair legs ──
  rect(ctx, 11, 24, 2, 5, C.chairLeg);
  rect(ctx, 19, 24, 2, 5, C.chairLeg);

  // ── chair seat ──
  rect(ctx, 9, 21, 14, 4, C.chairSeat);
  // seat highlight
  hline(ctx, 10, 21, 12, C.lightGray);

  // ── chair back ──
  rect(ctx, 11, 14, 10, 8, C.chairBack);
  hline(ctx, 11, 14, 10, C.lightGray);   // top highlight

  // ── desk body ──
  rect(ctx, 1, 17, 30, 5, C.deskTop);
  hline(ctx, 1, 17, 30, '#334155');       // desk top edge highlight
  rect(ctx, 1, 22, 30, 3, C.deskFront);

  // ── desk legs ──
  rect(ctx, 1, 25, 3, 4, C.deskLeg);
  rect(ctx, 28, 25, 3, 4, C.deskLeg);

  // ── monitor glow (drawn before monitor frame) ──
  ctx.globalAlpha = 0.45;
  rect(ctx, 5, 4, 22, 14, glowColor);
  ctx.globalAlpha = 1;

  // ── monitor frame ──
  rect(ctx, 6, 4, 20, 12, C.monitorFrame);
  rect(ctx, 7, 5, 18, 10, C.monitorBevel);

  // ── screen ──
  rect(ctx, 8, 6, 16, 8, screenColor);

  // ── screen scanlines ──
  ctx.globalAlpha = 0.12;
  for (let y = 6; y < 14; y += 2) {
    hline(ctx, 8, y, 16, '#000000');
  }
  ctx.globalAlpha = 1;

  // ── screen content (tiny "graph" or "terminal" lines) ──
  ctx.globalAlpha = 0.7;
  const lineColor = screenColor === C.screenGreen ? '#00ff44' :
                    screenColor === C.screenAmber  ? '#ffcc44' : '#aaddff';
  hline(ctx, 9,  7, 10, lineColor);
  hline(ctx, 9,  9,  7, lineColor);
  hline(ctx, 9, 11,  9, lineColor);
  ctx.globalAlpha = 1;

  // ── monitor stand ──
  rect(ctx, 14, 16, 4, 2, C.monitorFrame);
  rect(ctx, 12, 17, 8, 1, C.monitorFrame);

  // ── keyboard ──
  rect(ctx, 9, 18, 14, 3, C.midGray);
  hline(ctx, 9, 18, 14, C.lightGray);
  // key rows
  ctx.globalAlpha = 0.5;
  for (let kx = 10; kx < 22; kx += 2) {
    px(ctx, kx, 19, C.silver);
    px(ctx, kx, 20, C.silver);
  }
  ctx.globalAlpha = 1;

  // ── LED accent strip on desk edge ──
  ctx.globalAlpha = 0.9;
  hline(ctx, 1, 22, 30, accentColor);
  ctx.globalAlpha = 1;

  // ── mouse ──
  rect(ctx, 23, 18, 4, 3, C.midGray);
  px(ctx, 25, 18, C.lightGray);
}

// ── Per-workstation wrappers ──────────────────────────────────────────────────

function drawWorkstationDeployer() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  drawWorkstation(ctx, C.screenBlue, C.glowBlue, C.deployer);
  return c;
}

function drawWorkstationDistributor() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  drawWorkstation(ctx, C.screenGreen, C.glowGreen, C.distributor);
  return c;
}

function drawWorkstationSwapper() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  drawWorkstation(ctx, C.screenAmber, 'rgba(255,170,0,0.22)', C.swapper);
  return c;
}

function drawWorkstationExtractor() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  drawWorkstation(ctx, C.screenGreen, C.glowGreen, C.extractor);
  return c;
}

// ── Agent sprites ─────────────────────────────────────────────────────────────
// Each agent is a 32×32 top-down pixel-art character.
// Palette key:  body = agent accent color, skin/hair fixed.
// Frames: idle, walk0 (left foot), walk1 (right foot)

/**
 * Draw one agent frame.
 * @param {string} bodyColor   main shirt/jacket color
 * @param {string} bodyDark    shadow of shirt
 * @param {string} hairColor   hair color
 * @param {number} walkPhase   0=idle, 1=walk left, 2=walk right
 * @param {boolean} atDesk     if true, show seated "working" pose
 */
function drawAgent(bodyColor, bodyDark, hairColor, walkPhase, atDesk) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  if (atDesk) {
    // ── Seated pose (back of head + shoulders visible above desk edge) ──────
    // Shoulders / upper body peeking above desk line (y=12–19)
    rect(ctx, 10, 12, 12, 8, bodyColor);   // body
    hline(ctx, 10, 12, 12, bodyDark);       // shoulder shadow
    // Head (bob slightly with walkPhase for "typing" animation)
    const headBob = (walkPhase % 2 === 1) ? 1 : 0;
    rect(ctx, 12, 5 + headBob, 8, 7, C.skin);  // head
    rect(ctx, 12, 5 + headBob, 8, 3, hairColor); // hair on top
    // ears
    px(ctx, 11, 8 + headBob, C.skin);
    px(ctx, 20, 8 + headBob, C.skin);
    // eyes
    px(ctx, 14, 9 + headBob, C.black);
    px(ctx, 17, 9 + headBob, C.black);
    // arms reaching forward
    rect(ctx, 7, 17, 4, 3, C.skin);   // left arm
    rect(ctx, 21, 17, 4, 3, C.skin);  // right arm
    // hands on keyboard
    rect(ctx, 7, 20, 3, 2, C.skin);
    rect(ctx, 22, 20, 3, 2, C.skin);
    return c;
  }

  // ── Standing/walking pose ─────────────────────────────────────────────────
  const baseY = 8;

  // Leg positions vary by walk phase
  let legLX = 12, legRX = 17;
  let legLY = baseY + 14, legRY = baseY + 14;
  if (walkPhase === 1) { legLY -= 2; legRY += 1; }
  if (walkPhase === 2) { legRY -= 2; legLY += 1; }

  // ── shadow ──
  ctx.globalAlpha = 0.18;
  rect(ctx, 11, 28, 10, 3, '#000020');
  ctx.globalAlpha = 1;

  // ── legs ──
  rect(ctx, legLX, legLY, 3, 8, '#334155');         // trousers L
  rect(ctx, legRX, legRY, 3, 8, '#334155');         // trousers R
  rect(ctx, legLX, legLY + 7, 3, 2, '#1e293b');    // shoe L
  rect(ctx, legRX, legRY + 7, 3, 2, '#1e293b');    // shoe R

  // ── body ──
  rect(ctx, 10, baseY + 7, 12, 8, bodyColor);
  hline(ctx, 10, baseY + 7, 12, bodyDark);           // shoulder line

  // ── arms ──
  const armSwing = walkPhase === 1 ? -1 : walkPhase === 2 ? 1 : 0;
  rect(ctx, 7,  baseY + 8 + armSwing, 3, 6, C.skin);
  rect(ctx, 22, baseY + 8 - armSwing, 3, 6, C.skin);

  // ── head ──
  rect(ctx, 11, baseY, 10, 8, C.skin);
  rect(ctx, 11, baseY, 10, 3, hairColor);  // hair

  // ── face ──
  px(ctx, 13, baseY + 4, C.black);   // left eye
  px(ctx, 18, baseY + 4, C.black);   // right eye
  px(ctx, 14, baseY + 6, C.skinDark); // mouth

  // ── ears ──
  px(ctx, 10, baseY + 3, C.skin);
  px(ctx, 21, baseY + 3, C.skin);

  // ── highlight on head ──
  px(ctx, 13, baseY + 1, '#fde8cc');

  return c;
}

// ── Named agent wrappers ──────────────────────────────────────────────────────

const AGENTS = {
  deployer:     { body: C.deployer,     dark: C.deployerDark,     hair: C.hairAlt },
  distributor:  { body: C.distributor,  dark: C.distributorDark,  hair: C.hair },
  swapper:      { body: C.swapper,      dark: C.swapperDark,      hair: '#4a3000' },
  extractor:    { body: C.extractor,    dark: C.extractorDark,    hair: C.hair },
};

// ── Register all textures into Phaser ────────────────────────────────────────

export function registerAll(scene) {
  // Floor & wall tiles
  scene.textures.addCanvas('floor_tile', drawFloorTile());
  scene.textures.addCanvas('wall_tile',  drawWallTile());

  // Workstations
  scene.textures.addCanvas('workstation_deployer',     drawWorkstationDeployer());
  scene.textures.addCanvas('workstation_distributor',  drawWorkstationDistributor());
  scene.textures.addCanvas('workstation_swapper',      drawWorkstationSwapper());
  scene.textures.addCanvas('workstation_extractor',    drawWorkstationExtractor());

  // Agent frames
  for (const [name, pal] of Object.entries(AGENTS)) {
    scene.textures.addCanvas(`agent_${name}_idle`,
      drawAgent(pal.body, pal.dark, pal.hair, 0, false));
    scene.textures.addCanvas(`agent_${name}_walk0`,
      drawAgent(pal.body, pal.dark, pal.hair, 1, false));
    scene.textures.addCanvas(`agent_${name}_walk1`,
      drawAgent(pal.body, pal.dark, pal.hair, 2, false));
    scene.textures.addCanvas(`agent_${name}_work0`,
      drawAgent(pal.body, pal.dark, pal.hair, 0, true));
    scene.textures.addCanvas(`agent_${name}_work1`,
      drawAgent(pal.body, pal.dark, pal.hair, 1, true));
  }
}

export { C, S };
