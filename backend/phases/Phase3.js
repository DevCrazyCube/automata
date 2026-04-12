// phases/Phase3.js
// BUYER ENTRY: outside buyers swap stablecoin for the token via the pool.
// Fees accumulate in the pool (and conceptually to the fee capture wallet).
// Agent: Swapper (agent id 3) — works in the "swapping" zone.

const config = require('../config.json');
const logger = require('../utils/logger');
const { sleep } = require('../utils/calculations');

const DELAY = config.PHASE_DELAYS_MS?.between_steps ?? 300;

async function run(ctx) {
  const { io, state, modeFactory } = ctx;
  const phase = 3;
  const agent = 3;

  io.emit('phase_started', { phase, agent, name: 'Swapper', zone: 'swapping' });
  io.emit('agent_walking', { agent, destination: 'swapping' });
  await sleep(DELAY * 2);

  try {
    const buyers = config.BUYER_WALLETS;
    state.buyerWallets = [];
    state.totalBuyerInflow = 0;
    state.totalTokensOut = 0;

    for (let i = 0; i < buyers.length; i += 1) {
      const buyer = buyers[i];
      const progress = Math.floor(((i + 1) / buyers.length) * 100);

      io.emit('agent_working', {
        agent,
        action: `Swap ${buyer.stablecoin_amount} USDT → TOKEN (${buyer.address.slice(0, 8)}…)`,
        progress
      });
      io.emit('phase_progress', { phase, progress });
      io.emit('buyer_entered', { buyer: buyer.address, stablecoin: buyer.stablecoin_amount });

      const wallet = modeFactory.createWallet(buyer.address);
      // Seed buyer with the stablecoin they want to spend (simulation only).
      if (modeFactory.getMode() === 'simulation') {
        wallet.credit('STABLECOIN', buyer.stablecoin_amount);
      }
      state.buyerWallets.push(wallet);

      // Execute the swap via the pool.
      const swapResult = await state.pool.swap(
        'STABLECOIN',
        'TOKEN',
        buyer.stablecoin_amount,
        config.SLIPPAGE_TOLERANCE
      );

      if (modeFactory.getMode() === 'simulation') {
        wallet.debit('STABLECOIN', buyer.stablecoin_amount);
        wallet.credit('TOKEN', swapResult.outputAmount);
      }

      state.totalBuyerInflow += buyer.stablecoin_amount;
      state.totalTokensOut += swapResult.outputAmount;

      const fee = buyer.stablecoin_amount * config.FEE_PERCENT;
      io.emit('swap_executed', {
        buyer: buyer.address,
        stablecoin_in: buyer.stablecoin_amount,
        tokens_received: swapResult.outputAmount,
        fee
      });
      logger.transaction(io, {
        from: buyer.address,
        to: config.POOL_ADDRESS,
        amount: buyer.stablecoin_amount,
        asset: 'STABLECOIN',
        type: 'swap_in'
      });
      logger.transaction(io, {
        from: config.POOL_ADDRESS,
        to: buyer.address,
        amount: swapResult.outputAmount,
        asset: 'TOKEN',
        type: 'swap_out'
      });
      io.emit('wallet_updated', {
        wallet: buyer.address,
        asset: 'TOKEN',
        balance: wallet.getBalance?.('TOKEN') ?? swapResult.outputAmount
      });
      await sleep(DELAY);
    }

    io.emit('phase_progress', { phase, progress: 100 });
    io.emit('agent_completed', { agent });

    const result = {
      success: true,
      buyerCount: buyers.length,
      totalStablecoinIn: state.totalBuyerInflow,
      totalTokensOut: state.totalTokensOut,
      poolPrice: state.pool.getPrice?.() ?? null
    };
    io.emit('phase_completed', { phase, data: result });
    logger.info('Phase3', 'complete', result);
    return result;
  } catch (error) {
    logger.error('Phase3', error.message);
    io.emit('operation_error', { phase, error: error.message, timestamp: new Date().toISOString() });
    throw error;
  }
}

module.exports = { run };
