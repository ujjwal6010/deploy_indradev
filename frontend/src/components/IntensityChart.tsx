import ReactECharts from 'echarts-for-react';
import type { TrackPoint } from '../types';

interface IntensityChartProps {
  trajectory: TrackPoint[];
}

export default function IntensityChart({ trajectory }: IntensityChartProps) {
  if (!trajectory || trajectory.length === 0) return null;

  const hours = trajectory.map(t => `T+${t.forecast_hour}`);
  const maxIntensities = trajectory.map(t => t.max_intensity);
  const meanIntensities = trajectory.map(t => t.mean_intensity);

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { top: 30, right: 20, bottom: 20, left: 40 },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisLine: { lineStyle: { color: '#1e3a5f' } }
    },
    yAxis: {
      type: 'value',
      name: 'mm/24h',
      nameTextStyle: { color: '#475569', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1e3a5f', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 }
    },
    series: [
      {
        name: 'Peak Intensity',
        type: 'line',
        data: maxIntensities,
        smooth: true,
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(245, 158, 11, 0.4)' }, { offset: 1, color: 'rgba(245, 158, 11, 0)' }]
          }
        }
      },
      {
        name: 'Mean Intensity',
        type: 'line',
        data: meanIntensities,
        smooth: true,
        itemStyle: { color: '#3b82f6' },
        lineStyle: { width: 2 }
      }
    ]
  };

  return (
    <div className="mt-4">
      <div className="text-xs text-[#94a3b8] uppercase tracking-widest mb-2">Intensity Evolution</div>
      <div className="bg-[#0d1829] rounded border border-[#1e3a5f] p-2">
        <ReactECharts option={option} style={{ height: '180px', width: '100%' }} />
      </div>
    </div>
  );
}
