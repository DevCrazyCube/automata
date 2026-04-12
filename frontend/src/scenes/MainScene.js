// scenes/MainScene.js
// The single Phaser scene used by the visualization. Draws four work zones
// and four agents, then wires socket events to agent behaviour.

import Phaser from 'phaser';
import Agent from '../classes/Agent.js';
import socket from '../services/socketService.js';

const WORLD_WIDTH = 640;
const WORLD_HEIGHT = 480;

const ZONE_STYLE = {
  deployment:   { color: 0x1e3a8a, label: 'DEPLOYMENT' },
  distribution: { color: 0x065f46, label: 'DISTRIBUTION' },
  swapping:     { color: 0x78350f, label: 'SWAPPING' },
  extraction:   { color: 0x4c1d95, label: 'EXTRACTION' }
};

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.agents = {};
    this.zones = {};
    this.handlers = [];
  }

  preload() {
    // No external assets — everything is drawn with primitives.
  }

  create() {
    // Background
    this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x0f172a);

    // Zone layout: 2x2 grid with padding
    const pad = 30;
    const zoneW = (WORLD_WIDTH - pad * 3) / 2;
    const zoneH = (WORLD_HEIGHT - pad * 3 - 40) / 2;

    const zoneCoords = {
      deployment:   { x: pad,                  y: pad + 40 },
      distribution: { x: pad * 2 + zoneW,      y: pad + 40 },
      swapping:     { x: pad,                  y: pad * 2 + zoneH + 40 },
      extraction:   { x: pad * 2 + zoneW,      y: pad * 2 + zoneH + 40 }
    };

    Object.entries(zoneCoords).forEach(([key, coord]) => {
      const zone = { ...coord, width: zoneW, height: zoneH };
      this.zones[key] = zone;
      const cx = zone.x + zone.width / 2;
      const cy = zone.y + zone.height / 2;
      this.add
        .rectangle(cx, cy, zone.width, zone.height, ZONE_STYLE[key].color, 0.35)
        .setStrokeStyle(2, 0x475569);
      this.add
        .text(cx, zone.y + 12, ZONE_STYLE[key].label, {
          fontSize: '12px',
          color: '#cbd5e1',
          fontFamily: 'monospace',
          fontStyle: 'bold'
        })
        .setOrigin(0.5, 0);
    });

    // Title bar
    this.add
      .text(WORLD_WIDTH / 2, 16, 'AUTOMATA  ·  Multi-Agent Protocol Visualization', {
        fontSize: '14px',
        color: '#e2e8f0',
        fontFamily: 'monospace',
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0);

    // Create the four agents at a starting "home row" above the zones.
    const homeY = 60;
    const spacing = WORLD_WIDTH / 5;
    this.agents[1] = new Agent(this, spacing * 1, homeY, 'Deployer',    '#FF6B6B');
    this.agents[2] = new Agent(this, spacing * 2, homeY, 'Distributor', '#4ECDC4');
    this.agents[3] = new Agent(this, spacing * 3, homeY, 'Swapper',     '#FFE66D');
    this.agents[4] = new Agent(this, spacing * 4, homeY, 'Extractor',   '#95E1D3');

    this.bindSocketHandlers();

    // Clean up listeners when the scene is destroyed (HMR friendly).
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.unbindSocketHandlers());
    this.events.on(Phaser.Scenes.Events.DESTROY, () => this.unbindSocketHandlers());
  }

  bindSocketHandlers() {
    const on = (event, handler) => {
      socket.on(event, handler);
      this.handlers.push({ event, handler });
    };

    on('agent_walking', (data) => {
      const agent = this.agents[data.agent];
      const zone = this.zones[data.destination];
      if (agent && zone) agent.walkToZone(zone);
    });

    on('agent_working', (data) => {
      const agent = this.agents[data.agent];
      if (agent) agent.performAction(data.action, data.progress || 0);
    });

    on('agent_completed', (data) => {
      const agent = this.agents[data.agent];
      if (agent) agent.celebrate();
    });

    on('phase_started', (data) => {
      const agent = this.agents[data.agent];
      if (agent && data.zone && this.zones[data.zone]) {
        agent.walkToZone(this.zones[data.zone]);
      }
    });
  }

  unbindSocketHandlers() {
    this.handlers.forEach(({ event, handler }) => socket.off(event, handler));
    this.handlers = [];
  }
}

export default MainScene;
export { WORLD_WIDTH, WORLD_HEIGHT };
