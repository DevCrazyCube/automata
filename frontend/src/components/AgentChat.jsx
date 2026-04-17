// components/AgentChat.jsx
// Live feed of agent reasoning, tool calls, and inter-agent messages.
// Each entry is colour-coded by agent and tagged by type so operators can
// follow the LLM-driven decision flow at a glance.

const AGENT_COLOR = {
  deployer:    'text-red-300',
  distributor: 'text-teal-300',
  swapper:     'text-yellow-300',
  extractor:   'text-purple-300',
  system:      'text-gray-400'
};

const AGENT_BG = {
  deployer:    'bg-red-900/30 border-red-700/50',
  distributor: 'bg-teal-900/30 border-teal-700/50',
  swapper:     'bg-yellow-900/30 border-yellow-700/50',
  extractor:   'bg-purple-900/30 border-purple-700/50',
  system:      'bg-gray-900/30 border-gray-700/50'
};

const KIND_LABEL = {
  reasoning: 'thinks',
  action:    'calls',
  result:    'result',
  message:   '→',
  yielded:   'yields',
  error:     'ERROR'
};

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour12: false });
}

function AgentChat({ entries }) {
  const reversed = [...entries].slice(-200);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2">
        Agent Activity
      </h2>
      <div className="flex-1 overflow-y-auto border border-gray-800 rounded bg-gray-950 p-2 text-xs space-y-1.5 font-mono">
        {reversed.length === 0 && (
          <div className="text-gray-600 italic">
            No agent activity yet. Click Start Operation to launch the LLM agents.
          </div>
        )}
        {reversed.map((e, idx) => {
          const color = AGENT_COLOR[e.agent] || AGENT_COLOR.system;
          const bg = AGENT_BG[e.agent] || AGENT_BG.system;
          return (
            <div
              key={`${e.timestamp}-${idx}-${e.kind}`}
              className={`px-2 py-1 rounded border ${bg}`}
            >
              <div className="flex gap-2 items-baseline">
                <span className="text-gray-600 shrink-0 text-[10px]">
                  {formatTime(e.timestamp)}
                </span>
                <span className={`${color} font-bold uppercase shrink-0`}>
                  {e.agent || 'system'}
                </span>
                <span className="text-gray-500 shrink-0 text-[10px]">
                  {KIND_LABEL[e.kind] || e.kind}
                </span>
                {e.kind === 'message' && e.to && (
                  <span className={`${AGENT_COLOR[e.to] || 'text-gray-400'} font-bold text-[10px]`}>
                    {e.to}
                  </span>
                )}
                {e.kind === 'action' && e.tool && (
                  <span className="text-cyan-300 text-[10px]">{e.tool}</span>
                )}
              </div>
              {e.text && (
                <div className="mt-0.5 text-gray-300 whitespace-pre-wrap leading-snug pl-1">
                  {e.text}
                </div>
              )}
              {e.kind === 'action' && e.input && Object.keys(e.input).length > 0 && (
                <div className="mt-0.5 text-gray-500 pl-1 text-[10px] truncate">
                  {JSON.stringify(e.input)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AgentChat;
