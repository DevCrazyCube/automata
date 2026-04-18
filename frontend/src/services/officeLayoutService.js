// services/officeLayoutService.js
// Grid A-L (columns 1-12), 1-10 (rows) furniture placement system.

const GRID_WIDTH = 12;   // A-L
const GRID_HEIGHT = 10;  // 1-10
const TILE_SIZE = 64;    // pixels per grid tile

// Convert column letter to number: A=0, B=1, ..., L=11
function colToNum(col) {
  return col.charCodeAt(0) - 'A'.charCodeAt(0);
}

// Convert row letter to number: 1=0, 2=1, ..., 10=9
function rowToNum(row) {
  return parseInt(row) - 1;
}

// Grid coordinates to pixel position
function gridToPixel(colLetter, rowNum) {
  const col = colToNum(colLetter);
  const row = rowToNum(rowNum);
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}

const FURNITURE_CATALOG = {
  // Top wall (row 2)
  A: { name: 'Bookshelf', type: 'DOUBLE_BOOKSHELF', cols: 'B-C', row: 2, width: 2 },
  B: { name: 'Bookshelf', type: 'DOUBLE_BOOKSHELF', cols: 'E-F', row: 2, width: 2 },
  C: { name: 'Vending Machine', type: 'PC_FRONT_OFF', cols: 'H', row: 2, width: 1 },
  D: { name: 'Water Cooler', type: 'LARGE_PLANT', cols: 'I', row: 2, width: 1 },

  // Desks (rows 4, 6, 8)
  F: { name: 'Desk + PC', type: 'DESK_FRONT', cols: 'D', row: 4, width: 1 },
  G: { name: 'Desk + PC', type: 'DESK_FRONT', cols: 'F', row: 4, width: 1 },
  J: { name: 'Desk', type: 'DESK_FRONT', cols: 'B-C', row: 6, width: 2 },
  K: { name: 'Desk', type: 'DESK_FRONT', cols: 'E-F', row: 6, width: 2 },
  L: { name: 'Desk', type: 'DESK_FRONT', cols: 'H-I', row: 6, width: 2 },
  N: { name: 'Small Desk', type: 'SMALL_TABLE_FRONT', cols: 'D', row: 8, width: 1 },
  O: { name: 'Small Desk', type: 'SMALL_TABLE_FRONT', cols: 'F', row: 8, width: 1 },

  // Plants (scattered)
  E: { name: 'Plant', type: 'PLANT', cols: 'B', row: 4, width: 1 },
  I: { name: 'Plant', type: 'PLANT', cols: 'J', row: 4, width: 1 },
  M: { name: 'Small Plant', type: 'PLANT_2', cols: 'B', row: 8, width: 1 },
  R: { name: 'Plant', type: 'PLANT', cols: 'B', row: 10, width: 1 },

  // Meeting room (bottom right)
  P: { name: 'Bookshelf', type: 'DOUBLE_BOOKSHELF', cols: 'H', row: 8, width: 1 },
  Q: { name: 'Bookshelf', type: 'DOUBLE_BOOKSHELF', cols: 'J', row: 8, width: 1 },
  S: { name: 'Table', type: 'TABLE_FRONT', cols: 'E-F', row: 10, width: 2 },
  T: { name: 'Sofa', type: 'SOFA_FRONT', cols: 'H-I', row: 10, width: 2 },

  // Wall objects
  H: { name: 'Wall Device', type: 'CLOCK', cols: 'H', row: 4, width: 1 },
};

// Agent starting positions (at desks)
const AGENT_STARTING_POSITIONS = {
  deployer: { desk: 'F', col: 'D', row: 4 },   // Desk F (D4)
  distributor: { desk: 'G', col: 'F', row: 4 }, // Desk G (F4)
  swapper: { desk: 'J', col: 'B', row: 6 },     // Desk J (B6)
  extractor: { desk: 'K', col: 'E', row: 6 },   // Desk K (E6)
};

export {
  GRID_WIDTH,
  GRID_HEIGHT,
  TILE_SIZE,
  colToNum,
  rowToNum,
  gridToPixel,
  FURNITURE_CATALOG,
  AGENT_STARTING_POSITIONS,
};
