// phases/Phase6.js
// FORWARDING: move extracted stablecoin to one or more destination wallets.
// Agent: Extractor (agent id 4) — zone "extraction".

const config = require('../config.json');
const logger = require('../utils/logger');
const { sleep } = require('../utils/calculations');

const DELAY = config.PHASE_DELAYS_MS?.between_steps ?? 300;

function resolveAddress(symbolic) {
  if (symbolic === 'ADMIN_WALLET') return config.ADMIN_WALLET;
  if (symbolic === 'DEPLOYER_ADDRESS') return config.DEPLOYER_ADDRESS;
  return symbolic;
}

async function run(ctx) {
  const { io, state, modeFactory } = ctx;
  const phase = 6;
  const agent = 4;

  io.emit('phase_started', { phase, agent, name: 'Extractor', zone: 'extraction' });
  io.emit('agent_walking', { agent, destination: 'extraction' });
  await sleep(DELAY * 2);

  try {
    const forwardings = config.CASH_FORWARDING_TXNS;
    const totalAvailable = state.adminWallet.getBalance?.('STABLECOIN') ?? state.extractedStable ?? 0;
    state.totalForwarded = 0;
    state.forwardingDestinations = [];

    for (let i = 0; i < forwardings.length; i += 1) {
      const tx = forwardings[i];
      const progress = Math.floor(((i + 1) / forwardings.length) * 100);
      const amount = totalAvailable * tx.fraction;

      io.emit('agent_working', {
        agent,
        action: `Forwarding ${amount.toFixed(2)} USDT → ${tx.to.slice(0, 8)}…`,
        progress
      });
      io.emit('phase_progress', { phase, progress });

      const from = resolveAddress(tx.from);
      const to = resolveAddress(tx.to);

      if (modeFactory.getMode() === 'simulation') {
        await state.adminWallet.transfer(to, amount, 'STABLECOIN');
      } else {
        await state.adminWallet.transfer(
          to,
          amount,
          config.STABLECOIN_ADDRESS,
          config.STABLECOIN_DECIMALS
        );
      }

      state.totalForwarded += amount;
      state.forwardingDestinations.push({ to, amount });

      io.emit('cash_forwarded', { from, to, amount });
      logger.transaction(io, {
        from,
        to,
        amount,
        asset: 'STABLECOIN',
        type: 'forward'
      });
      io.emit('wallet_updated', {
        wallet: config.ADMIN_WALLET,
        asset: 'STABLECOIN',
        balance: state.adminWallet.getBalance?.('STABLECOIN') ?? 0
      });
      await sleep(DELAY);
    }

    io.emit('phase_progress', { phase, progress: 100 });
    io.emit('agent_completed', { agent });

    const result = {
      success: true,
      totalForwarded: state.totalForwarded,
      destinations: state.forwardingDestinations.length
    };
    io.emit('phase_completed', { phase, data: result });
    logger.info('Phase6', 'complete', result);
    return result;
  } catch (error) {
    logger.error('Phase6', error.message);
    io.emit('operation_error', { phase, error: error.message, timestamp: new Date().toISOString() });
    throw error;
  }
}

module.exports = { run };
