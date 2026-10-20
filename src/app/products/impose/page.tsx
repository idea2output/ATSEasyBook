'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { ImpositionLaunchModal } from '@/components/imposition/ImpositionLaunchModal';
import {
  Layers,
  CheckCircle2,
  ArrowRight,
  Printer,
  Scissors,
  Sliders,
  Grid,
  FileCheck,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  RotateCw,
  Maximize2,
  Move,
} from 'lucide-react';

export default function ImposeProductMarketingPage() {
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-rose-600 selection:text-white font-sans">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 border-b border-neutral-900 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-600/10 border border-rose-600/30 text-rose-400 text-xs font-bold uppercase tracking-widest">
                <Layers className="w-4 h-4" />
                <span>Commercial Prepress Impose Studio</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase leading-none">
                Automated Press Sheet &amp; <br />
                <span className="text-rose-600">Signature Layouts.</span>
              </h1>

              <p className="text-lg text-neutral-300 leading-relaxed max-w-2xl">
                ATS Impose is a dedicated vector prepress imposition engine. Eliminate manual plate calculation errors with automated 8-up and 16-up signatures, dynamic paper creep compensation, registration crosshairs, and press plate gripper controls.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/Impose/"
                  id="hero-launch-impose-direct-btn"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <Layers className="w-4 h-4" />
                  <span>Launch ATS Impose</span>
                </Link>

                <button
                  type="button"
                  id="hero-open-impose-modal-btn"
                  onClick={() => setIsLaunchModalOpen(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <Sliders className="w-4 h-4 text-neutral-400" />
                  <span>Mounting &amp; Handoff Specs</span>
                </button>

                <Link
                  href="/#products"
                  className="inline-flex items-center space-x-2 px-5 py-3.5 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <span>Explore All Products</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-20 border-b border-neutral-900 bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-rose-500">
                Precision Prepress Architecture
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Engineered for High-Speed Press Runs
              </h2>
              <p className="text-sm text-neutral-400">
                Manual imposition spreadsheets and repetitive desktop templates lead to costly press plate remakes. ATS Impose replaces manual guesswork with mathematical vector layouts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
                  <Grid className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  8-Up &amp; 16-Up Press Signatures
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Generates head-to-head and foot-to-foot sheet folding arrangements with right-angle and parallel fold geometries for standard commercial folders.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
                  <Move className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Progressive Spine Creep Compensation
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Calculates sheet caliper expansion across thick signatures. Automatically shifts inner page margins outward to prevent edge text clipping during three-knife face trimming.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
                  <Scissors className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Dynamic Printer &amp; Fold Marks
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Automatically positions high-precision crop marks, folding dashes, collation steps on the signature spine, and press registration targets outside the trim box.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Custom Press Gripper &amp; Plate Margins
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Tailor plate layouts for specific press cylinders (A1, A2, B1, and custom dimensions) with dedicated gripper margin clearance and centering rules.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
                  <RotateCw className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Saddle-Stitch &amp; Perfect-Bound Modes
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Supports nested saddle-stitched wire booklets, gathered signatures for milled spine perfect-binding, and custom book block signatures with automated collation numbers.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Secure Prepress Handoff Integration
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Direct one-click handoff from ATS EasyBook and ATS Preflight via short-lived, single-use HttpOnly cookies scoped to /Impose/—zero exposed URL tokens.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Specification Matrix */}
        <section className="py-20 border-b border-neutral-900 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-rose-500">
                Engineering Specifications
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Production Standards &amp; Formats
              </h2>
              <p className="text-sm text-neutral-400">
                Comprehensive prepress parameters built to satisfy demanding commercial press operators.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 bg-neutral-950 border border-neutral-850 rounded-xl space-y-2">
                <span className="text-[11px] font-mono uppercase text-rose-400 font-bold">Sheet Standards</span>
                <p className="text-sm font-bold text-white">B1, A1, Half-Sheet, Full-Sheet</p>
                <p className="text-xs text-neutral-400">Supports standard ISO 216 paper series as well as custom web-fed press dimensions up to 64 inches.</p>
              </div>

              <div className="p-5 bg-neutral-950 border border-neutral-850 rounded-xl space-y-2">
                <span className="text-[11px] font-mono uppercase text-rose-400 font-bold">Vector Precision</span>
                <p className="text-sm font-bold text-white">0.01 pt Coordinate Accuracy</p>
                <p className="text-xs text-neutral-400">High-precision vector math ensures absolute alignment between front and back sheet passes.</p>
              </div>

              <div className="p-5 bg-neutral-950 border border-neutral-850 rounded-xl space-y-2">
                <span className="text-[11px] font-mono uppercase text-rose-400 font-bold">Mark Generators</span>
                <p className="text-sm font-bold text-white">Automated Press Targets</p>
                <p className="text-xs text-neutral-400">Generates registration crosshairs, folding indicators, bleed boundaries, and collation bar markers.</p>
              </div>

              <div className="p-5 bg-neutral-950 border border-neutral-850 rounded-xl space-y-2">
                <span className="text-[11px] font-mono uppercase text-rose-400 font-bold">CTP Bridge Ready</span>
                <p className="text-sm font-bold text-white">CIP4 / JDF Compatible</p>
                <p className="text-xs text-neutral-400">Ready for automated plate imposition ticket dispatch to Harlequin, Apogee, and Prinergy CTP RIPs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-neutral-950 text-center border-t border-neutral-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              Ready to Lay Out Press Sheets?
            </h2>
            <p className="text-neutral-400 text-sm max-w-xl mx-auto">
              Launch ATS Impose now in your browser. Configure signatures, adjust gutter creep, and export press flats without leaving the ATS Tech ecosystem.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/Impose/"
                id="cta-open-impose-workspace-btn"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg transition-transform hover:scale-[1.02]"
              >
                <Layers className="w-4 h-4" />
                <span>Open ATS Impose Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Launch & Endpoint Specs Modal */}
      <ImpositionLaunchModal
        isOpen={isLaunchModalOpen}
        onClose={() => setIsLaunchModalOpen(false)}
      />
    </div>
  );
}
