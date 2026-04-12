// components/FinalReport.jsx
// Shown once the backend emits 'operation_complete'. Displays profit, ROI,
// and per-phase results.

function fmt(value, suffix = '') {
  if (value === null || value === undefined) return '—';
  if (typeof value !== 'number') return String(value) + suffix;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 }) + suffix;
}

function FinalReport({ report, onDismiss }) {
  if (!report) return null;

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-lg w-full shadow-2xl">
        <h2 className="text-lg font-bold text-emerald-400 mb-4">
          ✓ Operation Complete
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm font-mono">
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-xs text-gray-400 uppercase">Mode</div>
            <div className="text-white">{report.mode || '—'}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-xs text-gray-400 uppercase">Duration</div>
            <div className="text-white">{fmt(report.duration, 's')}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-xs text-gray-400 uppercase">Cost</div>
            <div className="text-white">{fmt(report.cost)} USDT</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-xs text-gray-400 uppercase">Revenue</div>
            <div className="text-white">{fmt(report.revenue)} USDT</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-xs text-gray-400 uppercase">Profit</div>
            <div className={report.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {fmt(report.totalProfit)} USDT
            </div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-xs text-gray-400 uppercase">ROI</div>
            <div className={report.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {fmt(report.roi, '%')}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-semibold"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default FinalReport;
