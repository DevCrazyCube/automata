// phases/Phase5.js
// EXTRACTION: remove liquidity from the pool in one or more tranches.
// Agent: Extractor (agent id 4) — works in the "extraction" zone.

const config = require('../config.json');
const logger = require('../utils/logger');
const { sleep } = require('../utils/calculations');

const DELAY = config.PHASE_DELAYS_MS?.between_steps ?? 300;

async function run(ctx) {
  const { io, state, modeFactory } = ctx;
  const phase = 5;
  const agent = 4;

  io.emit('phase_started', { phase, agent, name: 'Extractor', zone: 'extraction' });
  io.emit('agent_walking', { agent, destination: 'extraction' });
  await sleep(DELAY * 2);

  try {
    const removals = config.LP_REMOVAL_TXNS;
    state.extractedStable = 0;
    state.extractedTokens = 0;

    for (let i = 0; i < removals.length; i += 1) {
      const removal = removals[i];
      const progress = Math.floor(((i + 1) / removals.length) * 100);

      io.emit('agent_working', {
        agent,
        action: `Removing ${Math.round(removal.fraction * 100)}% of LP (${removal.date})`,
        progress
      });
      io.emit('phase_progress', { phase, progress });

      let result;
      if (modeFactory.getMode() === 'simulation') {
        result = await state.pool.removeLiquidity(config.ADMIN_WALLET, removal.fraction);
        state.adminWallet.credit('TOKEN', result.tokenAmount);
        state.adminWallet.credit('STABLECOIN', result.stablecoinAmount);
      } else {
        // In production the LP token amount is computed on-chain; callers
        // should translate "fraction" into an explicit LP token amount.
        const lpBalance = await state.pool.getLpBalance(config.ADMIN_WALLET);
        const lpToBurn = lpBalance * removal.fraction;
        result = await state.pool.removeLiquidity(
          config.ROUTER_ADDRESS,
          config.TOKEN_ADDRESS,
          config.STABLECOIN_ADDRESS,
          lpToBurn,
          state.adminWallet.getSigner()
        );
      }

      state.extractedStable += result.stablecoinAmount || 0;
      state.extractedTokens += result.tokenAmount || 0;

      io.emit('liquidity_removed', {
        removal_id: i + 1,
        usdt: result.stablecoinAmount,
        tokens: result.tokenAmount
      });
      logger.transaction(io, {
        from: config.POOL_ADDRESS,
        to: config.ADMIN_WALLET,
        amount: result.stablecoinAmount || 0,
        asset: 'STABLECOIN',
        type: 'remove_liquidity'
      });
      logger.transaction(io, {
        from: config.POOL_ADDRESS,
        to: config.ADMIN_WALLET,
        amount: result.tokenAmount || 0,
        asset: 'TOKEN',
        type: 'remove_liquidity'
      });
      io.emit('wallet_updated', {
        wallet: config.ADMIN_WALLET,
        asset: 'STABLECOIN',
        balance: state.adminWallet.getBalance?.('STABLECOIN') ?? state.extractedStable
      });
      await sleep(DELAY);
    }

    io.emit('phase_progress', { phase, progress: 100 });
    io.emit('agent_completed', { agent });

    const result = {
      success: true,
      totalStablecoinExtracted: state.extractedStable,
      totalTokensExtracted: state.extractedTokens,
      removals: removals.length
    };
    io.emit('phase_completed', { phase, data: result });
    logger.info('Phase5', 'complete', result);
    return result;
  } catch (error) {
    logger.error('Phase5', error.message);
    io.emit('operation_error', { phase, error: error.message, timestamp: new Date().toISOString() });
    throw error;
  }
}

module.exports = { run };
