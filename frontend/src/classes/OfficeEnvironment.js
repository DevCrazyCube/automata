// classes/OfficeEnvironment.js
// Builds the office tilemap with rooms, furniture, and interactive objects.
// Also creates InteractiveObject instances for agent interactions.

import InteractiveObject from './InteractiveObject.js';

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;
const TILE_SIZE = 32;

export default class OfficeEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.interactiveObjects = {};
    this.floorLayer = null;
    this.wallLayer = null;
    this.particleEmitters = {};
  }

  // Build the office environment
  build() {
    this._createFloors();
    this._createWalls();
    this._createFurniture();
    this._createInteractiveObjects();
    this._createParticles();

    return this.interactiveObjects;
  }

  _createParticles() {
    // Placeholder for future particle effects
    // Particle systems require physics to be enabled
  }

  triggerCoffeeParticles() {
    // Particle effect triggered on coffee interaction
  }

  triggerWhiteboardDust(x, y) {
    // Particle effect triggered on whiteboard write
  }

  _createFloors() {
    // Create alternating beige checkerboard floor
    for (let y = 0; y < WORLD_HEIGHT; y += TILE_SIZE) {
      for (let x = 0; x < WORLD_WIDTH; x += TILE_SIZE) {
        const isCheckerboard = ((x / TILE_SIZE) + (y / TILE_SIZE)) % 2 === 0;
        const key = isCheckerboard ? 'floor_beige_a' : 'floor_beige_b';
        const img = this.scene.add.image(x + TILE_SIZE / 2, y + TILE_SIZE / 2, key);
        if (img) {
          img.setOrigin(0.5, 0.5).setDepth(0);
        }
      }
    }
  }

  _createWalls() {
    // Top wall
    for (let x = 0; x < WORLD_WIDTH; x += TILE_SIZE) {
      const img = this.scene.add.image(x + TILE_SIZE / 2, TILE_SIZE / 2, 'wall_gray');
      if (img) {
        img.setOrigin(0.5, 0.5).setDepth(5);
      }
    }

    // Vertical divider at mid-width
    for (let y = TILE_SIZE; y < WORLD_HEIGHT; y += TILE_SIZE) {
      const img = this.scene.add.image(WORLD_WIDTH / 2, y + TILE_SIZE / 2, 'wall_gray');
      if (img) {
        img.setOrigin(0.5, 0.5).setDepth(5);
      }
    }

    // Horizontal divider at 60% height
    for (let x = 0; x < WORLD_WIDTH / 2; x += TILE_SIZE) {
      const img = this.scene.add.image(x + TILE_SIZE / 2, WORLD_HEIGHT * 0.65, 'wall_gray');
      if (img) {
        img.setOrigin(0.5, 0.5).setDepth(5);
      }
    }
  }

  _createFurniture() {
    const furniture = [
      // Agent desks (left side)
      { x: 80, y: 150, key: 'desk', scale: 1.5, depth: 8 },
      { x: 80, y: 150, key: 'chair', scale: 1.0, depth: 8 },
      { x: 250, y: 150, key: 'desk', scale: 1.5, depth: 8 },
      { x: 250, y: 150, key: 'chair', scale: 1.0, depth: 8 },
      // Break room furniture (right side)
      { x: 550, y: 200, key: 'coffee_machine', scale: 2.0, depth: 8 },
      { x: 550, y: 350, key: 'table', scale: 2.0, depth: 8 },
      { x: 550, y: 480, key: 'couch_64x32', scale: 2.0, depth: 8 },
      { x: 100, y: 400, key: 'whiteboard', scale: 1.8, depth: 6 },
      { x: 750, y: 500, key: 'water_cooler', scale: 2.0, depth: 8 },
      { x: 50, y: 500, key: 'bookshelf', scale: 1.5, depth: 8 },
      { x: 700, y: 100, key: 'plant', scale: 1.5, depth: 8 },
      { x: 300, y: 500, key: 'filing_cabinet', scale: 1.5, depth: 8 },
      { x: 750, y: 50, key: 'trash_can', scale: 2.0, depth: 8 },
    ];

    for (const item of furniture) {
      if (this.scene.textures.exists(item.key)) {
        const img = this.scene.add.image(item.x, item.y, item.key);
        img.setOrigin(0.5, 0.5).setScale(item.scale).setDepth(item.depth);
      }
    }

    // Chairs around table
    for (let i = 0; i < 4; i++) {
      if (this.scene.textures.exists('chair')) {
        const angle = (i / 4) * Math.PI * 2;
        const x = 550 + Math.cos(angle) * 70;
        const y = 350 + Math.sin(angle) * 60;
        const img = this.scene.add.image(x, y, 'chair');
        img.setOrigin(0.5, 0.5).setScale(0.8).setDepth(8);
      }
    }
  }

  _createInteractiveObjects() {
    // Create interactive object instances
    this.interactiveObjects.coffee = new InteractiveObject(
      this.scene, 550, 200, 'coffee', { radius: 80 }
    );

    this.interactiveObjects.couch = new InteractiveObject(
      this.scene, 550, 480, 'couch', { radius: 96 }
    );

    this.interactiveObjects.table = new InteractiveObject(
      this.scene, 550, 350, 'table', { radius: 80 }
    );

    this.interactiveObjects.whiteboard = new InteractiveObject(
      this.scene, 100, 400, 'whiteboard', { radius: 96 }
    );

    this.interactiveObjects.water_cooler = new InteractiveObject(
      this.scene, 750, 500, 'water_cooler', { radius: 64 }
    );
  }

  destroy() {
    Object.values(this.interactiveObjects).forEach(obj => obj.destroy());
    this.interactiveObjects = {};
  }
}
