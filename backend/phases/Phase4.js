// phases/Phase4.js
// CONTROL LAYER: activate transfer restrictions on the token and whitelist
// privileged wallets (admin + deployer). After this phase, ordinary holders
// can no longer move their tokens — only whitelisted addresses can.
// Agent: Distributor (agent id 2) re-used — zone "distribution" (top-right).

const config = require('../config.json');
const logger = require('../utils/logger');
const { sleep } = require('../utils/calculations');

const DELAY = config.PHASE_DELAYS_MS?.between_steps ?? 300;

async function run(ctx) {
  const { io, state } = ctx;
  const phase = 4;
  const agent = 2;

  io.emit('phase_started', { phase, agent, name: 'Distributor', zone: 'distribution' });
  io.emit('agent_walking', { agent, destination: 'distribution' });
  await sleep(DELAY * 2);

  try {
    // Resolve symbolic addresses like "ADMIN_WALLET" to the real value.
    const whitelistAddresses = config.WHITELISTED_WALLETS.map((entry) => {
      if (entry === 'ADMIN_WALLET') return config.ADMIN_WALLET;
      if (entry === 'DEPLOYER_ADDRESS') return config.DEPLOYER_ADDRESS;
      return entry;
    });

    io.emit('agent_working', { agent, action: 'Applying whitelist', progress: 30 });
    io.emit('phase_progress', { phase, progress: 30 });
    for (const addr of whitelistAddresses) {
      state.token.whitelistAddress?.(addr);
      logger.transaction(io, {
        from: config.ADMIN_WALLET,
        to: config.TOKEN_ADDRESS,
        amount: 0,
        asset: 'TOKEN',
        type: 'whitelist',
        meta: addr
      });
      await sleep(DELAY / 2);
    }

    io.emit('agent_working', { agent, action: 'Activating transfer restrictions', progress: 75 });
    io.emit('phase_progress', { phase, progress: 75 });
    state.token.setTransferRestricted?.(true);

    logger.transaction(io, {
      from: config.ADMIN_WALLET,
      to: config.TOKEN_ADDRESS,
      amount: 0,
      asset: 'TOKEN',
      type: 'restrict_transfers'
    });

    io.emit('phase_progress', { phase, progress: 100 });
    io.emit('agent_completed', { agent });

    const result = {
      success: true,
      whitelisted: whitelistAddresses,
      transferRestricted: true
    };
    io.emit('phase_completed', { phase, data: result });
    logger.info('Phase4', 'complete', result);
    return result;
  } catch (error) {
    logger.error('Phase4', error.message);
    io.emit('operation_error', { phase, error: error.message, timestamp: new Date().toISOString() });
    throw error;
  }
}

module.exports = { run };
