// classes/TilemapFactory.js
// Generates a complete multi-room DeFi office via tilemap data structures.
// Returns tilemap metadata + layer data that Phaser can consume.
//
// Rooms:
//   • Main Office (largest, central)
//   • Break Room (kitchen area, north-west)
//   • Corridor (east-west spine)
//   • Storage/Server Room (south-east)
//
// Each tile is 16×16 pixels. Canvas is 800×540 → 50×34 tiles.
// Walkable (collision 0), Solid walls (collision 1), Doors (special handling).

const TILE_SIZE = 16;
const GRID_W = 50;  // 800 / 16
const GRID_H = 34;  // 544 / 16

// Tile indices (map to SpriteFactory)
const T = {
  EMPTY:        0,    // transparent
  FLOOR:        1,    // base floor
  WALL_N:       2,    // north wall (top edge)
  WALL_S:       3,    // south wall
  WALL_E:       4,    // east wall
  WALL_W:       5,    // west wall
  WALL_NE:      6,    // corner
  WALL_NW:      7,
  WALL_SE:      8,
  WALL_SW:      9,
  DOOR_H:       10,   // horizontal door (walkable)
  DOOR_V:       11,   // vertical door
  WINDOW_H:     12,
  WINDOW_V:     13,
  DESK:         14,
  CHAIR:        15,
  CABINET:      16,
  SHELF:        17,
  PLANT:        18,
  WATER_COOLER: 19,
  COFFEE:       20,
  VENDING:      21,
  TABLE:        22,
  WHITEBOARD:   23,
  CEILING_LIGHT: 24,
  CEILING:      25,
};

// Collision layer: 0 = walkable, 1 = solid, 2 = door (special)
const C = { WALK: 0, SOLID: 1, DOOR: 2 };

/**
 * Create a blank tilemap layer.
 * @returns {Uint16Array} 50×34 grid initialized to EMPTY
 */
function makeLayer() {
  return new Uint16Array(GRID_W * GRID_H);
}

function idx(x, y) {
  return y * GRID_W + x;
}

function setTile(layer, x, y, tileIdx) {
  if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
    layer[idx(x, y)] = tileIdx;
  }
}

function getTile(layer, x, y) {
  if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
    return layer[idx(x, y)];
  }
  return T.WALL_N;
}

/**
 * Fill a rectangular region with a tile.
 */
function fillRect(layer, x, y, w, h, tile) {
  for (let ry = y; ry < y + h; ry++) {
    for (let rx = x; rx < x + w; rx++) {
      setTile(layer, rx, ry, tile);
    }
  }
}

/**
 * Draw a rectangular frame (hollow) with corner pieces.
 */
function drawFrame(layer, x, y, w, h) {
  // Top edge
  for (let rx = x + 1; rx < x + w - 1; rx++) {
    setTile(layer, rx, y, T.WALL_N);
  }
  // Bottom edge
  for (let rx = x + 1; rx < x + w - 1; rx++) {
    setTile(layer, rx, y + h - 1, T.WALL_S);
  }
  // Left edge
  for (let ry = y + 1; ry < y + h - 1; ry++) {
    setTile(layer, x, ry, T.WALL_W);
  }
  // Right edge
  for (let ry = y + 1; ry < y + h - 1; ry++) {
    setTile(layer, x + w - 1, ry, T.WALL_E);
  }
  // Corners
  setTile(layer, x, y, T.WALL_NW);
  setTile(layer, x + w - 1, y, T.WALL_NE);
  setTile(layer, x, y + h - 1, T.WALL_SW);
  setTile(layer, x + w - 1, y + h - 1, T.WALL_SE);
}

/**
 * Build the entire office tilemap. Returns {layer, collision, metadata}.
 */
