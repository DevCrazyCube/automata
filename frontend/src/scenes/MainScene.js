// scenes/MainScene.js
// DeFi Office workspace: 4 workstations arranged in a 2×2 grid.
// Each workstation belongs to one agent who idles/patrols nearby
// and sits down to "type" during active phases.

import Phaser from 'phaser';
import Agent from '../classes/Agent.js';
import { registerAll, registerAnimations } from '../classes/SpriteFactory.js';
import OfficeEnvironment from '../classes/OfficeEnvironment.js';
import IdleBehavior from '../classes/IdleBehavior.js';
import AgentInteraction from '../classes/AgentInteraction.js';
import socket from '../services/socketService.js';

export const WORLD_WIDTH  = 800;
export const WORLD_HEIGHT = 540;

// Workstation layout constants
const PAD   = 24;
const WS_W  = 80;   // workstation sprite is drawn at 2.5× scale → 80px rendered
const WS_H  = 80;
const COL_A = PAD + WS_W / 2 + 20;
const COL_B = WORLD_WIDTH - PAD - WS_W / 2 - 20;
const ROW_1 = PAD + 80;
const ROW_2 = WORLD_HEIGHT - PAD - 80;

/** 4 workstation descriptors. zone is the Phaser "logical zone" agents walk to. */
const STATIONS = {
  deployer: {
    key:       'workstation_deployer',
    agentKey:  'deployer',
    name:      'Deployer',
    tint:      0xff5555,
    wsX:       COL_A,
    wsY:       ROW_1,
    label:     'DEPLOYMENT',
    subLabel:  'Token Contract',
  },
  distributor: {
    key:       'workstation_distributor',
    agentKey:  'distributor',
    name:      'Distributor',
    tint:      0x44ddcc,
    wsX:       COL_B,
    wsY:       ROW_1,
    label:     'DISTRIBUTION',
    subLabel:  'Token Staging',
  },
  swapper: {
    key:       'workstation_swapper',
    agentKey:  'swapper',
    name:      'Swapper',
    tint:      0xffdd44,
    wsX:       COL_A,
    wsY:       ROW_2,
    label:     'SWAP FLOOR',
    subLabel:  'DEX Router',
  },
  extractor: {
    key:       'workstation_extractor',
    agentKey:  'extractor',
    name:      'Extractor',
    tint:      0x88eedd,
    wsX:       COL_B,
    wsY:       ROW_2,
    label:     'EXTRACTION',
    subLabel:  'LP Removal',
  },
};

/** Map backend zone names to station keys. */
const ZONE_MAP = {
  deployment:   'deployer',
  distribution: 'distributor',
  swapping:     'swapper',
  extraction:   'extractor',
};

/** Map backend agent index (1-4) to station key. */
const AGENT_IDX_MAP = { 1: 'deployer', 2: 'distributor', 3: 'swapper', 4: 'extractor' };

