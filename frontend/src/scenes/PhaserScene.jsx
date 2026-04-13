// scenes/PhaserScene.jsx
// React wrapper around a Phaser.Game. Guards against:
//   • React StrictMode double-mount (ref sentinel)
//   • onGameReady identity churn (stored in a ref, not a dep)
//   • Multiple canvas leaks (destroy(true) on unmount)

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene, { WORLD_WIDTH, WORLD_HEIGHT } from './MainScene.js';

function PhaserScene({ onGameReady }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  // Store callback in a ref so changing it never re-runs the effect.
  const onGameReadyRef = useRef(onGameReady);
  useEffect(() => { onGameReadyRef.current = onGameReady; }, [onGameReady]);

  useEffect(() => {
    // Guard: already mounted (covers React StrictMode double-invoke).
    if (gameRef.current) return undefined;
    if (!containerRef.current) return undefined;

    const config = {
      type: Phaser.CANVAS,       // Force CANVAS — avoids WebGL context-loss flicker on resize.
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      parent: containerRef.current,
      backgroundColor: '#0f172a',
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        antialias: false,        // Pixel art — no anti-aliasing.
        pixelArt: true,
        roundPixels: true        // Eliminates sub-pixel shimmer.
      }
    };

    gameRef.current = new Phaser.Game(config);
    if (typeof onGameReadyRef.current === 'function') {
      onGameReadyRef.current(gameRef.current);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []); // Empty deps — run once per mount lifecycle only.

  return (
    <div
      id="phaser-container"
      ref={containerRef}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      className="flex-1 min-h-0 w-full bg-gray-950"
    />
  );
}

export default PhaserScene;
