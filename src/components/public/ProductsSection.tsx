'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Layers,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Palette,
  Globe2,
  Cpu,
  Scissors,
  Printer,
  Sparkles,
} from 'lucide-react';

export const ProductsSection: React.FC = () => {
  return (
    <section id="products" className="relative py-28 bg-[#030712] text-white border-b border-white/[0.08] scroll-mt-16 overflow-hidden">
      {/* Ambient Red Glow in Background */}
      <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-rose-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-rose-700/8 blur-[100px] pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>ATS Core Product Suite</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Engineered for Precision Print &amp; Publishing
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Two foundational technological pillars powering the complete cycle from raw manuscript to commercial offset press output.
          </p>
        </div>

        {/* 2-Card Bento Product Grid (Material 3 Glassmorphism) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PRODUCT 1: ATS EasyBook */}
          <div className="p-8 sm:p-10 glass-panel-elevated hover:border-rose-500/50 rounded-[32px] flex flex-col justify-between space-y-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-15px_rgba(225,29,72,0.25)] group">
            {/* Red Accent Radial Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/15 blur-3xl pointer-events-none group-hover:bg-rose-600/25 transition-all" />

            <div className="space-y-6">
              {/* Product Badge & Header */}
              <div className="flex items-center justify-between">
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
                  <BookOpen className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-full font-mono shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  Live &amp; Operational
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  ATS EasyBook
                </h3>
                <p className="text-sm font-semibold text-rose-400 font-mono mt-1">
                  Automated Book Layout &amp; Prepress Studio
                </p>
              </div>

              {/* Purpose */}
              <p className="text-slate-300 text-sm leading-relaxed">
                Transforms structured manuscript Markdown into publication-ready book spreads with accurate text-flow pagination, image anchoring, certified CMYK output intents, and native Arabic, Urdu, and Hindi typography.
              </p>

              {/* Key Features */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Key Technical Capabilities:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Accurate DOM text-flow reflow</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>1-col and 2-col balanced pagination</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>FOGRA39 &amp; FOGRA51 CMYK PDF/X-4</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>100K body black &amp; overprint</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>RTL Arabic &amp; Urdu Nastaliq</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Accessible Reflowable EPUB 3</span>
                  </li>
                </ul>
              </div>

              {/* Intended Users */}
              <div className="pt-3 text-xs text-slate-400 border-t border-white/[0.08]">
                <strong className="text-slate-200">Intended Users:</strong> Authors, book designers, academic presses, multilingual publishers, and self-publishing platforms.
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/books/new"
                className="px-6 py-3.5 bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_-3px_rgba(225,29,72,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.02] border border-rose-500/40 flex items-center space-x-2"
              >
                <span>Launch EasyBook Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard"
                className="px-5 py-3.5 glass-pill hover:bg-white/[0.08] text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-white/[0.12]"
              >
                <span>View Library</span>
              </Link>
            </div>
          </div>

          {/* PRODUCT 2: ATS Imposition */}
          <div className="p-8 sm:p-10 glass-panel-elevated hover:border-white/[0.25] rounded-[32px] flex flex-col justify-between space-y-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.5)] group">
            {/* Ambient Neutral Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/[0.03] blur-3xl pointer-events-none group-hover:bg-white/[0.06] transition-all" />

            <div className="space-y-6">
              {/* Product Badge & Header */}
              <div className="flex items-center justify-between">
                <div className="p-3.5 bg-white/[0.06] border border-white/[0.12] rounded-2xl text-slate-300 shadow-inner">
                  <Layers className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 bg-white/[0.06] text-slate-300 border border-white/[0.12] text-xs font-bold rounded-full font-mono">
                  Engine Architecture Ready
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  ATS Imposition
                </h3>
                <p className="text-sm font-semibold text-slate-400 font-mono mt-1">
                  Commercial Press Sheet &amp; Signature Optimization
                </p>
              </div>

              {/* Purpose */}
              <p className="text-slate-300 text-sm leading-relaxed">
                Automates the imposition of multi-page book signatures for sheet-fed and web offset presses. Configures saddle-stitch and perfect-bound signatures with automated creep compensation, gutter calculation, and CTP plate registration marks.
              </p>

              {/* Key Features */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Key Technical Capabilities:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>8-page &amp; 16-page press signatures</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Automated binding creep compensation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Head-to-head &amp; foot-to-foot schemes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Custom sheet sizes &amp; gripper margins</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Dynamic registration &amp; fold marks</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>100K registration color verification</span>
                  </li>
                </ul>
              </div>

              {/* Intended Users */}
              <div className="pt-3 text-xs text-slate-400 border-t border-white/[0.08]">
                <strong className="text-slate-200">Intended Users:</strong> Commercial print shops, bindery technicians, prepress operators, and print production coordinators.
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <a
                href="#how-it-works"
                className="px-6 py-3.5 glass-pill hover:bg-white/[0.08] text-white rounded-xl text-xs font-bold border border-white/[0.14] transition-all flex items-center space-x-2"
              >
                <span>View Imposition Specs</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <span className="text-[11px] text-slate-400 font-mono">
                Integrated with EasyBook PDF export pipeline
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
