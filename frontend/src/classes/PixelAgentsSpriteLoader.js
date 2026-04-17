// classes/PixelAgentsSpriteLoader.js
// Loads and manages pixel-agents style character sprites from PNG assets.
// Integrates with Phaser texture system for rendering.

export class PixelAgentsSpriteLoader {
  static async loadCharacterSprites(scene) {
    // Character sprite mapping: agent key → character index
    const characterMap = {
      deployer: 0,      // char_0.png (red agent variant)
      distributor: 1,   // char_1.png (cyan agent variant)
      swapper: 2,       // char_2.png (yellow agent variant)
      extractor: 3,     // char_3.png (purple agent variant)
    };

    const agents = ['deployer', 'distributor', 'swapper', 'extractor'];
    const characterIds = [0, 1, 2, 3];

    // Load character sprites
    for (let i = 0; i < agents.length; i++) {
      const agentKey = agents[i];
      const charId = characterIds[i];
      const path = `/assets/characters/char_${charId}.png`;

      // Register the character sprite image with Phaser
      scene.textures.addImage(`agent_${agentKey}`, path);
    }

    // Load floor sprites
    const floors = ['floor_1', 'floor_2', 'floor_3', 'floor_4', 'floor_5', 'floor_6', 'floor_7', 'floor_8', 'floor_9'];
    for (let i = 1; i <= 9; i++) {
      const path = `/assets/floors/${i}.png`;
      scene.textures.addImage(`floor_${i}`, path);
    }

    // Load wall sprites
    const wallColors = ['dark', 'light', 'stone', 'brick', 'wood'];
    for (const color of wallColors) {
      const path = `/assets/walls/${color}.png`;
      try {
        scene.textures.addImage(`wall_${color}`, path);
      } catch (e) {
        console.warn(`Wall sprite not found: ${color}`);
      }
    }

    // Load furniture sprites
    const furnitures = ['DESK_FRONT', 'DESK_SIDE', 'WOODEN_CHAIR', 'SOFA', 'PC_FRONT_ON_1', 'PC_SIDE', 'WHITEBOARD', 'COFFEE', 'BOOKSHELF', 'PLANT'];
    for (const furniture of furnitures) {
      const path = `/assets/furniture/${furniture.split('_')[0]}/${furniture}.png`;
      try {
        scene.textures.addImage(`furniture_${furniture}`, path);
      } catch (e) {
        console.warn(`Furniture sprite not found: ${furniture}`);
      }
    }
  }

  static createFallbackSprite(scene, key, width, height, color) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    scene.textures.addCanvas(key, canvas);
  }
}
