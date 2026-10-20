'use client';

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import {
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Layers,
  Palette,
  Type,
  Image as ImageIcon,
  Wrench,
  Printer,
  Sparkles,
  Download,
  FileCheck,
} from 'lucide-react';

export default function PreflightProductMarketingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-rose-600 selection:text-white font-sans">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 border-b border-neutral-900 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-600/10 border border-rose-600/30 text-rose-400 text-xs font-bold uppercase tracking-widest font-mono">
                <ShieldCheck className="w-4 h-4" />
                <span>Prepress Production Quality</span>
              </div>

              <h1 className="tracking-tight">
                <span className="block font-palagio text-4xl sm:text-6xl font-bold text-[#f1f3f7] leading-tight">
                  Eliminate Press Stops.
                </span>
                <span className="block font-sans text-2xl sm:text-3xl md:text-4xl font-black text-rose-500 mt-2 leading-tight">
                  Before Plates Are Made.
                </span>
              </h1>

              <p className="text-lg text-neutral-300 leading-relaxed max-w-2xl">
                ATS Preflight is a dedicated prepress validation and repair engine. Inspect CMYK color separations, page box geometries, font embedding, image DPI, and black overprint against real print standards—with transparent, non-destructive repair.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/preflight"
                  id="hero-launch-preflight-btn"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Launch Preflight Workspace</span>
                </Link>

                <Link
                  href="/#products"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <span>Explore All Products</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400" />
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
                Deep Prepress Verification
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Built For Real Print Production
              </h2>
              <p className="text-sm text-neutral-400">
                Most web-based PDF checkers perform shallow keyword scans. ATS Preflight parses the low-level PDF object graph, decompresses content streams, and measures actual geometric bounding boxes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Page Box Hierarchy & Bleed
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Verifies MediaBox, TrimBox, BleedBox, and CropBox relationships. Ensures standard 0.125&quot; (9pt) bleed margin for precision bindery cutting.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  CMYK & Overprint Integrity
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Identifies rogue RGB objects, verifies DeviceCMYK separations, enforces 100K pure black text, and flags missing black overprint state.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
                  <Type className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Font Embedding & Subsets
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Detects un-embedded TrueType and Type1 fonts that cause RIP rasterization failures. Validates CID-keyed subsets and font descriptor metrics.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Effective Image Resolution
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Calculates true effective DPI on the printed page. Alerts on images under 300 DPI and flags unacceptable low-resolution under 150 DPI.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Transparent Non-Destructive Repair
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Never modifies your original file. Generates a clear repair plan, creates repaired copies, and re-inspects them independently.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
                <div className="w-10 h-10 rounded-lg bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  ATS Impose Ready
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Compliant files generate machine-readable impose metadata—saddle-stitch and perfect-bound signatures ready for high-speed plates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-black text-center border-t border-neutral-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              Ready to verify your print files?
            </h2>
            <p className="text-neutral-400 text-sm max-w-xl mx-auto">
              Upload your interior PDF or cover file now. Receive an instant page-level preflight report with certified quality scores.
            </p>
            <div className="pt-2">
              <Link
                href="/preflight"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg transition-transform hover:scale-[1.02]"
              >
                <span>Open Preflight Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
