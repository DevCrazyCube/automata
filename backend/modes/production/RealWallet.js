// modes/production/RealWallet.js
// Real blockchain wallet using ethers.js. Only loaded when MODE=production.

const ERC20_ABI = require('../../contracts/abis/ERC20.json');

class RealWallet {
  constructor(address, privateKey, rpcUrl) {
    // Lazy require so simulation mode doesn't need ethers installed.
    // eslint-disable-next-line global-require
    const ethers = require('ethers');
    this.ethers = ethers;
    this.address = address;
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
  }

  /**
   * Transfer an ERC20 token.
   */
  async transfer(toAddress, amount, tokenAddress, decimals = 18) {
    const contract = new this.ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
    const tx = await contract.transfer(
      toAddress,
      this.ethers.utils.parseUnits(amount.toString(), decimals)
    );
    const receipt = await tx.wait();
    return {
      success: receipt.status === 1,
      txHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: receipt.blockNumber
    };
  }

  async getBalance(tokenAddress, decimals = 18) {
    const contract = new this.ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const balance = await contract.balanceOf(this.address);
    return parseFloat(this.ethers.utils.formatUnits(balance, decimals));
  }

  async getETHBalance() {
    const balance = await this.provider.getBalance(this.address);
    return parseFloat(this.ethers.utils.formatEther(balance));
  }

  getSigner() {
    return this.signer;
  }
}

module.exports = RealWallet;
