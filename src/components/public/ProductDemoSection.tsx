'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Layers,
  Sparkles,
  Printer,
  CheckCircle2,
  Maximize2,
  FileText,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';

export const ProductDemoSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'easybook' | 'imposition'>('easybook');

  return (
    <section id="demo-interactive" className="relative py-24 bg-[#030712] border-b border-white/[0.08] text-white overflow-hidden scroll-mt-16">
      {/* Ambient Red Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-rose-600/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full glass-pill text-[11px] font-mono text-rose-400 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
              <span>Interactive Architecture Showcase</span>
            </div>
            <h2 className="tracking-tight">
              <span className="block font-palagio text-3xl sm:text-5xl font-bold text-[#f1f3f7] leading-tight">
                Experience the Precision Engine.
              </span>
              <span className="block font-sans text-xl sm:text-2xl md:text-3xl font-black text-rose-500 mt-2 leading-tight">
                Live Interactive Architecture.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Fictional editorial demonstration illustrating accurate text flow, 2-column balancing, and 16-page press signature impose layouts.
            </p>
          </div>

          {/* Material 3 Segmented Tab Switcher */}
          <div className="flex p-1.5 glass-pill rounded-2xl border border-white/[0.12] self-start md:self-auto shadow-lg">
            <button
              type="button"
              id="tab-easybook"
              onClick={() => setActiveTab('easybook')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'easybook'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-[0_0_16px_rgba(225,29,72,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>ATS EasyBook Demo</span>
            </button>
            <button
              type="button"
              id="tab-imposition"
              onClick={() => setActiveTab('imposition')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'imposition'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-[0_0_16px_rgba(225,29,72,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>ATS Impose Demo</span>
            </button>
          </div>
        </div>

        {/* Demo Stage Container: 2026 Glassmorphic Window */}
        <div className="glass-panel-elevated rounded-[28px] overflow-hidden border border-white/[0.12] shadow-2xl">
          {/* Mock Titlebar */}
          <div className="px-5 py-3.5 bg-slate-950/80 border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 font-mono text-[11px] text-slate-300">
                {activeTab === 'easybook'
                  ? 'ats://easybook.studio/preview/the-arctic-sea#6x9-two-col'
                  : 'ats://impose.press/signatures/sheet-4up-perfect-bind'}
              </span>
            </div>

            <div className="hidden sm:flex items-center space-x-3 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/[0.08] text-slate-300">
                {activeTab === 'easybook' ? 'CMYK: FOGRA39 Verified' : 'Sheet: 28 × 40 in'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400 font-semibold">100K Overprint: Active</span>
            </div>
          </div>

          {/* Interactive Screen Display */}
          {activeTab === 'easybook' ? (
            /* EASYBOOK DEMO: Accurate 2-Column Spread */
            <div className="p-6 md:p-10 bg-slate-950/70 flex flex-col items-center">
              <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/60 p-6 sm:p-8 rounded-2xl border border-white/[0.08] shadow-inner">
                {/* Verso Page 2 (Left) */}
                <div className="bg-white text-slate-900 rounded-xl shadow-xl p-6 aspect-[6/9] flex flex-col justify-between text-[11px] leading-relaxed relative overflow-hidden">
                  {/* Spine Indicator Left */}
                  <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-300/60 to-transparent pointer-events-none" />

                  {/* Running Header */}
                  <div className="text-[9px] uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-1.5 flex justify-between font-mono">
                    <span>Captain Arthur Vance</span>
                    <span className="font-bold text-slate-700">2</span>
                  </div>

                  {/* Two Column Text Flow */}
                  <div className="grid grid-cols-2 gap-3.5 flex-1 pt-3">
                    <div className="space-y-1.5 text-justify">
                      <p className="font-serif">
                        The sea remained calm beneath the frozen cliffs of the northern sound. Observations were logged systematically at dawn, verifying that navigational bearings matched standard chronometer readings.
                      </p>
                      <p className="font-serif">
                        Pack ice encroached from the western horizon, yet the engine maintained steady steam pressure throughout the watch.
                      </p>
                    </div>

                    <div className="space-y-1.5 text-justify">
                      <p className="font-serif">
                        Every crew member understood the gravity of the impending freeze. Sounding lines measured thirty fathoms before contact with granite bedrock.
                      </p>
                      <div className="p-2 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono text-slate-700">
                        Figure 2: Sounding logs verified against tidal chart data.
                      </div>
                    </div>
                  </div>

                  {/* Running Footer */}
                  <div className="text-[9px] text-center text-slate-400 pt-1.5 font-mono border-t border-slate-100">
                    [ATS Accurate Text Flow Engine • 0 Empty Gaps]
                  </div>
                </div>

                {/* Recto Page 3 (Right) */}
                <div className="bg-white text-slate-900 rounded-xl shadow-xl p-6 aspect-[6/9] flex flex-col justify-between text-[11px] leading-relaxed relative overflow-hidden">
                  {/* Spine Indicator Right */}
                  <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-300/60 to-transparent pointer-events-none" />

                  {/* Running Header */}
                  <div className="text-[9px] uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-1.5 flex justify-between font-mono">
                    <span className="font-bold text-slate-700">3</span>
                    <span>The Arctic Expedition</span>
                  </div>

                  {/* Two Column Flow Continuous */}
                  <div className="grid grid-cols-2 gap-3.5 flex-1 pt-3">
                    <div className="space-y-1.5 text-justify">
                      <p className="font-serif">
                        By mid-afternoon, sunlight refracted across towering icebergs, producing brilliant halos of amber and violet along the upper atmosphere.
                      </p>
                      <p className="font-serif">
                        Scientific apparatus recorded barometric stability, confirming our decision to winter in the sheltered bay of Admiralty Cove.
                      </p>
                    </div>

                    <div className="space-y-1.5 text-justify">
                      <p className="font-serif">
                        Provisions were inventoried once more: flour, cured meat, coal reserves, and kerosene accounted for thirty-six months of continuous operation.
                      </p>
                      <p className="font-serif font-bold text-slate-800">
                        The expedition stood prepared for the deep arctic night.
                      </p>
                    </div>
                  </div>

                  {/* Running Footer */}
                  <div className="text-[9px] text-center text-slate-400 pt-1.5 font-mono border-t border-slate-100">
                    FOGRA39 / ISO Coated v2 • Pure 100K Vector Black
                  </div>
                </div>
              </div>

              {/* Engine Metrics Callout */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300 font-medium">
                <span className="flex items-center space-x-2 px-3 py-1.5 rounded-full glass-pill">
                  <CheckCircle2 className="w-4 h-4 text-rose-500" />
                  <span>Balanced Column Heights: 100% Vertical Fill</span>
                </span>
                <span className="flex items-center space-x-2 px-3 py-1.5 rounded-full glass-pill">
                  <CheckCircle2 className="w-4 h-4 text-rose-500" />
                  <span>Widow/Orphan Protection (Min 2 Lines)</span>
                </span>
                <span className="flex items-center space-x-2 px-3 py-1.5 rounded-full glass-pill">
                  <CheckCircle2 className="w-4 h-4 text-rose-500" />
                  <span>Real DOM Typographic Points</span>
                </span>
              </div>
            </div>
          ) : (
            /* IMPOSITION DEMO: 16-Page Signature Press Sheet */
            <div className="p-6 md:p-10 bg-slate-950/70 flex flex-col items-center">
              <div className="max-w-4xl w-full glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] space-y-5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/[0.08] pb-3">
                  <span>Press Signature: 8-Page Sheet (Sheet 1 Front)</span>
                  <span className="text-rose-400 font-bold">Gripper Margin: 0.5 in • Bleed: 0.125 in</span>
                </div>

                {/* Simulated 4-Up Impose Grid */}
                <div className="grid grid-cols-4 gap-3 p-4 bg-slate-950/90 rounded-xl border border-dashed border-white/[0.12]">
                  {/* Page 5 (Upside down in head-to-head impose) */}
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-slate-400">Page 5 [Head]</span>
                    <div className="text-xs font-bold text-slate-200">Text Content</div>
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                  </div>

                  {/* Page 12 */}
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-slate-400">Page 12 [Head]</span>
                    <div className="text-xs font-bold text-slate-200">Text Content</div>
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                  </div>

                  {/* Page 9 */}
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-slate-400">Page 9 [Head]</span>
                    <div className="text-xs font-bold text-slate-200">Text Content</div>
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                  </div>

                  {/* Page 8 */}
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-slate-400">Page 8 [Head]</span>
                    <div className="text-xs font-bold text-slate-200">Text Content</div>
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                  </div>

                  {/* Bottom Row */}
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                    <div className="text-xs font-bold text-slate-200">Text Content</div>
                    <span className="text-[10px] font-mono text-slate-400">Page 4 [Foot]</span>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                    <div className="text-xs font-bold text-slate-200">Text Content</div>
                    <span className="text-[10px] font-mono text-slate-400">Page 13 [Foot]</span>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                    <div className="text-xs font-bold text-slate-200">Text Content</div>
                    <span className="text-[10px] font-mono text-slate-400">Page 16 [Foot]</span>
                  </div>

                  <div className="bg-rose-950/50 p-3 rounded-lg border border-rose-500/60 text-center flex flex-col justify-between h-36 shadow-[0_0_15px_rgba(225,29,72,0.3)]">
                    <span className="text-[10px] font-mono text-rose-400 font-bold">Opening Cover</span>
                    <div className="text-xs font-bold text-white">Title Page 1</div>
                    <span className="text-[10px] font-mono text-slate-300">Page 1 [Foot]</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 pt-2 font-mono">
                  <span>Signatures: Saddle-Stitch &amp; Perfect-Bound Schemes</span>
                  <span className="text-rose-400 font-bold">Automated Gutter &amp; Creep Compensation</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
