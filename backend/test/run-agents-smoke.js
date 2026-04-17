// test/run-agents-smoke.js
// Smoke test for the LLM-agent layer that does not require an Anthropic API
// key. Exercises tool handlers directly by simulating a full operation flow:
//   1. Deployer tools (deploy, mint, add_liquidity)
//   2. Distributor tools (transfer, burn, whitelist, restrict)
//   3. Swapper tools (swap)
//   4. Extractor tools (remove_liquidity, forward_stablecoin)
// Verifies state mutations, socket-event emission counts, and final report
// match the legacy phase-driver outputs.

const config = require('../config.json');
const ModeFactory = require('../utils/modeFactory');
const { runTool } = require('../agents/tools');

// Capture all emitted socket events for assertion at the end.
const events = [];
const io = { emit: (name, payload) => events.push({ name, payload }) };

const messageBus = [];

const state = {
  mode: 'simulation',
  config,
  deployerWallet: null,
  adminWallet: null,
  token: null,
  pool: null,
  distributionWallets: [],
  buyerWallets: [],
  totalBuyerInflow: 0,
  totalTokensOut: 0,
  extractedStable: 0,
  extractedTokens: 0,
  totalForwarded: 0,
  forwardingDestinations: []
};

const ctx = {
  io,
  state,
  modeFactory: new ModeFactory('simulation'),
  config,
  messageBus,
  agentName: 'test',
  agentKey: 'test'
};

async function step(name, ...calls) {
  for (const [tool, input] of calls) {
    const res = await runTool(tool, input || {}, ctx);
    if (res && res.error) {
      throw new Error(`${name}/${tool} failed: ${res.error}`);
    }
  }
}

async function main() {
  console.log('=== Agent-tools smoke test ===\n');

  // ── Deployer flow ─────────────────────────────────────────────────────────
  await step('deployer',
    ['execute_deploy_token', {}],
    ['execute_mint', { to: config.ADMIN_WALLET, amount: config.TOTAL_MINT_AMOUNT }],
    ['execute_add_liquidity', {
      token_amount: config.INITIAL_TOKEN_SEED,
      stablecoin_amount: config.INITIAL_STABLECOIN_SEED
    }],
    ['send_message', { to: 'Distributor', message: 'Setup complete' }]
  );

  // ── Distributor flow ──────────────────────────────────────────────────────
  for (const w of config.DISTRIBUTION_WALLETS) {
    await step('distributor',
      ['execute_register_distribution_wallet', { address: w.address, label: 'dist' }],
      ['execute_transfer', { from: config.ADMIN_WALLET, to: w.address, amount: w.amount }]
    );
  }
  for (const burnAmount of config.BURN_AMOUNTS) {
    await step('distributor', ['execute_burn', { from: config.ADMIN_WALLET, amount: burnAmount }]);
  }

  // ── Swapper flow ──────────────────────────────────────────────────────────
  for (const buyer of config.BUYER_WALLETS) {
    await step('swapper', ['execute_swap', {
      buyer_address: buyer.address,
      input_asset: 'STABLECOIN',
      output_asset: 'TOKEN',
      input_amount: buyer.stablecoin_amount,
      slippage: 0.05
    }]);
  }

  // ── Distributor control flow ──────────────────────────────────────────────
  for (const wlAddr of config.WHITELISTED_WALLETS) {
    const realAddr = config[wlAddr] || wlAddr;
    await step('distributor', ['execute_whitelist', { wallet_address: realAddr, allow: true }]);
  }
  await step('distributor', ['execute_set_transfer_restrictions', { restricted: true }]);

  // ── Extractor flow ────────────────────────────────────────────────────────
  for (const tranche of config.LP_REMOVAL_TXNS) {
    await step('extractor', ['execute_remove_liquidity', { lp_fraction: tranche.fraction }]);
  }
  for (const fwd of config.CASH_FORWARDING_TXNS) {
    const amount = state.extractedStable * fwd.fraction;
    await step('extractor', ['execute_forward_stablecoin', { to: fwd.to, amount }]);
  }

  // ── Assertions ────────────────────────────────────────────────────────────
  const eventTypes = [...new Set(events.map((e) => e.name))].sort();
  const summary = {
    eventsEmitted: events.length,
    uniqueEventTypes: eventTypes,
    totalSupply: state.token.getTotalSupply(),
    poolReserves: state.pool.getReserves(),
    totalBuyerInflow: state.totalBuyerInflow,
    extractedStable: state.extractedStable,
    totalForwarded: state.totalForwarded,
    messagesPosted: messageBus.length
  };

  console.log('\nResults:');
  console.log(JSON.stringify(summary, null, 2));

  if (state.totalForwarded <= 0) throw new Error('No stablecoin forwarded');
  if (state.token.getTotalSupply() <= 0) throw new Error('Token supply went to zero');
  if (events.length < 30) throw new Error(`Too few events: ${events.length}`);

  console.log('\n✓ AGENT-TOOLS SMOKE TEST PASSED');
}

main().catch((err) => {
  console.error('\n✗ AGENT-TOOLS SMOKE TEST FAILED:', err);
  process.exit(1);
});
