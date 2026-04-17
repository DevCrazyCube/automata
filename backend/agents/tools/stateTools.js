// agents/tools/stateTools.js
// Read-only world-state tools agents call to inspect the system before
// making decisions. All handlers receive (input, ctx) where ctx contains
// { state, modeFactory, config, io }.

const config = require('../../config.json');

const stateTools = [
  {
    name: 'check_token_state',
    description:
      'Inspect the live token state: total supply, holder count, top holders, ' +
      'and pool liquidity. Use this before making any decision about minting, ' +
      'burning, or distribution.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (_input, ctx) => {
      const { state } = ctx;
      const token = state.token;
      const pool = state.pool;
      if (!token) {
        return { error: 'Token not yet deployed' };
      }
      const holders = Object.entries(token.balances || {})
        .filter(([, bal]) => bal > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([addr, bal]) => ({ address: addr, balance: bal }));

      return {
        tokenAddress: token.address,
        totalSupply: token.getTotalSupply ? token.getTotalSupply() : token.totalSupply,
        whitelistEnabled: !!token.transferRestricted,
        whitelistSize: token.whitelist ? token.whitelist.size || token.whitelist.length : 0,
        holderCount: holders.length,
        topHolders: holders,
        poolReserves: pool ? pool.getReserves() : null,
        poolPrice: pool ? pool.getPrice() : null
      };
    }
  },

  {
    name: 'check_wallet_balance',
    description:
      'Get the token + stablecoin balance of a specific wallet. Useful before ' +
      'transferring or swapping to verify funds.',
    input_schema: {
      type: 'object',
      properties: {
        wallet_address: {
          type: 'string',
          description: 'The wallet address to inspect (0x...)'
        }
      },
      required: ['wallet_address']
    },
    handler: async ({ wallet_address }, ctx) => {
      const { state } = ctx;
      // Search known wallets
      const allWallets = [
        state.deployerWallet,
        state.adminWallet,
        ...(state.distributionWallets || []),
        ...(state.buyerWallets || [])
      ].filter(Boolean);

      const wallet = allWallets.find((w) => w && w.address === wallet_address);
      if (!wallet) {
        // Try token balance directly (any address)
        const tokenBal = state.token ? state.token.getBalance(wallet_address) : 0;
        return {
          address: wallet_address,
          known: false,
          tokenBalance: tokenBal,
          stablecoinBalance: 0
        };
      }

      return {
        address: wallet.address,
        known: true,
        tokenBalance: wallet.getBalance ? wallet.getBalance('TOKEN') : 0,
        stablecoinBalance: wallet.getBalance ? wallet.getBalance('STABLECOIN') : 0,
        whitelisted: wallet.isWhitelisted,
        restricted: wallet.restricted
      };
    }
  },

  {
    name: 'get_market_conditions',
    description:
      'Snapshot of pool price, reserves, recent volume, and sentiment indicators. ' +
      'Use this before swaps or liquidity-removal decisions.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (_input, ctx) => {
      const { state } = ctx;
      const pool = state.pool;
      if (!pool) return { error: 'Pool not yet created' };

      const reserves = pool.getReserves();
      const price = pool.getPrice();
      const recentInflow = state.totalBuyerInflow || 0;
      const tokensOut = state.totalTokensOut || 0;

      return {
        priceTokenPerStable: price,
        reserves,
        totalLpSupply: pool.totalLpSupply,
        recentInflowStablecoin: recentInflow,
        tokensSoldToBuyers: tokensOut,
        poolHealth: reserves.TOKEN > 0 && reserves.STABLECOIN > 0 ? 'healthy' : 'empty',
        sentiment:
          recentInflow > 0 && tokensOut > 0
            ? 'active buying'
            : reserves.STABLECOIN > 0
              ? 'liquidity available'
              : 'cold'
      };
    }
  },

  {
    name: 'get_config',
    description:
      'Read the operation configuration — initial seed amounts, target ' +
      'distribution wallets, buyer roster, planned LP-removal schedule, ' +
      'forwarding destinations, and tolerance settings.',
    input_schema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          description:
            'Optional: specific section to read (distribution, buyers, lp_removal, ' +
            'forwarding, supply, all)',
          enum: ['distribution', 'buyers', 'lp_removal', 'forwarding', 'supply', 'all']
        }
      },
      required: []
    },
    handler: async ({ section = 'all' }) => {
      const sections = {
        supply: {
          totalMint: config.TOTAL_MINT_AMOUNT,
          initialTokenSeed: config.INITIAL_TOKEN_SEED,
          initialStablecoinSeed: config.INITIAL_STABLECOIN_SEED
        },
        distribution: {
          wallets: config.DISTRIBUTION_WALLETS,
          burns: config.BURN_AMOUNTS
        },
        buyers: { wallets: config.BUYER_WALLETS },
        lp_removal: { schedule: config.LP_REMOVAL_TXNS },
        forwarding: { txns: config.CASH_FORWARDING_TXNS }
      };
      if (section === 'all') return sections;
      return sections[section] || { error: `Unknown section: ${section}` };
    }
  },

  {
    name: 'send_message',
    description:
      'Post a message to the shared agent chat channel so other agents can read it. ' +
      'Use this to coordinate strategy, signal completion, or request input from a ' +
      'specific agent. Address other agents by name (Deployer, Distributor, Swapper, ' +
      'Extractor) or use "all".',
    input_schema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient: "all" or one of Deployer/Distributor/Swapper/Extractor'
        },
        message: { type: 'string', description: 'The message text' }
      },
      required: ['to', 'message']
    },
    handler: async ({ to, message }, ctx) => {
      const entry = {
        from: ctx.agentName,
        to,
        message,
        timestamp: new Date().toISOString()
      };
      ctx.messageBus.push(entry);
      ctx.io.emit('agent_message', entry);
      return { success: true, posted: true };
    }
  },

  {
    name: 'read_messages',
    description:
      'Read recent messages from the shared agent chat channel (last 20). ' +
      'Use this to see what other agents have communicated.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (_input, ctx) => {
      const recent = ctx.messageBus.slice(-20);
      return { messages: recent, count: recent.length };
    }
  },

  {
    name: 'finish_turn',
    description:
      'Indicate that this agent has finished its current decision cycle and is ' +
      'ready to yield control. Call this when you have completed the task you set ' +
      'out to do, or when you have nothing further to contribute right now.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Why you are yielding (1 sentence)' },
        done: {
          type: 'boolean',
          description:
            'true if your overall responsibilities are complete; false if just ' +
            'pausing this turn'
        }
      },
      required: ['reason']
    },
    handler: async ({ reason, done = false }, ctx) => {
      ctx.io.emit('agent_yielded', {
        agent: ctx.agentKey,
        reason,
        done,
        timestamp: new Date().toISOString()
      });
      return { yielded: true, done };
    }
  }
];

module.exports = stateTools;
