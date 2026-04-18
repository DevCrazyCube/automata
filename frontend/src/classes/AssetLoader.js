// classes/AssetLoader.js
// Load and parse all assets following pixel-agents pattern

export class AssetLoader {
  constructor() {
    this.manifests = new Map();
    this.layout = null;
    this.characterData = {};
  }

  async loadAll() {
    await Promise.all([
      this.loadFurnitureManifests(),
      this.loadLayout()
    ]);
  }

  async loadFurnitureManifests() {
    const furnitureTypes = [
      'BIN', 'BOOKSHELF', 'CACTUS', 'CLOCK', 'COFFEE', 'COFFEE_TABLE',
      'CUSHIONED_BENCH', 'CUSHIONED_CHAIR', 'DESK', 'DOUBLE_BOOKSHELF',
      'HANGING_PLANT', 'LARGE_PAINTING', 'LARGE_PLANT', 'PC', 'PLANT',
      'PLANT_2', 'POT', 'SMALL_PAINTING', 'SMALL_PAINTING_2', 'SMALL_TABLE',
      'SOFA', 'WOODEN_BENCH', 'WOODEN_CHAIR', 'WHITEBOARD'
    ];

    for (const type of furnitureTypes) {
      try {
        const response = await fetch(`/assets/furniture/${type}/manifest.json`);
        if (response.ok) {
          const manifest = await response.json();
          this.manifests.set(type, manifest);
        }
      } catch (e) {
        console.warn(`Failed to load manifest for ${type}`);
      }
    }
  }

  async loadLayout() {
    try {
      console.log('Loading layout from /assets/default-layout-1.json');
      const response = await fetch('/assets/default-layout-1.json');
      console.log('Layout response status:', response.status);
      if (response.ok) {
        this.layout = await response.json();
        console.log('Layout loaded successfully:', {
          cols: this.layout.cols,
          rows: this.layout.rows,
          furniture: this.layout.furniture?.length || 0
        });
      } else {
        console.error('Layout response not ok:', response.status);
      }
    } catch (e) {
      console.error('Failed to load layout:', e);
    }
  }

  buildCatalog() {
    const catalog = [];
    const catalog_map = new Map();

    for (const [groupId, manifest] of this.manifests) {
      if (!manifest.members) continue;

      for (const member of manifest.members) {
        const entry = {
          id: member.id,
          groupId,
          type: member.id,
          label: manifest.name || groupId,
          file: member.file,
          width: member.width,
          height: member.height,
          footprintW: member.footprintW,
          footprintH: member.footprintH,
          orientation: member.orientation,
          category: manifest.category || 'misc',
          rotationScheme: manifest.rotationScheme,
          mirrorSide: member.mirrorSide || false,
          canPlaceOnSurfaces: manifest.canPlaceOnSurfaces || false,
          backgroundTiles: manifest.backgroundTiles || 0,
          state: member.state || 'off'
        };

        catalog.push(entry);
        catalog_map.set(member.id, entry);

        // Create virtual :left entries for mirror-sided items
        if (member.mirrorSide && member.orientation === 'side') {
          const leftEntry = { ...entry, id: `${member.id}:left`, type: `${member.id}:left` };
          catalog.push(leftEntry);
          catalog_map.set(`${member.id}:left`, leftEntry);
        }
      }
    }

    return { catalog, catalog_map };
  }

  getFurnitureEntry(furnitureId) {
    const { catalog_map } = this.buildCatalog();
    return catalog_map.get(furnitureId);
  }

  getAssetPath(furnitureId) {
    const entry = this.getFurnitureEntry(furnitureId);
    if (!entry) return null;
    return `/assets/furniture/${entry.groupId}/${entry.file}`;
  }

  getLayout() {
    return this.layout;
  }

  getFurnitureList() {
    if (!this.layout || !this.layout.furniture) return [];
    return this.layout.furniture;
  }

  getTileType(col, row) {
    if (!this.layout || row >= this.layout.rows || col >= this.layout.cols) return null;
    const index = row * this.layout.cols + col;
    return this.layout.tiles[index];
  }

  getTileColor(col, row) {
    if (!this.layout || row >= this.layout.rows || col >= this.layout.cols) return null;
    const index = row * this.layout.cols + col;
    return this.layout.tileColors?.[index] || null;
  }
}

export const assetLoader = new AssetLoader();
