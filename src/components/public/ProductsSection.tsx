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
    <section id="products" className="py-24 bg-black text-white border-b border-neutral-800 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 text-rose-500 font-mono text-xs uppercase tracking-widest font-bold">
            <span className="w-2 h-0.5 bg-rose-500" />
            <span>Featured Core Products</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Engineered for Precision Print &amp; Publishing
          </h2>
          <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
            Two foundational platforms powering the complete cycle from raw manuscript authoring to commercial offset press output.
          </p>
        </div>

        {/* 2-Card Product Grid (Bold Editorial Aesthetic) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PRODUCT 1: ATS EasyBook */}
          <div className="p-8 sm:p-12 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl flex flex-col justify-between space-y-8 transition-all group">
            <div className="space-y-6">
              {/* Product Badge & Header */}
              <div className="flex items-center justify-between">
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-rose-500">
                  <BookOpen className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full font-mono uppercase tracking-wider">
                  Available Now
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-4xl font-black text-white">
                  ATS EasyBook
                </h3>
                <p className="text-sm font-semibold text-rose-500 font-mono mt-1 uppercase tracking-wider">
                  Automated Book Layout &amp; Prepress Studio
                </p>
              </div>

              {/* Benefit-Focused Copy */}
              <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
                Transform raw manuscript text into publication-grade book spreads in minutes. Accurate typographic pagination ensures zero dead space at the bottom of pages, with native support for images, certified CMYK export, and Arabic, Urdu, and Hindi typography.
              </p>

              {/* Key Features */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                  Key Capabilities:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-neutral-300">
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>DOM-measured text reflow</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>1-col and 2-col balanced pagination</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>FOGRA39 &amp; FOGRA51 CMYK PDF/X-4</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>100K body black &amp; overprint</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>RTL Arabic &amp; Urdu Nastaliq</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>Accessible Reflowable EPUB 3</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 text-xs text-neutral-400 border-t border-neutral-900">
                <strong className="text-neutral-200">Suited For:</strong> Authors, book designers, academic presses, and digital publishers.
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/books/new"
                className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.02] flex items-center space-x-2"
              >
                <span>Launch EasyBook Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard"
                className="px-5 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-neutral-800"
              >
                <span>View Library</span>
              </Link>
            </div>
          </div>

          {/* PRODUCT 2: ATS Imposition */}
          <div className="p-8 sm:p-12 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl flex flex-col justify-between space-y-8 transition-all group">
            <div className="space-y-6">
              {/* Product Badge & Header */}
              <div className="flex items-center justify-between">
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-300">
                  <Layers className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 bg-neutral-900 text-neutral-400 border border-neutral-800 text-xs font-bold rounded-full font-mono uppercase tracking-wider">
                  Prepress Ready
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-4xl font-black text-white">
                  ATS Imposition
                </h3>
                <p className="text-sm font-semibold text-neutral-400 font-mono mt-1 uppercase tracking-wider">
                  Commercial Press Sheet &amp; Signature Optimization
                </p>
              </div>

              {/* Benefit-Focused Copy */}
              <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
                Automate complex multi-page signature layouts for commercial offset and high-speed digital presses. Calculates binding creep and progressive gutters with zero mathematical guesswork, outputting press-ready flats with registration and fold marks.
              </p>

              {/* Key Features */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                  Key Capabilities:
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-neutral-300">
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <span>8-page &amp; 16-page press signatures</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <span>Automated binding creep compensation</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <span>Head-to-head &amp; foot-to-foot schemes</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <span>Custom sheet sizes &amp; gripper margins</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <span>Dynamic registration &amp; fold marks</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <span>Direct CTP plate workflow bridge</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 text-xs text-neutral-400 border-t border-neutral-900">
                <strong className="text-neutral-200">Suited For:</strong> Commercial print shops, prepress operators, and bindery technicians.
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <a
                href="#how-it-works"
                className="px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold border border-neutral-700 transition-colors flex items-center space-x-2"
              >
                <span>View Imposition Specs</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <span className="text-xs text-neutral-500 font-mono">
                Integrated with EasyBook PDF export pipeline
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
