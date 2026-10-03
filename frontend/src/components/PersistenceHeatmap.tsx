import ReactECharts from 'echarts-for-react';
import type { TrackPoint, ScenarioPersistence } from '../types';

interface PersistenceHeatmapProps {
  scenario: ScenarioPersistence;
  trajectory: TrackPoint[];
}

export default function PersistenceHeatmap({ scenario, trajectory }: PersistenceHeatmapProps) {
  if (!trajectory || trajectory.length === 0) return null;

  // unique hours and members
  const hours = Array.from(new Set(trajectory.map(t => t.forecast_hour))).sort((a, b) => a - b);
  const members = scenario.members;

  const data = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = 0; j < hours.length; j++) {
      const m = members[i];
      const h = hours[j];
      const pt = trajectory.find(t => t.member === m && t.forecast_hour === h);
      // value: [x (hour index), y (member index), intensity (or just 1 for presence)]
      data.push([j, i, pt ? pt.max_intensity : 0]);
    }
  }

  const option = {
    tooltip: {
      position: 'top',
      formatter: (p: any) => {
        const val = p.value[2];
        if (val === 0) return 'Not present';
        return `${members[p.value[1]]} @ T+${hours[p.value[0]]}<br/>Peak: ${val.toFixed(0)} mm`;
      }
    },
    grid: { top: 30, right: 20, bottom: 20, left: 40 },
    xAxis: {
      type: 'category',
      data: hours.map(h => `T+${h}`),
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] } }
    },
    yAxis: {
      type: 'category',
      data: members,
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: 200, // roughly max precip
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      top: 0,
      itemWidth: 10,
      itemHeight: 100,
      textStyle: { color: '#94a3b8', fontSize: 10 },
      inRange: { color: ['#0d1829', '#3b82f6', '#f59e0b', '#ef4444'] }
    },
    series: [{
      name: 'Persistence',
      type: 'heatmap',
      data,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  };

  return (
    <div className="mt-4">
      <div className="text-xs text-[#94a3b8] uppercase tracking-widest mb-2">Member Persistence</div>
      <div className="bg-[#0d1829] rounded border border-[#1e3a5f] p-2">
        <ReactECharts option={option} style={{ height: '180px', width: '100%' }} />
      </div>
    </div>
  );
}
