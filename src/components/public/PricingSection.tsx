'use client';

import React from 'react';
import Link from 'next/link';
import {
  Coins,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  FileDown,
  Layers,
  Sparkles,
} from 'lucide-react';

export const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="relative py-28 bg-[#030712] text-white border-b border-white/[0.08] scroll-mt-16 overflow-hidden">
      {/* Ambient Red Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-rose-600/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
            <Coins className="w-3.5 h-3.5 text-rose-500" />
            <span>Commercial Credit Model</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Transparent, Output-Based Pricing
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Free creation, editing, and watermarked proofing. Pay only when generating certified, unwatermarked high-resolution print-ready artifacts.
          </p>
        </div>

        {/* Mandatory Launch / Preview Notice Banner (Material 3 Glass Pill Container) */}
        <div className="max-w-3xl mx-auto p-4 sm:p-5 glass-pill rounded-2xl flex items-start space-x-3.5 text-amber-200 text-xs leading-relaxed border border-amber-500/30 shadow-lg">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-bold block mb-0.5 text-sm">
              Launch Preview Notice:
            </strong>
            The credit structure below represents the planned production commercial model. No credit card charging or payment gateway is active in Phase 7. All exports during this phase remain fully unlocked for evaluation.
          </div>
        </div>

        {/* 3-Tier Plan Grid (Material 3 Glassmorphism) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* TIER 1: Free Author Tier */}
          <div className="p-8 glass-panel hover:glass-panel-elevated rounded-[32px] flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1.5 border border-white/[0.1]">
            <div className="space-y-4">
              <span className="px-3 py-1 glass-pill text-slate-300 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">
                Author Free
              </span>
              <div>
                <h3 className="text-2xl font-black text-white">Free Forever</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Full access to design, manuscript editing &amp; proofing
                </p>
              </div>

              <div className="pt-2 flex items-baseline space-x-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-slate-400 font-mono">/ project</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 pt-4 border-t border-white/[0.08]">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited manuscript projects</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Live 2-column &amp; 1-column preview</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Interactive image cropping &amp; reflow</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Watermarked screen-proof PDFs</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500">
                  <span>No credit card required</span>
                </li>
              </ul>
            </div>

            <Link
              href="/books/new"
              className="w-full py-3.5 glass-pill hover:bg-white/[0.08] text-white rounded-xl text-xs font-bold text-center block transition-all hover:scale-[1.02] border border-white/[0.12]"
            >
              Start Free Book
            </Link>
          </div>

          {/* TIER 2: Print-Ready Export Credits (Featured) */}
          <div className="p-8 glass-panel-elevated rounded-[32px] flex flex-col justify-between space-y-6 relative border-2 border-rose-500 shadow-[0_0_50px_-8px_rgba(225,29,72,0.45)] transition-all duration-300 hover:-translate-y-2 group">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(225,29,72,0.6)]">
              Planned Model
            </div>

            <div className="space-y-4">
              <span className="px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">
                Print Credits
              </span>
              <div>
                <h3 className="text-2xl font-black text-white">Press Export</h3>
                <p className="text-xs text-slate-300 mt-1">
                  High-res unwatermarked CMYK PDF/X-4 &amp; EPUB 3
                </p>
              </div>

              <div className="pt-2 flex items-baseline space-x-1">
                <span className="text-4xl font-black text-white">1 Credit</span>
                <span className="text-xs text-rose-300 font-mono">/ publication</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200 pt-4 border-t border-white/[0.08]">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Unwatermarked certified PDF/X-4</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>100K black &amp; overprint rules</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Full-bleed &amp; crop marks generation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Valid Reflowable EPUB 3 included</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Preflight compliance report</span>
                </li>
              </ul>
            </div>

            <Link
              href="/books/new"
              className="w-full py-3.5 bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold text-center block shadow-[0_0_20px_-3px_rgba(225,29,72,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.02] border border-rose-500/40"
            >
              Get Started
            </Link>
          </div>

          {/* TIER 3: Page-Band Pricing Structure */}
          <div className="p-8 glass-panel hover:glass-panel-elevated rounded-[32px] flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1.5 border border-white/[0.1]">
            <div className="space-y-4">
              <span className="px-3 py-1 glass-pill text-slate-300 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">
                Volume Page Bands
              </span>
              <div>
                <h3 className="text-2xl font-black text-white">Page-Band Scale</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Fair volume pricing matched to publication page length
                </p>
              </div>

              {/* Page Band Breakdown Table */}
              <div className="pt-2 space-y-2 text-xs font-mono">
                <div className="p-3 bg-slate-950/80 rounded-xl flex justify-between items-center border border-white/[0.06]">
                  <span className="text-slate-300">1 – 100 pages:</span>
                  <span className="text-rose-400 font-bold">1 Credit (Standard)</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl flex justify-between items-center border border-white/[0.06]">
                  <span className="text-slate-300">101 – 250 pages:</span>
                  <span className="text-rose-400 font-bold">1.5 Credits</span>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl flex justify-between items-center border border-white/[0.06]">
                  <span className="text-slate-300">251+ pages:</span>
                  <span className="text-rose-400 font-bold">2 Credits</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] text-[11px] text-slate-400 leading-snug">
                Future add-on credits will support custom organizational font licensing and automated preflight repair workflows.
              </div>
            </div>

            <a
              href="#products"
              className="w-full py-3.5 glass-pill hover:bg-white/[0.08] text-white rounded-xl text-xs font-bold text-center block transition-all hover:scale-[1.02] border border-white/[0.12]"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
