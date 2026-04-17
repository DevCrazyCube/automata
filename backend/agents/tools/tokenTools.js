// agents/tools/tokenTools.js
// Token-supply mutation tools: mint, burn, whitelist control, transfer-restrict.

const logger = require('../../utils/logger');

const tokenTools = [
  {
    name: 'execute_mint',
    description:
      'Mint new tokens to a wallet. Increases total supply. Used by the Deployer ' +
      'to seed the admin wallet with the initial supply.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient wallet address' },
        amount: { type: 'number', description: 'Number of tokens to mint' }
      },
      required: ['to', 'amount']
    },
    handler: async ({ to, amount }, ctx) => {
      const { state, io, modeFactory } = ctx;
      if (!state.token) return { error: 'Token not deployed yet — call execute_deploy_token first' };

      let txHash;
      if (modeFactory.getMode() === 'production') {
        const res = await state.token.mint(to, amount, state.adminWallet.getSigner());
        txHash = res.txHash;
      } else {
        const res = await state.token.mint(to, amount);
        txHash = res.txHash;
        // Credit balance on the matching wallet object if known
        const wallet = [state.adminWallet, state.deployerWallet].find((w) => w && w.address === to);
        if (wallet) wallet.credit('TOKEN', amount);
      }

      logger.transaction(io, {
        from: 'mint',
        to,
        amount,
        asset: 'TOKEN',
        type: 'mint'
      });
      io.emit('wallet_updated', {
        wallet: to,
        asset: 'TOKEN',
        balance: state.token.getBalance(to)
      });

      return { success: true, txHash, newSupply: state.token.getTotalSupply() };
    }
  },

  {
    name: 'execute_deploy_token',
    description:
      'Deploy the token contract and create the initial liquidity pool. Must be ' +
      'called once at the start of the operation by the Deployer agent.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (_input, ctx) => {
      const { state, modeFactory, config, io } = ctx;
      if (state.token) return { error: 'Token already deployed', address: state.token.address };

      // Wallets
      state.deployerWallet = modeFactory.createWallet(
        config.DEPLOYER_ADDRESS,
        process.env.DEPLOYER_PRIVATE_KEY
      );
      state.adminWallet = modeFactory.createWallet(
        config.ADMIN_WALLET,
        process.env.ADMIN_PRIVATE_KEY
      );
      state.token = modeFactory.createToken(config.TOKEN_ADDRESS, state.adminWallet);
      state.pool = modeFactory.createPool(config.POOL_ADDRESS);

      io.emit('wallet_updated', { wallet: config.ADMIN_WALLET, asset: 'TOKEN', balance: 0 });

      return {
        success: true,
        tokenAddress: state.token.address,
        poolAddress: state.pool.address,
        adminWallet: state.adminWallet.address,
        deployerWallet: state.deployerWallet.address
      };
    }
  },

  {
    name: 'execute_burn',
    description:
      'Burn tokens from a wallet, permanently reducing total supply. Use to ' +
      'create scarcity or remove unwanted excess from circulation.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Wallet to burn from' },
        amount: { type: 'number', description: 'Amount to burn' }
      },
      required: ['from', 'amount']
    },
    handler: async ({ from, amount }, ctx) => {
      const { state, io } = ctx;
      if (!state.token) return { error: 'Token not deployed' };

      const res = await state.token.burn(from, amount);
      // Update simulation wallet if known
      const wallet = [state.adminWallet, state.deployerWallet].find((w) => w && w.address === from);
      if (wallet && wallet.debit) wallet.debit('TOKEN', amount);

      logger.transaction(io, {
        from,
        to: 'burn',
        amount,
        asset: 'TOKEN',
        type: 'burn'
      });
      io.emit('wallet_updated', { wallet: from, asset: 'TOKEN', balance: state.token.getBalance(from) });
      return { success: true, txHash: res.txHash, newSupply: state.token.getTotalSupply() };
    }
  },

  {
    name: 'execute_whitelist',
    description:
      'Add or remove a wallet from the token transfer whitelist. When transfer ' +
      'restrictions are enabled, only whitelisted wallets can transfer tokens.',
    input_schema: {
      type: 'object',
      properties: {
        wallet_address: { type: 'string', description: 'Wallet to whitelist or unblock' },
        allow: { type: 'boolean', description: 'true to whitelist, false to remove' }
      },
      required: ['wallet_address', 'allow']
    },
    handler: async ({ wallet_address, allow }, ctx) => {
      const { state, io } = ctx;
      if (!state.token) return { error: 'Token not deployed' };

      if (allow) {
        state.token.whitelistAddress(wallet_address);
      } else if (state.token.whitelist && state.token.whitelist.delete) {
        state.token.whitelist.delete(wallet_address);
      }

      io.emit('whitelist_updated', { wallet: wallet_address, allowed: allow });
      return { success: true, wallet: wallet_address, allowed: allow };
    }
  },

  {
    name: 'execute_set_transfer_restrictions',
    description:
      'Enable or disable global transfer restrictions on the token. When enabled, ' +
      'only whitelisted addresses can move tokens. Used by Distributor in the ' +
      'control phase to lock the supply.',
    input_schema: {
      type: 'object',
      properties: {
        restricted: {
          type: 'boolean',
          description: 'true to enable restrictions, false to disable'
        }
      },
      required: ['restricted']
    },
    handler: async ({ restricted }, ctx) => {
      const { state, io } = ctx;
      if (!state.token) return { error: 'Token not deployed' };
      state.token.setTransferRestricted(restricted);
      io.emit('transfer_restrictions_updated', { restricted });
      return { success: true, restricted };
    }
  },

  {
    name: 'execute_transfer',
    description:
      'Transfer tokens from one wallet to another. Used by Distributor for the ' +
      'distribution phase (admin → distribution wallets).',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Sender wallet address' },
        to: { type: 'string', description: 'Recipient wallet address' },
        amount: { type: 'number', description: 'Token amount to transfer' }
      },
      required: ['from', 'to', 'amount']
    },
    handler: async ({ from, to, amount }, ctx) => {
      const { state, io } = ctx;
      if (!state.token) return { error: 'Token not deployed' };

      const res = await state.token.transfer(from, to, amount);
      // Update simulation wallets if known
      const fromWallet = [state.adminWallet, state.deployerWallet].find((w) => w && w.address === from);
      if (fromWallet && fromWallet.debit) fromWallet.debit('TOKEN', amount);
      const toWallet = [state.adminWallet, state.deployerWallet, ...(state.distributionWallets || [])]
        .find((w) => w && w.address === to);
      if (toWallet && toWallet.credit) toWallet.credit('TOKEN', amount);

      logger.transaction(io, {
        from,
        to,
        amount,
        asset: 'TOKEN',
        type: 'transfer'
      });
      io.emit('wallet_updated', { wallet: to, asset: 'TOKEN', balance: state.token.getBalance(to) });
      return { success: true, txHash: res.txHash };
    }
  }
];

module.exports = tokenTools;
