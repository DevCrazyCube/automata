// App.jsx
// Full-screen immersive office game with hamburger menu.
// Agents act autonomously. Click agents to interact. Menu for stats/settings.

import { useState, useEffect } from 'react';
import PhaserScene from './scenes/PhaserScene.jsx';
import HamburgerMenu from './components/HamburgerMenu.jsx';
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
  const [gameReady, setGameReady] = useState(false);

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
    <div className="w-screen h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Full-screen game */}
      <PhaserScene onGameReady={() => setGameReady(true)} />

      {/* Hamburger menu overlay */}
      <HamburgerMenu
        isConnected={isConnected}
        mode={mode}
        driver={driver}
        isRunning={isRunning}
        isPaused={isPaused}
        agentEntries={agentEntries}
        logs={logs}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
      />
    </div>
  );
}

export default App;
