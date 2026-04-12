// scenes/PhaserScene.jsx
// React wrapper that mounts a Phaser.Game inside a div. Destroys the
// game on unmount so hot reloads don't leak canvases.

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene, { WORLD_WIDTH, WORLD_HEIGHT } from './MainScene.js';

function PhaserScene({ onGameReady }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return undefined;

    const config = {
      type: Phaser.AUTO,
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      parent: containerRef.current,
      backgroundColor: '#0f172a',
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    gameRef.current = new Phaser.Game(config);
    if (typeof onGameReady === 'function') onGameReady(gameRef.current);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onGameReady]);

  return (
    <div
      id="phaser-container"
      ref={containerRef}
      className="flex-1 min-h-0 w-full bg-gray-900 p-4"
    />
  );
}

export default PhaserScene;
