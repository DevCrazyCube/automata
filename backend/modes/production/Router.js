// modes/production/Router.js
// Thin wrapper around a Uniswap-style router.

const ROUTER_ABI = require('../../contracts/abis/UniswapV2Router.json');

class Router {
  constructor(routerAddress, rpcUrl) {
    // eslint-disable-next-line global-require
    const ethers = require('ethers');
    this.ethers = ethers;
    this.routerAddress = routerAddress;
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  async getAmountsOut(amountIn, path, inputDecimals = 18) {
    const router = new this.ethers.Contract(this.routerAddress, ROUTER_ABI, this.provider);
    const amounts = await router.getAmountsOut(
      this.ethers.utils.parseUnits(amountIn.toString(), inputDecimals),
      path
    );
    return amounts.map((a) => a.toString());
  }

  async swapExactTokensForTokens(amountIn, amountOutMin, path, to, signer,
                                 inputDecimals = 18, outputDecimals = 6) {
    const router = new this.ethers.Contract(this.routerAddress, ROUTER_ABI, signer);
    const tx = await router.swapExactTokensForTokens(
      this.ethers.utils.parseUnits(amountIn.toString(), inputDecimals),
      this.ethers.utils.parseUnits(amountOutMin.toString(), outputDecimals),
      path,
      to,
      Math.floor(Date.now() / 1000) + 60 * 20
    );
    const receipt = await tx.wait();
    return { success: receipt.status === 1, txHash: receipt.transactionHash };
  }
}

module.exports = Router;
