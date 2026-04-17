// agents/AgentOrchestrator.js
// Coordinates the four LLM agents through a turn-taking loop.
//
// Behaviour:
//   • All four agents are constructed up-front and share a single mutable
//     `state` object (same shape the legacy phase modules used) plus a
//     `messageBus` they post into via the `send_message` tool.
//   • The orchestrator runs rounds: in each round, every not-yet-done agent
//     gets one turn. After a turn, the agent reports `done` (overall finished)
//     or yields. The loop ends when all agents are done OR a max-round cap is
//     hit OR the operation is externally stopped.
//   • The first round prompts each agent with their `initialPrompt()`. Later
//     rounds use a generic "What's next?" prompt — the agent must read
//     messages and decide based on world state.
//   • A final report is computed and emitted as `operation_complete`.

const config = require('../config.json');
const logger = require('../utils/logger');
const ModeFactory = require('../utils/modeFactory');
const { calculateROI, sleep } = require('../utils/calculations');

const DeployerAgent = require('./DeployerAgent');
const DistributorAgent = require('./DistributorAgent');
const SwapperAgent = require('./SwapperAgent');
const ExtractorAgent = require('./ExtractorAgent');

const MAX_ROUNDS = parseInt(process.env.AGENT_MAX_ROUNDS || '8', 10);
const ROUND_DELAY_MS = parseInt(process.env.AGENT_ROUND_DELAY_MS || '500', 10);
const TURN_DELAY_MS = parseInt(process.env.AGENT_TURN_DELAY_MS || '300', 10);

class AgentOrchestrator {
  /**
   * @param {object} opts
   * @param {import('socket.io').Server} opts.io
   * @param {object} [opts.configOverride]
   */
  constructor({ io, configOverride = {} }) {
    this.io = io;
    this.configOverride = configOverride;
    this.mode = configOverride.mode || config.MODE || 'simulation';
    this.modeFactory = new ModeFactory(this.mode);
    this.aborted = false;

    this.state = {
      mode: this.mode,
      config,
      deployerWallet: null,
      adminWallet: null,
      token: null,
      pool: null,
      distributionWallets: [],
      buyerWallets: [],
      totalBuyerInflow: 0,
      totalTokensOut: 0,
      extractedStable: 0,
      extractedTokens: 0,
      totalForwarded: 0,
      forwardingDestinations: [],
      phaseResults: []
    };

    this.messageBus = [];

    this.agents = {
      deployer: new DeployerAgent(),
      distributor: new DistributorAgent(),
      swapper: new SwapperAgent(),
      extractor: new ExtractorAgent()
    };
    this.agentOrder = ['deployer', 'distributor', 'swapper', 'extractor'];
  }

  /** Build the per-turn ctx passed to BaseAgent + tools. */
  _buildCtx() {
    return {
      io: this.io,
      state: this.state,
      modeFactory: this.modeFactory,
      config,
      messageBus: this.messageBus
    };
  }

  /** Externally request the operation to stop after the current turn. */
  abort() {
    this.aborted = true;
  }

  /**
   * Run the full operation. Returns a final report.
   */
  async run() {
    const startTime = Date.now();
    logger.info('orchestrator', `starting LLM-agent operation in ${this.mode} mode`);
    this.io.emit('operation_started', {
      mode: this.mode,
      startTime: new Date(startTime).toISOString(),
      driver: 'llm-agents'
    });

    // Notify each agent has entered the office (the Phaser scene listens for this)
    for (const key of this.agentOrder) {
      const a = this.agents[key];
      this.io.emit('agent_walking', { agent: a.agentId, destination: a.zone });
      this.io.emit('phase_started', {
        phase: a.agentId,
        agent: a.agentId,
        name: a.name,
        zone: a.zone
      });
    }

    let round = 0;
    try {
      while (round < MAX_ROUNDS && !this.aborted && !this._allDone()) {
        round += 1;
        logger.info('orchestrator', `── Round ${round} ──`);
        this.io.emit('agent_round', { round, totalDone: this._doneCount() });

        for (const key of this.agentOrder) {
          if (this.aborted) break;
          const agent = this.agents[key];
          if (agent.done) continue;

          // Move agent into its zone before they "speak" (drives Phaser anim)
          this.io.emit('agent_walking', { agent: agent.agentId, destination: agent.zone });
          this.io.emit('agent_working', {
            agent: agent.agentId,
            action: `${agent.name} is thinking…`,
            progress: Math.min(95, round * 12)
          });

          const prompt = round === 1
            ? agent.initialPrompt()
            : 'A new round has begun. Read recent messages, check world state, ' +
              'and decide what to do next. If your responsibilities are complete, ' +
              'call finish_turn with done=true. If you are waiting on another ' +
              'agent, call finish_turn with done=false.';

          try {
            const result = await agent.runTurn(prompt, this._buildCtx());
            logger.info(
              key,
              `turn ${round} ⇒ stop=${result.stopReason} actions=${result.toolCalls.length} done=${result.done}`
            );
          } catch (err) {
            logger.error(key, `turn failed: ${err.message}`);
            this.io.emit('agent_error', {
              agent: agent.agentId,
              error: err.message,
              timestamp: new Date().toISOString()
            });
            // Mark this agent done so the loop doesn't hang on a broken agent
            agent.done = true;
          }
          await sleep(TURN_DELAY_MS);
        }

        await sleep(ROUND_DELAY_MS);
      }

      const report = this._buildFinalReport(startTime);
      this.io.emit('operation_complete', report);
      logger.info('orchestrator', 'operation complete', {
        profit: report.totalProfit,
        roi: report.roi,
        duration: report.duration,
        rounds: round
      });
      return report;
    } catch (err) {
      logger.error('orchestrator', `operation failed: ${err.message}`);
      this.io.emit('operation_error', {
        error: err.message,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  }

  _allDone() {
    return this.agentOrder.every((k) => this.agents[k].done);
  }

  _doneCount() {
    return this.agentOrder.filter((k) => this.agents[k].done).length;
  }

  _buildFinalReport(startTime) {
    const duration = (Date.now() - startTime) / 1000;
    const cost = config.INITIAL_STABLECOIN_SEED;
    const revenue = this.state.totalForwarded || this.state.extractedStable || 0;
    const profit = revenue - cost;
    const roi = calculateROI(cost, revenue);

    return {
      success: true,
      mode: this.mode,
      driver: 'llm-agents',
      duration,
      cost,
      revenue,
      totalProfit: profit,
      roi: Math.round(roi * 100) / 100,
      messageBus: this.messageBus,
      agentSummaries: this.agentOrder.map((k) => {
        const a = this.agents[k];
        return {
          name: a.name,
          actions: a.actionCount,
          done: a.done,
          lastReason: a.lastYieldReason
        };
      }),
      finalBalances: {
        adminToken: this.state.adminWallet?.getBalance?.('TOKEN') ?? null,
        adminStablecoin: this.state.adminWallet?.getBalance?.('STABLECOIN') ?? null,
        poolReserves: this.state.pool?.getReserves?.() ?? null
      }
    };
  }
}

module.exports = AgentOrchestrator;
