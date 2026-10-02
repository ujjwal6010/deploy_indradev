import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MapView from './map/MapView';
import ForecastTimeline from './components/ForecastTimeline';
import ScenarioPanel from './components/ScenarioPanel';
import ScenarioDrawer from './components/ScenarioDrawer';
import RobustnessMatrix from './components/RobustnessMatrix';
import ScenarioDetectedNotification from './components/ScenarioDetectedNotification';
import EventExplorer from './components/EventExplorer';
import AboutPanel from './components/AboutPanel';
import { exportElementAsPng } from './utils/exportPng';
import { useForecastState, useScenarios, useScaleAnalysis, useCycles, useForecastReplay } from './hooks/useWeatherData';
import { FORECAST_HOURS, SCALES_KM } from './types';
import type { ScenarioPersistence } from './types';

export default function App() {
  const [currentHour, setCurrentHour] = useState(24);
  const [scaleKm, setScaleKm] = useState(50);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [notification, setNotification] = useState<ScenarioPersistence | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showSpaghetti, setShowSpaghetti] = useState(false);
  const [bottomTab, setBottomTab] = useState<'robustness' | 'events'>('robustness');
  const prevHour = useRef(currentHour);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const { data: forecastState, loading: forecastLoading } = useForecastState(currentHour, scaleKm);
  const { scenarios } = useScenarios(scaleKm);
  const { matrix } = useScaleAnalysis();
  const { cycles } = useCycles();

  const handleHourChange = useCallback((h: number) => {
    prevHour.current = currentHour;
    setCurrentHour(h);
  }, [currentHour]);

  const { isPlaying, start, stop } = useForecastReplay(handleHourChange);

  // Trigger notification when a persistent scenario first appears
  useEffect(() => {
    if (!forecastState || !scenarios.length) return;
    const emerging = scenarios.find(s =>
      s.status === 'Persistent' &&
      s.first_hour === currentHour &&
      currentHour > prevHour.current
    );
    if (emerging) setNotification(emerging);
  }, [currentHour, forecastState, scenarios]);

  const activeScenarios = scenarios.filter(
    s => s.first_hour <= currentHour && currentHour <= s.last_hour
  );

  const cycle = cycles[0];

  return (
    <div ref={dashboardRef} className="flex flex-col h-screen bg-[#060d1a] text-white overflow-hidden">
      <header className="flex items-center justify-between px-5 py-2.5 border-b border-[#1e3a5f] bg-[#0d1829] shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-sm font-bold tracking-wide text-white">
              INDRADEV
            </div>
            <div className="text-[10px] text-[#475569] mt-0.5 tracking-widest uppercase">
              Persistent member-consistent scenario detection · GEFS Ensemble
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {cycle && (
            <div className="text-right">
              <div className="text-[10px] text-[#475569] uppercase tracking-widest">Cycle</div>
              <div className="text-xs mono text-[#94a3b8]">{cycle.init_time.slice(0, 10)} 00Z</div>
            </div>
          )}
          <div className="flex gap-2 text-[10px]">
            <div className="bg-[#060d1a] border border-[#1e3a5f] rounded px-2 py-1">
              <span className="text-[#475569]">Events: </span>
              <span className="mono text-[#94a3b8]">{cycle?.total_events ?? '—'}</span>
            </div>
            <div className="bg-[#060d1a] border border-[#1e3a5f] rounded px-2 py-1">
              <span className="text-[#475569]">Tracks: </span>
              <span className="mono text-[#94a3b8]">{cycle?.total_tracks ?? '—'}</span>
            </div>
            <div className="bg-[#060d1a] border border-[#1e3a5f] rounded px-2 py-1">
              <span className="text-[#475569]">Scenarios: </span>
              <span className="mono text-green-400">{scenarios.length}</span>
            </div>
          </div>
          <button
            onClick={() => setShowSpaghetti(!showSpaghetti)}
            className={`text-[10px] border rounded px-2 py-1 transition-colors ${
              showSpaghetti 
                ? 'bg-blue-900/40 border-blue-500/50 text-blue-300' 
                : 'text-[#475569] hover:text-[#94a3b8] border-[#1e3a5f]'
            }`}
          >
            Spaghetti Plot
          </button>
          <button
            onClick={() => setShowAbout(!showAbout)}
            className="text-[10px] text-[#475569] hover:text-[#94a3b8] border border-[#1e3a5f] rounded px-2 py-1 transition-colors"
          >
            About
          </button>
          <button
            onClick={() => dashboardRef.current && exportElementAsPng(dashboardRef.current, 'dashboard_screenshot')}
            className="text-[10px] text-[#475569] hover:text-[#94a3b8] border border-[#1e3a5f] rounded px-2 py-1 transition-colors"
            title="Export full dashboard as PNG"
          >
            📷 Export
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        <div className="w-64 flex flex-col border-r border-[#1e3a5f] bg-[#0d1829] shrink-0">
          {/* Controls */}
          <div className="p-4 border-b border-[#1e3a5f] space-y-4">
            <div>
              <label className="text-[10px] text-[#475569] uppercase tracking-widest block mb-1.5">Spatial Scale</label>
              <div className="grid grid-cols-4 gap-1">
                {SCALES_KM.map(s => (
                  <button
                    key={s}
                    onClick={() => setScaleKm(s)}
                    className={`text-[10px] mono py-1 rounded border transition-all ${
                      s === scaleKm
                        ? 'bg-blue-900/40 border-blue-500/50 text-blue-300'
                        : 'bg-[#060d1a] border-[#1e3a5f] text-[#475569] hover:border-[#2e5a8f] hover:text-[#94a3b8]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="text-[9px] text-[#475569] mt-1">km grouping threshold</div>
            </div>

            <div>
              <label className="text-[10px] text-[#475569] uppercase tracking-widest block mb-1.5">
                Threshold
              </label>
              <div className="bg-[#060d1a] border border-[#1e3a5f] rounded px-2 py-1.5 text-xs mono text-[#94a3b8]">
                95th percentile
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#475569] uppercase tracking-widest block mb-1.5">
                Members
              </label>
              <div className="flex flex-wrap gap-1">
                {['gep01', 'gep02', 'gep03', 'gep04', 'gep05'].map((m, i) => {
                  const colors = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899'];
                  return (
                    <div key={m} className="flex items-center gap-1 text-[10px]">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors[i] }} />
                      <span className="mono text-[#94a3b8]">{m}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Scenario list */}
          <div className="flex-1 overflow-hidden">
            <ScenarioPanel
              scenarios={scenarios}
              selectedId={selectedScenarioId}
              currentHour={currentHour}
              onSelect={id => setSelectedScenarioId(prev => prev === id ? null : id)}
            />
          </div>
        </div>

        <div className="flex-1 relative flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <MapView
              forecastState={forecastState}
              scenarios={activeScenarios}
              selectedScenarioId={selectedScenarioId}
              onScenarioClick={setSelectedScenarioId}
              showSpaghetti={showSpaghetti}
            />

            <AnimatePresence>
              {forecastLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
                >
                  <div className="glass rounded-lg px-4 py-2 text-sm text-[#94a3b8] animate-subtle-glow">
                    Loading T+{currentHour}...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scenario detected notification */}
            <ScenarioDetectedNotification
              scenario={notification}
              onDismiss={() => setNotification(null)}
            />

            {/* About panel */}
            <AnimatePresence>
              {showAbout && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <AboutPanel onClose={() => setShowAbout(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Bottom: Robustness Matrix / Events ── */}
          <div className="h-52 border-t border-[#1e3a5f] bg-[#0d1829] flex flex-col shrink-0">
            <div className="flex border-b border-[#1e3a5f]">
              {(['robustness', 'events'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setBottomTab(tab)}
                  className={`px-4 py-2 text-[11px] uppercase tracking-widest font-medium transition-colors ${
                    bottomTab === tab ? 'tab-active text-white' : 'text-[#475569] hover:text-[#94a3b8]'
                  }`}
                >
                  {tab === 'robustness' ? 'Scale Robustness' : 'Events'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-auto">
              {bottomTab === 'robustness' ? (
                <RobustnessMatrix
                  matrix={matrix}
                  onCellClick={(h, s) => { setCurrentHour(h); setScaleKm(s); }}
                  selectedHour={currentHour}
                  selectedScale={scaleKm}
                />
              ) : (
                <EventExplorer currentHour={currentHour} onHourChange={handleHourChange} />
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedScenarioId && (
            <motion.div
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full"
            >
              <ScenarioDrawer
                scenarioId={selectedScenarioId}
                onClose={() => setSelectedScenarioId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ForecastTimeline
        currentHour={currentHour}
        isPlaying={isPlaying}
        scenarios={scenarios}
        onHourChange={handleHourChange}
        onPlay={() => start(currentHour)}
        onStop={stop}
      />
    </div>
  );
}