/** Resolve a station key from any of: numeric id, string key, agent name. */
function resolveStationKey(input) {
  if (input == null) return null;
  if (typeof input === 'number') return AGENT_IDX_MAP[input] || null;
  if (typeof input === 'string') {
    const lower = input.toLowerCase();
    if (STATIONS[lower]) return lower;
    if (AGENT_IDX_MAP[lower]) return AGENT_IDX_MAP[lower];
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
    this.zones    = {};   // key → { x, y, width, height } logical zone
    this.handlers = [];   // socket handler refs for cleanup
    this.office   = null; // OfficeEnvironment instance
    this.agentInteraction = null; // AgentInteraction instance
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  preload() {
    // Register all programmatic textures before create().
    registerAll(this);
  }

  create() {
    registerAnimations(this);

    this._buildOffice();
    this._buildAgents();
    this._setupIdleBehaviors();
    this._setupAgentInteraction();
    this._setupCamera();
    this._bindSocketHandlers();

    // Socket cleanup on scene shutdown (supports HMR).
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this._unbindSocketHandlers());
    this.events.on(Phaser.Scenes.Events.DESTROY,  () => this._unbindSocketHandlers());
  }

  _setupCamera() {
    // Center camera on first agent with smooth easing
    const firstAgent = Object.values(this.agents)[0];
    if (firstAgent) {
      this.cameras.main.startFollow(firstAgent.container, true);
      this.cameras.main.setLerp(0.08, 0.08);
      this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    }
  }

  // ── Office world construction ───────────────────────────────────────────────

  _buildOffice() {
    // Create office environment with tilemap and furniture
    this.office = new OfficeEnvironment(this);
    this.office.build();

    // Add title at top
    const W = WORLD_WIDTH;
    this.add.text(W / 2, 10, '◈  AUTOMATA  DEFI OPERATIONS CENTER  ◈', {
      fontSize: '10px',
      color: '#00aaff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      stroke: '#001433',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(100);

    // Subtle vignette overlay
    const H = WORLD_HEIGHT;
    const vignette = this.add.graphics();
    const gradSteps = 6;
    for (let i = gradSteps; i >= 0; i--) {
      const alpha = (1 - i / gradSteps) * 0.1;
      const margin = i * (Math.min(W, H) / gradSteps / 2);
      vignette.fillStyle(0x000010, alpha);
      vignette.fillRect(0, 0, W, margin);
      vignette.fillRect(0, H - margin, W, margin);
      vignette.fillRect(0, 0, margin, H);
      vignette.fillRect(W - margin, 0, margin, H);
    }
    vignette.setDepth(99);
  }

  // ── Agent initialisation ────────────────────────────────────────────────────

  _buildAgents() {
    // Place 4 agents at desks in the office
    const agentPositions = {
      deployer:    { x: 80, y: 180 },
      distributor: { x: 250, y: 180 },
      swapper:     { x: 80, y: 350 },
      extractor:   { x: 250, y: 350 },
    };

    const agentConfigs = {
      deployer:    { name: 'Deployer',    tint: 0xff5555 },
      distributor: { name: 'Distributor', tint: 0x44ddcc },
      swapper:     { name: 'Swapper',     tint: 0xffdd44 },
      extractor:   { name: 'Extractor',   tint: 0x88eedd },
    };

    for (const [stKey, pos] of Object.entries(agentPositions)) {
      const config = agentConfigs[stKey];
      this.agents[stKey] = new Agent(
        this, pos.x, pos.y,
        config.name, stKey, config.tint
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

  // ── Socket event wiring ─────────────────────────────────────────────────────

  _bindSocketHandlers() {
    const on = (event, handler) => {
      socket.on(event, handler);
      this.handlers.push({ event, handler });
    };

    on('phase_started', (data) => {
      const stKey = resolveStationKey(data.agent) || ZONE_MAP[data.zone];
      const agent = this.agents[stKey];
      if (agent && agent.idleBehavior) agent.idleBehavior.pause();
    });

    on('agent_working', (data) => {
      const stKey = resolveStationKey(data.agent);
      const agent = this.agents[stKey];
      if (agent) {
        agent.startWorking(data.action, data.progress || 0);
        if (agent.idleBehavior) agent.idleBehavior.pause();
      }
    });

    on('agent_thinking', (data) => {
      const stKey = resolveStationKey(data.agent || data.agentId);
      const agent = this.agents[stKey];
      if (agent) {
        agent.setChatText('💭 Thinking…');
        if (agent.idleBehavior) agent.idleBehavior.pause();
      }
    });

    on('agent_reasoning', (data) => {
      const stKey = resolveStationKey(data.agent || data.agentId);
      const agent = this.agents[stKey];
      if (agent && data.text) {
        const snippet = String(data.text).slice(0, 50);
        agent.setChatText(snippet);
      }
    });

    on('agent_action', (data) => {
      const stKey = resolveStationKey(data.agent || data.agentId);
      const agent = this.agents[stKey];
      if (agent) {
        agent.startWorking(summarizeAction(data.tool, data.input || {}), 0);
      }
    });

    on('agent_message', (data) => {
      const stKey = resolveStationKey(data.from);
      const agent = this.agents[stKey];
      if (agent && data.message) {
        const snippet = String(data.message).slice(0, 56);
        agent.setChatText(`→${data.to}: ${snippet}`);
      }
    });

    on('agent_yielded', (data) => {
      const stKey = resolveStationKey(data.agent);
      const agent = this.agents[stKey];
      if (agent) {
        if (data.done) agent.celebrate();
        else agent.setChatText('Waiting…');
      }
    });

    on('agent_error', (data) => {
      const stKey = resolveStationKey(data.agent);
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
