// classes/SpriteFactory.js
// Load sprites and setup animations following pixel-agents pattern

const TILE_SIZE = 32;

export function registerAll(scene) {
  // Load character PNGs (each is a full sprite sheet)
  scene.load.image('agent_deployer', '/assets/characters/char_0.png');
  scene.load.image('agent_distributor', '/assets/characters/char_1.png');
  scene.load.image('agent_swapper', '/assets/characters/char_2.png');
  scene.load.image('agent_extractor', '/assets/characters/char_3.png');

  // Load floor tilesets
  for (let i = 1; i <= 9; i++) {
    scene.load.image(`floor_${i}`, `/assets/floors/${i}.png`);
  }

  // Load wall tilesets
  scene.load.image('wall_dark', '/assets/walls/wall_0.png');

  // Handle load errors - create fallbacks
  scene.load.on('loaderror', (file) => {
    console.warn(`Failed to load: ${file.key}`);
  });

  scene.load.on('complete', () => {
    createFallbackSprites(scene);
  });
}

function createFallbackSprites(scene) {
  const agents = {
    deployer: 0xff5555,
    distributor: 0x44ddcc,
    swapper: 0xffdd44,
    extractor: 0x88eedd
  };

  for (const [agentKey, color] of Object.entries(agents)) {
    const key = `agent_${agentKey}`;
    if (!scene.textures.exists(key)) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      ctx.fillRect(0, 0, 32, 64);
      scene.textures.addCanvas(key, canvas);
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
}

export function registerAnimations(scene) {
  // For now, animations are handled via texture swaps, not frame-based
  // When we have sprite sheets, this will create proper animations
}
