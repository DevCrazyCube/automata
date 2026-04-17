// agents/tools/liquidityTools.js
// AMM liquidity management: seed pool, add LP, remove LP, forward stablecoin.

const logger = require('../../utils/logger');

const liquidityTools = [
  {
    name: 'execute_add_liquidity',
    description:
      'Deposit token + stablecoin into the AMM pool. The first call sets the ' +
      'initial price ratio. Subsequent calls add proportional liquidity. ' +
      'Returns LP tokens minted.',
    input_schema: {
      type: 'object',
      properties: {
        token_amount: { type: 'number', description: 'Amount of token to deposit' },
        stablecoin_amount: { type: 'number', description: 'Amount of stablecoin to deposit' },
        provider_address: {
          type: 'string',
          description: 'LP provider wallet (defaults to admin wallet)'
        }
      },
      required: ['token_amount', 'stablecoin_amount']
    },
    handler: async ({ token_amount, stablecoin_amount, provider_address }, ctx) => {
      const { state, io, config, modeFactory } = ctx;
      if (!state.pool) return { error: 'Pool not created — run execute_deploy_token first' };

      const provider = provider_address || config.ADMIN_WALLET;

      // In simulation, ensure the provider has the funds (auto-credit stablecoin
      // for admin since fiat doesn't exist in chain state)
      if (modeFactory.getMode() === 'simulation' && provider === config.ADMIN_WALLET) {
        if (state.adminWallet.getBalance('STABLECOIN') < stablecoin_amount) {
          state.adminWallet.credit('STABLECOIN', stablecoin_amount);
        }
        state.adminWallet.debit('TOKEN', token_amount);
        state.adminWallet.debit('STABLECOIN', stablecoin_amount);
      }

      const res = await state.pool.addLiquidity(token_amount, stablecoin_amount, provider);

      logger.transaction(io, {
        from: provider,
        to: state.pool.address,
        amount: token_amount,
        asset: 'TOKEN',
        type: 'add_liquidity'
      });
      logger.transaction(io, {
        from: provider,
        to: state.pool.address,
        amount: stablecoin_amount,
        asset: 'STABLECOIN',
        type: 'add_liquidity'
      });

      return {
        success: true,
        lpTokensMinted: res.lpTokens,
        txHash: res.txHash,
        newReserves: state.pool.getReserves(),
        newPrice: state.pool.getPrice()
      };
    }
  },

  {
    name: 'execute_remove_liquidity',
    description:
      'Withdraw a fraction (0.0–1.0) of the LP holder\'s liquidity from the pool. ' +
      'Returns the token + stablecoin amounts received. Used by Extractor to ' +
      'gradually drain the pool back to admin wallet.',
    input_schema: {
      type: 'object',
      properties: {
        lp_fraction: {
          type: 'number',
          description: 'Fraction of provider\'s LP to burn (0.0–1.0)',
          minimum: 0,
          maximum: 1
        },
        provider_address: {
          type: 'string',
          description: 'LP provider wallet (defaults to admin wallet)'
        }
      },
      required: ['lp_fraction']
    },
    handler: async ({ lp_fraction, provider_address }, ctx) => {
      const { state, io, config } = ctx;
      if (!state.pool) return { error: 'Pool not created' };

      const provider = provider_address || config.ADMIN_WALLET;
      const res = await state.pool.removeLiquidity(provider, lp_fraction);

      // In simulation, credit the admin wallet with the withdrawn amounts
      if (provider === config.ADMIN_WALLET && state.adminWallet.credit) {
        state.adminWallet.credit('TOKEN', res.tokenAmount);
        state.adminWallet.credit('STABLECOIN', res.stablecoinAmount);
      }

      state.extractedTokens = (state.extractedTokens || 0) + res.tokenAmount;
      state.extractedStable = (state.extractedStable || 0) + res.stablecoinAmount;

      logger.transaction(io, {
        from: state.pool.address,
        to: provider,
        amount: res.tokenAmount,
        asset: 'TOKEN',
        type: 'remove_liquidity'
      });
      logger.transaction(io, {
        from: state.pool.address,
        to: provider,
        amount: res.stablecoinAmount,
        asset: 'STABLECOIN',
        type: 'remove_liquidity'
      });
      io.emit('liquidity_removed', {
        removal_id: `lp-${Date.now()}`,
        usdt: res.stablecoinAmount,
        tokens: res.tokenAmount
      });

      return {
        success: true,
        tokenAmount: res.tokenAmount,
        stablecoinAmount: res.stablecoinAmount,
        txHash: res.txHash,
        newReserves: state.pool.getReserves()
      };
    }
  },

  {
    name: 'execute_forward_stablecoin',
    description:
      'Forward stablecoin from the admin wallet to a destination address. Used ' +
      'by the Extractor in the post-extraction forwarding phase to route ' +
      'extracted stablecoin to off-system destinations.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Destination wallet address' },
        amount: { type: 'number', description: 'Stablecoin amount to forward' }
      },
      required: ['to', 'amount']
    },
    handler: async ({ to, amount }, ctx) => {
      const { state, io } = ctx;
      if (!state.adminWallet) return { error: 'Admin wallet not initialised' };

      const res = await state.adminWallet.transfer(to, amount, 'STABLECOIN');
      state.totalForwarded = (state.totalForwarded || 0) + amount;
      state.forwardingDestinations = state.forwardingDestinations || [];
      state.forwardingDestinations.push({ to, amount });

      logger.transaction(io, {
        from: state.adminWallet.address,
        to,
        amount,
        asset: 'STABLECOIN',
        type: 'forward'
      });
      io.emit('cash_forwarded', {
        from: state.adminWallet.address,
        to,
        amount
      });
      return { success: true, txHash: res.txHash, totalForwarded: state.totalForwarded };
    }
  }
];

module.exports = liquidityTools;
