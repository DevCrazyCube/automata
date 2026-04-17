// agents/DistributorAgent.js
// Responsible for distribution + control: transfer tokens to distribution
// wallets per config, burn excess supply, then enable transfer restrictions
// and whitelist privileged wallets.

const BaseAgent = require('./BaseAgent');

const SYSTEM_PROMPT = `You are the **Distributor** agent in a four-agent DeFi launch operation.

# Your Role
After the Deployer completes setup, you allocate the remaining supply to the
configured distribution wallets, burn any excess that should be removed from
circulation, then lock the supply down with a whitelist before the Swapper
starts buyer activity.

# Tasks (in order)
1. Wait until the Deployer has announced setup complete (use \`read_messages\`).
2. Call \`get_config\` (section: "distribution") to retrieve the list of
   distribution wallets and burn amounts.
3. For each distribution wallet, call \`execute_register_distribution_wallet\`
   then \`execute_transfer\` from the admin wallet (use \`get_config\` "supply"
   for ADMIN_WALLET; pull the address from check_token_state if needed).
4. For each burn amount in config, call \`execute_burn\` from the admin wallet.
5. After distribution + burns are done, send a message to "Swapper" telling
   them buyer activity may begin.
6. Stay available — when the Swapper later announces it is done, you must
   apply control: whitelist the configured wallets, then enable transfer
   restrictions, then announce that control is complete to "Extractor".
7. After both responsibilities are finished, call \`finish_turn\` with done=true.

# Operating principles
- Use \`check_token_state\` after each transfer/burn to verify supply numbers.
- Be conservative — never burn more than the config specifies.
- Address other agents by name in messages.
- If the Swapper has not yet announced completion, yield with done=false (a
  later turn will resume you).`;

const TOOL_NAMES = [
  'check_token_state',
  'check_wallet_balance',
  'get_config',
  'send_message',
  'read_messages',
  'finish_turn',
  'execute_transfer',
  'execute_burn',
  'execute_whitelist',
  'execute_set_transfer_restrictions',
  'execute_register_distribution_wallet'
];

class DistributorAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Distributor',
      agentKey: 'distributor',
      agentId: 2,
      zone: 'distribution',
      systemPrompt: SYSTEM_PROMPT,
      toolNames: TOOL_NAMES
    });
  }

  initialPrompt() {
    return (
      'The Deployer has finished initial setup. Read recent messages and begin ' +
      'distribution: transfer tokens to the configured distribution wallets, ' +
      'burn any excess per config, then notify the Swapper. Stay alert for the ' +
      'Swapper completing buyer activity so you can apply transfer restrictions.'
    );
  }
}

module.exports = DistributorAgent;
