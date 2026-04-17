// classes/SpriteFactory.js
// Load pixel-agents PNG assets as Phaser textures

async function loadPixelAgentsAssets(scene) {
  // Character sprites - map agents to pixel-agents character indices
  const characterMap = {
    deployer: 0,      // char_0.png
    distributor: 1,   // char_1.png
    swapper: 2,       // char_2.png
    extractor: 3,     // char_3.png
  };

  // Load character sprites from PNG assets
  for (const [agentKey, charId] of Object.entries(characterMap)) {
    const path = `assets/characters/char_${charId}.png`;
    try {
      // Use Phaser's image loader for proper texture registration
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            scene.textures.addImage(`agent_${agentKey}`, img);
            resolve();
          } catch (e) {
            console.warn(`Failed to register character sprite: ${path}`);
            createFallbackCharacter(scene, agentKey);
            resolve();
          }
        };
        img.onerror = () => {
          console.warn(`Failed to load character sprite: ${path}`);
          createFallbackCharacter(scene, agentKey);
          resolve();
        };
        img.src = path;
      });
    } catch (e) {
      console.warn(`Error loading character sprite: ${path}`, e);
      createFallbackCharacter(scene, agentKey);
    }
  }

  loadEnvironmentAssets(scene);
}

function createFallbackCharacter(scene, agentKey) {
  // Create placeholder sprite if asset not found
  const colors = {
    deployer: 0xff5555,
    distributor: 0x44ddcc,
    swapper: 0xffdd44,
    extractor: 0x88eedd,
  };
  const color = colors[agentKey] || 0xcccccc;
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, 32, 64);
  scene.textures.addCanvas(`agent_${agentKey}`, canvas);
}

function loadEnvironmentAssets(scene) {
  // Load floors
  for (let i = 1; i <= 9; i++) {
    const path = `/assets/floors/${i}.png`;
    const image = new Image();
    image.src = path;
    image.onerror = () => {
      createFallbackFloor(scene, i);
    };
    try {
      scene.textures.addImage(`floor_${i}`, image);
    } catch (e) {
      createFallbackFloor(scene, i);
    }
  }

  // Create basic floor tiles if assets don't load
  ['floor_tile', 'wall_tile'].forEach((key) => {
    if (!scene.textures.exists(key)) {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (key === 'floor_tile') {
        ctx.fillStyle = '#d4c9b8';
        ctx.fillRect(0, 0, 32, 32);
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 32, 32);
      } else {
        ctx.fillStyle = '#a8a8a8';
        ctx.fillRect(0, 0, 32, 32);
      }
      scene.textures.addCanvas(key, canvas);
    }
  });

  // Create placeholder furniture sprites
  const furnitureKeys = [
    'desk', 'chair', 'coffee_machine', 'couch_64x32', 'table',
    'whiteboard', 'water_cooler', 'bookshelf', 'plant', 'filing_cabinet',
    'trash_can', 'door'
  ];

  for (const key of furnitureKeys) {
    if (!scene.textures.exists(key)) {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#8b6f47';
      ctx.fillRect(0, 0, 48, 32);
      ctx.fillStyle = '#6b5437';
      ctx.fillRect(0, 0, 48, 4);
      scene.textures.addCanvas(key, canvas);
    }
  }
}

function createFallbackFloor(scene, index) {
  const colors = ['#d4c9b8', '#c9bfad', '#dcd4c4', '#cfc7b7', '#d8d0c0', '#cfc7b7', '#d4c9b8', '#c9bfad', '#dcd4c4'];
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = colors[index - 1] || '#d4c9b8';
  ctx.fillRect(0, 0, 32, 32);
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#999999';
  ctx.strokeRect(0, 0, 32, 32);
  scene.textures.addCanvas(`floor_${index}`, canvas);
}

export async function registerAll(scene) {
  // Load pixel-agents PNG assets as Phaser textures
  loadPixelAgentsAssets(scene);
}

export function registerAnimations(scene) {
  // Animations use the static PNG sprites
  // For now, we use the agent sprite directly since PNG assets are single images
  // Pose changes are handled by changing sprite textures, not frame animations
}
