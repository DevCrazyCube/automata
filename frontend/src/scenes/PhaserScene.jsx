// scenes/PhaserScene.jsx
// React wrapper around a Phaser.Game.
// Uses RESIZE scale mode — Phaser canvas grows to match parent container.
// Camera zoom is handled by MainScene to fit the office content.

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from './MainScene.js';

function PhaserScene({ onGameReady }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const onGameReadyRef = useRef(onGameReady);
  useEffect(() => { onGameReadyRef.current = onGameReady; }, [onGameReady]);

  useEffect(() => {
    if (gameRef.current) return undefined;
    if (!containerRef.current) return undefined;

    const config = {
      type: Phaser.CANVAS,
      parent: containerRef.current,
      backgroundColor: '#0f172a',
      scene: [MainScene],
      scale: {
        // RESIZE: canvas always matches parent container dimensions exactly.
        // MainScene._setupCamera() calculates zoom to fit office inside it.
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.NO_CENTER,
        width: '100%',
        height: '100%',
      },
      render: {
        antialias: false,
        pixelArt: true,
        roundPixels: true,
      },
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
  }, []);

  return (
    <div
      id="phaser-container"
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
      className="bg-gray-950"
    />
  );
}

export default PhaserScene;
