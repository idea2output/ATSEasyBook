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
    <section className="relative overflow-hidden bg-slate-950 text-white pt-20 pb-24 md:pt-28 md:pb-32 border-b border-slate-900">
      {/* Precision Prepress Background Grid & Alignment Marks */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Decorative Prepress Registration Crosshairs in Corners */}
      <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-slate-700/60 pointer-events-none" />
      <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-slate-700/60 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge: Master Brand Platform */}
          <div className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs shadow-inner">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-300 font-medium">ATS Tech Master Platform</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400 font-mono font-bold">Phase 7 Live</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
            The Complete Engineering Platform for{' '}
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-rose-400 to-rose-200">
              Modern Print & Publishing
            </span>
          </h1>

          {/* Subtitle / Value Proposition */}
          <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
            From structured manuscript typography and automated reflow to commercial press imposition and certified CMYK PDF/X-4 prepress. Built for independent authors, commercial publishers, and print production houses.
          </p>

          {/* Core Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="#products"
              id="hero-explore-products-btn"
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-sm font-bold border border-slate-700 hover:border-slate-600 transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              href="/books/new"
              id="create-new-book-btn"
              className="w-full sm:w-auto px-7 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-900/40 transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Create a Book</span>
            </Link>

            <button
              type="button"
              id="load-sample-novel-btn"
              onClick={onLoadSampleBook}
              disabled={isCreatingBook}
              className="w-full sm:w-auto px-5 py-3.5 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold border border-slate-800 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{isCreatingBook ? 'Loading Engine...' : 'Try Sample Novel'}</span>
            </button>
          </div>

          {/* Key Value Highlights */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-left border-t border-slate-900/80">
            <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1">
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Accurate Text Flow</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                DOM-measured typography with zero premature column gaps.
              </p>
            </div>

            <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1">
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Certified CMYK Prepress</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                FOGRA39, FOGRA51, 100K black &amp; eligible black overprint.
              </p>
            </div>

            <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1">
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>RTL &amp; Multilingual</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Native Arabic, Urdu Nastaliq &amp; Hindi Devanagari typesetting.
              </p>
            </div>

            <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-1">
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Commercial Imposition</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Press signatures, creep compensation &amp; CTP plate output.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
