// agents/tools/index.js
// Combined registry of all tools available to LLM agents. Each agent is
// configured with a subset of these tools (see agent definitions).

const stateTools = require('./stateTools');
const tokenTools = require('./tokenTools');
const liquidityTools = require('./liquidityTools');
const swapTools = require('./swapTools');

const ALL_TOOLS = [...stateTools, ...tokenTools, ...liquidityTools, ...swapTools];

const TOOLS_BY_NAME = ALL_TOOLS.reduce((acc, t) => {
  acc[t.name] = t;
  return acc;
}, {});

/**
 * Pick a subset of tools by name.
 * @param {string[]} names
 * @returns {Array<{name, description, input_schema, handler}>}
 */
function pickTools(names) {
  return names
    .map((n) => TOOLS_BY_NAME[n])
    .filter(Boolean);
}

/**
 * Convert tool definitions into the Anthropic API "tools" payload shape
 * (excludes the handler function).
 */
function toClaudeSchemas(tools) {
  return tools.map(({ name, description, input_schema }) => ({
    name,
    description,
    input_schema
  }));
}

/**
 * Run a single tool call. Returns whatever the handler returns (object).
 * On error, returns { error: message } so the LLM can recover.
 */
async function runTool(name, input, ctx) {
  const tool = TOOLS_BY_NAME[name];
  if (!tool) return { error: `Unknown tool: ${name}` };
  try {
    return await tool.handler(input || {}, ctx);
  } catch (err) {
    return { error: err.message || String(err) };
  }
}

module.exports = {
  ALL_TOOLS,
  TOOLS_BY_NAME,
  pickTools,
  toClaudeSchemas,
  runTool
};
