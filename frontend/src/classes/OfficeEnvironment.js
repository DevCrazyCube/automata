// classes/OfficeEnvironment.js
// Build office from layout JSON with proper tilemap, furniture placement, and z-ordering

import InteractiveObject from './InteractiveObject.js';
import { assetLoader } from './AssetLoader.js';

const TILE_SIZE = 32;
const VOID_TILE = 255;

export default class OfficeEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.interactiveObjects = {};
    this.furnitureSprites = [];
    this.tileSprites = [];
    this.layout = null;
    this.catalog_map = null;
  }

  async build() {
    console.log('Building office environment...');
    // Load all assets
    await assetLoader.loadAll();
    console.log('Assets loaded');

    this.layout = assetLoader.getLayout();
    console.log('Layout retrieved:', this.layout ? 'OK' : 'MISSING');

    if (!this.layout) {
      console.error('Failed to load layout');
      return this.interactiveObjects;
    }

    console.log('Building catalog...');
    // Build catalog for furniture lookups
    const { catalog_map } = assetLoader.buildCatalog();
    this.catalog_map = catalog_map;
    console.log('Catalog built with', catalog_map.size, 'entries');

    console.log('Rendering tilemap...');
    // Render tilemap (floor and walls)
    this._renderTilemap();
    console.log('Tilemap rendered:', this.tileSprites.length, 'tiles');

    console.log('Placing furniture...');
    // Place furniture objects
    this._placeFurniture();
    console.log('Furniture placed:', this.furnitureSprites.length / 2, 'items');

    console.log('Creating interactive objects...');
    // Create interactive zones for idle behaviors
    this._createInteractiveObjects();
    console.log('Interactive objects created');

    console.log('Office built successfully');
    return this.interactiveObjects;
  }

  _renderTilemap() {
    const { cols, rows, tiles, tileColors } = this.layout;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileType = tiles[row * cols + col];
        if (tileType === VOID_TILE) continue;

        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        const color = this._getTileColor(tileColors, col, row, tileType);

        // Render tile as rectangle
        const tile = this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, color);
        tile.setOrigin(0.5, 0.5);
        tile.setDepth(1);
        this.tileSprites.push(tile);
      }
    }
  }

  _getTileColor(tileColors, col, row, tileType) {
    const colorData = tileColors?.[row * this.layout.cols + col];

    if (!colorData) {
      // Default colors
      return tileType === 0 ? 0x888888 : 0xd4c9b8;
    }

    // Convert HSL-like color object to hex
    return this._hslToHex(colorData);
  }

  _hslToHex(color) {
    if (!color || typeof color.h !== 'number') return 0x888888;

    // Simplified HSL to RGB conversion
    const h = (color.h || 0) / 360;
    const s = Math.min(Math.max((color.s || 0) / 100, 0), 1);
    const l = Math.min(Math.max((color.b || 0) / 100, 0), 1);

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;
    if (h < 1/6) { r = c; g = x; b = 0; }
    else if (h < 2/6) { r = x; g = c; b = 0; }
    else if (h < 3/6) { r = 0; g = c; b = x; }
    else if (h < 4/6) { r = 0; g = x; b = c; }
    else if (h < 5/6) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    const rr = Math.round((r + m) * 255);
    const gg = Math.round((g + m) * 255);
    const bb = Math.round((b + m) * 255);

    return (rr << 16) | (gg << 8) | bb;
  }

  _placeFurniture() {
    const furniture = assetLoader.getFurnitureList();

    for (const item of furniture) {
      this._placeFurnitureItem(item);
    }
  }

  _placeFurnitureItem(item) {
    const entry = this.catalog_map?.get(item.type);
    if (!entry) {
      console.warn(`Furniture not found: ${item.type}`);
      return;
    }

    const x = item.col * TILE_SIZE + TILE_SIZE / 2;
    const y = item.row * TILE_SIZE + TILE_SIZE / 2;

    // Create a placeholder for furniture (colored rectangle with label)
    const furnitureSprite = this.scene.add.rectangle(
      x, y,
      entry.footprintW * TILE_SIZE,
      entry.footprintH * TILE_SIZE,
      0x6b5437
    );
    furnitureSprite.setOrigin(0.5, 0.5);
    furnitureSprite.setDepth(5);
    furnitureSprite.setStrokeStyle(1, 0x8b7355);

    // Add label
    const label = this.scene.add.text(x, y, entry.id.split('_')[0], {
      fontSize: '8px',
      color: '#cccccc',
      fontFamily: 'monospace'
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(6);

    this.furnitureSprites.push(furnitureSprite);
    this.furnitureSprites.push(label);
  }

  _createInteractiveObjects() {
    // Create interactive zones at strategic locations
    // These can be referenced by idle behaviors

    // Find coffee and other key furniture in layout
    const furniture = assetLoader.getFurnitureList();

    for (const item of furniture) {
      const type = item.type.split(':')[0]; // Remove :left variants
      const x = item.col * TILE_SIZE + TILE_SIZE / 2;
      const y = item.row * TILE_SIZE + TILE_SIZE / 2;

      if (type === 'COFFEE' && !this.interactiveObjects.coffee) {
        this.interactiveObjects.coffee = new InteractiveObject(this.scene, x, y, 'coffee');
      } else if (type === 'SOFA' && !this.interactiveObjects.couch) {
        this.interactiveObjects.couch = new InteractiveObject(this.scene, x, y, 'couch');
      } else if ((type === 'SMALL_TABLE' || type === 'TABLE') && !this.interactiveObjects.table) {
        this.interactiveObjects.table = new InteractiveObject(this.scene, x, y, 'table');
      } else if (type === 'WHITEBOARD' && !this.interactiveObjects.whiteboard) {
        this.interactiveObjects.whiteboard = new InteractiveObject(this.scene, x, y, 'whiteboard');
      }
    }

    // Create fallback objects if not found
    if (!this.interactiveObjects.coffee) {
      this.interactiveObjects.coffee = new InteractiveObject(this.scene, 200, 400, 'coffee');
    }
    if (!this.interactiveObjects.couch) {
      this.interactiveObjects.couch = new InteractiveObject(this.scene, 400, 200, 'couch');
    }
    if (!this.interactiveObjects.table) {
      this.interactiveObjects.table = new InteractiveObject(this.scene, 300, 500, 'table');
    }
    if (!this.interactiveObjects.whiteboard) {
      this.interactiveObjects.whiteboard = new InteractiveObject(this.scene, 150, 300, 'whiteboard');
    }
    if (!this.interactiveObjects.water_cooler) {
      this.interactiveObjects.water_cooler = new InteractiveObject(this.scene, 600, 500, 'water_cooler');
    }
  }

  destroy() {
    this.tileSprites.forEach(s => s?.destroy?.());
    this.furnitureSprites.forEach(s => s?.destroy?.());
    this.tileSprites = [];
    this.furnitureSprites = [];
  }
}
