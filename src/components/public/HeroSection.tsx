'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Layers,
  ArrowRight,
  Sparkles,
  Printer,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Sliders,
  Maximize2,
  Eye,
  Activity,
  Cpu,
} from 'lucide-react';

interface HeroSectionProps {
  onLoadSampleBook?: () => void;
  onOpenAuth?: () => void;
  isCreatingBook?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLoadSampleBook,
  onOpenAuth,
  isCreatingBook = false,
}) => {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-[#030712] text-white pt-24 pb-28 md:pt-32 md:pb-36 border-b border-white/[0.08]">
      {/* 2026 Ambient Mesh Glows in ATS Red / Crimson */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(225,29,72,0.32),transparent_70%)] blur-2xl" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] pointer-events-none bg-[radial-gradient(circle,rgba(190,18,60,0.12),transparent_65%)] blur-3xl" />
      <div className="absolute top-1/3 left-0 w-[450px] h-[450px] pointer-events-none bg-[radial-gradient(circle,rgba(225,29,72,0.1),transparent_65%)] blur-3xl" />

      {/* Modern Radial-Masked Dot Matrix Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] [background-size:24px_24px]"
        style={{
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 35%, #000 50%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 35%, #000 50%, transparent 95%)',
        }}
      />

      {/* Prepress Registration Crosshairs in Corners with Glow */}
      <div className="absolute top-8 left-8 flex items-center space-x-1 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
        <div className="w-5 h-5 border-t-2 border-l-2 border-rose-500" />
        <span className="text-[10px] font-mono text-slate-500 select-none">REG 0,0</span>
      </div>
      <div className="absolute top-8 right-8 flex items-center space-x-1 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-mono text-slate-500 select-none">TRIM 100%</span>
        <div className="w-5 h-5 border-t-2 border-r-2 border-rose-500" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Core Hero Content */}
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Eyebrow Badge: Material 3 Glassmorphic Capsule */}
          <div className="inline-flex items-center space-x-3 px-4 py-1.5 rounded-full glass-pill shadow-xl text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
            </span>
            <span className="text-slate-200 font-semibold tracking-wide">ATS Tech Platform</span>
            <span className="text-slate-600 font-mono">•</span>
            <span className="text-rose-400 font-mono font-bold uppercase tracking-wider">Phase 7 Master Release</span>
          </div>

          {/* Master Headline: High-Contrast Display Typography */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight sm:tracking-[-0.03em] leading-[1.08] text-white">
            The Complete Engineering Platform for{' '}
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-rose-400 to-rose-200 drop-shadow-[0_4px_30px_rgba(225,29,72,0.4)]">
              Modern Print &amp; Publishing
            </span>
          </h1>

          {/* Subtitle / Value Proposition */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            From structured manuscript typography and automated reflow to commercial press imposition and certified CMYK PDF/X-4 prepress. Engineered for independent authors, commercial publishers, and offset production houses.
          </p>

          {/* Core Call to Action Buttons (Material 3 Expressive State Layers) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {/* Primary Action: Create a Book */}
            <Link
              href="/books/new"
              id="create-new-book-btn"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-2xl text-sm font-bold shadow-[0_0_30px_-4px_rgba(225,29,72,0.55),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-rose-500/40 flex items-center justify-center space-x-2.5 group"
            >
              <BookOpen className="w-4 h-4 text-rose-100 group-hover:rotate-6 transition-transform" />
              <span>Create a Book</span>
              <ArrowRight className="w-4 h-4 text-rose-200 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Secondary Action: Explore Products */}
            <Link
              href="#products"
              id="hero-explore-products-btn"
              className="w-full sm:w-auto px-7 py-4 glass-pill hover:bg-white/[0.08] text-white rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/[0.14] flex items-center justify-center space-x-2"
            >
              <span>Explore Products</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </Link>

            {/* Tertiary Action: Try Sample Novel */}
            <button
              type="button"
              id="load-sample-novel-btn"
              onClick={onLoadSampleBook}
              disabled={isCreatingBook}
              className="w-full sm:w-auto px-6 py-4 glass-pill hover:bg-white/[0.08] text-slate-200 hover:text-white rounded-2xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/[0.1] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{isCreatingBook ? 'Initializing Engine...' : 'Try Sample Novel'}</span>
            </button>
          </div>
        </div>

        {/* 2026 Trend Feature: Glassmorphic Prepress Workspace Preview Console */}
        <div className="relative max-w-5xl mx-auto pt-4">
          {/* Subtle Ambient Red Flare behind the console */}
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-600/30 via-red-500/20 to-rose-600/30 rounded-[32px] blur-xl opacity-60 pointer-events-none" />

          {/* Main Glassmorphic Showcase Card */}
          <div className="relative glass-panel-elevated rounded-[28px] overflow-hidden border border-white/[0.14] shadow-2xl">
            {/* Console Header Bar */}
            <div className="px-5 py-3.5 bg-slate-950/80 border-b border-white/[0.08] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-[11px] text-slate-400 flex items-center space-x-2">
                  <span className="text-rose-400 font-bold">ATS STUDIO</span>
                  <span>/</span>
                  <span>prepress_engine_v7.cmyk</span>
                </span>
              </div>

              {/* Live Prepress Status Chips */}
              <div className="hidden sm:flex items-center space-x-3 font-mono text-[11px]">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>PDF/X-4 Validated</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
                  <Activity className="w-3 h-3" />
                  <span>100K Overprint Active</span>
                </span>
              </div>
            </div>

            {/* Console Body: Interactive Live Spread Visualization */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-950/60 to-slate-900/60 space-y-6">
              {/* Telemetry Bar: CMYK Density Swatches & Typography Readouts */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] text-xs font-mono">
                {/* CMYK Control Strips */}
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">Process Inks:</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold">C 0%</span>
                    <span className="px-2 py-0.5 rounded bg-pink-500/20 border border-pink-400/40 text-pink-300 text-[10px] font-bold">M 0%</span>
                    <span className="px-2 py-0.5 rounded bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 text-[10px] font-bold">Y 0%</span>
                    <span className="px-2 py-0.5 rounded bg-rose-600/30 border border-rose-500/60 text-white text-[10px] font-bold">K 100%</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center space-x-4 text-slate-300 text-[11px]">
                  <span>Trim: <strong className="text-white">6.00 × 9.00 in</strong></span>
                  <span>Bleed: <strong className="text-rose-400">0.125 in (9pt)</strong></span>
                  <span>Leading: <strong className="text-white">14.0 pt</strong></span>
                  <span className="hidden md:inline">Profile: <strong className="text-rose-400">FOGRA39</strong></span>
                </div>
              </div>

              {/* Two-Page Spread Mockup Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/90 p-4 sm:p-6 rounded-2xl border border-white/[0.06] shadow-inner relative">
                {/* Left Page (Verso) */}
                <div className="p-5 sm:p-6 bg-slate-900/90 rounded-xl border border-slate-800 text-slate-300 space-y-3 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-2">
                    <span>14</span>
                    <span className="uppercase tracking-widest text-slate-400">The Polar Expedition</span>
                    <span className="text-rose-400 font-bold">VERSO</span>
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    Chapter II — Beyond the 78th Parallel
                  </h4>
                  <div className="space-y-1.5 text-xs leading-relaxed text-slate-300 font-serif">
                    <p>
                      <span className="float-left text-2xl font-bold leading-none pr-1.5 pt-0.5 text-rose-400 font-sans">T</span>
                      he pack ice groaned beneath the hull as the steamer entered uncharted waters. Every sound was magnified in the crystalline stillness of the Arctic morning. Navigation instruments registered steady drift southward, yet Captain Vance held course toward the meridian.
                    </p>
                    <p className="text-slate-400">
                      The crew worked in four-hour watches, clearing salt rime from the rigging while coal bunkers were measured against the calculated voyage duration.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/80">
                    <span className="text-emerald-400">✓ 0 Dropped Words</span>
                    <span>Column 1/2 Balanced</span>
                  </div>
                </div>

                {/* Right Page (Recto) */}
                <div className="p-5 sm:p-6 bg-slate-900/90 rounded-xl border border-slate-800 text-slate-300 space-y-3 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-2">
                    <span className="text-rose-400 font-bold">RECTO</span>
                    <span className="uppercase tracking-widest text-slate-400">Atmospheric Observations</span>
                    <span>15</span>
                  </div>
                  <div className="space-y-1.5 text-xs leading-relaxed text-slate-300 font-serif">
                    <p>
                      Barometric pressure dropped steadily toward nightfall, foretelling an approaching gale. Observation logs were sealed in tin cases and secured to the chart-table bulkheads.
                    </p>
                    <p className="text-slate-400">
                      By midnight, sea smoke rose in dense plumes from fissures in the floe, obscuring the horizon and reducing visibility to less than fifty yards.
                    </p>
                    <p className="text-slate-400">
                      Lookouts maintained vigilance through the sub-zero frost, listening for pressure ridges forming along the starboard flank.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/80">
                    <span>Height: 522.0 pt</span>
                    <span className="text-rose-400 font-bold">Strict 2-Line Widow Safe</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid: 4 Material 3 Glassmorphic Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          {/* Card 1 */}
          <div className="p-5 glass-panel hover:glass-panel-elevated rounded-2xl space-y-3 transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20 group-hover:border-rose-500/40 transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">Physical Engine</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                Accurate Text Flow
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Point-measured DOM typography fills usable vertical space without premature column drops.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-5 glass-panel hover:glass-panel-elevated rounded-2xl space-y-3 transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20 group-hover:border-rose-500/40 transition-colors">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">Certified Prepress</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                CMYK &amp; Overprint
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                FOGRA39, FOGRA51, and GRACoL intents with 100K body black and vector overprint rules.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-5 glass-panel hover:glass-panel-elevated rounded-2xl space-y-3 transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20 group-hover:border-rose-500/40 transition-colors">
                <Sliders className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">Global Scripts</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                RTL &amp; Multilingual
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Native Arabic, Urdu Nastaliq, and Hindi Devanagari with mirrored margin geometry.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-5 glass-panel hover:glass-panel-elevated rounded-2xl space-y-3 transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20 group-hover:border-rose-500/40 transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">Offset Prepress</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                Press Imposition
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Multi-signature sheet imposition with binding creep compensation and direct CTP bridge.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
