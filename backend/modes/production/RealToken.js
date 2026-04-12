// modes/production/RealToken.js
// Real ERC20 token contract interaction via ethers.js.

const ERC20_ABI = require('../../contracts/abis/ERC20.json');

class RealToken {
  constructor(tokenAddress, adminWallet, rpcUrl) {
    // eslint-disable-next-line global-require
    const ethers = require('ethers');
    this.ethers = ethers;
    this.tokenAddress = tokenAddress;
    this.adminWallet = adminWallet;
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  async mint(to, amount, signer, decimals = 18) {
    const contract = new this.ethers.Contract(this.tokenAddress, ERC20_ABI, signer);
    const tx = await contract.mint(
      to,
      this.ethers.utils.parseUnits(amount.toString(), decimals)
    );
    const receipt = await tx.wait();
    return { success: receipt.status === 1, txHash: receipt.transactionHash };
  }

  async transfer(to, amount, signer, decimals = 18) {
    const contract = new this.ethers.Contract(this.tokenAddress, ERC20_ABI, signer);
    const tx = await contract.transfer(
      to,
      this.ethers.utils.parseUnits(amount.toString(), decimals)
    );
    const receipt = await tx.wait();
    return { success: receipt.status === 1, txHash: receipt.transactionHash };
  }

  async burn(amount, signer, decimals = 18) {
    const contract = new this.ethers.Contract(this.tokenAddress, ERC20_ABI, signer);
    const tx = await contract.burn(
      this.ethers.utils.parseUnits(amount.toString(), decimals)
    );
    const receipt = await tx.wait();
    return { success: receipt.status === 1, txHash: receipt.transactionHash };
  }

  async getBalance(address, decimals = 18) {
    const contract = new this.ethers.Contract(this.tokenAddress, ERC20_ABI, this.provider);
    const balance = await contract.balanceOf(address);
    return parseFloat(this.ethers.utils.formatUnits(balance, decimals));
  }

  async getTotalSupply(decimals = 18) {
    const contract = new this.ethers.Contract(this.tokenAddress, ERC20_ABI, this.provider);
    const supply = await contract.totalSupply();
    return parseFloat(this.ethers.utils.formatUnits(supply, decimals));
  }
}

module.exports = RealToken;
