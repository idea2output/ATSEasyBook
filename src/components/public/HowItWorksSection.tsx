'use client';

import React from 'react';
import {
  FileText,
  Sliders,
  Eye,
  FileCheck2,
  Printer,
  Layers,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const easyBookSteps = [
    {
      step: '01',
      title: 'Manuscript & Template',
      desc: 'Author in structured Markdown or import existing manuscripts. Select standard book geometries (6 × 9, Digest, Paperback, A4) or define custom trim sizes.',
      icon: <FileText className="w-5 h-5 text-rose-500" />,
    },
    {
      step: '02',
      title: 'Accurate Text Flow',
      desc: 'The layout engine measures true typographic point dimensions. Text flows seamlessly through columns with strict 2-line widow/orphan protection and zero dead space.',
      icon: <Sliders className="w-5 h-5 text-rose-500" />,
    },
    {
      step: '03',
      title: 'Visual Proofing & Art',
      desc: 'Anchor figures with inline, full-width, or float-wrap positioning. Inspect mirrored two-page spreads with spine crease simulations and gutter creep awareness.',
      icon: <Eye className="w-5 h-5 text-rose-500" />,
    },
    {
      step: '04',
      title: 'Preflight & CMYK Audits',
      desc: 'Verify resolution (min 300 DPI), font subset embedding, bleed margins, and CMYK compliance (FOGRA39, FOGRA51, GRACoL) with 100K body black enforcement.',
      icon: <FileCheck2 className="w-5 h-5 text-rose-500" />,
    },
    {
      step: '05',
      title: 'Print-Ready Export',
      desc: 'Produce certified PDF/X-4 print files with crop marks, embedded ICC output intents, and black overprint (/GS_OP), plus accessible reflowable EPUB 3 files.',
      icon: <Printer className="w-5 h-5 text-rose-500" />,
    },
  ];

  const impositionSteps = [
    {
      phase: 'Phase 1: Input & Geometry',
      desc: 'Takes the exported multi-page publication PDF and parses trim, bleed, and safe zones.',
    },
    {
      phase: 'Phase 2: Press Sheet Matching',
      desc: 'Matches signatures to target commercial press sheet dimensions (e.g. 28 × 40 in or B1/B2 offset sheets).',
    },
    {
      phase: 'Phase 3: Creep & Gutter Compensation',
      desc: 'Calculates progressive paper thickness creep based on paper caliper (PPI) to ensure precise margins when folded.',
    },
    {
      phase: 'Phase 4: Plate & Signature Output',
      desc: 'Generates 8-up or 16-up imposed signature flats with fold marks, collation numbers, and registration marks.',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-28 bg-[#030712] text-white border-b border-white/[0.08] scroll-mt-16 overflow-hidden">
      {/* Ambient Red Glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-rose-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Workflow Engineering</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            How ATS Tech Powers the Production Pipeline
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Eliminating the manual handoffs between editorial manuscript drafting, typographic pagination, preflight auditing, and commercial imposition.
          </p>
        </div>

        {/* Part 1: EasyBook 5-Step Process (Material 3 Glassmorphic Cards) */}
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-rose-600 shadow-[0_0_10px_#f43f5e]" />
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              ATS EasyBook Publishing Pipeline
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {easyBookSteps.map((s, idx) => (
              <div
                key={s.step}
                className="p-6 glass-panel hover:glass-panel-elevated hover:border-rose-500/50 rounded-2xl flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(225,29,72,0.18)] group relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/25 px-2.5 py-1 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.2)]">
                      STEP {s.step}
                    </span>
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl group-hover:bg-rose-500/20 group-hover:border-rose-500/40 transition-colors">
                      {s.icon}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                    {s.title}
                  </h4>

                  <p className="text-slate-300 text-xs leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                <div className="pt-2 text-[10px] font-mono text-slate-500 font-medium">
                  Step {idx + 1} of 5
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 2: ATS Imposition Workflow (Material 3 Elevated Glass Console) */}
        <div className="p-8 sm:p-10 glass-panel-elevated rounded-[28px] border border-white/[0.12] space-y-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-white/[0.06] border border-white/[0.12] rounded-2xl text-slate-200 shadow-inner">
                <Layers className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  ATS Imposition Engine Workflow
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Prepress Signature Layout Architecture for Commercial Offset &amp; Digital Presses
                </p>
              </div>
            </div>

            <span className="px-3.5 py-1.5 glass-pill text-rose-400 rounded-full font-mono text-xs font-bold w-fit shadow-md">
              CTP Bridge Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {impositionSteps.map((st, i) => (
              <div
                key={i}
                className="p-5 bg-slate-950/80 border border-white/[0.08] hover:border-rose-500/40 rounded-xl space-y-2.5 transition-all group"
              >
                <div className="text-xs font-mono font-bold text-rose-400 group-hover:text-rose-300 transition-colors">
                  {st.phase}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
