'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Layers,
  ArrowRight,
  Sparkles,
  Printer,
  CheckCircle2,
  FileText,
  Play,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';

interface HeroSectionProps {
  onLoadSampleBook?: () => void;
  isCreatingBook?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLoadSampleBook,
  isCreatingBook = false,
}) => {
  const router = useRouter();
  const [activeVisualTab, setActiveVisualTab] = useState<'transformation' | 'imposition'>('transformation');
  const [fontPairing, setFontPairing] = useState<'palagio-sans' | 'palagio-manrope' | 'tenor-manrope' | 'syne-inter' | 'playfair-manrope'>('palagio-sans');

  const getLine1FontClass = () => {
    switch (fontPairing) {
      case 'tenor-manrope':
        return 'font-tenor';
      case 'syne-inter':
        return 'font-syne';
      case 'playfair-manrope':
        return 'font-playfair';
      case 'palagio-sans':
      case 'palagio-manrope':
      default:
        return 'font-palagio';
    }
  };

  const getLine2FontClass = () => {
    switch (fontPairing) {
      case 'palagio-manrope':
      case 'tenor-manrope':
      case 'playfair-manrope':
        return 'font-manrope';
      case 'syne-inter':
      case 'palagio-sans':
      default:
        return 'font-hero-sans';
    }
  };

  return (
    <section className="relative bg-[#07080b] text-white border-b border-neutral-800/80 overflow-hidden">
      {/* Ambient Red Glow for Depth */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-rose-600/[0.08] blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-2/3 right-10 w-[400px] h-[400px] bg-slate-800/[0.15] blur-[120px] pointer-events-none rounded-full" />

      {/* 1. Full-Screen Hero Viewport Container */}
      <div id="hero-viewport-stage" className="min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10 text-center">
        <div className="max-w-5xl mx-auto space-y-8 flex flex-col items-center">
          {/* Subtle Category Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-600/10 border border-rose-600/30 text-rose-400 text-xs font-mono font-bold uppercase tracking-widest shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Commercial Publishing &amp; Prepress Technology</span>
          </div>

          {/* Headline: Line 1 Palagio + Line 2 Sans Serif */}
          <h1 className="tracking-tight text-center">
            <span className={`block ${getLine1FontClass()} text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#f1f3f7] leading-[1.12]`}>
              Create Books. Prepare Print.
            </span>
            <span className={`block ${getLine2FontClass()} text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-rose-500 mt-3 sm:mt-5 leading-[1.12]`}>
              Deliver with Confidence.
            </span>
          </h1>

          {/* Supporting Text: Softened Off-White per Dark Mode Best Practices */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-300 leading-relaxed font-normal max-w-2xl mx-auto">
            ATS Tech brings book creation, print-ready PDF production, prepress tools, and production workflows into one professional platform.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {/* Primary CTA */}
            <Link
              href="/books/new"
              id="create-new-book-btn"
              className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rose-950/40 flex items-center justify-center space-x-2.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>Create a Book</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Secondary CTA */}
            <Link
              href="#products"
              id="hero-explore-products-btn"
              className="px-7 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-sm font-bold border border-neutral-700 hover:border-neutral-600 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Explore ATS Products</span>
              <Layers className="w-4 h-4 text-neutral-400" />
            </Link>

            {/* Tertiary Action: Watch How It Works */}
            <a
              href="#how-it-works"
              id="hero-watch-works-btn"
              className="px-6 py-4 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2 border border-neutral-800"
            >
              <Play className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Watch How It Works</span>
            </a>

            {/* Sample Novel Launcher */}
            <button
              type="button"
              id="load-sample-novel-btn"
              onClick={onLoadSampleBook}
              disabled={isCreatingBook}
              className="px-4 py-4 text-neutral-400 hover:text-white text-xs font-mono transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              title="Launch sample novel with fictional manuscript data"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isCreatingBook ? 'Loading...' : 'Try Sample Novel'}</span>
            </button>
          </div>

          {/* Typography Suggestions Pill (Interactive Font Pairing Preview) */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-neutral-400">
            <span className="text-neutral-500 uppercase tracking-wider font-semibold mr-1">Suggested Pairings:</span>
            <button
              type="button"
              id="font-pairing-palagio-sans"
              onClick={() => setFontPairing('palagio-sans')}
              className={`px-3 py-1 rounded-full border transition-all ${
                fontPairing === 'palagio-sans'
                  ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 font-bold'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400'
              }`}
            >
              Palagio (Original) + Inter
            </button>
            <button
              type="button"
              id="font-pairing-palagio-manrope"
              onClick={() => setFontPairing('palagio-manrope')}
              className={`px-3 py-1 rounded-full border transition-all ${
                fontPairing === 'palagio-manrope'
                  ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 font-bold'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400'
              }`}
            >
              Palagio + Manrope
            </button>
            <button
              type="button"
              id="font-pairing-tenor-manrope"
              onClick={() => setFontPairing('tenor-manrope')}
              className={`px-3 py-1 rounded-full border transition-all ${
                fontPairing === 'tenor-manrope'
                  ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 font-bold'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400'
              }`}
            >
              Tenor Sans (Similar) + Manrope
            </button>
            <button
              type="button"
              id="font-pairing-syne-inter"
              onClick={() => setFontPairing('syne-inter')}
              className={`px-3 py-1 rounded-full border transition-all ${
                fontPairing === 'syne-inter'
                  ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 font-bold'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400'
              }`}
            >
              Syne + Inter
            </button>
            <button
              type="button"
              id="font-pairing-playfair-manrope"
              onClick={() => setFontPairing('playfair-manrope')}
              className={`px-3 py-1 rounded-full border transition-all ${
                fontPairing === 'playfair-manrope'
                  ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 font-bold'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400'
              }`}
            >
              Playfair + Manrope
            </button>
          </div>

          {/* Scroll Cue to Live Demonstration */}
          <a
            href="#demo-interactive"
            className="pt-6 sm:pt-10 inline-flex flex-col items-center space-y-1.5 text-neutral-400 hover:text-white transition-colors group cursor-pointer"
            aria-label="Scroll down to interactive demonstration"
          >
            <span className="text-[11px] font-mono tracking-widest uppercase">Explore Live Prepress Engine</span>
            <ChevronDown className="w-4 h-4 text-rose-500 animate-bounce group-hover:text-rose-400" />
          </a>
        </div>
      </div>

      {/* 2. Dedicated Interactive Product Demonstration (Below the Full-Screen Hero Viewport) */}
      <div id="demo-interactive" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 space-y-6 border-t border-neutral-900 scroll-mt-20 relative z-10">
          {/* Demonstration Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-neutral-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold">
                Interactive Product Demonstration:
              </span>
            </div>

            <div className="flex p-1 bg-neutral-900 rounded-lg border border-neutral-800 text-xs font-bold">
              <button
                type="button"
                id="tab-easybook"
                onClick={() => setActiveVisualTab('transformation')}
                className={`px-4 py-2 rounded-md transition-all flex items-center space-x-2 ${
                  activeVisualTab === 'transformation'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Manuscript to Book Spread</span>
              </button>
              <button
                type="button"
                id="tab-imposition"
                onClick={() => setActiveVisualTab('imposition')}
                className={`px-4 py-2 rounded-md transition-all flex items-center space-x-2 ${
                  activeVisualTab === 'imposition'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Press Signature Impose</span>
              </button>
            </div>
          </div>

          {/* Showcase Display Container */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            {activeVisualTab === 'transformation' ? (
              /* TAB 1: Real Manuscript-to-Page Transformation */
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
                {/* Left Side: Source Manuscript (Fictional Data) */}
                <div className="lg:col-span-5 p-6 sm:p-8 bg-[#0a0a0f] space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-neutral-800 pb-2">
                      <span className="flex items-center space-x-2">
                        <FileText className="w-3.5 h-3.5 text-rose-500" />
                        <span className="text-neutral-200 font-bold">manuscript.md</span>
                      </span>
                      <span className="text-[10px] uppercase text-neutral-500">Source Manuscript</span>
                    </div>

                    <div className="font-mono text-xs text-neutral-300 space-y-3 leading-relaxed bg-black/60 p-4 rounded-lg border border-neutral-850">
                      <p className="text-rose-400 font-bold"># The Arctic Voyage</p>
                      <p className="text-neutral-400">## Chapter II: Beyond the 78th Parallel</p>
                      <p className="text-neutral-300">
                        The pack ice groaned beneath the hull as the steamer entered uncharted waters. Every sound was magnified in the crystalline stillness of the Arctic morning.
                      </p>
                      <p className="text-neutral-400">
                        Navigation instruments registered steady drift southward, yet Captain Vance held course toward the meridian.
                      </p>
                      <p className="text-amber-400/90 text-[11px]">
                        ![Admiralty Cove Chart](images/polar-soundings.png)
                      </p>
                      <p className="text-neutral-400 text-[11px]">
                        *Figure 2: Sounding logs verified against tidal chart data.*
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-400 font-mono flex items-center justify-between pt-2">
                    <span>Structured Markdown</span>
                    <span className="text-rose-500 font-semibold">Live Reflow Active →</span>
                  </div>
                </div>

                {/* Right Side: Faithful Rendered Book Spread */}
                <div className="lg:col-span-7 p-6 sm:p-8 bg-neutral-900/60 flex flex-col justify-between space-y-6">
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-neutral-800 pb-2">
                    <span className="font-bold text-neutral-200">ATS EasyBook Rendered Spread (6 × 9 in)</span>
                    <span className="text-emerald-400 font-semibold">✓ Certified FOGRA39 CMYK</span>
                  </div>

                  {/* Two-Page Spread Mockup with Realistic Print Styling */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Verso Page (Left) */}
                    <div className="bg-white text-neutral-900 rounded-sm shadow-md p-5 aspect-[6/9] flex flex-col justify-between text-[11px] leading-relaxed relative overflow-hidden">
                      <div className="text-[9px] uppercase tracking-widest text-neutral-500 border-b border-neutral-200 pb-1 flex justify-between font-mono">
                        <span>The Polar Expedition</span>
                        <span className="font-bold text-neutral-900">14</span>
                      </div>

                      <div className="space-y-2 flex-1 pt-2.5">
                        <h4 className="text-xs font-bold text-neutral-900 tracking-tight">
                          Chapter II — Beyond the 78th Parallel
                        </h4>
                        <p className="font-serif text-[10.5px] leading-snug text-neutral-800 text-justify">
                          <span className="float-left text-2xl font-bold leading-none pr-1.5 pt-0.5 text-rose-600 font-sans">T</span>
                          he pack ice groaned beneath the hull as the steamer entered uncharted waters. Every sound was magnified in the crystalline stillness of the Arctic morning. Navigation instruments registered steady drift southward, yet Captain Vance held course toward the meridian.
                        </p>
                        <p className="font-serif text-[10.5px] leading-snug text-neutral-700 text-justify">
                          The crew worked in four-hour watches, clearing salt rime from the rigging while coal bunkers were measured against the calculated voyage duration.
                        </p>
                      </div>

                      <div className="text-[8.5px] text-neutral-400 border-t border-neutral-100 pt-1 font-mono text-center">
                        Balanced Column Fill • 0 Dropped Words
                      </div>
                    </div>

                    {/* Recto Page (Right) */}
                    <div className="bg-white text-neutral-900 rounded-sm shadow-md p-5 aspect-[6/9] flex flex-col justify-between text-[11px] leading-relaxed relative overflow-hidden">
                      <div className="text-[9px] uppercase tracking-widest text-neutral-500 border-b border-neutral-200 pb-1 flex justify-between font-mono">
                        <span className="font-bold text-neutral-900">15</span>
                        <span>Atmospheric Observations</span>
                      </div>

                      <div className="space-y-2 flex-1 pt-2.5">
                        <p className="font-serif text-[10.5px] leading-snug text-neutral-800 text-justify">
                          Barometric pressure dropped steadily toward nightfall, foretelling an approaching gale. Observation logs were sealed in tin cases and secured to the chart-table bulkheads.
                        </p>
                        <div className="p-2 bg-neutral-100 border border-neutral-300 rounded text-[9px] font-mono text-neutral-700">
                          Figure 2: Sounding logs verified against tidal chart data.
                        </div>
                        <p className="font-serif text-[10.5px] leading-snug text-neutral-700 text-justify">
                          By midnight, sea smoke rose in dense plumes from fissures in the floe, obscuring the horizon.
                        </p>
                      </div>

                      <div className="text-[8.5px] text-neutral-400 border-t border-neutral-100 pt-1 font-mono text-center">
                        Pure 100K Vector Black • Overprint Active
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 font-mono pt-1">
                    <span>Trim: 6.00 × 9.00 in</span>
                    <span>Bleed: 0.125 in (9pt)</span>
                    <span className="text-neutral-300">Format: PDF/X-4</span>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: Press Signature Imposition Demonstration */
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Commercial 8-Up Press Signature Layout
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Standard head-to-head offset sheet arrangement with automated creep compensation.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-rose-500 font-bold">
                    Sheet Size: 28 × 40 in • Gripper: 0.5 in
                  </span>
                </div>

                {/* Imposition Sheet Grid */}
                <div className="grid grid-cols-4 gap-3 p-4 bg-black rounded-xl border border-neutral-800">
                  {/* Top Row: Head-to-Head (Rotated for folding) */}
                  <div className="bg-neutral-900 p-3 rounded border border-neutral-800 text-center flex flex-col justify-between h-32">
                    <span className="text-[10px] font-mono text-neutral-500">Page 5 [Head]</span>
                    <span className="text-xs font-bold text-neutral-300">Editorial Text</span>
                    <span className="text-[10px] font-mono text-rose-400">Creep +0.012 in</span>
                  </div>
                  <div className="bg-neutral-900 p-3 rounded border border-neutral-800 text-center flex flex-col justify-between h-32">
                    <span className="text-[10px] font-mono text-neutral-500">Page 12 [Head]</span>
                    <span className="text-xs font-bold text-neutral-300">Plate Graphic</span>
                    <span className="text-[10px] font-mono text-rose-400">Creep +0.012 in</span>
                  </div>
                  <div className="bg-neutral-900 p-3 rounded border border-neutral-800 text-center flex flex-col justify-between h-32">
                    <span className="text-[10px] font-mono text-neutral-500">Page 9 [Head]</span>
                    <span className="text-xs font-bold text-neutral-300">Editorial Text</span>
                    <span className="text-[10px] font-mono text-rose-400">Creep +0.012 in</span>
                  </div>
                  <div className="bg-neutral-900 p-3 rounded border border-neutral-800 text-center flex flex-col justify-between h-32">
                    <span className="text-[10px] font-mono text-neutral-500">Page 8 [Head]</span>
                    <span className="text-xs font-bold text-neutral-300">Editorial Text</span>
                    <span className="text-[10px] font-mono text-rose-400">Creep +0.012 in</span>
                  </div>

                  {/* Bottom Row: Foot-to-Foot */}
                  <div className="bg-neutral-900 p-3 rounded border border-neutral-800 text-center flex flex-col justify-between h-32">
                    <span className="text-[10px] font-mono text-rose-400">Creep +0.012 in</span>
                    <span className="text-xs font-bold text-neutral-300">Editorial Text</span>
                    <span className="text-[10px] font-mono text-neutral-500">Page 4 [Foot]</span>
                  </div>
                  <div className="bg-neutral-900 p-3 rounded border border-neutral-800 text-center flex flex-col justify-between h-32">
                    <span className="text-[10px] font-mono text-rose-400">Creep +0.012 in</span>
                    <span className="text-xs font-bold text-neutral-300">Editorial Text</span>
                    <span className="text-[10px] font-mono text-neutral-500">Page 13 [Foot]</span>
                  </div>
                  <div className="bg-neutral-900 p-3 rounded border border-neutral-800 text-center flex flex-col justify-between h-32">
                    <span className="text-[10px] font-mono text-rose-400">Creep +0.012 in</span>
                    <span className="text-xs font-bold text-neutral-300">Editorial Text</span>
                    <span className="text-[10px] font-mono text-neutral-500">Page 16 [Foot]</span>
                  </div>
                  <div className="bg-neutral-900 p-3 rounded border border-rose-600/50 text-center flex flex-col justify-between h-32">
                    <span className="text-[10px] font-mono text-rose-400 font-bold">Cover Signature</span>
                    <span className="text-xs font-bold text-white">Title Page 1</span>
                    <span className="text-[10px] font-mono text-neutral-500">Page 1 [Foot]</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 font-mono pt-1">
                  <span>Folding Scheme: 16-Page Right Angle Fold</span>
                  <span>Binding: Perfect Bound &amp; Saddle Stitch</span>
                  <span className="text-rose-500 font-bold">CTP Bridge Ready</span>
                </div>
              </div>
            )}
          </div>
        </div>
    </section>
  );
};
