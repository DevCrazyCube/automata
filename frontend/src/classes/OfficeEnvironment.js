// classes/OfficeEnvironment.js
// Minimal office background with 4 simple workstations

import InteractiveObject from './InteractiveObject.js';

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;

export default class OfficeEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.interactiveObjects = {};
  }

  build() {
    // Simple background
    this.scene.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x1a1a2e)
      .setOrigin(0.5, 0.5)
      .setDepth(0);

    // 4 simple workstations in 2x2 grid
    const stations = [
      { x: 200, y: 150, label: 'DEPLOYMENT' },
      { x: 600, y: 150, label: 'DISTRIBUTION' },
      { x: 200, y: 450, label: 'SWAP FLOOR' },
      { x: 600, y: 450, label: 'EXTRACTION' },
    ];

    for (const station of stations) {
      this._createWorkstation(station.x, station.y, station.label);
    }

    // Interactive objects for idle behaviors (minimal)
    this.interactiveObjects.coffee = new InteractiveObject(this.scene, 100, 100, 'coffee_machine');
    this.interactiveObjects.couch = new InteractiveObject(this.scene, 700, 100, 'couch');
    this.interactiveObjects.table = new InteractiveObject(this.scene, 400, 550, 'table');
    this.interactiveObjects.whiteboard = new InteractiveObject(this.scene, 100, 550, 'whiteboard');
    this.interactiveObjects.water_cooler = new InteractiveObject(this.scene, 700, 550, 'water_cooler');

    return this.interactiveObjects;
  }

  _createWorkstation(x, y, label) {
    // Desk rectangle
    this.scene.add.rectangle(x, y, 80, 60, 0x5a4a3a)
      .setOrigin(0.5, 0.5)
      .setDepth(5);

    // Desk label
    this.scene.add.text(x, y - 50, label, {
      fontSize: '11px',
      color: '#00aaff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(10);
  }

  destroy() {
    // Cleanup
  }
}
