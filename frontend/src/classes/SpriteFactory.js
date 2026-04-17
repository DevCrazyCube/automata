// classes/SpriteFactory.js
// Load and setup character sprites as Phaser sprite sheets with animations

const TILE_SIZE = 32;

export function registerAll(scene) {
  // Load character sprites as images first
  scene.load.image('agent_deployer', 'assets/characters/char_0.png');
  scene.load.image('agent_distributor', 'assets/characters/char_1.png');
  scene.load.image('agent_swapper', 'assets/characters/char_2.png');
  scene.load.image('agent_extractor', 'assets/characters/char_3.png');

  // Load floor sprites
  for (let i = 1; i <= 9; i++) {
    scene.load.image(`floor_${i}`, `assets/floors/floor_${i}.png`);
  }

  // Listen for load error to create fallbacks
  scene.load.on('loaderror', (file) => {
    console.warn(`Failed to load: ${file.key}`);
  });

  // Create fallbacks if assets don't load
  scene.load.on('complete', () => {
    createFallbackSprites(scene);
  });
}

function createFallbackSprites(scene) {
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

  // Floor tile fallback
  if (!scene.textures.exists('floor_tile')) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d4c9b8';
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    scene.textures.addCanvas('floor_tile', canvas);
  }

  // Furniture fallbacks
  const furnitureKeys = [
    'desk', 'chair', 'coffee_machine', 'couch_64x32', 'table',
    'whiteboard', 'water_cooler'
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

export function registerAnimations(scene) {
  // Animations will be sprite texture changes, not frame-based
  // Phaser will simply swap texture keys when animations are triggered
}
