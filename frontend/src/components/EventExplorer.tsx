import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { api } from '../services/api';
import type { ExtremeEvent, TrackPoint } from '../types';
import { FORECAST_HOURS } from '../types';

const MEMBER_COLORS: Record<string, string> = {
  gep01: '#f97316', gep02: '#3b82f6', gep03: '#22c55e',
  gep04: '#a855f7', gep05: '#ec4899',
};

const ALL_MEMBERS = ['gep01', 'gep02', 'gep03', 'gep04', 'gep05'];

interface EventExplorerProps {
  currentHour: number;
  onHourChange: (h: number) => void;
}

export default function EventExplorer({ currentHour, onHourChange }: EventExplorerProps) {
  const [events, setEvents] = useState<ExtremeEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ExtremeEvent | null>(null);
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [hourFilter, setHourFilter] = useState<number | null>(null);
  const [tracks, setTracks] = useState<TrackPoint[]>([]);

  // fetch all events on mount
  useEffect(() => {
    api.getEvents().then(setEvents).catch(console.error);
  }, []);

  // when a specific event is selected, load its member's track
  useEffect(() => {
    if (!selectedEvent) { setTracks([]); return; }
    api.getTracks(selectedEvent.member)
      .then(setTracks)
      .catch(console.error);
  }, [selectedEvent]);

  // apply filters
  const filtered = events.filter(e => {
    if (memberFilter && e.member !== memberFilter) return false;
    if (hourFilter !== null && e.forecast_hour !== hourFilter) return false;
    return true;
  });

  // number the events for display
  const numbered = filtered.map((evt, i) => ({ ...evt, displayNum: i + 1 }));

  // evolution chart for selected event
  const evolutionOption = selectedEvent && tracks.length > 0 ? (() => {
    const memberTrack = tracks.filter(t => t.member === selectedEvent.member);
    memberTrack.sort((a, b) => a.forecast_hour - b.forecast_hour);
    return {
      tooltip: { trigger: 'axis' },
      grid: { top: 25, right: 15, bottom: 20, left: 40 },
      xAxis: {
        type: 'category',
        data: memberTrack.map(t => `T+${t.forecast_hour}`),
        axisLabel: { color: '#94a3b8', fontSize: 9 },
        axisLine: { lineStyle: { color: '#1e3a5f' } }
      },
      yAxis: {
        type: 'value', name: 'mm/24h',
        nameTextStyle: { color: '#475569', fontSize: 9 },
        splitLine: { lineStyle: { color: '#1e3a5f', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 9 }
      },
      series: [
        {
          name: 'Peak',
          type: 'line', smooth: true,
          data: memberTrack.map(t => t.max_intensity),
          itemStyle: { color: MEMBER_COLORS[selectedEvent.member] || '#fff' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: (MEMBER_COLORS[selectedEvent.member] || '#fff') + '66' },
                { offset: 1, color: (MEMBER_COLORS[selectedEvent.member] || '#fff') + '00' }
              ]
            }
          }
        },
        {
          name: 'Mean',
          type: 'line', smooth: true,
          data: memberTrack.map(t => t.mean_intensity),
          itemStyle: { color: '#475569' },
          lineStyle: { type: 'dashed', width: 1.5 }
        }
      ]
    };
  })() : null;

  return (
    <div className="flex h-full">
      {/* left: filters + event list */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* filters row */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-[#1e3a5f] shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-[#475569] uppercase mr-1">Member:</span>
            <button
              onClick={() => setMemberFilter(null)}
              className={`text-[9px] px-1.5 py-0.5 rounded border ${!memberFilter ? 'bg-blue-900/40 border-blue-500/50 text-blue-300' : 'border-[#1e3a5f] text-[#475569] hover:text-[#94a3b8]'}`}
            >All</button>
            {ALL_MEMBERS.map(m => (
              <button
                key={m}
                onClick={() => setMemberFilter(memberFilter === m ? null : m)}
                className={`text-[9px] px-1.5 py-0.5 rounded border ${memberFilter === m ? 'bg-blue-900/40 border-blue-500/50 text-blue-300' : 'border-[#1e3a5f] text-[#475569] hover:text-[#94a3b8]'}`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-0.5" style={{ background: MEMBER_COLORS[m] }} />
                {m.slice(-2)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-[#475569] uppercase mr-1">Hour:</span>
            <button
              onClick={() => setHourFilter(null)}
              className={`text-[9px] px-1.5 py-0.5 rounded border ${hourFilter === null ? 'bg-blue-900/40 border-blue-500/50 text-blue-300' : 'border-[#1e3a5f] text-[#475569] hover:text-[#94a3b8]'}`}
            >All</button>
            {FORECAST_HOURS.map(h => (
              <button
                key={h}
                onClick={() => setHourFilter(hourFilter === h ? null : h)}
                className={`text-[9px] px-1 py-0.5 rounded border mono ${hourFilter === h ? 'bg-blue-900/40 border-blue-500/50 text-blue-300' : 'border-[#1e3a5f] text-[#475569] hover:text-[#94a3b8]'}`}
              >{h}</button>
            ))}
          </div>
          <div className="text-[9px] text-[#475569] ml-auto mono">{filtered.length} events</div>
        </div>

        {/* event cards */}
        <div className="flex-1 overflow-auto p-2">
          <div className="grid grid-cols-4 gap-1.5">
            {numbered.map(evt => {
              const isSelected = selectedEvent?.event_id === evt.event_id;
              return (
                <button
                  key={evt.event_id}
                  onClick={() => setSelectedEvent(isSelected ? null : evt)}
                  className={`text-left bg-[#060d1a] border rounded p-2 transition-all ${
                    isSelected ? 'border-blue-500/60 ring-1 ring-blue-500/30' : 'border-[#1e3a5f] hover:border-[#2e5a8f]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-[#475569] mono">#{String(evt.displayNum).padStart(3, '0')}</span>
                    <span className="text-[9px] mono" style={{ color: MEMBER_COLORS[evt.member] }}>{evt.member}</span>
                  </div>
                  <div className="text-xs mono text-white font-medium">{evt.max_intensity.toFixed(0)} mm</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-[#475569]">T+{evt.forecast_hour}</span>
                    <span className="text-[9px] text-[#475569]">{evt.area.toFixed(0)} cells</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* right: detail panel when event selected */}
      {selectedEvent && (
        <div className="w-64 border-l border-[#1e3a5f] bg-[#0a1422] flex flex-col overflow-y-auto shrink-0">
          <div className="p-3 border-b border-[#1e3a5f]">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-[#475569] uppercase tracking-widest">Event Detail</div>
              <button onClick={() => setSelectedEvent(null)} className="text-[#475569] hover:text-white text-sm">×</button>
            </div>
            <div className="text-sm mono text-white font-semibold mt-1">{selectedEvent.event_id}</div>
          </div>

          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Member', value: selectedEvent.member, color: MEMBER_COLORS[selectedEvent.member] },
                { label: 'Forecast', value: `T+${selectedEvent.forecast_hour}` },
                { label: 'Peak', value: `${selectedEvent.max_intensity.toFixed(0)} mm` },
                { label: 'Mean', value: `${selectedEvent.mean_intensity.toFixed(0)} mm` },
                { label: 'Area', value: `${selectedEvent.area.toFixed(0)} cells` },
                { label: 'Location', value: `${selectedEvent.latitude_centroid.toFixed(1)}°N ${selectedEvent.longitude_centroid.toFixed(1)}°E` },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#0d1829] rounded p-1.5 border border-[#1e3a5f]">
                  <div className="text-[9px] text-[#475569] uppercase">{label}</div>
                  <div className="text-[11px] text-white mono mt-0.5" style={color ? { color } : undefined}>{value}</div>
                </div>
              ))}
            </div>

            {/* evolution across forecast hours */}
            {evolutionOption && (
              <div>
                <div className="text-[10px] text-[#94a3b8] uppercase tracking-widest mb-1">
                  {selectedEvent.member} — Intensity Evolution
                </div>
                <div className="bg-[#0d1829] rounded border border-[#1e3a5f] p-1">
                  <ReactECharts option={evolutionOption} style={{ height: '120px', width: '100%' }} />
                </div>
              </div>
            )}

            <button
              onClick={() => { onHourChange(selectedEvent.forecast_hour); }}
              className="w-full text-[10px] py-1.5 rounded border border-blue-500/40 text-blue-300 hover:bg-blue-900/30 transition-colors uppercase tracking-widest"
            >
              Jump to T+{selectedEvent.forecast_hour} on map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
