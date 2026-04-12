// components/TransactionLog.jsx
// Scrolling live log of transaction events.

const TYPE_COLORS = {
  mint: 'text-emerald-400',
  distribution: 'text-teal-300',
  burn: 'text-orange-400',
  swap_in: 'text-yellow-300',
  swap_out: 'text-yellow-200',
  add_liquidity: 'text-blue-300',
  remove_liquidity: 'text-purple-300',
  forward: 'text-pink-300',
  whitelist: 'text-gray-400',
  restrict_transfers: 'text-gray-400',
  transfer: 'text-white'
};

function short(addr) {
  if (!addr) return '—';
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatAmount(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value !== 'number') return String(value);
  if (value === 0) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)}k`;
  return value.toFixed(2);
}

function TransactionLog({ logs }) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2">
        Transaction Log
      </h2>
      <div className="flex-1 overflow-y-auto border border-gray-800 rounded bg-gray-950 p-2 text-xs font-mono space-y-1">
        {logs.length === 0 && (
          <div className="text-gray-600 italic">No transactions yet. Click Start Operation.</div>
        )}
        {logs.map((log, idx) => {
          const color = TYPE_COLORS[log.type] || 'text-gray-300';
          return (
            <div key={`${log.timestamp}-${idx}`} className="flex gap-2 items-baseline">
              <span className="text-gray-600 shrink-0">
                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
              </span>
              <span className={`${color} shrink-0 uppercase w-16`}>{log.type || 'tx'}</span>
              <span className="text-gray-400 truncate">
                {short(log.from)} → {short(log.to)}
              </span>
              <span className="text-gray-200 ml-auto">
                {formatAmount(log.amount)} {log.asset || ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TransactionLog;
