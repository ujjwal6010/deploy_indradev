import type { RobustnessCell } from '../types';
import { FORECAST_HOURS, SCALES_KM } from '../types';

interface RobustnessMatrixProps {
  matrix: RobustnessCell[];
  onCellClick: (hour: number, scale: number) => void;
  selectedHour: number;
  selectedScale: number;
}

function getCellColor(cell: RobustnessCell | undefined): string {
  if (!cell || cell.scenario_count === 0) return 'bg-[#0d1829] border-[#1e3a5f]';
  if (cell.has_persistent) return 'bg-green-900/40 border-green-500/40';
  if (cell.max_timesteps >= 2) return 'bg-amber-900/40 border-amber-500/40';
  return 'bg-blue-900/40 border-blue-500/40';
}

function getDotColor(cell: RobustnessCell | undefined): string {
  if (!cell || cell.scenario_count === 0) return '';
  if (cell.has_persistent) return 'bg-green-400';
  if (cell.max_timesteps >= 2) return 'bg-amber-400';
  return 'bg-blue-400';
}

export default function RobustnessMatrix({ matrix, onCellClick, selectedHour, selectedScale }: RobustnessMatrixProps) {
  const getCell = (fh: number, scale: number) =>
    matrix.find(c => c.forecast_hour === fh && c.scale_km === scale);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-[#94a3b8] uppercase tracking-widest font-semibold">
          Scale Robustness Matrix
        </h3>
        <div className="flex items-center gap-3 text-[10px] text-[#475569]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-400/60 inline-block" /> Persistent</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400/60 inline-block" /> Emerging</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400/60 inline-block" /> Transient</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr>
              <th className="text-left text-[#475569] pr-3 pb-2 font-normal">T+hr</th>
              {SCALES_KM.map(s => (
                <th key={s} className="text-center text-[#475569] pb-2 font-normal">{s} km</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FORECAST_HOURS.map(fh => (
              <tr key={fh}>
                <td className={`pr-3 py-0.5 mono font-medium ${fh === selectedHour ? 'text-blue-400' : 'text-[#94a3b8]'}`}>
                  T+{fh}
                </td>
                {SCALES_KM.map(scale => {
                  const cell = getCell(fh, scale);
                  const isSelected = fh === selectedHour && scale === selectedScale;
                  return (
                    <td key={scale} className="py-0.5 px-1 text-center">
                      <button
                        onClick={() => onCellClick(fh, scale)}
                        title={cell ? `${cell.scenario_count} scenarios, max ${cell.max_timesteps} steps` : 'No scenarios'}
                        className={`matrix-cell w-8 h-6 rounded border ${getCellColor(cell)} ${isSelected ? 'ring-1 ring-white/40' : ''} flex items-center justify-center mx-auto`}
                      >
                        {cell && cell.scenario_count > 0 && (
                          <div className={`w-2 h-2 rounded-full ${getDotColor(cell)}`} />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
