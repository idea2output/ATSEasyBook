'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Layers,
  Play,
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
            <span className={`block ${getLine2FontClass()} text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-rose-500 mt-2 sm:mt-3 leading-[1.15]`}>
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
        </div>
      </div>
    </section>
  );
};
