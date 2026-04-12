// utils/modeFactory.js
// Single place that decides whether to instantiate simulation or production
// classes. Every phase uses this factory so phase code stays identical
// regardless of mode.

const config = require('../config.json');
const logger = require('./logger');

const SimulationWallet = require('../modes/simulation/Wallet');
const SimulationPool = require('../modes/simulation/Pool');
const SimulationToken = require('../modes/simulation/Token');

// Production classes are required lazily so that running in simulation mode
// does not force ethers.js to be installed / reachable.
function loadProduction() {
  return {
    RealWallet: require('../modes/production/RealWallet'),
    RealPool: require('../modes/production/RealPool'),
    RealToken: require('../modes/production/RealToken'),
    Router: require('../modes/production/Router')
  };
}

class ModeFactory {
  constructor(overrideMode) {
    this.mode = overrideMode || config.MODE || 'simulation';
    logger.debug('modeFactory', `initialized in ${this.mode} mode`);
  }

  getMode() {
    return this.mode;
  }

  createWallet(address, privateKey = null) {
    if (this.mode === 'simulation') {
      return new SimulationWallet(address);
    }
    const { RealWallet } = loadProduction();
    return new RealWallet(address, privateKey, config.RPC_URL);
  }

  createPool(address) {
    if (this.mode === 'simulation') {
      return new SimulationPool(address);
    }
    const { RealPool } = loadProduction();
    return new RealPool(address, config.RPC_URL);
  }

  createToken(address, adminWallet) {
    if (this.mode === 'simulation') {
      return new SimulationToken(address, adminWallet);
    }
    const { RealToken } = loadProduction();
    return new RealToken(address, adminWallet, config.RPC_URL);
  }

  createRouter() {
    if (this.mode === 'simulation') {
      // Simulation mode routes swaps directly through SimulationPool, so
      // we return a thin shim that delegates to pool.swap().
      return {
        mode: 'simulation',
        async swap(pool, inputAsset, outputAsset, inputAmount, slippage) {
          return pool.swap(inputAsset, outputAsset, inputAmount, slippage);
        }
      };
    }
    const { Router } = loadProduction();
    return new Router(config.ROUTER_ADDRESS, config.RPC_URL);
  }
}

module.exports = ModeFactory;
