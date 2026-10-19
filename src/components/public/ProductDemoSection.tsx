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
} from 'lucide-react';

export const ProductDemoSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'easybook' | 'imposition'>('easybook');

  return (
    <section className="py-20 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-500 font-mono text-xs uppercase tracking-wider font-bold">
              <span>Interactive Architecture Showcase</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
              Experience the Precision Engine
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xl">
              Fictional editorial demonstration illustrating accurate text flow, 2-column balancing, and 16-page press signature imposition.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('easybook')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'easybook'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>ATS EasyBook Demo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('imposition')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'imposition'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>ATS Imposition Demo</span>
            </button>
          </div>
        </div>

        {/* Demo Stage Container */}
        <div className="border border-slate-800 rounded-2xl bg-slate-950 shadow-2xl overflow-hidden">
          {/* Mock Browser / Window Titlebar */}
          <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[11px] text-slate-400">
                {activeTab === 'easybook'
                  ? 'ats://easybook.studio/preview/the-arctic-sea#6x9-two-col'
                  : 'ats://imposition.press/signatures/sheet-4up-perfect-bind'}
              </span>
            </div>

            <div className="hidden sm:flex items-center space-x-3 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {activeTab === 'easybook' ? 'CMYK: FOGRA39 Verified' : 'Sheet: 28 × 40 in'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono">100K Overprint: Active</span>
            </div>
          </div>

          {/* Interactive Screen Display */}
          {activeTab === 'easybook' ? (
            /* EASYBOOK DEMO: Accurate 2-Column Spread */
            <div className="p-6 md:p-10 bg-slate-950 flex flex-col items-center">
              <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-xl border border-slate-800 shadow-inner">
                {/* Verso Page 2 (Left) */}
                <div className="bg-white text-slate-900 rounded shadow-md p-6 aspect-[6/9] flex flex-col justify-between text-[11px] leading-relaxed relative overflow-hidden">
                  {/* Spine Indicator Left */}
                  <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-slate-200/80 to-transparent pointer-events-none" />

                  {/* Running Header */}
                  <div className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1 flex justify-between">
                    <span>Captain Arthur Vance</span>
                    <span className="font-mono">2</span>
                  </div>

                  {/* Two Column Text Flow */}
                  <div className="grid grid-cols-2 gap-3 flex-1 pt-3">
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
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[9px] font-mono text-slate-600">
                        Figure 2: Sounding logs verified against tidal chart data.
                      </div>
                    </div>
                  </div>

                  {/* Running Footer */}
                  <div className="text-[9px] text-center text-slate-400 pt-1">
                    [ATS Accurate Text Flow Engine • 0 Empty Gaps]
                  </div>
                </div>

                {/* Recto Page 3 (Right) */}
                <div className="bg-white text-slate-900 rounded shadow-md p-6 aspect-[6/9] flex flex-col justify-between text-[11px] leading-relaxed relative overflow-hidden">
                  {/* Spine Indicator Right */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-slate-200/80 to-transparent pointer-events-none" />

                  {/* Running Header */}
                  <div className="text-[9px] uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1 flex justify-between">
                    <span className="font-mono">3</span>
                    <span>The Arctic Expedition</span>
                  </div>

                  {/* Two Column Flow Continuous */}
                  <div className="grid grid-cols-2 gap-3 flex-1 pt-3">
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
                  <div className="text-[9px] text-center text-slate-400 pt-1">
                    FOGRA39 / ISO Coated v2 • Pure 100K Vector Black
                  </div>
                </div>
              </div>

              {/* Engine Metrics Callout */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-500" />
                  <span>Balanced Column Heights: 100% Vertical Fill</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-500" />
                  <span>Widow/Orphan Protection (Min 2 Lines)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-500" />
                  <span>Real DOM Typographic Points</span>
                </span>
              </div>
            </div>
          ) : (
            /* IMPOSITION DEMO: 16-Page Signature Press Sheet */
            <div className="p-6 md:p-10 bg-slate-950 flex flex-col items-center">
              <div className="max-w-4xl w-full bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                  <span>Press Signature: 8-Page Sheet (Sheet 1 Front)</span>
                  <span className="text-rose-400 font-bold">Gripper Margin: 0.5 in • Bleed: 0.125 in</span>
                </div>

                {/* Simulated 4-Up Imposition Grid */}
                <div className="grid grid-cols-4 gap-2.5 p-4 bg-slate-950 rounded-lg border border-dashed border-slate-700">
                  {/* Page 5 (Upside down in head-to-head imposition) */}
                  <div className="bg-slate-800 p-3 rounded border border-slate-700 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-slate-400">Page 5 [Head]</span>
                    <div className="text-xs font-bold text-slate-300">Text Content</div>
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                  </div>

                  {/* Page 12 (Upside down) */}
                  <div className="bg-slate-800 p-3 rounded border border-slate-700 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-slate-400">Page 12 [Head]</span>
                    <div className="text-xs font-bold text-slate-300">Text Content</div>
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                  </div>

                  {/* Page 9 (Upside down) */}
                  <div className="bg-slate-800 p-3 rounded border border-slate-700 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-slate-400">Page 9 [Head]</span>
                    <div className="text-xs font-bold text-slate-300">Text Content</div>
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                  </div>

                  {/* Page 8 (Upside down) */}
                  <div className="bg-slate-800 p-3 rounded border border-slate-700 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-slate-400">Page 8 [Head]</span>
                    <div className="text-xs font-bold text-slate-300">Text Content</div>
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                  </div>

                  {/* Bottom Row (Right side up) */}
                  {/* Page 4 */}
                  <div className="bg-slate-800 p-3 rounded border border-slate-700 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                    <div className="text-xs font-bold text-slate-300">Text Content</div>
                    <span className="text-[10px] font-mono text-slate-400">Page 4 [Foot]</span>
                  </div>

                  {/* Page 13 */}
                  <div className="bg-slate-800 p-3 rounded border border-slate-700 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                    <div className="text-xs font-bold text-slate-300">Text Content</div>
                    <span className="text-[10px] font-mono text-slate-400">Page 13 [Foot]</span>
                  </div>

                  {/* Page 16 */}
                  <div className="bg-slate-800 p-3 rounded border border-slate-700 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-rose-400">Creep: +0.012 in</span>
                    <div className="text-xs font-bold text-slate-300">Text Content</div>
                    <span className="text-[10px] font-mono text-slate-400">Page 16 [Foot]</span>
                  </div>

                  {/* Page 1 */}
                  <div className="bg-rose-950/40 p-3 rounded border border-rose-600/60 text-center flex flex-col justify-between h-36">
                    <span className="text-[10px] font-mono text-rose-400 font-bold">Opening Cover</span>
                    <div className="text-xs font-bold text-white">Title Page 1</div>
                    <span className="text-[10px] font-mono text-slate-400">Page 1 [Foot]</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2">
                  <span>Signatures: Saddle-Stitch &amp; Perfect-Bound Schemes</span>
                  <span className="text-rose-400 font-mono font-bold">Automated Gutter &amp; Creep Compensation</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
