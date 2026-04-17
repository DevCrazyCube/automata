// classes/SpriteFactory.js
// Detailed pixel art sprites in isometric style matching reference image.
// Characters with facial features, clothing, and professional office aesthetic.

const S = 32;

const C = {
  // Skin tones
  skinLight: '#f5c9a9',
  skinMid: '#e8b896',
  skinDark: '#d4935f',

  // Hair
  hairBlack: '#1a1a1a',
  hairBrown: '#654321',
  hairRed: '#cc4444',
  hairBlonde: '#daa520',

  // Clothing colors (agent themed)
  deployerRed: '#cc3333',
  deployerRedDark: '#992222',
  distributorCyan: '#33cccc',
  distributorCyanDark: '#1a9999',
  swapperYellow: '#ffee44',
  swapperYellowDark: '#cc9900',
  extractorPurple: '#9944ff',
  extractorPurpleDark: '#6622cc',

  // Office
  deskWood: '#8b6f47',
  deskWoodDark: '#6b5437',
  floorBeige: '#d4c9b8',
  floorBeigeAlt: '#c9bfad',
  wallLight: '#a8a8a8',
  chairBlue: '#4a5a7a',
  chairBlueDark: '#2a3a5a',
  white: '#ffffff',
  black: '#1a1a1a',
  gray: '#808080',
};

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

function line(ctx, x1, y1, x2, y2, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// ── Detailed character sprites ──

/**
 * Draw character with detailed facial features and clothing.
 * Base function for creating different character variants.
 */
function drawCharacterIdle(skinColor, hairColor, shirtColor, pantsColor, direction = 'down') {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  // Shadow
  ctx.globalAlpha = 0.2;
  rect(ctx, 8, 28, 16, 3, '#000000');
  ctx.globalAlpha = 1;

  // Pants
  rect(ctx, 10, 19, 5, 8, pantsColor);
  rect(ctx, 17, 19, 5, 8, pantsColor);

  // Shoes
  rect(ctx, 10, 27, 5, 2, '#333333');
  rect(ctx, 17, 27, 5, 2, '#333333');

  // Shirt/torso
  rect(ctx, 9, 12, 14, 7, shirtColor);

  // Shirt details (buttons/seams)
  px(ctx, 16, 14, '#666666');
  px(ctx, 16, 17, '#666666');

  // Arms
  rect(ctx, 6, 14, 3, 6, skinColor);
  rect(ctx, 23, 14, 3, 6, skinColor);
  rect(ctx, 6, 20, 3, 2, '#333333'); // sleeves
  rect(ctx, 23, 20, 3, 2, '#333333');

  // Neck
  px(ctx, 15, 12, skinColor);
  px(ctx, 17, 12, skinColor);

  // Head (detailed with facial features)
  rect(ctx, 11, 3, 10, 9, skinColor);

  // Hair
  rect(ctx, 11, 3, 10, 5, hairColor);
  px(ctx, 10, 5, hairColor);
  px(ctx, 21, 5, hairColor);

  // Face - eyes
  px(ctx, 13, 7, '#000000');
  px(ctx, 18, 7, '#000000');
  px(ctx, 13, 8, '#ffffff');
  px(ctx, 18, 8, '#ffffff');

  // Mouth (simple smile)
  px(ctx, 15, 10, '#cc6666');
  px(ctx, 16, 10, '#cc6666');

  return c;
}

function drawCharacterWalking(skinColor, hairColor, shirtColor, pantsColor, walkFrame) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  // Shadow
  ctx.globalAlpha = 0.2;
  rect(ctx, 8, 28, 16, 3, '#000000');
  ctx.globalAlpha = 1;

  // Leg swing animation
  const legLift = walkFrame === 0 ? 1 : -1;

  // Pants - legs swinging
  rect(ctx, 10, 19 + legLift, 5, 8, pantsColor);
  rect(ctx, 17, 19 - legLift, 5, 8, pantsColor);
  rect(ctx, 10, 27, 5, 2, '#333333');
  rect(ctx, 17, 27, 5, 2, '#333333');

  // Shirt
  rect(ctx, 9, 12, 14, 7, shirtColor);
  px(ctx, 16, 14, '#666666');
  px(ctx, 16, 17, '#666666');

  // Arms swinging
  const armSwing = walkFrame === 0 ? -2 : 2;
  rect(ctx, 6, 14 + armSwing, 3, 6, skinColor);
  rect(ctx, 23, 14 - armSwing, 3, 6, skinColor);

  // Head
  rect(ctx, 11, 3, 10, 9, skinColor);
  rect(ctx, 11, 3, 10, 5, hairColor);
  px(ctx, 10, 5, hairColor);
  px(ctx, 21, 5, hairColor);
  px(ctx, 13, 7, '#000000');
  px(ctx, 18, 7, '#000000');
  px(ctx, 13, 8, '#ffffff');
  px(ctx, 18, 8, '#ffffff');

  return c;
}

