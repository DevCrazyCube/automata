// components/PhaseProgress.jsx
// Renders a progress bar for each of the six phases.

const PHASE_META = [
  { id: 1, name: 'Setup',         color: 'bg-red-500' },
  { id: 2, name: 'Distribution',  color: 'bg-teal-400' },
  { id: 3, name: 'Buyer Entry',   color: 'bg-yellow-400' },
  { id: 4, name: 'Control',       color: 'bg-emerald-400' },
  { id: 5, name: 'Extraction',    color: 'bg-purple-400' },
  { id: 6, name: 'Forwarding',    color: 'bg-pink-400' }
];

function PhaseProgress({ phases }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-400 mb-2">
        Phases
      </h2>
      <div className="space-y-2">
        {PHASE_META.map((phase) => {
          const progress = phases[phase.id] || 0;
          const isComplete = progress >= 100;
          return (
            <div key={phase.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-mono">
                  {phase.id}. {phase.name}
                </span>
                <span className={`font-mono ${isComplete ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {isComplete ? '✓ done' : `${progress}%`}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded overflow-hidden">
                <div
                  className={`h-full ${phase.color} transition-all duration-300`}
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PhaseProgress;
