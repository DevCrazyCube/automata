// scenes/MainScene.js
// DeFi Office workspace: 4 workstations arranged in a 2×2 grid.
// Each workstation belongs to one agent who idles/patrols nearby
// and sits down to "type" during active phases.

import Phaser from 'phaser';
import Agent from '../classes/Agent.js';
import { registerAll, registerAnimations, queueFurnitureLoads } from '../classes/SpriteFactory.js';
import OfficeEnvironment from '../classes/OfficeEnvironment.js';
import Workstation from '../classes/Workstation.js';
import IdleBehavior from '../classes/IdleBehavior.js';
import AgentInteraction from '../classes/AgentInteraction.js';
import { AgentClickHandler } from '../services/agentClickService.js';
import socket from '../services/socketService.js';

const TILE_SIZE = 32;

// World dimensions will be set based on layout
let WORLD_WIDTH = 960;
let WORLD_HEIGHT = 640;

export const setWorldDimensions = (w, h) => {
  WORLD_WIDTH = w;
  WORLD_HEIGHT = h;
};

export const getWorldDimensions = () => ({ width: WORLD_WIDTH, height: WORLD_HEIGHT });

/** Map backend zone names to station keys. */
const ZONE_MAP = {
  deployment:   'deployer',
  distribution: 'distributor',
  swapping:     'swapper',
  extraction:   'extractor',
};

/** Map backend agent index (1-4) to agent key. */
const AGENT_IDX_MAP = { 1: 'deployer', 2: 'distributor', 3: 'swapper', 4: 'extractor' };

/** Resolve an agent key from any of: numeric id, string key, zone name. */
function resolveAgentKey(input) {
  if (input == null) return null;
  if (typeof input === 'number') return AGENT_IDX_MAP[input] || null;
  if (typeof input === 'string') {
    const lower = input.toLowerCase();
    if (['deployer', 'distributor', 'swapper', 'extractor'].includes(lower)) return lower;
    if (ZONE_MAP[lower]) return ZONE_MAP[lower];
    return AGENT_IDX_MAP[lower] || null;
  }
  return null;
}

/** Friendly one-line summary of a tool call for the speech bubble. */
function summarizeAction(tool, input = {}) {
  switch (tool) {
    case 'execute_deploy_token':           return 'Deploying token…';
    case 'execute_mint':                   return `Minting ${formatNum(input.amount)}`;
    case 'execute_burn':                   return `Burning ${formatNum(input.amount)}`;
    case 'execute_transfer':               return `Sending ${formatNum(input.amount)}`;
    case 'execute_add_liquidity':          return 'Seeding LP';
    case 'execute_remove_liquidity':       return `Pulling ${Math.round((input.lp_fraction || 0) * 100)}% LP`;
    case 'execute_swap':                   return `Swapping ${formatNum(input.input_amount)}`;
    case 'execute_forward_stablecoin':     return `Forwarding ${formatNum(input.amount)}`;
    case 'execute_whitelist':              return input.allow ? 'Whitelisting' : 'Removing whitelist';
    case 'execute_set_transfer_restrictions': return input.restricted ? 'Locking transfers' : 'Unlocking transfers';
    case 'check_token_state':              return 'Checking state';
    case 'check_wallet_balance':           return 'Checking balance';
    case 'get_market_conditions':          return 'Reading market';
    case 'get_config':                     return 'Reading config';
    case 'send_message':                   return `→ ${input.to}: ${(input.message || '').slice(0, 24)}`;
    case 'read_messages':                  return 'Reading messages';
    case 'finish_turn':                    return input.done ? 'Done ✓' : 'Yielding';
    default:                                return tool;
  }
}

