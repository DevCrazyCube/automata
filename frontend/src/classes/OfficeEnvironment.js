// classes/OfficeEnvironment.js
// Builds the office tilemap with rooms, furniture, and interactive objects.
// Also creates InteractiveObject instances for agent interactions.

import InteractiveObject from './InteractiveObject.js';

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;

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
    // Coffee machine steam effect
    const coffeeEmitter = this.scene.make.particles({
      speed: { min: -20, max: 20 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 1200,
      gravityY: -80,
    });

    coffeeEmitter.createEmitter({
      speed: { min: -20, max: 20 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 1000,
      gravityY: -100,
      emitZone: { source: new Phaser.Geom.Circle(550, 180, 10) },
    });

    coffeeEmitter.start();
    coffeeEmitter.pause();

    this.particleEmitters.coffee = coffeeEmitter;

    // Whiteboard dust effect (for erasing)
    const dustEmitter = this.scene.make.particles({
      speed: { min: -50, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.1, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 800,
    });

    dustEmitter.createEmitter({
      speed: { min: -40, max: 40 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.15, end: 0 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 600,
    });

    dustEmitter.pause();
    this.particleEmitters.whiteboard = dustEmitter;
  }

  triggerCoffeeParticles() {
    if (this.particleEmitters.coffee) {
      this.particleEmitters.coffee.resume();
      this.scene.time.delayedCall(2000, () => {
        this.particleEmitters.coffee.pause();
      });
    }
  }

  triggerWhiteboardDust(x, y) {
    if (this.particleEmitters.whiteboard) {
      this.particleEmitters.whiteboard.emitParticleAt(x, y, 8);
    }
  }

  _createFloors() {
    // Create alternating beige checkerboard floor
    const tileSize = 32;
    for (let y = 0; y < WORLD_HEIGHT; y += tileSize) {
      for (let x = 0; x < WORLD_WIDTH; x += tileSize) {
        const isCheckerboard = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        const key = isCheckerboard ? 'floor_beige_a' : 'floor_beige_b';
        this.scene.add.image(x + tileSize / 2, y + tileSize / 2, key)
          .setOrigin(0.5, 0.5)
          .setDepth(0);
      }
    }
  }

  _createWalls() {
    // Top wall
    for (let x = 0; x < WORLD_WIDTH; x += 32) {
      this.scene.add.image(x + 16, 16, 'wall_gray')
        .setOrigin(0.5, 0.5)
        .setDepth(5);
    }

    // Vertical divider at mid-width (separate main office and break room)
    for (let y = 0; y < WORLD_HEIGHT; y += 32) {
      if (y > 60) { // Skip wall after top area
        this.scene.add.image(WORLD_WIDTH / 2, y + 16, 'wall_gray')
          .setOrigin(0.5, 0.5)
          .setDepth(5);
      }
    }

    // Horizontal divider at 60% height (separate work area and break area)
    for (let x = 0; x < WORLD_WIDTH / 2; x += 32) {
      this.scene.add.image(x + 16, WORLD_HEIGHT * 0.65, 'wall_gray')
        .setOrigin(0.5, 0.5)
        .setDepth(5);
    }
  }

  _createFurniture() {
    // Agent desks (left side)
    this.scene.add.image(80, 150, 'desk')
      .setOrigin(0.5, 0.5)
      .setScale(1.5)
      .setDepth(8);
    this.scene.add.image(80, 150, 'chair')
      .setOrigin(0.5, 0.5)
      .setScale(1.0)
      .setDepth(8);

    this.scene.add.image(250, 150, 'desk')
      .setOrigin(0.5, 0.5)
      .setScale(1.5)
      .setDepth(8);
    this.scene.add.image(250, 150, 'chair')
      .setOrigin(0.5, 0.5)
      .setScale(1.0)
      .setDepth(8);

    // Break room furniture (right side)
    // Coffee machine
    this.scene.add.image(550, 200, 'coffee_machine')
      .setOrigin(0.5, 0.5)
      .setScale(2.0)
      .setDepth(8);

    // Break room table (center)
    this.scene.add.image(550, 350, 'table')
      .setOrigin(0.5, 0.5)
      .setScale(2.0)
      .setDepth(8);

    // Chairs around table
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = 550 + Math.cos(angle) * 70;
      const y = 350 + Math.sin(angle) * 60;
      this.scene.add.image(x, y, 'chair')
        .setOrigin(0.5, 0.5)
        .setScale(0.8)
        .setDepth(8);
    }

    // Couch (lower right)
    this.scene.add.image(550, 480, 'couch_64x32')
      .setOrigin(0.5, 0.5)
      .setScale(2.0)
      .setDepth(8);

    // Whiteboard (left side lower)
    this.scene.add.image(100, 400, 'whiteboard')
      .setOrigin(0.5, 0.5)
      .setScale(1.8)
      .setDepth(6);

    // Water cooler (right side corner)
    this.scene.add.image(750, 500, 'water_cooler')
      .setOrigin(0.5, 0.5)
      .setScale(2.0)
      .setDepth(8);

    // Bookshelf (left side corner)
    this.scene.add.image(50, 500, 'bookshelf')
      .setOrigin(0.5, 0.5)
      .setScale(1.5)
      .setDepth(8);

    // Plant (decorative)
    this.scene.add.image(700, 100, 'plant')
      .setOrigin(0.5, 0.5)
      .setScale(1.5)
      .setDepth(8);

    // Filing cabinet
    this.scene.add.image(300, 500, 'filing_cabinet')
      .setOrigin(0.5, 0.5)
      .setScale(1.5)
      .setDepth(8);

    // Trash can (corner)
    this.scene.add.image(750, 50, 'trash_can')
      .setOrigin(0.5, 0.5)
      .setScale(2.0)
      .setDepth(8);
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