function drawCharacterTyping(skinColor, hairColor, shirtColor, pantsColor) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  // Sitting pose - torso forward
  rect(ctx, 10, 16, 12, 6, shirtColor);
  px(ctx, 16, 17, '#666666');

  // Head (looking at screen)
  rect(ctx, 11, 5, 10, 9, skinColor);
  rect(ctx, 11, 5, 10, 5, hairColor);
  px(ctx, 13, 9, '#000000');
  px(ctx, 18, 9, '#000000');

  // Arms on keyboard
  rect(ctx, 6, 18, 4, 4, skinColor);
  rect(ctx, 22, 18, 4, 4, skinColor);
  rect(ctx, 6, 22, 4, 2, '#999999'); // hands on keyboard
  rect(ctx, 22, 22, 4, 2, '#999999');

  // Legs (sitting)
  rect(ctx, 11, 22, 4, 6, pantsColor);
  rect(ctx, 17, 22, 4, 6, pantsColor);

  return c;
}

function drawCharacterCelebrating(skinColor, hairColor, shirtColor, pantsColor) {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  // Jumping pose - feet off ground
  rect(ctx, 10, 18, 5, 4, pantsColor);
  rect(ctx, 17, 18, 5, 4, pantsColor);
  rect(ctx, 10, 22, 5, 2, '#333333');
  rect(ctx, 17, 22, 5, 2, '#333333');

  // Shirt
  rect(ctx, 9, 12, 14, 6, shirtColor);

  // Arms raised
  rect(ctx, 5, 10, 3, 8, skinColor);
  rect(ctx, 24, 10, 3, 8, skinColor);

  // Head (happy)
  rect(ctx, 11, 2, 10, 9, skinColor);
  rect(ctx, 11, 2, 10, 5, hairColor);

  // Happy eyes
  px(ctx, 13, 7, '#000000');
  px(ctx, 18, 7, '#000000');
  px(ctx, 13, 8, '#ffffff');
  px(ctx, 18, 8, '#ffffff');

  // Big smile
  px(ctx, 15, 10, '#ff6666');
  px(ctx, 16, 10, '#ff6666');
  px(ctx, 17, 10, '#ff6666');

  return c;
}

// ── Floor and wall tiles (isometric style) ──

function drawFloorTile() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  rect(ctx, 0, 0, S, S, C.floorBeige);
  ctx.globalAlpha = 0.3;
  line(ctx, 0, S - 1, S, S - 1, '#999999');
  line(ctx, S - 1, 0, S - 1, S, '#999999');
  ctx.globalAlpha = 1;
  return c;
}

function drawWallTile() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');
  rect(ctx, 0, 0, S, S, C.wallLight);
  rect(ctx, 0, 0, S, 4, '#c0c0c0');
  return c;
}

// ── Isometric furniture ──

function drawDeskIsometric() {
  const c = makeCanvas(48, 32);
  const ctx = c.getContext('2d');

  // Top surface (angled)
  rect(ctx, 6, 8, 36, 12, C.deskWood);
  rect(ctx, 6, 8, 36, 1, C.deskWoodDark);

  // Front leg
  rect(ctx, 8, 20, 4, 8, C.deskWoodDark);
  rect(ctx, 38, 20, 4, 8, C.deskWoodDark);

  // Detail: monitor and desk items
  rect(ctx, 14, 10, 12, 6, '#333333'); // monitor
  rect(ctx, 16, 11, 8, 4, '#4a7a9a'); // screen

  return c;
}

function drawChairIsometric() {
  const c = makeCanvas();
  const ctx = c.getContext('2d');

  // Seat (angled)
  rect(ctx, 8, 12, 16, 8, C.chairBlue);

  // Back
  rect(ctx, 10, 6, 12, 8, C.chairBlueDark);

  // Legs
  rect(ctx, 9, 20, 2, 6, C.chairBlueDark);
  rect(ctx, 21, 20, 2, 6, C.chairBlueDark);

  return c;
}

// ── Agent variant creators ──

const AGENTS = {
  deployer: {
    skin: C.skinLight,
    hair: C.hairBlack,
    shirt: C.deployerRed,
    pants: '#333333'
  },
  distributor: {
    skin: C.skinMid,
    hair: C.hairBrown,
    shirt: C.distributorCyan,
    pants: '#1a1a3a'
  },
  swapper: {
    skin: C.skinLight,
    hair: C.hairRed,
    shirt: C.swapperYellow,
    pants: '#555555'
  },
  extractor: {
    skin: C.skinDark,
    hair: C.hairBlonde,
    shirt: C.extractorPurple,
    pants: '#2a2a3a'
  }
};

