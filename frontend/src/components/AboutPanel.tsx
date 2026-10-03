import { useRef } from 'react';
import { exportElementAsPng } from '../utils/exportPng';

interface AboutPanelProps {
  onClose: () => void;
}

export default function AboutPanel({ onClose }: AboutPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={panelRef} className="absolute top-4 left-4 w-96 glass rounded-xl p-5 z-40 animate-fade-in-up max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-4">
        <div className="text-sm font-semibold text-white">Why This Is Different</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => panelRef.current && exportElementAsPng(panelRef.current, 'about_panel')}
            className="text-[9px] text-[#475569] hover:text-[#94a3b8] border border-[#1e3a5f] rounded px-1.5 py-0.5"
            title="Export as PNG for PPT"
          >📷 Export</button>
          <button onClick={onClose} className="text-[#475569] hover:text-white text-lg leading-none">×</button>
        </div>
      </div>

      <div className="space-y-4 text-xs text-[#94a3b8]">
        {/* comparison */}
        <div className="bg-[#060d1a] rounded-lg p-3 border border-[#1e3a5f]">
          <div className="text-[#475569] uppercase tracking-widest text-[10px] mb-1.5">Traditional Ensemble View</div>
          <div>Shows ensemble spread and member disagreement as a single probability field</div>
          <div className="text-[10px] text-[#475569] mt-1">{`→ "There is 40% chance of >100mm rainfall here"`}</div>
        </div>

        <div className="flex justify-center">
          <div className="w-px h-6 bg-gradient-to-b from-[#1e3a5f] to-green-500/50" />
        </div>

        <div className="bg-green-900/15 rounded-lg p-3 border border-green-500/25">
          <div className="text-green-400 uppercase tracking-widest text-[10px] mb-1.5">Our System</div>
          <div>
            Detects <strong className="text-white">persistent, member-consistent spatial scenario structures</strong> within that disagreement
          </div>
          <div className="text-[10px] text-green-400/70 mt-1">→ "Members 02 and 03 consistently agree on a 130mm event over Odisha from T+54 to T+66"</div>
        </div>

        {/* how it works */}
        <div>
          <div className="text-[10px] text-[#94a3b8] uppercase tracking-widest mb-2 font-medium">How It Works</div>
          <div className="space-y-2">
            {[
              { step: '1', title: 'Detect', desc: 'Identify extreme precipitation events per member using 95th percentile thresholds on 24h rolling accumulation' },
              { step: '2', title: 'Track', desc: 'Track events within each member across forecast hours using Hungarian assignment (centroid + IoU + intensity matching)' },
              { step: '3', title: 'Associate', desc: 'Build cross-member proximity graphs at each timestep. Members within scale_km of each other get linked' },
              { step: '4', title: 'Detect Scenarios', desc: 'Extract connected components from the proximity graph. Groups of ≥2 members = candidate scenario' },
              { step: '5', title: 'Test Persistence', desc: 'Track which member-groups recur across consecutive timesteps. Transient groupings are filtered out' },
              { step: '6', title: 'Scale Robustness', desc: 'Repeat at 50/100/150/200 km thresholds. Scenarios surviving multiple scales = robust signal' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 mono shrink-0">{step}</div>
                <div>
                  <span className="text-white text-[11px] font-medium">{title}</span>
                  <span className="text-[10px] text-[#475569] ml-1">— {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* key questions */}
        <div>
          <div className="text-[10px] text-[#94a3b8] uppercase tracking-widest mb-2 font-medium">Key Questions This Answers</div>
          <div className="space-y-1 text-[10px] text-[#94a3b8]">
            <div>✓ Is ensemble spread just noise, or does it contain structure?</div>
            <div>✓ Which members agree on the same spatial placement?</div>
            <div>✓ Does this agreement persist across multiple forecast hours?</div>
            <div>✓ Is this pattern robust to spatial scale changes?</div>
            <div>✓ What is the atmospheric context of the agreeing members?</div>
          </div>
        </div>

        {/* null-test caveat */}
        <div className="border-t border-[#1e3a5f] pt-3">
          <div className="text-[10px] text-amber-400 uppercase tracking-widest mb-2 font-medium">⚠ Scientific Validation Caveat</div>
          <div className="bg-amber-900/10 rounded-lg p-3 border border-amber-500/20 space-y-2 text-[10px]">
            <div className="text-amber-300/80">
              <strong className="text-amber-400">Null-test not yet performed.</strong> The persistence labels ("Persistent", "Emerging", etc.) are evidence-based descriptors of the observed ensemble structure. They do <strong>not</strong> claim statistical significance.
            </div>
            <div className="text-[#475569]">
              A proper null test would involve running the same detection pipeline on randomized/shuffled ensemble members to establish a baseline rate of "accidental" persistent groupings. If the observed rate significantly exceeds the null rate, the detection has statistical meaning.
            </div>
            <div className="text-[#475569]">
              Until this test is performed, all scenario labels should be interpreted as <em>"structurally interesting patterns worth investigating"</em> rather than <em>"statistically significant forecast signals."</em>
            </div>
          </div>
        </div>

        {/* tech stack */}
        <div className="border-t border-[#1e3a5f] pt-3">
          <div className="text-[10px] text-[#475569] uppercase tracking-widest mb-1.5">Tech Stack</div>
          <div className="flex flex-wrap gap-1">
            {['Python', 'FastAPI', 'xarray', 'SciPy', 'NetworkX', 'React', 'TypeScript', 'MapLibre GL', 'ECharts', 'Tailwind'].map(t => (
              <span key={t} className="text-[9px] bg-[#060d1a] border border-[#1e3a5f] rounded px-1.5 py-0.5 text-[#94a3b8] mono">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
