// agents/tools/swapTools.js
// DEX swap & buyer-simulation tools.

const logger = require('../../utils/logger');

const swapTools = [
  {
    name: 'execute_swap',
    description:
      'Swap one asset for another against the pool. The buyer must already hold ' +
      'the input asset. Returns the actual output amount after slippage.',
    input_schema: {
      type: 'object',
      properties: {
        buyer_address: { type: 'string', description: 'Buyer wallet address' },
        input_asset: {
          type: 'string',
          enum: ['TOKEN', 'STABLECOIN'],
          description: 'Asset to spend'
        },
        output_asset: {
          type: 'string',
          enum: ['TOKEN', 'STABLECOIN'],
          description: 'Asset to receive'
        },
        input_amount: { type: 'number', description: 'Amount of input asset' },
        slippage: {
          type: 'number',
          description: 'Slippage tolerance (0.0–1.0). Default 0.05 (5%).',
          minimum: 0,
          maximum: 1
        }
      },
      required: ['buyer_address', 'input_asset', 'output_asset', 'input_amount']
    },
    handler: async ({ buyer_address, input_asset, output_asset, input_amount, slippage }, ctx) => {
      const { state, io, modeFactory } = ctx;
      if (!state.pool) return { error: 'Pool not created' };

      // Locate or create buyer wallet
      let buyer = (state.buyerWallets || []).find((w) => w && w.address === buyer_address);
      if (!buyer) {
        buyer = modeFactory.createWallet(buyer_address);
        state.buyerWallets = state.buyerWallets || [];
        state.buyerWallets.push(buyer);
        io.emit('buyer_entered', { buyer: buyer_address, stablecoin_amount: input_amount });
      }

      // In simulation, ensure buyer has the input asset
      if (modeFactory.getMode() === 'simulation' && buyer.getBalance(input_asset) < input_amount) {
        buyer.credit(input_asset, input_amount);
      }
      if (buyer.debit) buyer.debit(input_asset, input_amount);

      const swapRes = await state.pool.swap(input_asset, output_asset, input_amount, slippage ?? 0.05);

      if (buyer.credit) buyer.credit(output_asset, swapRes.outputAmount);

      // Track aggregate flow
      if (input_asset === 'STABLECOIN') {
        state.totalBuyerInflow = (state.totalBuyerInflow || 0) + input_amount;
        state.totalTokensOut = (state.totalTokensOut || 0) + swapRes.outputAmount;
      }

      logger.transaction(io, {
        from: buyer_address,
        to: state.pool.address,
        amount: input_amount,
        asset: input_asset,
        type: 'swap_in'
      });
      logger.transaction(io, {
        from: state.pool.address,
        to: buyer_address,
        amount: swapRes.outputAmount,
        asset: output_asset,
        type: 'swap_out'
      });
      io.emit('swap_executed', {
        buyer: buyer_address,
        stablecoin_in: input_asset === 'STABLECOIN' ? input_amount : swapRes.outputAmount,
        tokens_received: output_asset === 'TOKEN' ? swapRes.outputAmount : input_amount,
        fee: input_amount * (state.pool.feePercent || 0)
      });

      return {
        success: true,
        outputAmount: swapRes.outputAmount,
        txHash: swapRes.txHash,
        newPrice: state.pool.getPrice(),
        newReserves: state.pool.getReserves()
      };
    }
  },

  {
    name: 'execute_register_distribution_wallet',
    description:
      'Register an internal distribution wallet so subsequent transfers/swaps ' +
      'are tracked. Returns the wallet object reference.',
    input_schema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Wallet address' },
        label: { type: 'string', description: 'Optional label for logs' }
      },
      required: ['address']
    },
    handler: async ({ address, label }, ctx) => {
      const { state, modeFactory } = ctx;
      let existing = (state.distributionWallets || []).find((w) => w && w.address === address);
      if (existing) return { success: true, address, alreadyRegistered: true };

      const wallet = modeFactory.createWallet(address);
      wallet.label = label || address;
      state.distributionWallets = state.distributionWallets || [];
      state.distributionWallets.push(wallet);
      return { success: true, address, label: wallet.label };
    }
  }
];

module.exports = swapTools;
