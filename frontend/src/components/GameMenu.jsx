// components/GameMenu.jsx
// Professional hamburger menu with Statistics, Settings, Wallet, About.

import { useState } from 'react';

export default function GameMenu({
  isConnected,
  mode,
  driver,
  isRunning,
  isPaused,
  gameState,
  onStart,
  onPause,
  onResume,
  onStop,
  onSettingsChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('statistics');
  const [settings, setSettings] = useState({
    soundEnabled: true,
    gameSpeed: 'normal',
    apiKey: localStorage.getItem('anthropic_api_key') || '',
    rpc: localStorage.getItem('rpc_endpoint') || 'https://ethereum-rpc.publicnode.com',
    walletAddress: localStorage.getItem('wallet_address') || '0x...',
    network: 'ethereum',
  });

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem(key === 'apiKey' ? 'anthropic_api_key' : key, value);
    if (onSettingsChange) onSettingsChange(key, value);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 w-10 h-10 flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 rounded transition-colors"
        aria-label="Menu"
      >
        <div className="w-5 h-0.5 bg-white mb-1.5" />
        <div className="w-5 h-0.5 bg-white mb-1.5" />
        <div className="w-5 h-0.5 bg-white" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Panel */}
      <div
        className={`fixed top-0 left-0 h-screen w-96 bg-gray-900 border-r border-gray-700 z-40 shadow-2xl transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900">
          <h1 className="text-2xl font-bold text-white">AUTOMATA</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-4 border-b border-gray-700 bg-gray-950 sticky top-20">
          <TabBtn
            label="Stats"
            active={activeTab === 'statistics'}
            onClick={() => setActiveTab('statistics')}
          />
          <TabBtn
            label="Settings"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
          <TabBtn
            label="Wallet"
            active={activeTab === 'wallet'}
            onClick={() => setActiveTab('wallet')}
          />
          <TabBtn
            label="About"
            active={activeTab === 'about'}
            onClick={() => setActiveTab('about')}
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {activeTab === 'statistics' && (
            <StatisticsTab gameState={gameState} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              onSettingChange={handleSettingChange}
            />
          )}
          {activeTab === 'wallet' && (
            <WalletTab
              settings={settings}
              onSettingChange={handleSettingChange}
              isConnected={isConnected}
            />
          )}
          {activeTab === 'about' && <AboutTab />}
        </div>

        {/* Control Bar */}
        <div className="border-t border-gray-700 bg-gray-950 p-4 space-y-2 sticky bottom-0">
          <StatusRow label="Status" value={isRunning ? 'Running' : 'Idle'} />
          <StatusRow
            label="Connection"
            value={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'emerald' : 'red'}
          />
          <div className="pt-2 space-y-2">
            <button
              onClick={isRunning ? onPause : onStart}
              disabled={!isConnected}
              className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-mono rounded transition-colors"
            >
              {isRunning ? (isPaused ? 'Resume' : 'Pause') : 'Start'} Operation
            </button>
            {isRunning && (
              <button
                onClick={onStop}
                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-mono rounded transition-colors"
              >
                Stop Operation
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function StatusRow({ label, value, color = 'gray' }) {
  const colorClass =
    color === 'emerald' ? 'text-emerald-400' : color === 'red' ? 'text-red-400' : 'text-gray-300';
  return (
    <div className="flex justify-between text-xs font-mono">
      <span className="text-gray-400">{label}:</span>
      <span className={colorClass}>{value}</span>
    </div>
  );
}

function StatisticsTab({ gameState = {} }) {
  const { tokensMinted = 0, transactions = 0, liquidity = 0, profit = 0, roi = 0 } = gameState;

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <h3 className="text-sm text-gray-300 mb-4 font-mono">Game Statistics</h3>
        <div className="space-y-3 text-sm">
          <StatItem label="Tokens Minted" value={tokensMinted.toLocaleString()} />
          <StatItem label="Transactions" value={transactions} />
          <StatItem label="Liquidity Added" value={`${liquidity.toLocaleString()}`} />
          <StatItem label="Profit/Loss" value={`${profit >= 0 ? '+' : ''}${profit}`} />
          <StatItem label="ROI" value={`${roi}%`} />
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <span className="text-emerald-400 font-mono">{value}</span>
    </div>
  );
}

function SettingsTab({ settings, onSettingChange }) {
  return (
    <div className="space-y-6">
      <SettingGroup title="Audio">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => onSettingChange('soundEnabled', e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-gray-300">Sound Effects</span>
        </label>
      </SettingGroup>

      <SettingGroup title="Game">
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Game Speed</label>
          <select
            value={settings.gameSpeed}
            onChange={(e) => onSettingChange('gameSpeed', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white"
          >
            <option value="slow">Slow (0.5x)</option>
            <option value="normal">Normal (1x)</option>
            <option value="fast">Fast (2x)</option>
          </select>
        </div>
      </SettingGroup>

      <SettingGroup title="API Configuration">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">Anthropic API Key</label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => onSettingChange('apiKey', e.target.value)}
              placeholder="sk-..."
              className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">RPC Endpoint</label>
            <input
              type="text"
              value={settings.rpc}
              onChange={(e) => onSettingChange('rpc', e.target.value)}
              placeholder="https://..."
              className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </SettingGroup>
    </div>
  );
}

function SettingGroup({ title, children }) {
  return (
    <div className="bg-gray-800 p-4 rounded border border-gray-700">
      <h4 className="text-xs text-gray-400 uppercase mb-4 font-mono">{title}</h4>
      {children}
    </div>
  );
}

function WalletTab({ settings, onSettingChange, isConnected }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <h3 className="text-sm text-gray-300 mb-4 font-mono">Connection</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400' : 'bg-red-400'
            }`}
          />
          <span className="text-sm text-gray-300">
            {isConnected ? 'Connected to Network' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <label className="text-xs text-gray-400 uppercase mb-2 block font-mono">
          Wallet Address
        </label>
        <input
          type="text"
          value={settings.walletAddress}
          onChange={(e) => onSettingChange('walletAddress', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white font-mono focus:outline-none focus:border-blue-500 mb-2"
        />
        <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
          Copy Address
        </button>
      </div>

      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <label className="text-xs text-gray-400 uppercase mb-2 block font-mono">
          Network
        </label>
        <select
          value={settings.network}
          onChange={(e) => onSettingChange('network', e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="ethereum">Ethereum Mainnet</option>
          <option value="polygon">Polygon</option>
          <option value="sepolia">Sepolia Testnet</option>
          <option value="simulation">Simulation Mode</option>
        </select>
      </div>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <h3 className="text-sm text-gray-300 mb-2 font-mono">AUTOMATA</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          A DeFi office simulation where autonomous AI agents manage token operations. Watch them coordinate trades, manage liquidity, and chat naturally about their work.
        </p>
      </div>

      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <h3 className="text-sm text-gray-300 mb-2 font-mono">Features</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>✓ AI-driven agent conversations</li>
          <li>✓ Real-time token operations</li>
          <li>✓ Interactive office environment</li>
          <li>✓ Click agents to interact</li>
          <li>✓ LLM-powered dialogue</li>
        </ul>
      </div>

      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <p className="text-xs text-gray-500">
          v1.0.0 • Built with Phaser 3 & Claude AI • 2026
        </p>
      </div>
    </div>
  );
}
