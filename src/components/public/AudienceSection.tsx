'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Printer,
  CheckCircle2,
  ArrowRight,
  FileText,
  Sliders,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export const AudienceSection: React.FC = () => {
  return (
    <section className="py-24 bg-black text-white border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 text-rose-500 font-mono text-xs uppercase tracking-widest font-bold">
            <span className="w-2 h-0.5 bg-rose-500" />
            <span>Built for the Full Production Spectrum</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            One Platform. Two Specialized Workflows.
          </h2>
          <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
            Whether you are self-publishing a single novel or managing high-volume offset press runs, ATS Tech delivers dedicated tools tailored to your exact publishing stage.
          </p>
        </div>

        {/* Two Audience Path Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: For Authors & Publishers */}
          <div className="p-8 sm:p-12 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl flex flex-col justify-between space-y-8 transition-all group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-rose-500 group-hover:bg-rose-950/30 group-hover:border-rose-800/50 transition-colors">
                  <BookOpen className="w-8 h-8" />
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">
                  Author &amp; Publisher Path
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  For Authors &amp; Independent Publishers
                </h3>
                <p className="text-sm sm:text-base text-neutral-400 mt-2 leading-relaxed">
                  Focus on storytelling and clean editorial design without battling frustrating desktop formatting tools.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start space-x-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Create Books Professionally</strong>
                    <span>Choose from industry-standard trim sizes (6×9, Digest, Paperback, A4) or define custom layouts.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Format Manuscripts Automatically</strong>
                    <span>Write in Markdown with automatic chapter detection, running headers, and drop caps.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Add and Anchor Images</strong>
                    <span>Full-width plates, inline figures, and text-wrap floats with automatic resolution audits.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Export Print-Ready PDF &amp; EPUB</strong>
                    <span>One-click export of print-ready PDF/X files and validated reflowable EPUB 3 eBooks.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-900 flex items-center justify-between">
              <Link
                href="/books/new"
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
              >
                <span>Start Authoring</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-xs text-neutral-500 font-mono">
                No credit card required
              </span>
            </div>
          </div>

          {/* Card 2: For Print Professionals */}
          <div className="p-8 sm:p-12 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl flex flex-col justify-between space-y-8 transition-all group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white group-hover:bg-neutral-850 group-hover:border-neutral-700 transition-colors">
                  <Printer className="w-8 h-8" />
                </div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">
                  Commercial Production Path
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  For Print Professionals &amp; Production Houses
                </h3>
                <p className="text-sm sm:text-base text-neutral-400 mt-2 leading-relaxed">
                  Eliminate prepress bottlenecks with certified PDF checks, press-sheet imposition, and color management.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start space-x-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Preflight Files Accurately</strong>
                    <span>Automated checks for 300+ DPI rasters, font subsetting, bleed boundaries, and safe margins.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Create Press Impositions</strong>
                    <span>Generate 8-page and 16-page signatures with automated spine creep and gutter compensation.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Manage CMYK Output Intents</strong>
                    <span>Certified FOGRA39, FOGRA51, and GRACoL workflows with pure 100K black vector overprint.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm text-neutral-300">
                  <CheckCircle2 className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-bold">Streamline Production Workflows</strong>
                    <span>Bridge digital and offset CTP workflows, reducing turnaround time from days to minutes.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-900 flex items-center justify-between">
              <Link
                href="/#products"
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold border border-neutral-700 transition-colors"
              >
                <span>Explore Prepress Tools</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-xs text-neutral-500 font-mono">
                Commercial MIS Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