export function buildOfficeTilemap() {
  const layer = makeLayer();
  const collision = new Uint8Array(GRID_W * GRID_H); // 0=walk, 1=solid, 2=door

  // ─────────────────────────────────────────────────────────────────────────
  // ROOM 1: MAIN OFFICE (center, largest)
  // Bounds: (5, 4) to (45, 28) — 40×24 tiles
  // ─────────────────────────────────────────────────────────────────────────
  const mainX = 5, mainY = 4, mainW = 40, mainH = 24;
  fillRect(layer, mainX, mainY, mainW, mainH, T.FLOOR);
  drawFrame(layer, mainX, mainY, mainW, mainH);

  // Main office: 4 workstations (one per corner of room, each 4×4 space)
  const wsSize = 4;
  const wsSpacing = 10;
  // Top-left workstation
  fillRect(layer, mainX + 3, mainY + 3, wsSize, wsSize, T.FLOOR);
  setTile(layer, mainX + 4, mainY + 4, T.DESK);
  setTile(layer, mainX + 5, mainY + 5, T.CHAIR);

  // Top-right workstation
  fillRect(layer, mainX + mainW - wsSize - 3, mainY + 3, wsSize, wsSize, T.FLOOR);
  setTile(layer, mainX + mainW - wsSize - 2, mainY + 4, T.DESK);
  setTile(layer, mainX + mainW - wsSize - 1, mainY + 5, T.CHAIR);

  // Bottom-left workstation
  fillRect(layer, mainX + 3, mainY + mainH - wsSize - 3, wsSize, wsSize, T.FLOOR);
  setTile(layer, mainX + 4, mainY + mainH - wsSize - 2, T.DESK);
  setTile(layer, mainX + 5, mainY + mainH - wsSize - 1, T.CHAIR);

  // Bottom-right workstation
  fillRect(layer, mainX + mainW - wsSize - 3, mainY + mainH - wsSize - 3, wsSize, wsSize, T.FLOOR);
  setTile(layer, mainX + mainW - wsSize - 2, mainY + mainH - wsSize - 2, T.DESK);
  setTile(layer, mainX + mainW - wsSize - 1, mainY + mainH - wsSize - 1, T.CHAIR);

  // Main office: center furniture & decorations
  setTile(layer, mainX + 12, mainY + 12, T.TABLE);
  setTile(layer, mainX + 13, mainY + 12, T.WHITEBOARD);
  setTile(layer, mainX + 28, mainY + 14, T.PLANT);
  setTile(layer, mainX + 30, mainY + 14, T.PLANT);

  // Door to break room (north wall, middle-left)
  setTile(layer, mainX + 12, mainY, T.DOOR_H);
  collision[idx(mainX + 12, mainY)] = C.DOOR;

  // Door to corridor (east wall)
  setTile(layer, mainX + mainW - 1, mainY + 12, T.DOOR_V);
  collision[idx(mainX + mainW - 1, mainY + 12)] = C.DOOR;

  // Door to storage room (south wall, right side)
  setTile(layer, mainX + 30, mainY + mainH - 1, T.DOOR_H);
  collision[idx(mainX + 30, mainY + mainH - 1)] = C.DOOR;

  // ─────────────────────────────────────────────────────────────────────────
  // ROOM 2: BREAK ROOM (north-west, small)
  // Bounds: (5, 1) to (20, 4) — 15×3 tiles
  // ─────────────────────────────────────────────────────────────────────────
  const breakX = 5, breakY = 1, breakW = 15, breakH = 3;
  fillRect(layer, breakX, breakY, breakW, breakH, T.FLOOR);
  drawFrame(layer, breakX, breakY, breakW, breakH);

  // Break room: water cooler, coffee machine, vending machine
  setTile(layer, breakX + 3, breakY + 1, T.WATER_COOLER);
  setTile(layer, breakX + 7, breakY + 1, T.COFFEE);
  setTile(layer, breakX + 11, breakY + 1, T.VENDING);

  // ─────────────────────────────────────────────────────────────────────────
  // ROOM 3: CORRIDOR (east side spine)
  // Bounds: (46, 4) to (50, 28) — 4×24 tiles
  // ─────────────────────────────────────────────────────────────────────────
  const corrX = 46, corrY = 4, corrW = 4, corrH = 24;
  fillRect(layer, corrX, corrY, corrW, corrH, T.FLOOR);
  drawFrame(layer, corrX, corrY, corrW, corrH);

  // Windows on outside wall
  for (let wy = corrY + 3; wy < corrY + corrH - 3; wy += 4) {
    setTile(layer, corrX + corrW - 1, wy, T.WINDOW_V);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ROOM 4: STORAGE / SERVER ROOM (south-east)
  // Bounds: (35, 29) to (50, 34) — 15×5 tiles
  // ─────────────────────────────────────────────────────────────────────────
  const storageX = 35, storageY = 29, storageW = 15, storageH = 5;
  fillRect(layer, storageX, storageY, storageW, storageH, T.FLOOR);
  drawFrame(layer, storageX, storageY, storageW, storageH);

  // Storage: shelves & cabinets
  for (let sx = storageX + 2; sx < storageX + storageW - 2; sx += 3) {
    setTile(layer, sx, storageY + 2, T.SHELF);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Build collision layer from tile layer
  // ─────────────────────────────────────────────────────────────────────────
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const tile = getTile(layer, x, y);
      if (tile === T.EMPTY || tile === T.FLOOR || tile === T.DOOR_H || tile === T.DOOR_V) {
        collision[idx(x, y)] = tile === T.DOOR_H || tile === T.DOOR_V ? C.DOOR : C.WALK;
      } else {
        collision[idx(x, y)] = C.SOLID;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Metadata: room boundaries, workstation positions, doorways
  // ─────────────────────────────────────────────────────────────────────────
  const metadata = {
    rooms: {
      main: { x: mainX, y: mainY, w: mainW, h: mainH },
      break: { x: breakX, y: breakY, w: breakW, h: breakH },
      corridor: { x: corrX, y: corrY, w: corrW, h: corrH },
      storage: { x: storageX, y: storageY, w: storageW, h: storageH },
    },
    // Workstation centres (in tile coords)
    workstations: {
      deployer:     { x: mainX + 4, y: mainY + 4 },
      distributor:  { x: mainX + mainW - 3, y: mainY + 4 },
      swapper:      { x: mainX + 4, y: mainY + mainH - 3 },
      extractor:    { x: mainX + mainW - 3, y: mainY + mainH - 3 },
    },
    // Idle roaming zones (room bounds)
    roamZones: [
      { x: mainX + 1, y: mainY + 1, w: mainW - 2, h: mainH - 2 },
      { x: breakX + 1, y: breakY + 1, w: breakW - 2, h: breakH - 2 },
      { x: corrX + 1, y: corrY + 1, w: corrW - 2, h: corrH - 2 },
    ],
    // Doorway tiles (bidirectional connections)
    doorways: [
      { tile: { x: mainX + 12, y: mainY }, rooms: ['main', 'break'], dir: 'N' },
      { tile: { x: mainX + mainW - 1, y: mainY + 12 }, rooms: ['main', 'corridor'], dir: 'E' },
      { tile: { x: mainX + 30, y: mainY + mainH - 1 }, rooms: ['main', 'storage'], dir: 'S' },
    ],
  };

  return { layer, collision, metadata, GRID_W, GRID_H, TILE_SIZE };
}

export { T, C, TILE_SIZE, GRID_W, GRID_H };
