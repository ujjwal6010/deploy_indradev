import type { ScenarioPersistence } from '../types';

interface ScenarioPanelProps {
  scenarios: ScenarioPersistence[];
  selectedId: string | null;
  currentHour: number;
  onSelect: (id: string) => void;
}

const MEMBER_COLORS: Record<string, string> = {
  gep01: '#f97316', gep02: '#0071e3', gep03: '#34c759',
  gep04: '#af52de', gep05: '#ff2d55',
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

    return (
      <button
        onClick={() => onSelect(scenario.scenario_id)}
        className={`w-full text-left p-4 rounded-xl border transition-all mb-3 shadow-sm group ${
          isSelected
            ? 'bg-white border-[#0071e3] ring-1 ring-[#0071e3]'
            : 'bg-white border-[#e5e5ea] hover:border-[#d1d1d6] hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-bold text-[#1d2b45]">{scenario.scenario_id}</span>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${STATUS_BADGE[scenario.status] ?? 'badge-transient'}`}>
            {scenario.status}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1.5 flex-wrap">
            {scenario.members.map(m => (
              <div key={m} className="flex items-center gap-1 bg-[#f5f5f7] rounded-md px-1.5 py-0.5 border border-[#e5e5ea]">
                <div className="w-1.5 h-1.5 rounded-[2px]" style={{ background: MEMBER_COLORS[m] }} />
                <span className="text-[11px] font-medium text-[#4b5563]">{m}</span>
              </div>
            ))}
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 group-hover:stroke-[#1d2b45] transition-all"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-medium text-[#6e6e73]">
          <span>T+{scenario.first_hour} – T+{scenario.last_hour}</span>
          <span className="w-[1px] h-3 bg-[#e5e5ea]" />
          <span>{scenario.timesteps} stages</span>
          <span className="w-[1px] h-3 bg-[#e5e5ea]" />
          <span>{scenario.scale_km} km</span>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d2b45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          <h3 className="text-[12px] font-bold text-[#1d2b45] uppercase tracking-wider">Scenario Intelligence</h3>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:stroke-[#6e6e73] transition-colors"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      </div>

      <div className="flex-1 -mx-4 px-4 overflow-y-auto">
        {active.length > 0 && (
          <>
            {active.map(s => <ScenarioCard key={s.scenario_id} scenario={s} />)}
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <div className="text-[10px] text-[#aeaeb2] uppercase tracking-widest font-semibold mb-2 mt-3">
              Upcoming
            </div>
            {upcoming.slice(0, 3).map(s => <ScenarioCard key={s.scenario_id} scenario={s} />)}
          </>
        )}

        {scenarios.length === 0 && (
          <div className="text-center text-[#aeaeb2] text-xs py-8">
            No persistent scenarios detected<br />at current scale setting.
          </div>
        )}

        {/* Additional bottom buttons */}
        <div className="mt-4 space-y-2 pb-4">
          <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-[#e5e5ea] rounded-xl text-[13px] font-semibold text-[#4b5563] hover:text-[#1d2b45] hover:border-[#d1d1d6] transition-all shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add scenario group
          </button>
          <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-[#e5e5ea] rounded-xl text-[13px] font-semibold text-[#4b5563] hover:text-[#1d2b45] hover:border-[#d1d1d6] transition-all shadow-sm group">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              Manage groups
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#1d2b45] group-hover:translate-x-0.5 transition-all"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
