// modes/simulation/Pool.js
// Constant-product AMM pool simulation. Stores token & stablecoin reserves
// and issues a fake LP-token balance per liquidity provider so that
// Phase 5 (LP removal) has something to act on.

const { getAmountOut, minOutputWithSlippage } = require('../../utils/calculations');

function fakeTxHash() {
  return '0x' + Math.random().toString(16).slice(2).padEnd(64, '0').slice(0, 64);
}

class SimulationPool {
  constructor(address) {
    this.address = address;
    this.reserves = { TOKEN: 0, STABLECOIN: 0 };
    this.totalLpSupply = 0;
    this.lpBalances = {};     // address → LP token balance
    this.feePercent = 0.0025; // 0.25% default
  }

  /**
   * Seed or extend liquidity. First provider sets the initial ratio; subsequent
   * providers receive LP tokens proportional to the current reserves.
   */
  async addLiquidity(tokenAmount, stablecoinAmount, providerAddress = null) {
    if (tokenAmount <= 0 || stablecoinAmount <= 0) {
      throw new Error('Liquidity amounts must be positive');
    }

    let lpMinted;
    if (this.totalLpSupply === 0) {
      lpMinted = Math.sqrt(tokenAmount * stablecoinAmount);
    } else {
      lpMinted = Math.min(
        (tokenAmount * this.totalLpSupply) / this.reserves.TOKEN,
        (stablecoinAmount * this.totalLpSupply) / this.reserves.STABLECOIN
      );
    }

    this.reserves.TOKEN += tokenAmount;
    this.reserves.STABLECOIN += stablecoinAmount;
    this.totalLpSupply += lpMinted;

    if (providerAddress) {
      this.lpBalances[providerAddress] = (this.lpBalances[providerAddress] || 0) + lpMinted;
    }

    return { success: true, lpTokens: lpMinted, txHash: fakeTxHash() };
  }

  /**
   * Calculate output for a given input without updating reserves.
   */
  calculateSwapOutput(inputAsset, outputAsset, inputAmount) {
    const inputReserve = this.reserves[inputAsset];
    const outputReserve = this.reserves[outputAsset];
    return getAmountOut(inputAmount, inputReserve, outputReserve, this.feePercent);
  }

  /**
   * Execute a swap against the pool. Mutates reserves.
   */
  async swap(inputAsset, outputAsset, inputAmount, slippageTolerance = 0.05) {
    if (!this.reserves[inputAsset] || !this.reserves[outputAsset]) {
      throw new Error(`Pool does not support swap ${inputAsset} → ${outputAsset}`);
    }
    const outputAmount = this.calculateSwapOutput(inputAsset, outputAsset, inputAmount);
    const minOutput = minOutputWithSlippage(outputAmount, slippageTolerance);

    if (outputAmount < minOutput) {
      throw new Error('Slippage tolerance exceeded');
    }

    this.reserves[inputAsset] += inputAmount;
    this.reserves[outputAsset] -= outputAmount;

    return {
      success: true,
      inputAmount,
      outputAmount,
      minOutput,
      txHash: fakeTxHash()
    };
  }

  /**
   * Remove a fraction of the LP holder's liquidity.
   *
   * @param {string} providerAddress
   * @param {number} fraction between 0 and 1
   */
  async removeLiquidity(providerAddress, fraction = 1.0) {
    const lpBalance = this.lpBalances[providerAddress] || 0;
    if (lpBalance === 0) {
      throw new Error(`No LP balance for ${providerAddress}`);
    }
    const lpToBurn = lpBalance * fraction;
    const share = lpToBurn / this.totalLpSupply;

    const tokenOut = this.reserves.TOKEN * share;
    const stableOut = this.reserves.STABLECOIN * share;

    this.reserves.TOKEN -= tokenOut;
    this.reserves.STABLECOIN -= stableOut;
    this.totalLpSupply -= lpToBurn;
    this.lpBalances[providerAddress] = lpBalance - lpToBurn;

    return {
      success: true,
      tokenAmount: tokenOut,
      stablecoinAmount: stableOut,
      txHash: fakeTxHash()
    };
  }

  getReserves() {
    return { ...this.reserves };
  }

  getPrice() {
    if (this.reserves.TOKEN === 0) return 0;
    return this.reserves.STABLECOIN / this.reserves.TOKEN;
  }

  getLpBalance(address) {
    return this.lpBalances[address] || 0;
  }
}

module.exports = SimulationPool;
