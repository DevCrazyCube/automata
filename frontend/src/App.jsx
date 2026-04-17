// App.jsx
// Main React app. Manages operation state, socket listeners, and renders
// the game scene + UI controls + sidebar (agent chat + transactions).

import { useState, useEffect } from 'react';
import PhaserScene from './scenes/PhaserScene.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import AgentChat from './components/AgentChat.jsx';
import TransactionLog from './components/TransactionLog.jsx';
import FinalReport from './components/FinalReport.jsx';
import socket from './services/socketService.js';

const MAX_AGENT_ENTRIES = 300;
const MAX_TX_LOGS = 100;

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [mode, setMode] = useState('—');
  const [driver, setDriver] = useState('agents');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [agentEntries, setAgentEntries] = useState([]);
  const [logs, setLogs] = useState([]);
  const [finalReport, setFinalReport] = useState(null);

  // ── Socket listeners ────────────────────────────────────────────────────

  useEffect(() => {
    const pushAgentEntry = (entry) =>
      setAgentEntries((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_AGENT_ENTRIES
          ? next.slice(next.length - MAX_AGENT_ENTRIES)
          : next;
      });

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onModeInfo = (data) => setMode(data.mode);
    const onDriverInfo = (data) => setDriver(data.driver);

    const onOperationStarted = (data) => {
      setIsRunning(true);
      setIsPaused(false);
      setAgentEntries([]);
      setLogs([]);
      setFinalReport(null);
      if (data?.driver) setDriver(data.driver);
    };

    const onTransactionLog = (data) => {
      setLogs((prev) => [data, ...prev].slice(0, MAX_TX_LOGS));
    };

    const onAgentThinking = (data) =>
      pushAgentEntry({
        kind: 'reasoning',
        agent: data.agent,
        text: `(prompt) ${data.prompt}`,
        timestamp: data.timestamp
      });

    const onAgentReasoning = (data) =>
      pushAgentEntry({
        kind: 'reasoning',
        agent: data.agent,
        text: data.text,
        timestamp: data.timestamp
      });

    const onAgentAction = (data) =>
      pushAgentEntry({
        kind: 'action',
        agent: data.agent,
        tool: data.tool,
        input: data.input,
        timestamp: data.timestamp
      });

    const onAgentMessage = (data) =>
      pushAgentEntry({
        kind: 'message',
        agent: (data.from || '').toLowerCase(),
        to: (data.to || '').toLowerCase(),
        text: data.message,
        timestamp: data.timestamp
      });

    const onAgentYielded = (data) =>
      pushAgentEntry({
        kind: 'yielded',
        agent: data.agent,
        text: `${data.reason}${data.done ? ' [done]' : ''}`,
        timestamp: data.timestamp
      });

    const onAgentError = (data) =>
      pushAgentEntry({
        kind: 'error',
        agent: 'system',
        text: `Agent ${data.agent} error: ${data.error}`,
        timestamp: data.timestamp
      });

    const onOperationComplete = (data) => {
      setIsRunning(false);
      setIsPaused(false);
      setFinalReport(data);
    };

    const onOperationError = (data) => {
      setIsRunning(false);
      setIsPaused(false);
      pushAgentEntry({
        kind: 'error',
        agent: 'system',
        text: data.error,
        timestamp: data.timestamp || new Date().toISOString()
      });
    };

    const onOperationPaused = () => setIsPaused(true);
    const onOperationResumed = () => setIsPaused(false);
    const onOperationStopped = () => {
      setIsRunning(false);
      setIsPaused(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('mode_info', onModeInfo);
    socket.on('driver_info', onDriverInfo);
    socket.on('operation_started', onOperationStarted);
    socket.on('transaction_log', onTransactionLog);
    socket.on('agent_thinking', onAgentThinking);
    socket.on('agent_reasoning', onAgentReasoning);
    socket.on('agent_action', onAgentAction);
    socket.on('agent_message', onAgentMessage);
    socket.on('agent_yielded', onAgentYielded);
    socket.on('agent_error', onAgentError);
    socket.on('operation_complete', onOperationComplete);
    socket.on('operation_error', onOperationError);
    socket.on('operation_paused', onOperationPaused);
    socket.on('operation_resumed', onOperationResumed);
    socket.on('operation_stopped', onOperationStopped);

    socket.emit('get_mode_info');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('mode_info', onModeInfo);
      socket.off('driver_info', onDriverInfo);
      socket.off('operation_started', onOperationStarted);
      socket.off('transaction_log', onTransactionLog);
      socket.off('agent_thinking', onAgentThinking);
      socket.off('agent_reasoning', onAgentReasoning);
      socket.off('agent_action', onAgentAction);
      socket.off('agent_message', onAgentMessage);
      socket.off('agent_yielded', onAgentYielded);
      socket.off('agent_error', onAgentError);
      socket.off('operation_complete', onOperationComplete);
      socket.off('operation_error', onOperationError);
      socket.off('operation_paused', onOperationPaused);
      socket.off('operation_resumed', onOperationResumed);
      socket.off('operation_stopped', onOperationStopped);
    };
  }, []);

  // ── Event handlers ──────────────────────────────────────────────────────

  const handleStart = () => socket.emit('start_operation', {});
  const handlePause = () => socket.emit('pause_operation', {});
  const handleResume = () => socket.emit('resume_operation', {});
  const handleStop = () => socket.emit('stop_operation', {});

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Top bar with driver/mode badges */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-950 border-b border-gray-800 text-xs font-mono">
        <span className="text-gray-400">AUTOMATA</span>
        <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-300">mode: {mode}</span>
        <span
          className={`px-2 py-0.5 rounded ${
            driver === 'agents' ? 'bg-emerald-900 text-emerald-300' : 'bg-gray-800 text-gray-300'
          }`}
        >
          driver: {driver}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400' : 'bg-red-400'
            }`}
          />
          {isConnected ? 'connected' : 'disconnected'}
        </span>
      </div>

      {/* Main content area: game on left, sidebar on right */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Game area */}
        <div className="flex-1 flex flex-col">
          <PhaserScene onGameReady={() => {}} />
          <ControlPanel
            isRunning={isRunning}
            isPaused={isPaused}
            isConnected={isConnected}
            mode={mode}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
          />
        </div>

        {/* Sidebar: agent chat + transactions */}
        <div className="w-96 border-l border-gray-700 bg-gray-950 p-4 overflow-hidden flex flex-col gap-3">
          <AgentChat entries={agentEntries} />
          <TransactionLog logs={logs} />
        </div>
      </div>

      {/* Final report modal */}
      {finalReport && (
        <FinalReport report={finalReport} onDismiss={() => setFinalReport(null)} />
      )}
    </div>
  );
}

export default App;
