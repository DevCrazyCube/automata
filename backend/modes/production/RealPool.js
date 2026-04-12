// modes/production/RealPool.js
// Real Uniswap V2-style pool interaction via ethers.js.

const PAIR_ABI = require('../../contracts/abis/UniswapV2Pair.json');
const ROUTER_ABI = require('../../contracts/abis/UniswapV2Router.json');

class RealPool {
  constructor(poolAddress, rpcUrl) {
    // eslint-disable-next-line global-require
    const ethers = require('ethers');
    this.ethers = ethers;
    this.poolAddress = poolAddress;
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  async getReserves() {
    const pair = new this.ethers.Contract(this.poolAddress, PAIR_ABI, this.provider);
    const reserves = await pair.getReserves();
    return {
      TOKEN: reserves[0].toString(),
      STABLECOIN: reserves[1].toString(),
      blockTimestampLast: reserves[2]
    };
  }

  async addLiquidity(routerAddress, tokenAddress, stablecoinAddress,
                     tokenAmount, stablecoinAmount, signer,
                     tokenDecimals = 18, stableDecimals = 6) {
    const router = new this.ethers.Contract(routerAddress, ROUTER_ABI, signer);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const tx = await router.addLiquidity(
      tokenAddress,
      stablecoinAddress,
      this.ethers.utils.parseUnits(tokenAmount.toString(), tokenDecimals),
      this.ethers.utils.parseUnits(stablecoinAmount.toString(), stableDecimals),
      0,
      0,
      await signer.getAddress(),
      deadline
    );
    const receipt = await tx.wait();
    return { success: receipt.status === 1, txHash: receipt.transactionHash };
  }

  async removeLiquidity(routerAddress, tokenAddress, stablecoinAddress,
                        lpTokenAmount, signer) {
    const router = new this.ethers.Contract(routerAddress, ROUTER_ABI, signer);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const tx = await router.removeLiquidity(
      tokenAddress,
      stablecoinAddress,
      lpTokenAmount,
      0,
      0,
      await signer.getAddress(),
      deadline
    );
    const receipt = await tx.wait();
    return { success: receipt.status === 1, txHash: receipt.transactionHash };
  }

  async getLpBalance(lpProviderAddress) {
    const pair = new this.ethers.Contract(this.poolAddress, PAIR_ABI, this.provider);
    const balance = await pair.balanceOf(lpProviderAddress);
    return parseFloat(this.ethers.utils.formatUnits(balance, 18));
  }
}

module.exports = RealPool;