export function registerAll(scene) {
  // Floor and walls
  scene.textures.addCanvas('floor_tile', drawFloorTile());
  scene.textures.addCanvas('wall_tile', drawWallTile());

  // Furniture
  scene.textures.addCanvas('desk', drawDeskIsometric());
  scene.textures.addCanvas('chair', drawChairIsometric());
  scene.textures.addCanvas('coffee_machine', drawDeskIsometric()); // placeholder
  scene.textures.addCanvas('couch_64x32', drawDeskIsometric()); // placeholder
  scene.textures.addCanvas('table', drawDeskIsometric()); // placeholder
  scene.textures.addCanvas('whiteboard', drawWallTile()); // placeholder
  scene.textures.addCanvas('water_cooler', drawChairIsometric()); // placeholder
  scene.textures.addCanvas('bookshelf', drawDeskIsometric()); // placeholder
  scene.textures.addCanvas('plant', drawChairIsometric()); // placeholder
  scene.textures.addCanvas('filing_cabinet', drawChairIsometric()); // placeholder
  scene.textures.addCanvas('trash_can', drawChairIsometric()); // placeholder
  scene.textures.addCanvas('door', drawWallTile()); // placeholder

  // Agent sprites (detailed pixel art)
  for (const [name, pal] of Object.entries(AGENTS)) {
    // Idle
    scene.textures.addCanvas(`agent_${name}_idle`, drawCharacterIdle(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_idle0`, drawCharacterIdle(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_idle1`, drawCharacterIdle(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_idle2`, drawCharacterIdle(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_idle3`, drawCharacterIdle(pal.skin, pal.hair, pal.shirt, pal.pants));

    // Walking
    scene.textures.addCanvas(`agent_${name}_walk_down0`, drawCharacterWalking(pal.skin, pal.hair, pal.shirt, pal.pants, 0));
    scene.textures.addCanvas(`agent_${name}_walk_down1`, drawCharacterWalking(pal.skin, pal.hair, pal.shirt, pal.pants, 1));
    scene.textures.addCanvas(`agent_${name}_walk_up0`, drawCharacterWalking(pal.skin, pal.hair, pal.shirt, pal.pants, 0));
    scene.textures.addCanvas(`agent_${name}_walk_up1`, drawCharacterWalking(pal.skin, pal.hair, pal.shirt, pal.pants, 1));

    // Typing
    scene.textures.addCanvas(`agent_${name}_work0`, drawCharacterTyping(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_work1`, drawCharacterTyping(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_work2`, drawCharacterTyping(pal.skin, pal.hair, pal.shirt, pal.pants));

    // Celebrating
    scene.textures.addCanvas(`agent_${name}_success0`, drawCharacterCelebrating(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_success1`, drawCharacterCelebrating(pal.skin, pal.hair, pal.shirt, pal.pants));

    // Other animations (reuse for now)
    scene.textures.addCanvas(`agent_${name}_coffee0`, drawCharacterIdle(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_coffee_reach0`, drawCharacterIdle(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_coffee_reach1`, drawCharacterWalking(pal.skin, pal.hair, pal.shirt, pal.pants, 0));
    scene.textures.addCanvas(`agent_${name}_couch0`, drawCharacterIdle(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_sit_down0`, drawCharacterTyping(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_sit_down1`, drawCharacterTyping(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_sit_down2`, drawCharacterTyping(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_get_up0`, drawCharacterWalking(pal.skin, pal.hair, pal.shirt, pal.pants, 0));
    scene.textures.addCanvas(`agent_${name}_get_up1`, drawCharacterWalking(pal.skin, pal.hair, pal.shirt, pal.pants, 1));
    scene.textures.addCanvas(`agent_${name}_talk0`, drawCharacterIdle(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_talk1`, drawCharacterIdle(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_talk2`, drawCharacterWalking(pal.skin, pal.hair, pal.shirt, pal.pants, 0));
    scene.textures.addCanvas(`agent_${name}_write0`, drawCharacterTyping(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_write1`, drawCharacterTyping(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_error0`, drawCharacterIdle(pal.skin, pal.hair, pal.shirt, pal.pants));
    scene.textures.addCanvas(`agent_${name}_error1`, drawCharacterIdle(pal.skin, pal.hair, pal.shirt, pal.pants));
  }
}

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

    scene.anims.create({
      key: `${name}_coffee_reach`,
      frames: [
        { key: `agent_${name}_coffee_reach0` },
        { key: `agent_${name}_coffee_reach1` },
      ],
      frameRate: 4,
      repeat: 0,
    });

    scene.anims.create({
      key: `${name}_sit_down`,
      frames: [
        { key: `agent_${name}_sit_down0` },
        { key: `agent_${name}_sit_down1` },
        { key: `agent_${name}_sit_down2` },
      ],
      frameRate: 4,
      repeat: 0,
    });

    scene.anims.create({
      key: `${name}_get_up`,
      frames: [
        { key: `agent_${name}_get_up0` },
        { key: `agent_${name}_get_up1` },
      ],
      frameRate: 4,
      repeat: 0,
    });

    scene.anims.create({
      key: `${name}_write`,
      frames: [
        { key: `agent_${name}_write0` },
        { key: `agent_${name}_write1` },
      ],
      frameRate: 6,
      repeat: -1,
    });

    scene.anims.create({
      key: `${name}_error`,
      frames: [
        { key: `agent_${name}_error0` },
        { key: `agent_${name}_error1` },
      ],
      frameRate: 4,
      repeat: -1,
    });
  }
}

export { C, S };
