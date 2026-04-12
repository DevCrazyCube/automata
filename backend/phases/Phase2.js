// phases/Phase2.js
// STAGING: distribute tokens to holder wallets, burn a portion to build
// the illusion of scarcity.
// Agent: Distributor (agent id 2) — works in the "distribution" zone.

const config = require('../config.json');
const logger = require('../utils/logger');
const { sleep } = require('../utils/calculations');

const DELAY = config.PHASE_DELAYS_MS?.between_steps ?? 300;

async function run(ctx) {
  const { io, state, modeFactory } = ctx;
  const phase = 2;
  const agent = 2;

  io.emit('phase_started', { phase, agent, name: 'Distributor', zone: 'distribution' });
  io.emit('agent_walking', { agent, destination: 'distribution' });
  await sleep(DELAY * 2);

  try {
    const recipients = config.DISTRIBUTION_WALLETS;
    const totalSteps = recipients.length + config.BURN_AMOUNTS.length;
    let stepIndex = 0;

    state.distributionWallets = [];

    for (const recipient of recipients) {
      stepIndex += 1;
      const progress = Math.floor((stepIndex / totalSteps) * 80);
      io.emit('agent_working', {
        agent,
        action: `Distributing ${recipient.amount.toLocaleString()} → ${recipient.address.slice(0, 8)}…`,
        progress
      });
      io.emit('phase_progress', { phase, progress });

      // Create a recipient wallet in simulation mode so balances track.
      const wallet = modeFactory.createWallet(recipient.address);
      state.distributionWallets.push(wallet);

      if (modeFactory.getMode() === 'simulation') {
        state.adminWallet.debit('TOKEN', recipient.amount);
        wallet.credit('TOKEN', recipient.amount);
        await state.token.transfer(config.ADMIN_WALLET, recipient.address, recipient.amount);
      } else {
        await state.token.transfer(
          recipient.address,
          recipient.amount,
          state.adminWallet.getSigner(),
          config.TOKEN_DECIMALS
        );
      }

      logger.transaction(io, {
        from: config.ADMIN_WALLET,
        to: recipient.address,
        amount: recipient.amount,
        asset: 'TOKEN',
        type: 'distribution'
      });
      io.emit('wallet_updated', {
        wallet: recipient.address,
        asset: 'TOKEN',
        balance: wallet.getBalance?.('TOKEN') ?? recipient.amount
      });
      await sleep(DELAY);
    }

    // Burn tokens from the admin wallet.
    for (const amount of config.BURN_AMOUNTS) {
      stepIndex += 1;
      const progress = Math.floor((stepIndex / totalSteps) * 80) + 10;
      io.emit('agent_working', {
        agent,
        action: `Burning ${amount.toLocaleString()} tokens`,
        progress
      });
      io.emit('phase_progress', { phase, progress });

      if (modeFactory.getMode() === 'simulation') {
        state.adminWallet.debit('TOKEN', amount);
        await state.token.burn(config.ADMIN_WALLET, amount);
      } else {
        await state.token.burn(amount, state.adminWallet.getSigner(), config.TOKEN_DECIMALS);
      }

      logger.transaction(io, {
        from: config.ADMIN_WALLET,
        to: '0x000000000000000000000000000000000000dead',
        amount,
        asset: 'TOKEN',
        type: 'burn'
      });
      await sleep(DELAY);
    }

    io.emit('phase_progress', { phase, progress: 100 });
    io.emit('agent_completed', { agent });

    const result = {
      success: true,
      distributed: recipients.length,
      burned: config.BURN_AMOUNTS.reduce((a, b) => a + b, 0),
      adminBalance: state.adminWallet.getBalance?.('TOKEN') ?? null
    };
    io.emit('phase_completed', { phase, data: result });
    logger.info('Phase2', 'complete', result);
    return result;
  } catch (error) {
    logger.error('Phase2', error.message);
    io.emit('operation_error', { phase, error: error.message, timestamp: new Date().toISOString() });
    throw error;
  }
}

module.exports = { run };
