// scenes/PhaserScene.jsx
// React wrapper around a Phaser.Game. Guards against:
//   • React StrictMode double-mount (ref sentinel)
//   • onGameReady identity churn (stored in a ref, not a dep)
//   • Multiple canvas leaks (destroy(true) on unmount)

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from './MainScene.js';

function PhaserScene({ onGameReady }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const onGameReadyRef = useRef(onGameReady);
  useEffect(() => { onGameReadyRef.current = onGameReady; }, [onGameReady]);

  useEffect(() => {
    // Guard: already mounted
    if (gameRef.current) return undefined;
    if (!containerRef.current) return undefined;

    // Get container dimensions
    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.max(rect.width, 800) || 800;
    const height = Math.max(rect.height, 600) || 600;

    const config = {
      type: Phaser.CANVAS,
      width,
      height,
      parent: containerRef.current,
      backgroundColor: '#0f172a',
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        fullscreenTarget: 'parent',
        expandParent: true,
        width,
        height,
      },
      render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true
      }
    };

    gameRef.current = new Phaser.Game(config);
    if (typeof onGameReadyRef.current === 'function') {
      onGameReadyRef.current(gameRef.current);
    }

    // Handle window resize
    const handleResize = () => {
      if (gameRef.current && containerRef.current) {
        const newRect = containerRef.current.getBoundingClientRect();
        gameRef.current.scale.resize(newRect.width, newRect.height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      id="phaser-container"
      ref={containerRef}
      style={{
        flex: 1,
        minHeight: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
      className="bg-gray-950"
    />
  );
}

export default PhaserScene;
