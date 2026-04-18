// classes/OfficeEnvironment.js
// Renders the office from default-layout-1.json, replicating the pixel-agents
// rendering approach:
//   • Floor tiles as 32×32 solid-colored rectangles (colorized via HSL)
//   • Walls as darker solid tiles
//   • Furniture as PNG sprites drawn at NATIVE pixel dimensions, anchored
//     at (col*32, row*32) top-left, depth y-sorted by bottom edge.

import InteractiveObject from './InteractiveObject.js';
import { buildFurnitureCatalog } from './SpriteFactory.js';

const TILE_SIZE = 32;
const VOID_TILE = 255;
const WALL_TILE = 0;
const FALLBACK_FLOOR = 0xd4c9b8;
const WALL_COLOR = 0x4a5568;

export default class OfficeEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.layout = null;
    this.catalog = null;
    this.tileSprites = [];
    this.furnitureSprites = [];
    this.interactiveObjects = {};
  }

  /** Synchronous build — all assets are already in scene.cache when called. */
  build() {
    this.layout = this.scene.cache.json.get('layout');
    if (!this.layout) {
      console.error('Layout not found in cache');
      return this.interactiveObjects;
    }

    this.catalog = buildFurnitureCatalog(this.scene);
    console.log(`Catalog built: ${this.catalog.size} furniture entries`);

    this._renderTilemap();
    this._placeFurniture();
    this._createInteractiveObjects();

    console.log(`Office built: ${this.tileSprites.length} tiles, ${this.furnitureSprites.length} furniture sprites`);
    return this.interactiveObjects;
  }

  _renderTilemap() {
    const { cols, rows, tiles, tileColors } = this.layout;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const tileType = tiles[idx];
        if (tileType === VOID_TILE) continue;

        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        let color;

        if (tileType === WALL_TILE) {
          color = this._tileColorToHex(tileColors?.[idx]) ?? WALL_COLOR;
        } else {
          color = this._floorColor(tileType, tileColors?.[idx]);
        }

        const tile = this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, color);
        tile.setOrigin(0, 0);
        tile.setDepth(0);
        this.tileSprites.push(tile);
      }
    }
  }

  /** Pixel-agents HSL-ish colorization: hue/saturation/brightness/contrast deltas
   *  applied to a base floor/wall color. Simplified: use the encoded h/s/b as
   *  HSL directly (b is brightness shift, -100 = black, +100 = white). */
  _floorColor(tileType, color) {
    const baseFloors = [
      0x8a8a8a, // 0 (wall) — not used here
      0xb8a98e, // 1 — tan floor
      0xa68d6b, // 2
      0x9c8a72, // 3
      0x8e7a5a, // 4
      0xbaa782, // 5
      0xa89170, // 6
      0xc4b391, // 7 — light tan
      0xa6916f, // 8
      0x8f7e65, // 9
    ];
    const base = baseFloors[tileType] ?? FALLBACK_FLOOR;
    if (!color) return base;
    return this._adjustColor(base, color);
  }

  /** Apply h/s/b/c shifts to a base RGB hex color. */
  _adjustColor(baseHex, adj) {
    const r0 = (baseHex >> 16) & 0xff;
    const g0 = (baseHex >> 8) & 0xff;
    const b0 = baseHex & 0xff;

    // brightness: -100..+100 → scale toward black/white
    const bShift = (adj.b || 0) / 100;
    const sShift = (adj.s || 0) / 100;

    let r = r0 / 255;
    let g = g0 / 255;
    let b = b0 / 255;

    // Apply brightness
    if (bShift >= 0) {
      r = r + (1 - r) * bShift;
      g = g + (1 - g) * bShift;
      b = b + (1 - b) * bShift;
    } else {
      r = r * (1 + bShift);
      g = g * (1 + bShift);
      b = b * (1 + bShift);
    }

    // Apply saturation (shift toward/away from grey)
    const grey = (r + g + b) / 3;
    r = grey + (r - grey) * (1 + sShift);
    g = grey + (g - grey) * (1 + sShift);
    b = grey + (b - grey) * (1 + sShift);

    // Apply hue shift (rotate RGB — very rough but OK for variation)
    const hShift = ((adj.h || 0) % 360) / 360;
    if (hShift) {
      const [rr, gg, bb] = this._rotateHue([r, g, b], hShift);
      r = rr; g = gg; b = bb;
    }

    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b = Math.max(0, Math.min(1, b));

    return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
  }

  _rotateHue([r, g, b], amount) {
    // amount in [0,1]
    const cosA = Math.cos(amount * Math.PI * 2);
    const sinA = Math.sin(amount * Math.PI * 2);
    const matrix = [
      0.299 + 0.701 * cosA + 0.168 * sinA,
      0.587 - 0.587 * cosA + 0.330 * sinA,
      0.114 - 0.114 * cosA - 0.497 * sinA,
      0.299 - 0.299 * cosA - 0.328 * sinA,
      0.587 + 0.413 * cosA + 0.035 * sinA,
      0.114 - 0.114 * cosA + 0.292 * sinA,
      0.299 - 0.3 * cosA + 1.25 * sinA,
      0.587 - 0.588 * cosA - 1.05 * sinA,
      0.114 + 0.886 * cosA - 0.203 * sinA,
    ];
    return [
      r * matrix[0] + g * matrix[1] + b * matrix[2],
      r * matrix[3] + g * matrix[4] + b * matrix[5],
      r * matrix[6] + g * matrix[7] + b * matrix[8],
    ];
  }

  _tileColorToHex(color) {
    if (!color) return null;
    return this._adjustColor(0x5a6b8a, color); // dark wall base
  }

  _placeFurniture() {
    const furniture = this.layout.furniture || [];

    for (const item of furniture) {
      const entry = this.catalog.get(item.type);
      if (!entry) {
        console.warn(`No catalog entry for ${item.type}`);
        continue;
      }

      if (!this.scene.textures.exists(entry.textureKey)) {
        console.warn(`Texture missing: ${entry.textureKey}`);
        continue;
      }

      const x = item.col * TILE_SIZE;
      const y = item.row * TILE_SIZE;

      const sprite = this.scene.add.image(x, y, entry.textureKey);
      sprite.setOrigin(0, 0);

      // Mirror horizontally for :left variants
      if (entry.orientation === 'left' && entry.mirrorSide) {
        sprite.setFlipX(true);
      }

      // Depth: y-sort by bottom edge of sprite (matches pixel-agents zY).
      // Chairs' back-facing variant renders in front of the character;
      // front/side chairs render behind. For simplicity use bottom edge.
      const spriteH = entry.height || TILE_SIZE;
      const bottomEdge = y + spriteH;
      sprite.setDepth(bottomEdge);

      this.furnitureSprites.push(sprite);
    }
  }

  _createInteractiveObjects() {
    const furniture = this.layout.furniture || [];

    for (const item of furniture) {
      const typeKey = item.type.split(':')[0];
      const x = item.col * TILE_SIZE + TILE_SIZE / 2;
      const y = item.row * TILE_SIZE + TILE_SIZE / 2;

      if (typeKey.startsWith('COFFEE') && !this.interactiveObjects.coffee) {
        this.interactiveObjects.coffee = new InteractiveObject(this.scene, x, y, 'coffee');
      } else if (typeKey.startsWith('SOFA') && !this.interactiveObjects.couch) {
        this.interactiveObjects.couch = new InteractiveObject(this.scene, x, y, 'couch');
      } else if (typeKey.startsWith('TABLE') || typeKey.startsWith('SMALL_TABLE')) {
        if (!this.interactiveObjects.table) {
          this.interactiveObjects.table = new InteractiveObject(this.scene, x, y, 'table');
        }
      } else if (typeKey === 'WHITEBOARD' && !this.interactiveObjects.whiteboard) {
        this.interactiveObjects.whiteboard = new InteractiveObject(this.scene, x, y, 'whiteboard');
      }
    }

    // Fallbacks so idle behavior has something to target
    const cx = (this.layout.cols * TILE_SIZE) / 2;
    const cy = (this.layout.rows * TILE_SIZE) / 2;
    if (!this.interactiveObjects.coffee)     this.interactiveObjects.coffee     = new InteractiveObject(this.scene, cx, cy, 'coffee');
    if (!this.interactiveObjects.couch)      this.interactiveObjects.couch      = new InteractiveObject(this.scene, cx, cy, 'couch');
    if (!this.interactiveObjects.table)      this.interactiveObjects.table      = new InteractiveObject(this.scene, cx, cy, 'table');
    if (!this.interactiveObjects.whiteboard) this.interactiveObjects.whiteboard = new InteractiveObject(this.scene, cx, cy, 'whiteboard');
    if (!this.interactiveObjects.water_cooler) this.interactiveObjects.water_cooler = new InteractiveObject(this.scene, cx, cy, 'water_cooler');
  }

  destroy() {
    this.tileSprites.forEach(s => s?.destroy?.());
    this.furnitureSprites.forEach(s => s?.destroy?.());
    this.tileSprites = [];
    this.furnitureSprites = [];
  }
}
