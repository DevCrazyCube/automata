// components/HamburgerMenu.jsx
// Hamburger menu overlay with Statistics, Settings, Wallet Info, About.

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

  const handleMenuItemClick = (tab) => {
    setActiveTab(tab);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const countTxs = logs.length;
  const totalMinted = logs.reduce((sum, log) => sum + (log.amount || 0), 0);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 w-10 h-10 flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 rounded transition-colors"
        aria-label="Menu"
      >
        <div className="w-6 h-0.5 bg-white mb-1.5" />
        <div className="w-6 h-0.5 bg-white mb-1.5" />
        <div className="w-6 h-0.5 bg-white" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={handleClose}
        />
      )}

      {/* Menu panel */}
      <div
        className={`fixed top-0 left-0 h-screen w-96 bg-gray-900 border-r border-gray-700 z-40 shadow-2xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Menu header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">AUTOMATA</h1>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 p-4 border-b border-gray-700 overflow-x-auto">
          <TabButton
            label="Control"
            active={activeTab === 'control'}
            onClick={() => handleMenuItemClick('control')}
          />
          <TabButton
            label="Stats"
            active={activeTab === 'stats'}
            onClick={() => handleMenuItemClick('stats')}
          />
          <TabButton
            label="Settings"
            active={activeTab === 'settings'}
            onClick={() => handleMenuItemClick('settings')}
          />
          <TabButton
            label="Wallet"
            active={activeTab === 'wallet'}
            onClick={() => handleMenuItemClick('wallet')}
          />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
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
              logs={logs}
              totalMinted={totalMinted}
              countTxs={countTxs}
              agentEntries={agentEntries}
            />
          )}

          {activeTab === 'settings' && <SettingsTab />}

          {activeTab === 'wallet' && <WalletTab isConnected={isConnected} />}
        </div>
      </div>
    </>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-sm font-mono whitespace-nowrap rounded transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function ControlTab({
  isRunning,
  isPaused,
  isConnected,
  mode,
  driver,
  onStart,
  onPause,
  onResume,
  onStop,
}) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <div className="text-sm text-gray-400 mb-3">Status</div>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-gray-400">Connection:</span>
            <span
              className={isConnected ? 'text-emerald-400' : 'text-red-400'}
            >
              {isConnected ? 'connected' : 'disconnected'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Mode:</span>
            <span className="text-white">{mode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Driver:</span>
            <span className="text-white">{driver}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Running:</span>
            <span className={isRunning ? 'text-emerald-400' : 'text-gray-500'}>
              {isRunning ? 'yes' : 'no'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={isRunning ? onPause : onStart}
          disabled={!isConnected}
          className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-mono rounded transition-colors"
        >
          {isRunning ? (isPaused ? 'Resume' : 'Pause') : 'Start'} Operation
        </button>
        {isRunning && (
          <button
            onClick={onStop}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-mono rounded transition-colors"
          >
            Stop Operation
          </button>
        )}
      </div>
    </div>
  );
}

function StatsTab({ logs, totalMinted, countTxs, agentEntries }) {
  const actionCount = agentEntries.filter((e) => e.kind === 'action').length;

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <div className="text-sm text-gray-400 mb-3">Overview</div>
        <div className="space-y-3 text-sm">
          <StatRow label="Transactions" value={countTxs} />
          <StatRow label="Total Minted" value={`${totalMinted.toLocaleString()}`} />
          <StatRow label="Actions Taken" value={actionCount} />
          <StatRow label="Agent Events" value={agentEntries.length} />
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <div className="text-sm text-gray-400 mb-3">Recent Transactions</div>
        <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
          {logs.slice(0, 5).map((log, i) => (
            <div key={i} className="text-gray-300 border-l-2 border-gray-700 pl-2">
              {log.description || 'Transaction'}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-500">No transactions yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}:</span>
      <span className="text-emerald-400 font-mono">{value}</span>
    </div>
  );
}

function SettingsTab() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [rpc, setRpc] = useState('');

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <div className="text-sm text-gray-400 mb-4">Audio</div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-white">Sound Effects</span>
        </label>
      </div>

      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <div className="text-sm text-gray-400 mb-3">API Configuration</div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Anthropic API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              RPC Endpoint
            </label>
            <input
              type="text"
              value={rpc}
              onChange={(e) => setRpc(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <div className="text-sm text-gray-400 mb-3">Game Speed</div>
        <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500">
          <option value="slow">Slow (0.5x)</option>
          <option value="normal" selected>
            Normal (1x)
          </option>
          <option value="fast">Fast (2x)</option>
        </select>
      </div>
    </div>
  );
}

function WalletTab({ isConnected }) {
  const [walletAddress, setWalletAddress] = useState('0x...');

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <div className="text-sm text-gray-400 mb-3">Connection</div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span className="text-gray-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <div className="text-sm text-gray-400 mb-3">Wallet Address</div>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button className="mt-2 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
          Copy Address
        </button>
      </div>

      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <div className="text-sm text-gray-400 mb-3">Network</div>
        <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500">
          <option value="ethereum">Ethereum Mainnet</option>
          <option value="polygon">Polygon</option>
          <option value="sepolia">Sepolia Testnet</option>
          <option value="simulation" selected>
            Simulation Mode
          </option>
        </select>
      </div>
    </div>
  );
}

export default HamburgerMenu;
