// classes/FurnitureManager.js
// Loads and manages furniture metadata from manifest files

export class FurnitureManager {
  constructor() {
    this.manifests = new Map();
    this.furnitureDatabase = new Map();
  }

  async loadAllManifests() {
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
          this._indexManifest(manifest);
        }
      } catch (e) {
        console.warn(`Failed to load manifest for ${type}`);
      }
    }

    return this.manifests;
  }

  _indexManifest(manifest) {
    if (manifest.members) {
      for (const member of manifest.members) {
        this.furnitureDatabase.set(member.id, {
          ...member,
          parentType: manifest.id,
          parentManifest: manifest
        });
      }
    }
  }

  getFurnitureData(furnitureId) {
    // Handle furniture IDs like "DESK_FRONT", "SOFA_SIDE:left"
    const baseId = furnitureId.split(':')[0];
    const variant = furnitureId.includes(':') ? furnitureId.split(':')[1] : null;
    return this.furnitureDatabase.get(baseId) || null;
  }

  getAssetPath(furnitureId) {
    const data = this.getFurnitureData(furnitureId);
    if (!data) return null;
    return `/assets/furniture/${data.parentType}/${data.file}`;
  }

  getAssetDimensions(furnitureId) {
    const data = this.getFurnitureData(furnitureId);
    if (!data) return { width: 32, height: 32 };
    return { width: data.width, height: data.height };
  }
}

// Global instance
export const furnitureManager = new FurnitureManager();
