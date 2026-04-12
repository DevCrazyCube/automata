// components/ControlPanel.jsx
// Start / Pause / Resume / Stop controls plus a connection indicator.

function ControlPanel({ isRunning, isPaused, isConnected, mode, onStart, onPause, onResume, onStop }) {
  const btn = 'px-4 py-2 rounded font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 border-t border-gray-700 bg-gray-900">
      <button
        type="button"
        className={`${btn} bg-emerald-600 hover:bg-emerald-500 text-white`}
        onClick={onStart}
        disabled={!isConnected || isRunning}
      >
        ▶ Start Operation
      </button>

      {isRunning && !isPaused && (
        <button
          type="button"
          className={`${btn} bg-yellow-600 hover:bg-yellow-500 text-white`}
          onClick={onPause}
        >
          ❚❚ Pause
        </button>
      )}

      {isRunning && isPaused && (
        <button
          type="button"
          className={`${btn} bg-blue-600 hover:bg-blue-500 text-white`}
          onClick={onResume}
        >
          ▶ Resume
        </button>
      )}

      <button
        type="button"
        className={`${btn} bg-red-600 hover:bg-red-500 text-white`}
        onClick={onStop}
        disabled={!isRunning}
      >
        ■ Stop
      </button>

      <div className="ml-auto flex items-center gap-4 text-xs font-mono">
        <span className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-500'}`}
          />
          {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
        <span className="px-2 py-1 rounded bg-gray-800 text-gray-300 uppercase">
          {mode || '—'}
        </span>
      </div>
    </div>
  );
}

export default ControlPanel;
