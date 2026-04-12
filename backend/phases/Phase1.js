// phases/Phase1.js
// SETUP: deploy token, create pool, seed initial liquidity.
// Agent: Deployer (agent id 1) — works in the "deployment" zone.

const config = require('../config.json');
const logger = require('../utils/logger');
const { sleep } = require('../utils/calculations');

const DELAY = config.PHASE_DELAYS_MS?.between_steps ?? 300;

/**
 * Run Phase 1.
 *
 * @param {object} ctx - shared run context (io, state, modeFactory)
 * @returns {Promise<object>} phase result
 */
async function run(ctx) {
  const { io, state, modeFactory } = ctx;
  const phase = 1;
  const agent = 1;

  io.emit('phase_started', { phase, agent, name: 'Deployer', zone: 'deployment' });
  io.emit('agent_walking', { agent, destination: 'deployment' });
  await sleep(DELAY * 2);

  try {
    // ── 1. Create core wallets ────────────────────────────────────────────
    io.emit('agent_working', { agent, action: 'Creating admin + deployer wallets', progress: 10 });
    io.emit('phase_progress', { phase, progress: 10 });

    state.deployerWallet = modeFactory.createWallet(
      config.DEPLOYER_ADDRESS,
      process.env.DEPLOYER_PRIVATE_KEY
    );
    state.adminWallet = modeFactory.createWallet(
      config.ADMIN_WALLET,
      process.env.ADMIN_PRIVATE_KEY
    );
    await sleep(DELAY);

    // ── 2. Deploy token ───────────────────────────────────────────────────
    io.emit('agent_working', { agent, action: 'Deploying token contract', progress: 30 });
    io.emit('phase_progress', { phase, progress: 30 });
    state.token = modeFactory.createToken(config.TOKEN_ADDRESS, state.adminWallet);
    await sleep(DELAY);

    // ── 3. Mint the full supply to the admin wallet ───────────────────────
    io.emit('agent_working', { agent, action: `Minting ${config.TOTAL_MINT_AMOUNT.toLocaleString()} tokens`, progress: 50 });
    io.emit('phase_progress', { phase, progress: 50 });
    if (modeFactory.getMode() === 'production') {
      await state.token.mint(config.ADMIN_WALLET, config.TOTAL_MINT_AMOUNT, state.adminWallet.getSigner());
    } else {
      await state.token.mint(config.ADMIN_WALLET, config.TOTAL_MINT_AMOUNT);
      state.adminWallet.credit('TOKEN', config.TOTAL_MINT_AMOUNT);
    }
    logger.transaction(io, {
      from: 'mint',
      to: config.ADMIN_WALLET,
      amount: config.TOTAL_MINT_AMOUNT,
      asset: 'TOKEN',
      type: 'mint'
    });
    io.emit('wallet_updated', {
      wallet: config.ADMIN_WALLET,
      asset: 'TOKEN',
      balance: state.adminWallet.getBalance('TOKEN')
    });
    await sleep(DELAY);

    // ── 4. Create pool ────────────────────────────────────────────────────
    io.emit('agent_working', { agent, action: 'Creating liquidity pool', progress: 70 });
    io.emit('phase_progress', { phase, progress: 70 });
    state.pool = modeFactory.createPool(config.POOL_ADDRESS);
    await sleep(DELAY);

    // ── 5. Seed initial liquidity ─────────────────────────────────────────
    io.emit('agent_working', { agent, action: 'Seeding initial liquidity', progress: 85 });
    io.emit('phase_progress', { phase, progress: 85 });

    if (modeFactory.getMode() === 'simulation') {
      state.adminWallet.credit('STABLECOIN', config.INITIAL_STABLECOIN_SEED);
      state.adminWallet.debit('TOKEN', config.INITIAL_TOKEN_SEED);
      state.adminWallet.debit('STABLECOIN', config.INITIAL_STABLECOIN_SEED);
      await state.pool.addLiquidity(
        config.INITIAL_TOKEN_SEED,
        config.INITIAL_STABLECOIN_SEED,
        config.ADMIN_WALLET
      );
    } else {
      await state.pool.addLiquidity(
        config.ROUTER_ADDRESS,
        config.TOKEN_ADDRESS,
        config.STABLECOIN_ADDRESS,
        config.INITIAL_TOKEN_SEED,
        config.INITIAL_STABLECOIN_SEED,
        state.adminWallet.getSigner(),
        config.TOKEN_DECIMALS,
        config.STABLECOIN_DECIMALS
      );
    }

    logger.transaction(io, {
      from: config.ADMIN_WALLET,
      to: config.POOL_ADDRESS,
      amount: config.INITIAL_TOKEN_SEED,
      asset: 'TOKEN',
      type: 'add_liquidity'
    });
    logger.transaction(io, {
      from: config.ADMIN_WALLET,
      to: config.POOL_ADDRESS,
      amount: config.INITIAL_STABLECOIN_SEED,
      asset: 'STABLECOIN',
      type: 'add_liquidity'
    });

    io.emit('phase_progress', { phase, progress: 100 });
    io.emit('agent_completed', { agent });

    const result = {
      success: true,
      tokenDeployed: true,
      poolCreated: true,
      liquiditySeeded: {
        tokenAmount: config.INITIAL_TOKEN_SEED,
        stablecoinAmount: config.INITIAL_STABLECOIN_SEED
      },
      adminBalance: state.adminWallet.getBalance?.('TOKEN') ?? null
    };
    io.emit('phase_completed', { phase, data: result });
    logger.info('Phase1', 'complete', result);
    return result;
  } catch (error) {
    logger.error('Phase1', error.message);
    io.emit('operation_error', { phase, error: error.message, timestamp: new Date().toISOString() });
    throw error;
  }
}

module.exports = { run };
