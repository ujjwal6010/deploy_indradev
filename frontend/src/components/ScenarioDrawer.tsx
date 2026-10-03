import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { ScenarioPersistence, TrackPoint } from '../types';
import { MEMBERS } from '../types';
import IntensityChart from './IntensityChart';
import TrajectoryChart from './TrajectoryChart';
import AtmosphericDiagnosticsChart from './AtmosphericDiagnosticsChart';
import PersistenceHeatmap from './PersistenceHeatmap';
import { exportElementAsPng } from '../utils/exportPng';
import { exportToCsv } from '../utils/exportData';

interface ScenarioDrawerProps {
  scenarioId: string;
  onClose: () => void;
}

const STATUS_CLASS: Record<string, string> = {
  Persistent: 'badge-persistent',
  Emerging: 'badge-emerging',
  'Scale-sensitive': 'badge-scale-sensitive',
  Transient: 'badge-transient',
};

const MEMBER_COLORS: Record<string, string> = {
  gep01: '#f97316', gep02: '#3b82f6', gep03: '#22c55e',
  gep04: '#a855f7', gep05: '#ec4899',
};

export default function ScenarioDrawer({ scenarioId, onClose }: ScenarioDrawerProps) {
  const [scenario, setScenario] = useState<ScenarioPersistence | null>(null);
  const [atmosphere, setAtmosphere] = useState<any>(null);
  const [trajectory, setTrajectory] = useState<TrackPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getScenarioDetail(scenarioId),
      api.getScenarioAtmosphere(scenarioId),
      api.getScenarioTrajectory(scenarioId),
    ]).then(([detail, atmos, traj]) => {
      setScenario(detail);
      setAtmosphere(atmos);
      setTrajectory(traj);
    }).catch(console.error).finally(() => setLoading(false));
  }, [scenarioId]);

  const firstTrack = trajectory[0];
  const lastTrack = trajectory[trajectory.length - 1];
  const displacementKm = firstTrack && lastTrack
    ? Math.round(Math.sqrt(
        ((lastTrack.latitude - firstTrack.latitude) * 111) ** 2 +
        ((lastTrack.longitude - firstTrack.longitude) * 111) ** 2
      ))
    : null;

  if (loading) return (
    <div className="w-80 glass h-full flex items-center justify-center">
      <div className="text-[#94a3b8] text-sm">Loading scenario...</div>
    </div>
  );

  if (!scenario) return null;

  const atmMembers = atmosphere?.members ?? {};
  const temps = Object.values(atmMembers).map((m: any) => m.temperature_c).filter((v: any) => v != null) as number[];
  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '--';

  return (
    <div ref={drawerRef} className="w-80 glass h-full overflow-y-auto flex flex-col animate-fade-in-up">
      <div className="flex items-center justify-between p-4 border-b border-[#1e3a5f]">
        <div>
          <div className="text-xs text-[#94a3b8] uppercase tracking-widest mb-0.5">Scenario</div>
          <div className="text-white font-semibold text-lg mono">{scenarioId}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCsv(trajectory, `scenario_${scenarioId}_trajectory`)}
            className="text-[9px] text-[#475569] hover:text-[#94a3b8] border border-[#1e3a5f] rounded px-1.5 py-0.5"
            title="Export trajectory data to CSV"
          >CSV</button>
          <button
            onClick={() => drawerRef.current && exportElementAsPng(drawerRef.current, `scenario_${scenarioId}`)}
            className="text-[9px] text-[#475569] hover:text-[#94a3b8] border border-[#1e3a5f] rounded px-1.5 py-0.5"
            title="Export as PNG for PPT"
          >📷</button>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white text-xl leading-none">×</button>
        </div>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[scenario.status] ?? 'badge-transient'}`}>
            {scenario.status || 'Unknown'}
          </span>
          <span className="text-[#475569] text-xs mono">{scenario.scale_km} km scale</span>
        </div>

        {/* Members */}
        <div>
          <div className="text-xs text-[#94a3b8] uppercase tracking-widest mb-2">Members</div>
          <div className="space-y-1.5">
            {scenario.members.map(m => (
              <div key={m} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: MEMBER_COLORS[m] ?? '#fff' }} />
                <span className="text-sm text-white mono">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Temporal extent */}
        <div>
          <div className="text-xs text-[#94a3b8] uppercase tracking-widest mb-2">Temporal Extent</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'First Detected', value: `T+${scenario.first_hour}` },
              { label: 'Last Detected', value: `T+${scenario.last_hour}` },
              { label: 'Persistence', value: `${scenario.timesteps} timesteps` },
              { label: 'Consecutive', value: `${scenario.longest_consecutive} steps` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#0d1829] rounded p-2 border border-[#1e3a5f]">
                <div className="text-[10px] text-[#475569] uppercase">{label}</div>
                <div className="text-sm text-white mono font-medium mt-0.5">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trajectory */}
        {displacementKm !== null && (
          <div>
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-[#0d1829] rounded p-2 border border-[#1e3a5f]">
                <div className="text-[10px] text-[#475569] uppercase">Displacement</div>
                <div className="text-sm text-white mono font-medium mt-0.5">~{displacementKm} km</div>
              </div>
            </div>
            {trajectory.length > 0 && <TrajectoryChart trajectory={trajectory} />}
          </div>
        )}

        {/* Persistence Heatmap */}
        {trajectory.length > 0 && (
          <PersistenceHeatmap scenario={scenario} trajectory={trajectory} />
        )}

        {/* Intensity Chart */}
        {trajectory.length > 0 && (
          <IntensityChart trajectory={trajectory} />
        )}

        {/* Atmospheric Diagnostics */}
        {atmosphere && (
          <AtmosphericDiagnosticsChart atmosphere={atmosphere} />
        )}
      </div>
    </div>
  );
}
