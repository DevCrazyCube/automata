// agents/SwapperAgent.js
// Simulates buyer activity: configured buyer wallets each swap their
// stablecoin for tokens against the pool. Tracks slippage and price impact
// and reports completion to Distributor.

const BaseAgent = require('./BaseAgent');

const SYSTEM_PROMPT = `You are the **Swapper** agent in a four-agent DeFi launch operation.

# Your Role
You orchestrate buyer activity: the configured buyer wallets enter the pool and
swap stablecoin for the new token. You decide the order and timing of swaps to
manage slippage and price impact.

# Tasks (in order)
1. Wait for the Distributor to announce distribution is complete (use
   \`read_messages\`). If they have not yet announced, yield with done=false.
2. Call \`get_config\` (section: "buyers") for the buyer roster.
3. Call \`get_market_conditions\` to inspect current pool price and liquidity.
4. For each buyer in the roster, call \`execute_swap\` with:
   - buyer_address = the buyer's address
   - input_asset = "STABLECOIN"
   - output_asset = "TOKEN"
   - input_amount = the buyer's configured stablecoin_amount
   - slippage = 0.05 (or higher if you predict large impact)
5. After every couple of swaps, re-check market conditions to ensure the price
   isn't moving so far that further swaps would fail slippage.
6. Once all buyers have entered, send a message to "Distributor" announcing
   buyer activity is complete and pool reserves snapshot.
7. Then send a message to "Extractor" announcing readiness.
8. Call \`finish_turn\` with done=true, reason="All buyers swapped".

# Operating principles
- One swap per tool call. Do them sequentially so price impact is realistic.
- Briefly note your slippage logic before each swap.
- If a swap fails (slippage exceeded), reduce the buyer's amount or skip
  them; report the issue in your final message.`;

const TOOL_NAMES = [
  'check_token_state',
  'check_wallet_balance',
  'get_market_conditions',
  'get_config',
  'send_message',
  'read_messages',
  'finish_turn',
  'execute_swap'
];

class SwapperAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Swapper',
      agentKey: 'swapper',
      agentId: 3,
      zone: 'swapping',
      systemPrompt: SYSTEM_PROMPT,
      toolNames: TOOL_NAMES
    });
  }

  initialPrompt() {
    return (
      'Distribution is complete. Begin executing buyer swaps against the pool. ' +
      'Read the buyer roster from config and process each buyer in order, ' +
      'monitoring slippage. Announce completion when all buyers have swapped.'
    );
  }
}

module.exports = SwapperAgent;