function formatNum(v) {
  if (v == null) return '';
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return String(v);
}

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.agents   = {};   // key → Agent instance
    this.workstations = {}; // key → Workstation instance
    this.zones    = {};   // key → { x, y, width, height } logical zone
    this.handlers = [];   // socket handler refs for cleanup
    this.office   = null; // OfficeEnvironment instance
    this.agentInteraction = null; // AgentInteraction instance
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  preload() {
    // Register sprite loader - loads all assets
    registerAll(this);
  }

  create() {
    registerAnimations(this);

    // Phase 1: Build manifests are cached from preload.
    // Queue furniture PNG loads based on manifest data.
    console.log('Queuing furniture loads...');
    queueFurnitureLoads(this);

    // Phase 2: Once furniture PNGs load, build the office and agents
    this.load.once('complete', () => {
      console.log('Furniture loads complete, building office...');
      this._buildOffice();
      this._buildWorkstations();
      this._buildAgents();
      this._assignWorkstations();
      this._setupIdleBehaviors();
      this._setupAgentInteraction();
      this._setupAgentClicking();
      this._setupCamera();
      this._bindSocketHandlers();
    });

    this.load.start();

    // Re-fit camera whenever Phaser RESIZE mode changes canvas dimensions.
    this.scale.on('resize', () => {
      if (this.office) this._setupCamera();
    });

    // Socket cleanup on scene shutdown (supports HMR).
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this._unbindSocketHandlers());
    this.events.on(Phaser.Scenes.Events.DESTROY,  () => this._unbindSocketHandlers());
  }

  update(time, delta) {
    // Update all agents every frame (prevents idle behavior freezing)
    for (const agent of Object.values(this.agents)) {
      if (agent && agent.update) {
        agent.update(time);
      }
    }
  }

  _setupCamera() {
    const cam = this.cameras.main;
    const layout = this.office?.layout;

    if (!layout) return;

    // Find non-void content bounds for better framing
    const VOID_TILE = 255;
    let minCol = Infinity, maxCol = -Infinity;
    let minRow = Infinity, maxRow = -Infinity;

    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.cols; col++) {
        const idx = row * layout.cols + col;
        if (layout.tiles[idx] !== VOID_TILE) {
          minCol = Math.min(minCol, col);
          maxCol = Math.max(maxCol, col);
          minRow = Math.min(minRow, row);
          maxRow = Math.max(maxRow, row);
        }
      }
    }

    // Use content bounds with small padding
    const padding = TILE_SIZE;
    const startX = Math.max(0, minCol * TILE_SIZE - padding);
    const startY = Math.max(0, minRow * TILE_SIZE - padding);
    const contentW = (maxCol - minCol + 1) * TILE_SIZE + padding * 2;
    const contentH = (maxRow - minRow + 1) * TILE_SIZE + padding * 2;

    cam.setBounds(startX, startY, contentW, contentH);

    // In RESIZE mode, scale.width/height equal the actual canvas dimensions
    const canvasW = this.scale.width;
    const canvasH = this.scale.height;

    const zoom = Math.min(canvasW / contentW, canvasH / contentH);
    cam.setZoom(zoom);
    cam.centerOn(startX + contentW / 2, startY + contentH / 2);
  }

  // ── Office world construction ───────────────────────────────────────────────

  _buildOffice() {
    // Create office from layout JSON (loaded via Phaser cache in preload)
    this.office = new OfficeEnvironment(this);
    this.office.build();

    // Update world dimensions from loaded layout
    const layout = this.office.layout;
    if (layout) {
      const newWidth = layout.cols * TILE_SIZE;
      const newHeight = layout.rows * TILE_SIZE;
      setWorldDimensions(newWidth, newHeight);
      WORLD_WIDTH = newWidth;
      WORLD_HEIGHT = newHeight;
    }
  }

  // ── Workstation building ────────────────────────────────────────────────────

  _buildWorkstations() {
    const layout = this.office?.layout;
    if (!layout || !layout.furniture) return;

    // Find DESK+PC pairs to form workstations
    const desks = [];
    const pcs = [];

    for (const item of layout.furniture) {
      if (item.type && item.type.includes('DESK')) {
        desks.push(item);
      } else if (item.type && item.type.includes('PC')) {
        pcs.push(item);
      }
    }

    // Pair desks with nearby PCs to form workstations
    let wsIndex = 0;
    for (const desk of desks) {
      // Find the nearest PC to this desk
      let nearestPC = null;
      let minDist = Infinity;

      for (const pc of pcs) {
        const dist = Math.abs((pc.col - desk.col)) + Math.abs((pc.row - desk.row));
        if (dist < minDist && !pcs.some(p => p === pc && p.used)) {
          minDist = dist;
          nearestPC = pc;
        }
      }

      if (nearestPC && minDist <= 2) {
        // Found a paired PC
        const wsId = `ws_${wsIndex++}`;
        const deskPos = {
          col: desk.col,
          row: desk.row,
          x: desk.col * TILE_SIZE + TILE_SIZE / 2,
          y: desk.row * TILE_SIZE + TILE_SIZE / 2
        };
        const pcPos = {
          col: nearestPC.col,
          row: nearestPC.row,
          x: nearestPC.col * TILE_SIZE + TILE_SIZE / 2,
          y: nearestPC.row * TILE_SIZE + TILE_SIZE / 2
        };
        const seatPos = {
          x: deskPos.x,
          y: deskPos.y + 24 // slightly forward to sit at desk
        };

        // Create workstation (owner will be assigned later)
        const ws = new Workstation(wsId, null, deskPos, pcPos, seatPos);
        this.workstations[wsId] = ws;
        nearestPC.used = true;
      }
    }

    console.log(`Workstations built: ${Object.keys(this.workstations).length}`);
  }

  _assignWorkstations() {
    const agentKeys = ['deployer', 'distributor', 'swapper', 'extractor'];
    const wsKeys = Object.keys(this.workstations);

    // Assign each agent to a workstation
    for (let i = 0; i < agentKeys.length && i < wsKeys.length; i++) {
      const agentKey = agentKeys[i];
      const wsKey = wsKeys[i];
      const ws = this.workstations[wsKey];
      ws.agentKey = agentKey; // Set the owner
      this.agents[agentKey].workstation = ws; // Give agent reference to their workstation
    }
  }

  // ── Agent initialisation ────────────────────────────────────────────────────

  _buildAgents() {
    const agentConfigs = {
      deployer:    { name: 'Deployer',    tint: 0xff5555 },
      distributor: { name: 'Distributor', tint: 0x44ddcc },
      swapper:     { name: 'Swapper',     tint: 0xffdd44 },
      extractor:   { name: 'Extractor',   tint: 0x88eedd },
    };

    // Get spawn positions from layout JSON
    const layout = this.office?.layout;
    const spawnPositions = layout?.agentSpawnPositions || {};

    for (const [agentKey, config] of Object.entries(agentConfigs)) {
      const spawn = spawnPositions[agentKey];
      if (!spawn) {
        console.warn(`No spawn position for agent: ${agentKey}`);
        continue;
      }
      const x = spawn.col * TILE_SIZE + TILE_SIZE / 2;
      const y = spawn.row * TILE_SIZE + TILE_SIZE / 2;
      this.agents[agentKey] = new Agent(
        this, x, y,
        config.name, agentKey, config.tint
      );
    }
  }

  _setupIdleBehaviors() {
    // Create idle behavior for each agent
    for (const [stKey, agent] of Object.entries(this.agents)) {
      agent.idleBehavior = new IdleBehavior(agent, this.office.interactiveObjects);
    }
  }

  _setupAgentInteraction() {
    // Create agent interaction system (proximity-based chat)
    this.agentInteraction = new AgentInteraction(this, this.agents);
    this.agentInteraction.start();
  }

  _setupAgentClicking() {
    // Create agent click handler for player interactions
    this.agentClickHandler = new AgentClickHandler(this, this.agents);
  }

  // ── Socket event wiring ─────────────────────────────────────────────────────

  _bindSocketHandlers() {
    const on = (event, handler) => {
      socket.on(event, handler);
      this.handlers.push({ event, handler });
    };

    on('phase_started', (data) => {
      const stKey = resolveAgentKey(data.agent) || ZONE_MAP[data.zone];
      const agent = this.agents[stKey];
      if (agent && agent.idleBehavior) agent.idleBehavior.pause();
    });

    on('agent_working', (data) => {
      const stKey = resolveAgentKey(data.agent);
      const agent = this.agents[stKey];
      if (agent) {
        agent.startWorking(data.action, data.progress || 0);
        if (agent.idleBehavior) agent.idleBehavior.pause();
      }
    });

    on('agent_thinking', (data) => {
      const stKey = resolveAgentKey(data.agent || data.agentId);
      const agent = this.agents[stKey];
      if (agent) {
        agent.setChatText('💭 Thinking…');
        if (agent.idleBehavior) agent.idleBehavior.pause();
      }
    });

    on('agent_reasoning', (data) => {
      const stKey = resolveAgentKey(data.agent || data.agentId);
      const agent = this.agents[stKey];
      if (agent && data.text) {
        const snippet = String(data.text).slice(0, 50);
        agent.setChatText(snippet);
      }
    });

    on('agent_action', (data) => {
      const stKey = resolveAgentKey(data.agent || data.agentId);
      const agent = this.agents[stKey];
      if (agent) {
        agent.startWorking(summarizeAction(data.tool, data.input || {}), 0);
      }
    });

    on('agent_message', (data) => {
      const stKey = resolveAgentKey(data.from);
      const agent = this.agents[stKey];
      if (agent && data.message) {
        const snippet = String(data.message).slice(0, 56);
        agent.setChatText(`→${data.to}: ${snippet}`);
      }
    });

    on('agent_yielded', (data) => {
      const stKey = resolveAgentKey(data.agent);
      const agent = this.agents[stKey];
      if (agent) {
        if (data.done) agent.celebrate();
        else agent.setChatText('Waiting…');
      }
    });

    on('agent_error', (data) => {
      const stKey = resolveAgentKey(data.agent);
      const agent = this.agents[stKey];
      if (agent) {
        agent.setChatText('⚠ Error');
        if (agent.idleBehavior) agent.idleBehavior.pause();
      }
    });

    on('phase_progress', (data) => {
      const phaseAgentMap = { 1: 'deployer', 2: 'distributor', 3: 'swapper',
                               4: 'distributor', 5: 'extractor', 6: 'extractor' };
      const stKey = phaseAgentMap[data.phase];
      const agent = this.agents[stKey];
      if (agent) agent.setProgressValue(data.progress);
    });

    on('agent_completed', (data) => {
      const stKey = AGENT_IDX_MAP[data.agent];
      const agent = this.agents[stKey];
      if (agent) agent.celebrate();
    });

    on('operation_complete', () => {
      for (const agent of Object.values(this.agents)) {
        agent.celebrate();
      }
      // Resume idle behaviors after operation
      this.time.delayedCall(2000, () => {
        for (const agent of Object.values(this.agents)) {
          if (agent.idleBehavior) agent.idleBehavior.resume();
        }
      });
    });

    on('operation_stopped', () => {
      for (const agent of Object.values(this.agents)) {
        agent.reset();
        if (agent.idleBehavior) agent.idleBehavior.resume();
      }
    });
  }

  _unbindSocketHandlers() {
    this.handlers.forEach(({ event, handler }) => socket.off(event, handler));
    this.handlers = [];
    if (this.agentInteraction) {
      this.agentInteraction.destroy();
      this.agentInteraction = null;
    }
    if (this.office) {
      this.office.destroy();
      this.office = null;
    }
  }
}

export default MainScene;
