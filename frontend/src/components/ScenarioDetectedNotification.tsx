import { useState, useEffect } from 'react';
import type { ScenarioPersistence } from '../types';

interface ScenarioDetectedNotificationProps {
  scenario: ScenarioPersistence | null;
  onDismiss: () => void;
}

const MEMBER_COLORS: Record<string, string> = {
  gep01: '#f97316', gep02: '#3b82f6', gep03: '#22c55e',
  gep04: '#a855f7', gep05: '#ec4899',
};

export default function ScenarioDetectedNotification({ scenario, onDismiss }: ScenarioDetectedNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (scenario) {
      setVisible(true);
      const timer = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [scenario]);

  if (!scenario || !visible) return null;

  return (
    <div className="absolute top-4 right-4 z-50 w-72 glass rounded-xl border animate-pulse-border p-4 animate-fade-in-up"
      style={{ borderColor: 'rgba(34,197,94,0.4)' }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-[10px] text-green-400 uppercase tracking-widest font-semibold mb-0.5">
            🔍 Scenario Structure Detected
          </div>
          <div className="text-white font-bold mono text-sm">{scenario.scenario_id}</div>
        </div>
        <button onClick={() => { setVisible(false); onDismiss(); }}
          className="text-[#475569] hover:text-white text-lg leading-none">×</button>
      </div>

      <div className="flex gap-1.5 mb-2">
        {scenario.members.map(m => (
          <div key={m} className="flex items-center gap-1 bg-[#0d1829] rounded px-1.5 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: MEMBER_COLORS[m] }} />
            <span className="text-[10px] mono text-[#94a3b8]">{m}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-[#475569]">Persistence: </span>
          <span className="text-white mono font-medium">{scenario.timesteps} timesteps</span>
        </div>
        <div>
          <span className="text-[#475569]">Scale: </span>
          <span className="text-white mono font-medium">{scenario.scale_km} km</span>
        </div>
        <div>
          <span className="text-[#475569]">T+{scenario.first_hour} → T+{scenario.last_hour}</span>
        </div>
      </div>
    </div>
  );
}
