// classes/OfficeEnvironment.js
// Build office from layout JSON with tilemap, furniture, and interactive zones

import InteractiveObject from './InteractiveObject.js';
import { LayoutLoader } from './LayoutLoader.js';
import { furnitureManager } from './FurnitureManager.js';

const TILE_SIZE = 32;

export default class OfficeEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.layout = null;
    this.interactiveObjects = {};
    this.furnitureSprites = [];
    this.tilemap = null;
  }

  async build() {
    // Load layout JSON
    this.layout = await LayoutLoader.loadDefaultLayout();
    if (!this.layout) {
      console.error('Failed to load layout');
      return this.interactiveObjects;
    }

    // Load furniture manifests
    await furnitureManager.loadAllManifests();

    // Build tilemap layers
    this._buildTilemap();

    // Place furniture objects
    this._placeFurniture();

    // Create interactive zones for idle behaviors
    this._createInteractiveObjects();

    return this.interactiveObjects;
  }

  _buildTilemap() {
    const { cols, rows } = this.layout;
    const floorLayer = this.scene.add.layer();
    const wallLayer = this.scene.add.layer();

    // Render each tile
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileType = LayoutLoader.getTileType(this.layout, col, row);
        const tileColor = LayoutLoader.getTileColor(this.layout, col, row);
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        if (tileType === 255) continue; // VOID tiles - skip

        if (tileType === 0) {
          // Wall tile - render with color
          const color = tileColor ? this._hslToHex(tileColor) : 0x888888;
          this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, color)
            .setOrigin(0.5, 0.5)
            .setDepth(1);
          wallLayer.add(this.scene.add.text(0, 0, ''));
        } else {
          // Floor tile - render with color or sprite
          const color = tileColor ? this._hslToHex(tileColor) : 0xd4c9b8;
          this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, color)
            .setOrigin(0.5, 0.5)
            .setDepth(2);
          floorLayer.add(this.scene.add.text(0, 0, ''));
        }
      }
    }
  }

  _hslToHex(color) {
    if (!color || !color.h) return 0x888888;
    // Simplified HSL to RGB conversion
    const h = (color.h || 0) / 360;
    const s = ((color.s || 0) + 100) / 100;
    const l = ((color.b || 0) + 100) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 1/6) { r = c; g = x; }
    else if (h < 2/6) { r = x; g = c; }
    else if (h < 3/6) { g = c; b = x; }
    else if (h < 4/6) { g = x; b = c; }
    else if (h < 5/6) { r = x; b = c; }
    else { r = c; b = x; }
    const rr = Math.round((r + m) * 255);
    const gg = Math.round((g + m) * 255);
    const bb = Math.round((b + m) * 255);
    return (rr << 16) | (gg << 8) | bb;
  }

  _placeFurniture() {
    const furniture = LayoutLoader.getAllFurniture(this.layout);

    for (const furnitureItem of furniture) {
      const assetPath = furnitureManager.getAssetPath(furnitureItem.type);
      const dims = furnitureManager.getAssetDimensions(furnitureItem.type);

      if (!assetPath) {
        console.warn(`No asset path for ${furnitureItem.type}`);
        continue;
      }

      // Load furniture image and create sprite
      const img = new Image();
      img.onload = () => {
        const x = furnitureItem.col * TILE_SIZE + TILE_SIZE / 2;
        const y = furnitureItem.row * TILE_SIZE + TILE_SIZE / 2;

        const sprite = this.scene.add.image(x, y, furnitureItem.type);
        sprite.setOrigin(0.5, 0.5);
        sprite.setDepth(5);

        // Scale to tile size
        const scale = TILE_SIZE / Math.max(dims.width, dims.height);
        sprite.setScale(scale);

        this.furnitureSprites.push(sprite);
      };
      img.onerror = () => {
        console.warn(`Failed to load furniture image: ${assetPath}`);
      };

      // Actually load the image via Phaser
      if (!this.scene.textures.exists(furnitureItem.type)) {
        this.scene.load.image(furnitureItem.type, assetPath);
      }
    }

    // Start load if we added any images
    if (furniture.length > 0) {
      this.scene.load.start();
    }
  }

  _createInteractiveObjects() {
    // Create interactive zones at fixed locations for idle behaviors
    this.interactiveObjects.coffee = new InteractiveObject(
      this.scene, 150, 450, 'coffee_machine'
    );
    this.interactiveObjects.couch = new InteractiveObject(
      this.scene, 450, 150, 'couch_64x32'
    );
    this.interactiveObjects.table = new InteractiveObject(
      this.scene, 250, 550, 'table'
    );
    this.interactiveObjects.whiteboard = new InteractiveObject(
      this.scene, 100, 300, 'whiteboard'
    );
    this.interactiveObjects.water_cooler = new InteractiveObject(
      this.scene, 650, 550, 'water_cooler'
    );
  }

  destroy() {
    this.furnitureSprites.forEach(s => s.destroy());
    this.furnitureSprites = [];
  }
}
