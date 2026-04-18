// classes/GridOffice.js
// Renders office on grid A-L, 1-10 with sprite-based furniture.

import {
  TILE_SIZE,
  FURNITURE_CATALOG,
  AGENT_STARTING_POSITIONS,
  colToNum,
  rowToNum,
  gridToPixel,
} from '../services/officeLayoutService.js';

export default class GridOffice {
  constructor(scene) {
    this.scene = scene;
    this.furnitureSprites = [];
    this.furnitureItems = [];
    this.worldWidth = 0;
    this.worldHeight = 0;
    this.layout = null;
    this.interactiveObjects = {};
  }

  build() {
    // Draw background
    this._drawBackground();

    // Place furniture from catalog
    for (const [key, item] of Object.entries(FURNITURE_CATALOG)) {
      this._placeFurniture(item);
    }

    // Update world bounds
    this.worldWidth = 12 * TILE_SIZE;
    this.worldHeight = 10 * TILE_SIZE;

    // Create layout object compatible with MainScene expectations
    this.layout = {
      cols: 12,
      rows: 10,
      furniture: this.furnitureItems,
      agentStartingPositions: AGENT_STARTING_POSITIONS,
    };
  }

  _drawBackground() {
    // Draw tiled floor background
    const bg = this.scene.add.rectangle(
      0,
      0,
      12 * TILE_SIZE,
      10 * TILE_SIZE,
      0x1a2332
    );
    bg.setOrigin(0, 0);
    bg.setDepth(0);

    // Draw grid lines (optional, for debugging)
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.lineStyle(1, 0x334455, 0.3);

    for (let col = 0; col <= 12; col++) {
      const x = col * TILE_SIZE;
      graphics.lineBetween(x, 0, x, 10 * TILE_SIZE);
    }

    for (let row = 0; row <= 10; row++) {
      const y = row * TILE_SIZE;
      graphics.lineBetween(0, y, 12 * TILE_SIZE, y);
    }

    graphics.setDepth(1);
    this.scene.add.existing(graphics);
  }

  _placeFurniture(item) {
    // Parse column range (e.g., "B" or "B-C")
    const [colStart, colEnd] = item.cols.split('-');
    const startCol = colToNum(colStart);
    const endCol = colEnd ? colToNum(colEnd) : startCol;
    const row = rowToNum(item.row);

    // Calculate position at center of grid cell
    const x = startCol * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;

    // Store furniture item with position info for agent placement
    this.furnitureItems.push({
      name: item.name,
      type: item.type,
      col: startCol,
      row: row,
      startCol,
      endCol,
      x,
      y,
    });

    // Create sprite (use placeholder if texture missing)
    let sprite;
    if (this.scene.textures.exists(`furn_${item.type}`)) {
      sprite = this.scene.add.image(x, y, `furn_${item.type}`);
    } else {
      // Placeholder rectangle
      sprite = this.scene.add.rectangle(
        x,
        y,
        (endCol - startCol + 1) * TILE_SIZE - 4,
        TILE_SIZE - 4,
        0x334455
      );
      sprite.setStrokeStyle(2, 0x667788);
    }

    sprite.setOrigin(0.5, 0.5);
    sprite.setDepth(10 + y); // Depth sort by position

    // Add label
    this.scene.add
      .text(x, y - 20, item.name, {
        fontSize: '10px',
        color: '#9ca3af',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5, 1)
      .setDepth(11 + y);

    this.furnitureSprites.push(sprite);
  }

  destroy() {
    this.furnitureSprites.forEach((s) => s?.destroy?.());
    this.furnitureSprites = [];
  }
}
