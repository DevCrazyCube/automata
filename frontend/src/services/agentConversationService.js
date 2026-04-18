// services/agentConversationService.js
// Generates LLM-based conversations for agents using Claude API.

const AGENT_PERSONALITIES = {
  deployer: 'energetic token deployer, focuses on contract security',
  distributor: 'careful strategist, thinks about distribution fairness',
  swapper: 'quick trader, likes arbitrage opportunities',
  extractor: 'analytical LP extractor, optimizes liquidity',
};

const CONVERSATION_CONTEXTS = [
  'discussing recent token price movements',
  'planning the next DeFi strategy',
  'gossiping about market conditions',
  'sharing code reviews and ideas',
  'joking about gas prices',
  'talking about work-life balance',
];

export async function generateAgentConversation(
  agent1Name,
  agent2Name,
  currentGameState = {}
) {
  try {
    const context = CONVERSATION_CONTEXTS[
      Math.floor(Math.random() * CONVERSATION_CONTEXTS.length)
    ];
    const personality1 = AGENT_PERSONALITIES[agent1Name] || 'helpful colleague';
    const personality2 = AGENT_PERSONALITIES[agent2Name] || 'helpful colleague';

    const prompt = `You are two DeFi office workers having a casual conversation. Keep it SHORT (1-2 sentences max per person).

Agent 1 (${agent1Name}): ${personality1}
Agent 2 (${agent2Name}): ${personality2}
Context: They are ${context}
Game State: ${JSON.stringify(currentGameState)}

Generate a brief, natural 2-turn conversation. Format:
Agent1: [short response]
Agent2: [short response]

Remember: Keep responses very brief and natural!`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': localStorage.getItem('anthropic_api_key') || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Failed to generate conversation:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse the two-line response
    const lines = text.split('\n').filter((l) => l.trim());
    return {
      agent1: agent1Name,
      agent2: agent2Name,
      line1: lines[0] || `Hi ${agent2Name}!`,
      line2: lines[1] || 'Hey!',
    };
  } catch (error) {
    console.warn('Conversation generation failed:', error);
    return null;
  }
}

export async function generatePlayerAgentChat(
  agentName,
  playerMessage,
  gameState = {}
) {
  try {
    const personality = AGENT_PERSONALITIES[agentName] || 'helpful assistant';

    const prompt = `You are ${agentName}, a DeFi office worker. ${personality}.

The player says: "${playerMessage}"

Respond in character, briefly and naturally (1-2 sentences). Be friendly but professional.
Game state: ${JSON.stringify(gameState)}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': localStorage.getItem('anthropic_api_key') || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Failed to generate agent response:', response.status);
      return `[${agentName} nods thoughtfully]`;
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.warn('Agent response generation failed:', error);
    return `[${agentName} smiles politely]`;
  }
}

// Fallback conversations for when API is unavailable
const FALLBACK_CONVERSATIONS = [
  { agent1: 'deployer', agent2: 'distributor', line1: 'How\'s the token distribution looking?', line2: 'Pretty solid so far, gas prices are crazy today though!' },
  { agent1: 'swapper', agent2: 'extractor', line1: 'Any good arbitrage opportunities lately?', line2: 'Not really, market\'s pretty efficient right now.' },
  { agent1: 'deployer', agent2: 'swapper', line1: 'Just deployed the new contract!', line2: 'Nice! Let me test it out with a swap.' },
  { agent1: 'distributor', agent2: 'extractor', line1: 'How do you manage LP positions?', line2: 'Usually monitor the ratios and rebalance daily.' },
];

export function getFallbackConversation() {
  return FALLBACK_CONVERSATIONS[
    Math.floor(Math.random() * FALLBACK_CONVERSATIONS.length)
  ];
}
