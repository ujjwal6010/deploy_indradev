import { useCallback } from 'react';
import { FORECAST_HOURS } from '../types';
import type { ForecastState, ScenarioPersistence } from '../types';

interface TimelineProps {
  currentHour: number;
  isPlaying: boolean;
  scenarios: ScenarioPersistence[];
  onHourChange: (h: number) => void;
  onPlay: () => void;
  onStop: () => void;
}

const STATUS_DOT: Record<string, string> = {
  Persistent: 'bg-green-400',
  Emerging: 'bg-amber-400',
  'Scale-sensitive': 'bg-blue-400',
  Transient: 'bg-slate-500',
};

export default function ForecastTimeline({ currentHour, isPlaying, scenarios, onHourChange, onPlay, onStop }: TimelineProps) {
  const hourIndex = FORECAST_HOURS.indexOf(currentHour);

  const hasPersistentAt = (fh: number) =>
    scenarios.some(s => s.status === 'Persistent' && s.first_hour <= fh && fh <= s.last_hour);

  const hasScenarioAt = (fh: number) =>
    scenarios.some(s => s.first_hour <= fh && fh <= s.last_hour);

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-t border-[#1e3a5f] bg-[#060d1a]">
      {/* Play/Stop */}
      <button
        onClick={isPlaying ? onStop : onPlay}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all"
        style={{
          background: isPlaying ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
          border: `1px solid ${isPlaying ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'}`,
          color: isPlaying ? '#ef4444' : '#3b82f6',
        }}
      >
        {isPlaying ? (
          <><span>■</span> Stop</>
        ) : (
          <><span>▶</span> Play Forecast</>
        )}
      </button>

      {/* Timeline ticks */}
      <div className="flex-1 relative">
        <div className="flex justify-between mb-1.5">
          {FORECAST_HOURS.map(fh => (
            <div key={fh} className="flex flex-col items-center gap-0.5" style={{ width: `${100 / FORECAST_HOURS.length}%` }}>
              {hasPersistentAt(fh) ? (
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Persistent scenario active" />
              ) : hasScenarioAt(fh) ? (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 opacity-60" />
              ) : (
                <div className="w-1 h-1 rounded-full bg-[#1e3a5f]" />
              )}
            </div>
          ))}
        </div>

        <input
          type="range"
          className="timeline-slider"
          min={0}
          max={FORECAST_HOURS.length - 1}
          value={hourIndex >= 0 ? hourIndex : 0}
          onChange={e => onHourChange(FORECAST_HOURS[Number(e.target.value)])}
        />

        <div className="flex justify-between mt-1">
          {FORECAST_HOURS.map((fh, i) => (
            <button
              key={fh}
              onClick={() => onHourChange(fh)}
              className={`text-[10px] mono transition-colors ${fh === currentHour ? 'text-blue-400 font-semibold' : 'text-[#475569] hover:text-[#94a3b8]'}`}
              style={{ width: `${100 / FORECAST_HOURS.length}%`, textAlign: 'center' }}
            >
              T+{fh}
            </button>
          ))}
        </div>
      </div>

      {/* Current hour display */}
      <div className="text-right min-w-[70px]">
        <div className="text-[10px] text-[#475569] uppercase tracking-widest">Lead Time</div>
        <div className="text-xl font-bold mono text-white">T+{currentHour}</div>
      </div>
    </div>
  );
}
