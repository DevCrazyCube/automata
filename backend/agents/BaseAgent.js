// agents/BaseAgent.js
// Abstract LLM-powered agent. Runs a tool-use loop with Claude:
//   1. Send system prompt + conversation history + available tools
//   2. Receive Claude's response (text + tool_use blocks)
//   3. Execute each tool_use, capture result
//   4. Append tool_result to conversation, loop until stop_reason == 'end_turn'
//
// Agents are persistent across turns: their `messages` array grows,
// allowing context continuity from one decision to the next. Prompt caching
// is applied to the system prompt (stable across turns) for cost efficiency.

const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');
const { pickTools, toClaudeSchemas, runTool } = require('./tools');

const DEFAULT_MODEL = process.env.AGENT_MODEL || 'claude-sonnet-4-6';
const MAX_TOOL_ITERATIONS = 12;       // safety cap per turn
const MAX_OUTPUT_TOKENS = 2048;

class BaseAgent {
  /**
   * @param {object} opts
   * @param {string} opts.name        Display name (e.g. "Deployer")
   * @param {string} opts.agentKey    Lowercase key (e.g. "deployer")
   * @param {number} opts.agentId     Numeric id (1-4)
   * @param {string} opts.zone        Office zone label (e.g. "deployment")
   * @param {string} opts.systemPrompt
   * @param {string[]} opts.toolNames Names of tools this agent can use
   */
  constructor({ name, agentKey, agentId, zone, systemPrompt, toolNames }) {
    this.name = name;
    this.agentKey = agentKey;
    this.agentId = agentId;
    this.zone = zone;
    this.systemPrompt = systemPrompt;
    this.toolNames = toolNames;
    this.tools = pickTools(toolNames);
    this.messages = [];
    this.client = null;
    this.done = false;
    this.lastYieldReason = null;
    this.actionCount = 0;
  }

  /** Lazy-init the Anthropic client (so missing key only fails when used). */
  _getClient() {
    if (this.client) return this.client;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY environment variable is not set. ' +
        'Set it in your shell or in backend/.env to enable LLM agents.'
      );
    }
    this.client = new Anthropic({ apiKey });
    return this.client;
  }

  /**
   * Execute a single decision turn. Sends the supplied user-prompt, runs the
   * tool-use loop until Claude finishes, and emits events along the way.
   *
   * @param {string} userPrompt  Human message kicking off this turn
   * @param {object} ctx         Shared run context (state, modeFactory, io, config, messageBus, agentName, agentKey)
   * @returns {Promise<object>}  { stopReason, finalText, toolCalls[] }
   */
  async runTurn(userPrompt, ctx) {
    const client = this._getClient();
    const { io } = ctx;

    // Inject identity + key into ctx so tools (send_message, etc) know who's calling.
    const turnCtx = { ...ctx, agentName: this.name, agentKey: this.agentKey };

    // Append the human message that starts this turn.
    this.messages.push({ role: 'user', content: userPrompt });
    io.emit('agent_thinking', {
      agent: this.agentKey,
      agentId: this.agentId,
      prompt: userPrompt.slice(0, 200),
      timestamp: new Date().toISOString()
    });

    const toolCalls = [];
    let finalText = '';
    let stopReason = null;

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
      const response = await this._invokeClaude(client);
      stopReason = response.stop_reason;

      // Append assistant turn (full content array, including text + tool_use blocks)
      this.messages.push({ role: 'assistant', content: response.content });

      // Collect text + tool_use blocks
      const textBlocks = response.content.filter((b) => b.type === 'text');
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');

      for (const tb of textBlocks) {
        if (tb.text && tb.text.trim()) {
          finalText += (finalText ? '\n' : '') + tb.text.trim();
          io.emit('agent_reasoning', {
            agent: this.agentKey,
            agentId: this.agentId,
            text: tb.text.trim(),
            timestamp: new Date().toISOString()
          });
        }
      }

      // No tool calls → end of turn
      if (toolUseBlocks.length === 0 || stopReason === 'end_turn') {
        break;
      }

      // Execute every tool_use, build matching tool_result blocks
      const toolResultBlocks = [];
      for (const tu of toolUseBlocks) {
        io.emit('agent_action', {
          agent: this.agentKey,
          agentId: this.agentId,
          tool: tu.name,
          input: tu.input,
          timestamp: new Date().toISOString()
        });

        const result = await runTool(tu.name, tu.input, turnCtx);
        toolCalls.push({ name: tu.name, input: tu.input, result });
        this.actionCount += 1;

        // Detect special "finish_turn" sentinel
        if (tu.name === 'finish_turn') {
          this.lastYieldReason = tu.input?.reason || null;
          if (tu.input?.done) this.done = true;
        }

        toolResultBlocks.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(result).slice(0, 4000) // cap for token safety
        });

        io.emit('agent_action_result', {
          agent: this.agentKey,
          agentId: this.agentId,
          tool: tu.name,
          result,
          timestamp: new Date().toISOString()
        });
      }

      // Append tool_results in a single user message
      this.messages.push({ role: 'user', content: toolResultBlocks });

      // If finish_turn was called, exit the loop after sending the result back
      if (toolUseBlocks.some((b) => b.name === 'finish_turn')) {
        break;
      }
    }

    return { stopReason, finalText, toolCalls, done: this.done };
  }

  /** Single Claude API call. Returns the raw response. */
  async _invokeClaude(client) {
    try {
      return await client.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: [
          {
            type: 'text',
            text: this.systemPrompt,
            cache_control: { type: 'ephemeral' }
          }
        ],
        tools: toClaudeSchemas(this.tools),
        messages: this.messages
      });
    } catch (err) {
      logger.error(this.agentKey, `Claude API error: ${err.message}`);
      throw err;
    }
  }

  /** Wipe conversation history (e.g. between operations). */
  reset() {
    this.messages = [];
    this.done = false;
    this.lastYieldReason = null;
    this.actionCount = 0;
  }
}

module.exports = BaseAgent;
