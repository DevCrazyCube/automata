// automation-wrapper.js
// Orchestrates the six phases in sequence, maintains shared run state,
// and produces the final operation summary. A single wrapper instance
// corresponds to a single operation run.

const config = require('./config.json');
const logger = require('./utils/logger');
const ModeFactory = require('./utils/modeFactory');
const { calculateROI, sleep } = require('./utils/calculations');

const Phase1 = require('./phases/Phase1');
const Phase2 = require('./phases/Phase2');
const Phase3 = require('./phases/Phase3');
const Phase4 = require('./phases/Phase4');
const Phase5 = require('./phases/Phase5');
const Phase6 = require('./phases/Phase6');

const PHASES = [Phase1, Phase2, Phase3, Phase4, Phase5, Phase6];
const BETWEEN_PHASE_DELAY = config.PHASE_DELAYS_MS?.between_phases ?? 600;

/**
 * Run the full 6-phase automation.
 *
 * @param {object} options
 * @param {import('socket.io').Server} options.io
 * @param {object} [options.configOverride]
 * @returns {Promise<object>} final report
 */
async function runAutomation({ io, configOverride = {} }) {
  const startTime = Date.now();
  const mode = configOverride.mode || config.MODE || 'simulation';
  const modeFactory = new ModeFactory(mode);

  logger.info('wrapper', `starting operation in ${mode} mode`);
  io.emit('operation_started', { mode, startTime: new Date(startTime).toISOString() });

  const state = {
    mode,
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

  const ctx = { io, state, modeFactory };

  try {
    for (let i = 0; i < PHASES.length; i += 1) {
      const phase = PHASES[i];
      const result = await phase.run(ctx);
      state.phaseResults.push(result);
      await sleep(BETWEEN_PHASE_DELAY);
    }

    const duration = (Date.now() - startTime) / 1000;
    const cost = config.INITIAL_STABLECOIN_SEED;
    const revenue = state.totalForwarded || state.extractedStable || 0;
    const profit = revenue - cost;
    const roi = calculateROI(cost, revenue);

    const finalReport = {
      success: true,
      mode,
      duration,
      cost,
      revenue,
      totalProfit: profit,
      roi: Math.round(roi * 100) / 100,
      phases: state.phaseResults,
      finalBalances: {
        adminToken: state.adminWallet?.getBalance?.('TOKEN') ?? null,
        adminStablecoin: state.adminWallet?.getBalance?.('STABLECOIN') ?? null,
        poolReserves: state.pool?.getReserves?.() ?? null
      }
    };

    io.emit('operation_complete', finalReport);
    logger.info('wrapper', 'operation complete', {
      profit: finalReport.totalProfit,
      roi: finalReport.roi,
      duration: finalReport.duration
    });

    return finalReport;
  } catch (error) {
    logger.error('wrapper', `operation failed: ${error.message}`);
    io.emit('operation_error', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

module.exports = { runAutomation };
