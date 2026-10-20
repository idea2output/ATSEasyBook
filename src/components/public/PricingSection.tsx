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
    <section id="pricing" className="py-24 bg-black text-white border-b border-neutral-800 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 text-rose-500 font-mono text-xs uppercase tracking-widest font-bold">
            <span className="w-2 h-0.5 bg-rose-500" />
            <span>Commercial Credit Model</span>
          </div>
          <h2 className="tracking-tight">
            <span className="block font-palagio text-3xl sm:text-5xl font-bold text-[#f1f3f7] leading-tight">
              Clear, Output-Based Pricing.
            </span>
            <span className="block font-sans text-xl sm:text-2xl md:text-3xl font-black text-rose-500 mt-2 leading-tight">
              Pay Only for Certified Print Files.
            </span>
          </h2>
          <p className="text-neutral-300 text-base sm:text-lg leading-relaxed font-normal">
            Free creation, editing, and watermarked proofing. Pay only when generating certified, unwatermarked high-resolution print-ready files.
          </p>
        </div>

        {/* Mandatory Launch / Preview Notice Banner */}
        <div className="max-w-4xl p-5 bg-neutral-950 border border-amber-500/40 rounded-xl flex items-start space-x-3.5 text-amber-200 text-xs sm:text-sm leading-relaxed">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-bold block mb-0.5">
              Launch Preview Notice:
            </strong>
            The credit structure below represents the planned production commercial model. No credit card charging or payment gateway is active in Phase 7. All exports during this evaluation phase remain fully unlocked for testing and review.
          </div>
        </div>

        {/* 2-Tier Primary Model Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          {/* TIER 1: Free Proof Tier */}
          <div className="p-8 sm:p-10 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-neutral-900 text-neutral-300 rounded-full font-mono text-xs font-bold uppercase tracking-wider">
                  Author Free
                </span>
                <span className="text-neutral-500 font-mono text-xs font-bold">Free Forever</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">Free Proofing</h3>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Full access to manuscript authoring, template design &amp; soft-proofing
                </p>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-neutral-400 font-mono">/ project</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-neutral-300 pt-4 border-t border-neutral-900">
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited manuscript books and chapters</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Live 1-column &amp; 2-column typographic reflow</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Interactive image cropping, anchoring &amp; placement</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Watermarked screen-proof PDF generation</span>
                </li>
                <li className="flex items-center space-x-2.5 text-neutral-500">
                  <span>No credit card required to start</span>
                </li>
              </ul>
            </div>

            <Link
              href="/books/new"
              className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-850 text-white rounded-lg text-xs font-bold text-center block transition-colors border border-neutral-800"
            >
              Start Free Book
            </Link>
          </div>

          {/* TIER 2: Print-Ready Export Credits (Featured) */}
          <div className="p-8 sm:p-10 bg-neutral-950 border-2 border-rose-600 rounded-2xl flex flex-col justify-between space-y-8 relative shadow-xl">
            <div className="absolute -top-3.5 left-8 px-3.5 py-1 bg-rose-600 text-white rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
              Production Export
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-rose-600/20 text-rose-400 rounded-full font-mono text-xs font-bold uppercase tracking-wider">
                  ATS Credits
                </span>
                <span className="text-rose-400 font-mono text-xs font-bold">Certified Output</span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">Print-Ready Export</h3>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                  High-res unwatermarked CMYK PDF/X-4 &amp; accessible EPUB 3
                </p>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-4xl font-black text-white">1 Credit</span>
                <span className="text-xs text-rose-400 font-mono">/ publication</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-neutral-200 pt-4 border-t border-neutral-900">
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Certified PDF/X-4 with embedded ICC output intent</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Pure 100K body black &amp; vector overprint (/GS_OP)</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Full-bleed &amp; crop marks generation</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Valid Reflowable EPUB 3 eBook included</span>
                </li>
                <li className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Preflight compliance report with zero watermarks</span>
                </li>
              </ul>
            </div>

            <Link
              href="/books/new"
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold text-center block transition-all shadow-md"
            >
              Export a Publication
            </Link>
          </div>
        </div>

        {/* Page-Band Scale Breakdown Table */}
        <div className="max-w-5xl p-8 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-900 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                Volume Page-Band Pricing Structure
              </h3>
              <p className="text-xs text-neutral-400">
                Fair, scalable credit consumption based on final document thickness.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Transparent Credit Bands
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 bg-black rounded-lg border border-neutral-800 space-y-1">
              <span className="text-neutral-500 block">STANDARD NOVEL / ESSAY</span>
              <div className="flex justify-between items-center pt-1">
                <span className="text-white font-bold">1 – 100 pages:</span>
                <span className="text-rose-400 font-bold">1.0 Credit</span>
              </div>
            </div>

            <div className="p-4 bg-black rounded-lg border border-neutral-800 space-y-1">
              <span className="text-neutral-500 block">MEDIUM VOLUME / NON-FICTION</span>
              <div className="flex justify-between items-center pt-1">
                <span className="text-white font-bold">101 – 250 pages:</span>
                <span className="text-rose-400 font-bold">1.5 Credits</span>
              </div>
            </div>

            <div className="p-4 bg-black rounded-lg border border-neutral-800 space-y-1">
              <span className="text-neutral-500 block">LARGE VOLUME / TEXTBOOK</span>
              <div className="flex justify-between items-center pt-1">
                <span className="text-white font-bold">251+ pages:</span>
                <span className="text-rose-400 font-bold">2.0 Credits</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
