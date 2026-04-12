// modes/simulation/Token.js
// In-memory ERC20-like token used for simulation mode.

function fakeTxHash() {
  return '0x' + Math.random().toString(16).slice(2).padEnd(64, '0').slice(0, 64);
}

class SimulationToken {
  constructor(address, adminWallet) {
    this.address = address;
    this.adminWallet = adminWallet;
    this.name = 'TOKEN';
    this.decimals = 18;
    this.totalSupply = 0;
    this.balances = {};           // address → balance
    this.whitelist = new Set();
    this.transferRestricted = false;
  }

  async mint(to, amount) {
    this.balances[to] = (this.balances[to] || 0) + amount;
    this.totalSupply += amount;
    return { success: true, amount, txHash: fakeTxHash() };
  }

  async transfer(from, to, amount) {
    if (this.transferRestricted && !this.whitelist.has(from)) {
      throw new Error(`${from} is not whitelisted (transfers restricted)`);
    }
    if ((this.balances[from] || 0) < amount) {
      throw new Error(`Insufficient token balance on ${from}`);
    }
    this.balances[from] -= amount;
    this.balances[to] = (this.balances[to] || 0) + amount;
    return { success: true, txHash: fakeTxHash() };
  }

  async burn(from, amount) {
    if ((this.balances[from] || 0) < amount) {
      throw new Error(`Insufficient token balance on ${from} to burn`);
    }
    this.balances[from] -= amount;
    this.totalSupply -= amount;
    return { success: true, txHash: fakeTxHash() };
  }

  whitelistAddress(address) {
    this.whitelist.add(address);
  }

  setTransferRestricted(restricted) {
    this.transferRestricted = restricted;
  }

  getBalance(address) {
    return this.balances[address] || 0;
  }

  getTotalSupply() {
    return this.totalSupply;
  }
}

module.exports = SimulationToken;
