import ReactECharts from 'echarts-for-react';
import type { TrackPoint } from '../types';

interface TrajectoryChartProps {
  trajectory: TrackPoint[];
}

export default function TrajectoryChart({ trajectory }: TrajectoryChartProps) {
  if (!trajectory || trajectory.length === 0) return null;

  // group by member
  const memberTracks: Record<string, [number, number, number][]> = {};
  trajectory.forEach(t => {
    if (!memberTracks[t.member]) memberTracks[t.member] = [];
    // [lon, lat, forecast_hour]
    memberTracks[t.member].push([t.longitude, t.latitude, t.forecast_hour]);
  });

  const series = Object.keys(memberTracks).map(m => {
    const color = {
      gep01: '#f97316', gep02: '#0071e3', gep03: '#34c759',
      gep04: '#af52de', gep05: '#ff2d55',
    }[m] || '#6e6e73';

    return {
      name: m,
      type: 'line',
      data: memberTracks[m],
      symbolSize: 6,
      itemStyle: { color },
      lineStyle: { width: 2, color },
      encode: {
        x: 0, // lon
        y: 1, // lat
      }
    };
  });

  const option = {
    tooltip: { 
      trigger: 'item',
      formatter: (params: any) => {
        const [lon, lat, fh] = params.value;
        return `${params.seriesName} @ T+${fh}<br/>Lat: ${lat.toFixed(2)}<br/>Lon: ${lon.toFixed(2)}`;
      }
    },
    grid: { top: 20, right: 20, bottom: 20, left: 40 },
    xAxis: {
      type: 'value',
      name: 'Lon',
      scale: true,
      nameTextStyle: { color: '#aeaeb2', fontSize: 10 },
      axisLabel: { color: '#6e6e73', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f0f0f2', type: 'dashed' } }
    },
    yAxis: {
      type: 'value',
      name: 'Lat',
      scale: true,
      nameTextStyle: { color: '#aeaeb2', fontSize: 10 },
      axisLabel: { color: '#6e6e73', fontSize: 10 },
      splitLine: { lineStyle: { color: '#f0f0f2', type: 'dashed' } }
    },
    series
  };

  return (
    <div className="mt-4">
      <div className="text-xs text-[#6e6e73] uppercase tracking-widest mb-2 font-medium">Trajectory Path</div>
      <div className="bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-2">
        <ReactECharts option={option} style={{ height: '180px', width: '100%' }} />
      </div>
    </div>
  );
}
