// components/HamburgerMenu.jsx
// Game-style centered popup. Gear icon (bottom-right of screen) toggles a
// centered modal with pixel-art styling: 2px borders, dark bg, mono font.

import { useState } from 'react';

function HamburgerMenu({
  isConnected,
  mode,
  driver,
  isRunning,
  isPaused,
  agentEntries,
  logs,
  onStart,
  onPause,
  onResume,
  onStop,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('control');

  const countTxs = logs.length;
  const totalMinted = logs.reduce((sum, log) => sum + (log.amount || 0), 0);
  const actionCount = agentEntries.filter((e) => e.kind === 'action').length;

  return (
    <>
      {/* Gear / menu toggle (bottom-right, framed like a game HUD button) */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 flex items-center justify-center text-2xl font-mono text-white bg-[#1a1d24] hover:bg-[#242832] border-2 border-[#4a5568] shadow-[0_0_0_2px_#0b0d11] transition-colors"
        style={{ imageRendering: 'pixelated' }}
      >
        ⚙
      </button>

      {/* Status badge (top-right) — always visible */}
      <div
        className="fixed top-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-[#1a1d24] border-2 border-[#4a5568] font-mono text-xs text-white shadow-[0_0_0_2px_#0b0d11]"
      >
        <div className={`w-2 h-2 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
        <span>{isRunning ? (isPaused ? 'PAUSED' : 'RUNNING') : 'IDLE'}</span>
      </div>

      {/* Quick start button (top-left) */}
      {!isRunning && (
        <button
          onClick={onStart}
          disabled={!isConnected}
          className="fixed top-4 left-4 z-30 px-4 py-1.5 bg-[#2a7a3a] hover:bg-[#348848] disabled:bg-[#3a3f4a] disabled:text-gray-500 border-2 border-[#4a5568] text-white font-mono text-xs shadow-[0_0_0_2px_#0b0d11] transition-colors"
        >
          ▶ START
        </button>
      )}
      {isRunning && (
        <div className="fixed top-4 left-4 z-30 flex gap-2">
          <button
            onClick={isPaused ? onResume : onPause}
            className="px-3 py-1.5 bg-[#2d3748] hover:bg-[#4a5568] border-2 border-[#4a5568] text-white font-mono text-xs shadow-[0_0_0_2px_#0b0d11]"
          >
            {isPaused ? '▶ RESUME' : '❚❚ PAUSE'}
          </button>
          <button
            onClick={onStop}
            className="px-3 py-1.5 bg-[#7a2a2a] hover:bg-[#883434] border-2 border-[#4a5568] text-white font-mono text-xs shadow-[0_0_0_2px_#0b0d11]"
          >
            ■ STOP
          </button>
        </div>
      )}

      {/* Centered modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div
            className="relative w-[520px] max-h-[80vh] bg-[#0f1115] border-4 border-[#4a5568] shadow-[0_0_0_4px_#0b0d11,0_24px_60px_rgba(0,0,0,0.6)] flex flex-col"
            style={{ imageRendering: 'pixelated' }}
          >
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#1a1d24] border-b-4 border-[#4a5568]">
              <h1 className="text-base font-mono font-bold text-white tracking-widest">
                ▶ AUTOMATA
              </h1>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="w-7 h-7 flex items-center justify-center text-white bg-[#7a2a2a] hover:bg-[#883434] border-2 border-[#4a5568] font-mono text-xs"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-4 pt-3 pb-2 bg-[#12141a] border-b-2 border-[#4a5568]">
              {['control', 'stats', 'settings', 'wallet'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border-2 transition-colors ${
                    activeTab === tab
                      ? 'bg-[#2d3748] text-emerald-300 border-emerald-500'
                      : 'bg-[#1a1d24] text-gray-400 hover:text-white border-[#4a5568]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 font-mono text-sm text-gray-200">
              {activeTab === 'control' && (
                <ControlTab
                  isRunning={isRunning}
                  isPaused={isPaused}
                  isConnected={isConnected}
                  mode={mode}
                  driver={driver}
                  onStart={onStart}
                  onPause={onPause}
                  onResume={onResume}
                  onStop={onStop}
                />
              )}
              {activeTab === 'stats' && (
                <StatsTab
                  totalMinted={totalMinted}
                  countTxs={countTxs}
                  actionCount={actionCount}
                  eventCount={agentEntries.length}
                  logs={logs}
                />
              )}
              {activeTab === 'settings' && <SettingsTab />}
              {activeTab === 'wallet' && <WalletTab isConnected={isConnected} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PanelCard({ title, children }) {
  return (
    <div className="bg-[#1a1d24] border-2 border-[#4a5568] p-4 mb-3 shadow-[inset_0_0_0_2px_#0b0d11]">
      {title && (
        <div className="text-[10px] text-emerald-400 uppercase tracking-widest mb-2">
          ━ {title}
        </div>
      )}
      {children}
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`text-xs ${accent || 'text-white'}`}>{value}</span>
    </div>
  );
}

function ControlTab({ isRunning, isPaused, isConnected, mode, driver, onStart, onPause, onResume, onStop }) {
  return (
    <div>
      <PanelCard title="STATUS">
        <Row label="CONNECTION" value={isConnected ? 'ONLINE' : 'OFFLINE'}
             accent={isConnected ? 'text-emerald-400' : 'text-red-400'} />
        <Row label="MODE" value={mode} />
        <Row label="DRIVER" value={driver} />
        <Row label="RUNNING" value={isRunning ? 'YES' : 'NO'}
             accent={isRunning ? 'text-emerald-400' : 'text-gray-500'} />
      </PanelCard>
      <div className="flex gap-2">
        {!isRunning ? (
          <PixelButton onClick={onStart} disabled={!isConnected} variant="green">
            ▶ START OP
          </PixelButton>
        ) : (
          <>
            <PixelButton onClick={isPaused ? onResume : onPause} variant="blue">
              {isPaused ? '▶ RESUME' : '❚❚ PAUSE'}
            </PixelButton>
            <PixelButton onClick={onStop} variant="red">■ STOP</PixelButton>
          </>
        )}
      </div>
    </div>
  );
}

function PixelButton({ children, onClick, disabled, variant = 'blue' }) {
  const colors = {
    green: 'bg-[#2a7a3a] hover:bg-[#348848]',
    blue:  'bg-[#2a4a7a] hover:bg-[#345888]',
    red:   'bg-[#7a2a2a] hover:bg-[#883434]',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 px-4 py-2 ${colors[variant]} disabled:bg-[#2a2e35] disabled:text-gray-600 border-2 border-[#4a5568] text-white font-mono text-xs tracking-wider shadow-[inset_0_0_0_2px_#0b0d11] transition-colors`}
    >
      {children}
    </button>
  );
}

function StatsTab({ totalMinted, countTxs, actionCount, eventCount, logs }) {
  return (
    <div>
      <PanelCard title="OVERVIEW">
        <Row label="TRANSACTIONS" value={countTxs} accent="text-emerald-400" />
        <Row label="TOTAL MINTED" value={totalMinted.toLocaleString()} accent="text-emerald-400" />
        <Row label="ACTIONS" value={actionCount} accent="text-emerald-400" />
        <Row label="EVENTS" value={eventCount} accent="text-emerald-400" />
      </PanelCard>
      <PanelCard title="RECENT TX">
        <div className="space-y-1 max-h-40 overflow-y-auto text-[11px]">
          {logs.slice(0, 6).map((log, i) => (
            <div key={i} className="text-gray-300 border-l-2 border-emerald-700 pl-2">
              {log.description || 'Transaction'}
            </div>
          ))}
          {logs.length === 0 && <div className="text-gray-600 text-[11px]">— NO TX YET —</div>}
        </div>
      </PanelCard>
    </div>
  );
}

function SettingsTab() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [rpc, setRpc] = useState('');
  return (
    <div>
      <PanelCard title="AUDIO">
        <label className="flex items-center gap-3 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="w-4 h-4 accent-emerald-500"
          />
          <span className="text-white">SOUND EFFECTS</span>
        </label>
      </PanelCard>
      <PanelCard title="API CONFIG">
        <label className="block text-[10px] text-gray-400 mb-1">ANTHROPIC KEY</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-2 py-1.5 bg-[#0b0d11] border-2 border-[#4a5568] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
        />
        <label className="block text-[10px] text-gray-400 mt-3 mb-1">RPC URL</label>
        <input
          type="text"
          value={rpc}
          onChange={(e) => setRpc(e.target.value)}
          placeholder="https://..."
          className="w-full px-2 py-1.5 bg-[#0b0d11] border-2 border-[#4a5568] text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
        />
      </PanelCard>
    </div>
  );
}

function WalletTab({ isConnected }) {
  const [walletAddress, setWalletAddress] = useState('0x...');
  return (
    <div>
      <PanelCard title="CONNECTION">
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span className="text-white">{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </div>
      </PanelCard>
      <PanelCard title="ADDRESS">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="w-full px-2 py-1.5 bg-[#0b0d11] border-2 border-[#4a5568] text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
        />
      </PanelCard>
      <PanelCard title="NETWORK">
        <select className="w-full px-2 py-1.5 bg-[#0b0d11] border-2 border-[#4a5568] text-xs text-white focus:outline-none focus:border-emerald-500">
          <option value="ethereum">ETHEREUM</option>
          <option value="polygon">POLYGON</option>
          <option value="sepolia">SEPOLIA</option>
          <option value="simulation" defaultValue>SIMULATION</option>
        </select>
      </PanelCard>
    </div>
  );
}

export default HamburgerMenu;
