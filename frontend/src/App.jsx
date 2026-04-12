// App.jsx
// Main React app. Manages operation state, socket listeners, and renders
// the game scene + UI controls + sidebar.

import { useState, useEffect } from 'react';
import PhaserScene from './scenes/PhaserScene.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import PhaseProgress from './components/PhaseProgress.jsx';
import TransactionLog from './components/TransactionLog.jsx';
import FinalReport from './components/FinalReport.jsx';
import socket from './services/socketService.js';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [mode, setMode] = useState('—');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phases, setPhases] = useState({});
  const [logs, setLogs] = useState([]);
  const [finalReport, setFinalReport] = useState(null);

  // ── Socket listeners ────────────────────────────────────────────────────

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onModeInfo = (data) => {
      setMode(data.mode);
    };

    const onOperationStarted = () => {
      setIsRunning(true);
      setIsPaused(false);
      setPhases({});
      setLogs([]);
      setFinalReport(null);
    };

    const onPhaseProgress = (data) => {
      setPhases((prev) => ({
        ...prev,
        [data.phase]: data.progress
      }));
    };

    const onTransactionLog = (data) => {
      setLogs((prev) => {
        const newLogs = [data, ...prev];
        return newLogs.slice(0, 100); // Keep last 100
      });
    };

    const onOperationComplete = (data) => {
      setIsRunning(false);
      setIsPaused(false);
      setFinalReport(data);
    };

    const onOperationError = (data) => {
      setIsRunning(false);
      setIsPaused(false);
      console.error('[socket] operation error:', data);
    };

    const onOperationPaused = () => {
      setIsPaused(true);
    };

    const onOperationResumed = () => {
      setIsPaused(false);
    };

    const onOperationStopped = () => {
      setIsRunning(false);
      setIsPaused(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('mode_info', onModeInfo);
    socket.on('operation_started', onOperationStarted);
    socket.on('phase_progress', onPhaseProgress);
    socket.on('transaction_log', onTransactionLog);
    socket.on('operation_complete', onOperationComplete);
    socket.on('operation_error', onOperationError);
    socket.on('operation_paused', onOperationPaused);
    socket.on('operation_resumed', onOperationResumed);
    socket.on('operation_stopped', onOperationStopped);

    // Trigger initial mode info request
    socket.emit('get_mode_info');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('mode_info', onModeInfo);
      socket.off('operation_started', onOperationStarted);
      socket.off('phase_progress', onPhaseProgress);
      socket.off('transaction_log', onTransactionLog);
      socket.off('operation_complete', onOperationComplete);
      socket.off('operation_error', onOperationError);
      socket.off('operation_paused', onOperationPaused);
      socket.off('operation_resumed', onOperationResumed);
      socket.off('operation_stopped', onOperationStopped);
    };
  }, []);

  // ── Event handlers ──────────────────────────────────────────────────────

  const handleStart = () => {
    socket.emit('start_operation', {});
  };

  const handlePause = () => {
    socket.emit('pause_operation', {});
  };

  const handleResume = () => {
    socket.emit('resume_operation', {});
  };

  const handleStop = () => {
    socket.emit('stop_operation', {});
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
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

        {/* Sidebar: phases + logs */}
        <div className="w-80 border-l border-gray-700 bg-gray-950 p-4 overflow-y-auto flex flex-col">
          <PhaseProgress phases={phases} />
          <hr className="my-4 border-gray-700" />
          <TransactionLog logs={logs} />
        </div>
      </div>

      {/* Final report modal */}
      {finalReport && (
        <FinalReport
          report={finalReport}
          onDismiss={() => setFinalReport(null)}
        />
      )}
    </div>
  );
}

export default App;
