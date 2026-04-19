// classes/OfficeEnvironment.js
// Renders the office from default-layout-1.json with depth-styled walls,
// zone-tinted floors, and pixel-perfect furniture stacking.
//
// Art assets are 16px-based (floors 16×16, furniture sized in 16px units).
// Logic grid is 32px per tile → every sprite renders at SPRITE_SCALE = 2×.
//
// Wall depth: for every wall tile whose south neighbor is floor, we draw a
// lighter "inner lip" strip on top of the wall rect to simulate the vertical
// face of a thick wall (top-down iso-ish effect).

import InteractiveObject from './InteractiveObject.js';
import { buildFurnitureCatalog } from './SpriteFactory.js';

const TILE_SIZE = 32;
const ART_SIZE = 16;
const SPRITE_SCALE = TILE_SIZE / ART_SIZE;
const VOID_TILE = 255;
const WALL_TILE = 0;
const FALLBACK_FLOOR = 0xd4c9b8;

// Wall palette: outer dark (shadowed base) + inner lighter lip.
const WALL_OUTER = 0x3a3f4a;
const WALL_INNER = 0x5b6270;
const WALL_TRIM  = 0x2a2e35;

export default class OfficeEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.layout = null;
    this.catalog = null;
    this.tileSprites = [];
    this.furnitureSprites = [];
    this.interactiveObjects = {};
  }

  build() {
    this.layout = this.scene.cache.json.get('layout');
    if (!this.layout) {
      console.error('Layout not found in cache');
      return this.interactiveObjects;
    }

    this.catalog = buildFurnitureCatalog(this.scene);

    this._renderTilemap();
    this._renderWallDepth();
    this._placeFurniture();
    this._createInteractiveObjects();

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

        let tile;
        if (tileType === WALL_TILE) {
          tile = this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, WALL_OUTER);
          tile.setOrigin(0, 0);
          tile.setDepth(1);
        } else {
          const spriteKey = `floor_${Math.min(tileType, 8)}`;
          if (this.scene.textures.exists(spriteKey)) {
            tile = this.scene.add.image(x, y, spriteKey);
            tile.setOrigin(0, 0);
            tile.setScale(SPRITE_SCALE);

            // Apply zone tint (from layout.tileColors) as a tint on the sprite.
            const adj = tileColors?.[idx] || tileColors?.[String(idx)];
            if (adj) {
              const tint = this._adjustColor(0xffffff, adj);
              tile.setTint(tint);
            }
          } else {
            const color = this._floorColor(tileType, tileColors?.[idx]);
            tile = this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, color);
            tile.setOrigin(0, 0);
          }
          tile.setDepth(0);
        }

        this.tileSprites.push(tile);
      }
    }
  }

  /** Draw a lighter lip on top of walls that have a floor neighbor to their
   *  south — simulates wall thickness/depth in a top-down pixel room. */
  _renderWallDepth() {
    const { cols, rows, tiles } = this.layout;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (tiles[idx] !== WALL_TILE) continue;

        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        // Inner (south-facing) lip: lighter strip along the bottom of the wall
        // cell when the tile below is a floor.
        const southIdx = (row + 1) * cols + col;
        const south = row + 1 < rows ? tiles[southIdx] : VOID_TILE;
        if (south !== WALL_TILE && south !== VOID_TILE) {
          const lip = this.scene.add.rectangle(
            x, y + TILE_SIZE - 8, TILE_SIZE, 8, WALL_INNER
          );
          lip.setOrigin(0, 0);
          lip.setDepth(1.1);
          this.tileSprites.push(lip);

          // Thin trim line at the very base of the wall (floor joint)
          const trim = this.scene.add.rectangle(
            x, y + TILE_SIZE - 2, TILE_SIZE, 2, WALL_TRIM
          );
          trim.setOrigin(0, 0);
          trim.setDepth(1.2);
          this.tileSprites.push(trim);
        }

        // Top highlight: thin light edge on north-facing wall tops
        const northIdx = (row - 1) * cols + col;
        const north = row - 1 >= 0 ? tiles[northIdx] : VOID_TILE;
        if (north === VOID_TILE) {
          const top = this.scene.add.rectangle(
            x, y, TILE_SIZE, 3, 0x242830
          );
          top.setOrigin(0, 0);
          top.setDepth(1.3);
          this.tileSprites.push(top);
        }
      }
    }
  }

  _floorColor(tileType, color) {
    const baseFloors = [
      0x8a8a8a, 0xb8a98e, 0xa68d6b, 0x9c8a72, 0x8e7a5a,
      0xbaa782, 0xa89170, 0xc4b391, 0xa6916f, 0x8f7e65,
    ];
    const base = baseFloors[tileType] ?? FALLBACK_FLOOR;
    if (!color) return base;
    return this._adjustColor(base, color);
  }

  _adjustColor(baseHex, adj) {
    const r0 = (baseHex >> 16) & 0xff;
    const g0 = (baseHex >> 8) & 0xff;
    const b0 = baseHex & 0xff;

    const bShift = (adj.b || 0) / 100;
    const sShift = (adj.s || 0) / 100;

    let r = r0 / 255, g = g0 / 255, b = b0 / 255;

    if (bShift >= 0) {
      r = r + (1 - r) * bShift;
      g = g + (1 - g) * bShift;
      b = b + (1 - b) * bShift;
    } else {
      r = r * (1 + bShift);
      g = g * (1 + bShift);
      b = b * (1 + bShift);
    }

    const grey = (r + g + b) / 3;
    r = grey + (r - grey) * (1 + sShift);
    g = grey + (g - grey) * (1 + sShift);
    b = grey + (b - grey) * (1 + sShift);

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
    const cosA = Math.cos(amount * Math.PI * 2);
    const sinA = Math.sin(amount * Math.PI * 2);
    const matrix = [
      0.299 + 0.701 * cosA + 0.168 * sinA,
      0.587 - 0.587 * cosA + 0.330 * sinA,
      0.114 - 0.114 * cosA - 0.497 * sinA,
      0.299 - 0.299 * cosA - 0.328 * sinA,
      0.587 + 0.413 * cosA + 0.035 * sinA,
      0.114 - 0.114 * cosA + 0.292 * sinA,
      0.299 - 0.3   * cosA + 1.25  * sinA,
      0.587 - 0.588 * cosA - 1.05  * sinA,
      0.114 + 0.886 * cosA - 0.203 * sinA,
    ];
    return [
      r * matrix[0] + g * matrix[1] + b * matrix[2],
      r * matrix[3] + g * matrix[4] + b * matrix[5],
      r * matrix[6] + g * matrix[7] + b * matrix[8],
    ];
  }

  _placeFurniture() {
    const furniture = this.layout.furniture || [];
    const { cols, tiles } = this.layout;

    // Build a PC→desk pairing map so PC sprites render precisely on the desk
    // top face rather than hovering a tile above.
    const deskAt = new Map();
    for (const item of furniture) {
      if (item.type && item.type.includes('DESK')) {
        deskAt.set(`${item.col},${item.row}`, item);
      }
    }

    for (const item of furniture) {
      const tileIdx = item.row * cols + item.col;
      if (tiles[tileIdx] === VOID_TILE) continue;

      const entry = this.catalog.get(item.type);
      if (!entry) continue;

      if (!this.scene.textures.exists(entry.textureKey)) continue;

      let x = item.col * TILE_SIZE;
      let y = item.row * TILE_SIZE;

      // PC sitting on a desk cell: keep same Y as desk so monitor poking
      // above the desk top reads naturally. Depth bonus below ensures the
      // PC sprite always renders in front of (after) the desk sprite.
      const isPC = item.type && item.type.includes('PC');
      const onDesk = isPC && deskAt.has(`${item.col},${item.row}`);

      const sprite = this.scene.add.image(x, y, entry.textureKey);
      sprite.setOrigin(0, 0);
      sprite.setScale(SPRITE_SCALE);

      if (entry.orientation === 'left' && entry.mirrorSide) {
        sprite.setFlipX(true);
      }

      // Depth: y-sort by bottom edge of scaled sprite. PCs on desks need a
      // small bonus so they always draw above the desk they sit on.
      const spriteH = (entry.height || ART_SIZE) * SPRITE_SCALE;
      const bottomEdge = y + spriteH + (onDesk ? 4 : 0);
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
      } else if ((typeKey.startsWith('TABLE') || typeKey.startsWith('SMALL_TABLE')
                  || typeKey === 'COFFEE_TABLE') && !this.interactiveObjects.table) {
        this.interactiveObjects.table = new InteractiveObject(this.scene, x, y, 'table');
      } else if (typeKey === 'WHITEBOARD' && !this.interactiveObjects.whiteboard) {
        this.interactiveObjects.whiteboard = new InteractiveObject(this.scene, x, y, 'whiteboard');
      }
    }

    const cx = (this.layout.cols * TILE_SIZE) / 2;
    const cy = (this.layout.rows * TILE_SIZE) / 2;
    if (!this.interactiveObjects.coffee)       this.interactiveObjects.coffee       = new InteractiveObject(this.scene, cx, cy, 'coffee');
    if (!this.interactiveObjects.couch)        this.interactiveObjects.couch        = new InteractiveObject(this.scene, cx, cy, 'couch');
    if (!this.interactiveObjects.table)        this.interactiveObjects.table        = new InteractiveObject(this.scene, cx, cy, 'table');
    if (!this.interactiveObjects.whiteboard)   this.interactiveObjects.whiteboard   = new InteractiveObject(this.scene, cx, cy, 'whiteboard');
    if (!this.interactiveObjects.water_cooler) this.interactiveObjects.water_cooler = new InteractiveObject(this.scene, cx, cy, 'water_cooler');
  }

  destroy() {
    this.tileSprites.forEach(s => s?.destroy?.());
    this.furnitureSprites.forEach(s => s?.destroy?.());
    this.tileSprites = [];
    this.furnitureSprites = [];
  }
}
