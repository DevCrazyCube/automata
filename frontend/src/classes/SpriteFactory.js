// classes/SpriteFactory.js
// Queues all asset loads (layout JSON, furniture manifests, character PNGs).
// Furniture PNGs are loaded in a second pass after manifests are available —
// call `queueFurnitureLoads(scene)` from create() and then `scene.load.start()`.

const FURNITURE_TYPES = [
  'BIN', 'BOOKSHELF', 'CACTUS', 'CLOCK', 'COFFEE', 'COFFEE_TABLE',
  'CUSHIONED_BENCH', 'CUSHIONED_CHAIR', 'DESK', 'DOUBLE_BOOKSHELF',
  'HANGING_PLANT', 'LARGE_PAINTING', 'LARGE_PLANT', 'PC', 'PLANT',
  'PLANT_2', 'POT', 'SMALL_PAINTING', 'SMALL_PAINTING_2', 'SMALL_TABLE',
  'SOFA', 'TABLE_FRONT', 'WHITEBOARD', 'WOODEN_BENCH', 'WOODEN_CHAIR',
];

export { FURNITURE_TYPES };

/** Phase 1 (preload): queue layout, manifests, and character spritesheets. */
export function registerAll(scene) {
  scene.load.json('layout', '/assets/default-layout-1.json');

  for (const type of FURNITURE_TYPES) {
    scene.load.json(`manifest_${type}`, `/assets/furniture/${type}/manifest.json`);
  }

  // Character spritesheets: 112×96 pixels = 7 cols × 3 rows of 16×32 frames
  // Each row represents a direction (down, up, right)
  // Frames per row: 0-2 = walk, 3-4 = typing, 5-6 = reading
  for (let i = 0; i < 6; i++) {
    scene.load.spritesheet(`char_${i}`, `/assets/characters/char_${i}.png`, {
      frameWidth: 16,
      frameHeight: 32,
      endFrame: 20  // 3 rows × 7 cols = 21 frames (0-20)
    });
  }

  // Floor and wall sprites for tilemap rendering
  for (let i = 0; i <= 8; i++) {
    scene.load.image(`floor_${i}`, `/assets/floors/floor_${i}.png`);
  }
  scene.load.image('wall_0', '/assets/walls/wall_0.png');

  scene.load.on('loaderror', (file) => {
    console.warn(`Failed to load: ${file.key} (${file.src})`);
  });
}

/** Phase 2 (create): queue furniture PNG loads based on loaded manifests.
 *  Caller must `scene.load.once('complete', cb).start()` after calling this. */
export function queueFurnitureLoads(scene) {
  let queued = 0;
  for (const type of FURNITURE_TYPES) {
    const manifest = scene.cache.json.get(`manifest_${type}`);
    if (!manifest) {
      console.warn(`No manifest for ${type}`);
      continue;
    }

    if (manifest.type === 'asset') {
      // Single-asset manifest (e.g. TABLE_FRONT, CLOCK)
      const file = manifest.file || `${manifest.id}.png`;
      scene.load.image(`furn_${manifest.id}`, `/assets/furniture/${type}/${file}`);
      queued++;
    } else if (Array.isArray(manifest.members)) {
      // Group manifest (e.g. DESK, PC, SOFA) — load each member PNG
      for (const member of manifest.members) {
        if (!member.file) continue;
        scene.load.image(`furn_${member.id}`, `/assets/furniture/${type}/${member.file}`);
        queued++;
      }
    }
  }
  return queued;
}

/** Build a lookup map: furnitureId → { key, footprintW, footprintH, orientation, mirrorSide, ... } */
export function buildFurnitureCatalog(scene) {
  const catalog = new Map();
  for (const type of FURNITURE_TYPES) {
    const manifest = scene.cache.json.get(`manifest_${type}`);
    if (!manifest) continue;

    if (manifest.type === 'asset') {
      catalog.set(manifest.id, {
        groupId: type,
        textureKey: `furn_${manifest.id}`,
        footprintW: manifest.footprintW || 1,
        footprintH: manifest.footprintH || 1,
        width: manifest.width,
        height: manifest.height,
        orientation: 'front',
        mirrorSide: false,
        category: manifest.category || 'misc',
        backgroundTiles: manifest.backgroundTiles || 0,
      });
    } else if (Array.isArray(manifest.members)) {
      for (const member of manifest.members) {
        const base = {
          groupId: type,
          textureKey: `furn_${member.id}`,
          footprintW: member.footprintW || 1,
          footprintH: member.footprintH || 1,
          width: member.width,
          height: member.height,
          orientation: member.orientation || 'front',
          mirrorSide: Boolean(member.mirrorSide),
          category: manifest.category || 'misc',
          backgroundTiles: manifest.backgroundTiles || 0,
        };
        catalog.set(member.id, base);
        // Virtual :left entry for mirrored side variants
        if (member.mirrorSide && member.orientation === 'side') {
          catalog.set(`${member.id}:left`, { ...base, orientation: 'left' });
        }
      }
    }
  }
  return catalog;
}

export function registerAnimations(scene) {
  // Reserved for frame-based animations (not currently needed).
}
