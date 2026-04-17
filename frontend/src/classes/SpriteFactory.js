// classes/SpriteFactory.js
// Load pixel-agents PNG assets using Phaser's asset loader

function setupPixelAgentsLoader(scene) {
  // Character sprites - map agents to pixel-agents character indices
  const characterMap = {
    deployer: 0,      // char_0.png
    distributor: 1,   // char_1.png
    swapper: 2,       // char_2.png
    extractor: 3,     // char_3.png
  };

  // Register character sprite images with Phaser loader
  for (const [agentKey, charId] of Object.entries(characterMap)) {
    const path = `assets/characters/char_${charId}.png`;
    scene.load.image(`agent_${agentKey}`, path);
  }

  // Load floor sprites
  for (let i = 1; i <= 9; i++) {
    scene.load.image(`floor_${i}`, `assets/floors/floor_${i}.png`);
  }
}

function createFallbackSprites(scene) {
  // Create fallback sprites if PNG loading fails
  const agents = {
    deployer: 0xff5555,
    distributor: 0x44ddcc,
    swapper: 0xffdd44,
    extractor: 0x88eedd,
  };

  for (const [agentKey, color] of Object.entries(agents)) {
    if (!scene.textures.exists(`agent_${agentKey}`)) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      ctx.fillRect(0, 0, 32, 64);
      scene.textures.addCanvas(`agent_${agentKey}`, canvas);
    }
  }

  // Create fallback floor tiles
  if (!scene.textures.exists('floor_tile')) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d4c9b8';
    ctx.fillRect(0, 0, 32, 32);
    scene.textures.addCanvas('floor_tile', canvas);
  }

  // Create fallback furniture sprites
  const furnitureKeys = [
    'desk', 'chair', 'coffee_machine', 'couch_64x32', 'table',
    'whiteboard', 'water_cooler', 'bookshelf', 'plant'
  ];

  for (const key of furnitureKeys) {
    if (!scene.textures.exists(key)) {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#8b6f47';
      ctx.fillRect(0, 0, 48, 32);
      scene.textures.addCanvas(key, canvas);
    }
  }
}

export function registerAll(scene) {
  // Setup Phaser loader for character sprites
  setupPixelAgentsLoader(scene);

  // Load events: when all assets are loaded, create fallbacks if needed
  scene.load.on('complete', () => {
    createFallbackSprites(scene);
  });

  scene.load.on('loaderror', (fileObj) => {
    console.warn(`Failed to load asset: ${fileObj.key}`);
  });
}

export function registerAnimations(scene) {
  // Animations handled by sprite texture changes, not frame animations
  // Pose changes use setTexture() calls
}
