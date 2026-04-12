// modes/simulation/Wallet.js
// In-memory wallet used for simulation mode. No blockchain, no cost.

/**
 * Generate a deterministic-looking fake tx hash for simulation logs.
 */
function fakeTxHash() {
  return '0x' + Math.random().toString(16).slice(2).padEnd(64, '0').slice(0, 64);
}

class SimulationWallet {
  constructor(address) {
    this.address = address;
    this.balances = { TOKEN: 0, STABLECOIN: 0, ETH: 100 };
    this.transactions = [];
    this.isWhitelisted = false;
    this.restricted = false;
  }

  /**
   * Move `amount` of `asset` from this wallet to `toAddress`.
   */
  async transfer(toAddress, amount, asset = 'TOKEN') {
    if (this.restricted) {
      throw new Error(`Wallet ${this.address} is restricted`);
    }
    if ((this.balances[asset] || 0) < amount) {
      throw new Error(`Insufficient ${asset} balance on ${this.address}`);
    }
    this.balances[asset] -= amount;
    const tx = {
      from: this.address,
      to: toAddress,
      amount,
      asset,
      type: 'transfer',
      timestamp: new Date().toISOString(),
      hash: fakeTxHash()
    };
    this.transactions.push(tx);
    return { success: true, txHash: tx.hash, tx };
  }

  /**
   * Credit the wallet directly (used by Pool/Token on swap/mint outputs).
   */
  credit(asset, amount) {
    this.balances[asset] = (this.balances[asset] || 0) + amount;
  }

  /**
   * Debit the wallet directly (used by Pool on swap inputs).
   */
  debit(asset, amount) {
    if ((this.balances[asset] || 0) < amount) {
      throw new Error(`Insufficient ${asset} balance on ${this.address}`);
    }
    this.balances[asset] -= amount;
  }

  getBalance(asset) {
    return this.balances[asset] || 0;
  }

  setRestricted(restricted) {
    this.restricted = restricted;
  }

  setWhitelisted(flag) {
    this.isWhitelisted = flag;
  }

  getSummary() {
    return {
      address: this.address,
      balances: { ...this.balances },
      transactionCount: this.transactions.length,
      isWhitelisted: this.isWhitelisted,
      restricted: this.restricted
    };
  }
}

module.exports = SimulationWallet;
