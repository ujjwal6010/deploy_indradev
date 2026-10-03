import type { ScenarioPersistence } from '../types';

interface ScenarioPanelProps {
  scenarios: ScenarioPersistence[];
  selectedId: string | null;
  currentHour: number;
  onSelect: (id: string) => void;
}

const MEMBER_COLORS: Record<string, string> = {
  gep01: '#f97316', gep02: '#3b82f6', gep03: '#22c55e',
  gep04: '#a855f7', gep05: '#ec4899',
};

const STATUS_BADGE: Record<string, string> = {
  Persistent: 'badge-persistent',
  Emerging: 'badge-emerging',
  'Scale-sensitive': 'badge-scale-sensitive',
  Transient: 'badge-transient',
};

export default function ScenarioPanel({ scenarios, selectedId, currentHour, onSelect }: ScenarioPanelProps) {
  const active = scenarios.filter(s => s.first_hour <= currentHour && currentHour <= s.last_hour);
  const upcoming = scenarios.filter(s => s.first_hour > currentHour);

  const ScenarioCard = ({ scenario }: { scenario: ScenarioPersistence }) => {
    const isSelected = scenario.scenario_id === selectedId;
    const isActive = scenario.first_hour <= currentHour && currentHour <= scenario.last_hour;

    return (
      <button
        onClick={() => onSelect(scenario.scenario_id)}
        className={`w-full text-left p-3 rounded-lg border transition-all mb-2 ${
          isSelected
            ? 'bg-blue-900/30 border-blue-500/50 glow-blue'
            : 'bg-[#0d1829] border-[#1e3a5f] hover:border-[#2e5a8f] hover:bg-[#111f35]'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs mono font-semibold text-white">{scenario.scenario_id}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS_BADGE[scenario.status] ?? 'badge-transient'}`}>
            {scenario.status}
          </span>
        </div>

        <div className="flex gap-1 mb-2">
          {scenario.members.map(m => (
            <div key={m} className="flex items-center gap-1 bg-[#060d1a] rounded px-1.5 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: MEMBER_COLORS[m] }} />
              <span className="text-[10px] mono text-[#94a3b8]">{m}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-[10px] text-[#475569]">
          <span>T+{scenario.first_hour} → T+{scenario.last_hour}</span>
          <span className="mono">{scenario.timesteps} steps · {scenario.scale_km}km</span>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-4 pb-2 border-b border-[#1e3a5f] shrink-0">
        <div className="text-xs text-[#94a3b8] uppercase tracking-widest font-semibold">
          Scenario Intelligence
        </div>
        <div className="text-[10px] text-[#475569] mt-0.5">
          Persistent member-consistent structures
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {active.length > 0 && (
          <>
            <div className="text-[10px] text-green-400 uppercase tracking-widest font-semibold mb-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
              Active at T+{currentHour}
            </div>
            {active.map(s => <ScenarioCard key={s.scenario_id} scenario={s} />)}
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <div className="text-[10px] text-[#475569] uppercase tracking-widest font-semibold mb-2 mt-3">
              Upcoming
            </div>
            {upcoming.slice(0, 3).map(s => <ScenarioCard key={s.scenario_id} scenario={s} />)}
          </>
        )}

        {scenarios.length === 0 && (
          <div className="text-center text-[#475569] text-xs py-8">
            No persistent scenarios detected<br />at current scale setting.
          </div>
        )}
      </div>
    </div>
  );
}
