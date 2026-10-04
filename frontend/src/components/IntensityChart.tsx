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
      axisLabel: { color: '#6e6e73', fontSize: 10 },
      axisLine: { lineStyle: { color: '#e5e5ea' } }
    },
    yAxis: {
      type: 'value',
      name: 'mm/24h',
      nameTextStyle: { color: '#aeaeb2', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f0f0f2', type: 'dashed' } },
      axisLabel: { color: '#6e6e73', fontSize: 10 }
    },
    series: [
      {
        name: 'Peak Intensity',
        type: 'line',
        data: maxIntensities,
        smooth: true,
        itemStyle: { color: '#ff9f0a' },
        lineStyle: { width: 2 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(255, 159, 10, 0.2)' }, { offset: 1, color: 'rgba(255, 159, 10, 0)' }]
          }
        }
      },
      {
        name: 'Mean Intensity',
        type: 'line',
        data: meanIntensities,
        smooth: true,
        itemStyle: { color: '#0071e3' },
        lineStyle: { width: 2 }
      }
    ]
  };

  return (
    <div className="mt-4">
      <div className="text-xs text-[#6e6e73] uppercase tracking-widest mb-2 font-medium">Intensity Evolution</div>
      <div className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-2">
        <ReactECharts option={option} style={{ height: '180px', width: '100%' }} />
      </div>
    </div>
  );
}
