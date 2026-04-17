// classes/LayoutLoader.js
// Loads office layout from JSON file

export class LayoutLoader {
  static async loadDefaultLayout() {
    try {
      const response = await fetch('/assets/default-layout-1.json');
      if (!response.ok) throw new Error('Failed to load layout');
      return await response.json();
    } catch (e) {
      console.error('Layout load error:', e);
      return null;
    }
  }

  static getTileType(layout, col, row) {
    if (!layout || row >= layout.rows || col >= layout.cols) return null;
    const index = row * layout.cols + col;
    return layout.tiles[index];
  }

  static getTileColor(layout, col, row) {
    if (!layout || row >= layout.rows || col >= layout.cols) return null;
    const index = row * layout.cols + col;
    return layout.tileColors[index];
  }

  static getFurnitureAt(layout, col, row) {
    if (!layout.furniture) return null;
    return layout.furniture.filter(f => f.col === col && f.row === row);
  }

  static getAllFurniture(layout) {
    return layout.furniture || [];
  }

  static getTileDimensions(layout) {
    return {
      cols: layout.cols,
      rows: layout.rows,
      tileSize: 32
    };
  }
}
