import ReactECharts from 'echarts-for-react';

interface AtmosphericDiagnosticsChartProps {
  atmosphere: any;
}

const MEMBER_COLORS: Record<string, string> = {
  gep01: '#f97316', gep02: '#3b82f6', gep03: '#22c55e',
  gep04: '#a855f7', gep05: '#ec4899',
};

export default function AtmosphericDiagnosticsChart({ atmosphere }: AtmosphericDiagnosticsChartProps) {
  if (!atmosphere || !atmosphere.members) return null;

  const members = Object.keys(atmosphere.members);
  const temps = members.map(m => atmosphere.members[m].temperature_c);
  const winds = members.map(m => atmosphere.members[m].wind_speed);
  const capes = members.map(m => atmosphere.members[m].cape_surface);
  const heights = members.map(m => atmosphere.members[m].geopotential_height_500);

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: 30, right: 20, bottom: 20, left: 40 },
    legend: { textStyle: { color: '#94a3b8', fontSize: 10 }, itemWidth: 10, itemHeight: 10, top: 0 },
    xAxis: {
      type: 'category',
      data: members,
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisLine: { lineStyle: { color: '#1e3a5f' } }
    },
    yAxis: [
      {
        type: 'value',
        name: '°C',
        nameTextStyle: { color: '#475569', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1e3a5f', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 }
      },
      {
        type: 'value',
        name: 'm/s',
        nameTextStyle: { color: '#475569', fontSize: 10 },
        splitLine: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 10 }
      }
    ],
    series: [
      {
        name: 'Temperature',
        type: 'bar',
        data: temps.map((t, i) => ({ value: t, itemStyle: { color: MEMBER_COLORS[members[i]] || '#3b82f6' } })),
        yAxisIndex: 0,
      },
      {
        name: 'Wind Speed',
        type: 'bar',
        data: winds.map((w, i) => ({ value: w, itemStyle: { color: 'rgba(148, 163, 184, 0.3)' } })),
        yAxisIndex: 1,
      }
    ]
  };

  const tempsArr = temps.filter(t => t != null);
  const avgTemp = tempsArr.length ? (tempsArr.reduce((a, b) => a + b, 0) / tempsArr.length).toFixed(1) : '--';
  
  const capesArr = capes.filter(c => c != null);
  const avgCape = capesArr.length ? Math.round(capesArr.reduce((a, b) => a + b, 0) / capesArr.length) : '--';
  
  const heightsArr = heights.filter(h => h != null);
  const avgHeight = heightsArr.length ? Math.round(heightsArr.reduce((a, b) => a + b, 0) / heightsArr.length) : '--';

  return (
    <div className="mt-4">
      <div className="text-xs text-[#94a3b8] uppercase tracking-widest mb-1">850 hPa Atmospheric State</div>
      <div className="text-[10px] text-[#475569] mb-2 italic">{atmosphere.disclaimer}</div>
      <div className="bg-[#0d1829] rounded border border-[#1e3a5f] p-2">
        <ReactECharts option={option} style={{ height: '180px', width: '100%' }} />
      </div>
      {tempsArr.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="p-2 bg-[#0d1829] rounded border border-[#1e3a5f]">
            <div className="text-[10px] text-[#475569] uppercase">Avg Temp</div>
            <div className="text-sm text-white mono font-medium mt-0.5">{avgTemp}°C</div>
          </div>
          <div className="p-2 bg-[#0d1829] rounded border border-[#1e3a5f]">
            <div className="text-[10px] text-[#475569] uppercase">500hPa Height</div>
            <div className="text-sm text-white mono font-medium mt-0.5">{avgHeight} m</div>
          </div>
          <div className="p-2 bg-[#0d1829] rounded border border-[#1e3a5f]">
            <div className="text-[10px] text-[#475569] uppercase">Avg CAPE</div>
            <div className="text-sm text-white mono font-medium mt-0.5">{avgCape} J/kg</div>
          </div>
        </div>
      )}
    </div>
  );
}
