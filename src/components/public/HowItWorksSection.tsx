'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Palette,
  FileCheck2,
  Printer,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Create',
      tagline: 'Author & Structure',
      description: 'Write in clean Markdown or paste existing manuscripts. Automatic chapter detection, heading hierarchy, and bidirectional multilingual text handling.',
      icon: <FileText className="w-5 h-5 text-rose-500" />,
    },
    {
      number: '02',
      title: 'Design',
      tagline: 'Typography & Layout',
      description: 'Select proven book templates or set custom trim sizes. Live DOM-measured engine reflows text with strict 2-line widow/orphan boundaries and zero dead space.',
      icon: <Palette className="w-5 h-5 text-rose-500" />,
    },
    {
      number: '03',
      title: 'Preflight',
      tagline: 'Audits & Compliance',
      description: 'Verify 300+ DPI raster resolution, bleed safe zones, font subset embedding, and CMYK profiles (FOGRA39, FOGRA51, GRACoL) before committing to paper.',
      icon: <FileCheck2 className="w-5 h-5 text-rose-500" />,
    },
    {
      number: '04',
      title: 'Export',
      tagline: 'Certified Output',
      description: 'One-click generation of print-ready PDF/X-4 files with vector overprint, 100K black body text, and accessible reflowable EPUB 3 digital editions.',
      icon: <Printer className="w-5 h-5 text-rose-500" />,
    },
    {
      number: '05',
      title: 'Print / Produce',
      tagline: 'Impose & Press Bridge',
      description: 'Impose multi-page signatures for offset and digital presses. Automated paper thickness creep compensation and registration marks for direct CTP production.',
      icon: <Layers className="w-5 h-5 text-rose-500" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-black text-white border-b border-neutral-800 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 text-rose-500 font-mono text-xs uppercase tracking-widest font-bold">
            <span className="w-2 h-0.5 bg-rose-500" />
            <span>Production Workflow Pipeline</span>
          </div>
          <h2 className="tracking-tight">
            <span className="block font-palagio text-3xl sm:text-5xl font-bold text-[#f1f3f7] leading-tight">
              How ATS Tech Works.
            </span>
            <span className="block font-sans text-xl sm:text-2xl md:text-3xl font-black text-rose-500 mt-2 leading-tight">
              From Raw Manuscript to Commercial Press.
            </span>
          </h2>
          <p className="text-neutral-300 text-base sm:text-lg leading-relaxed font-normal">
            Eliminate fragmented tools and costly manual prepress handoffs with a continuous, verified publishing pipeline.
          </p>
        </div>

        {/* 5-Step Editorial Sequence */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6 relative">
          {steps.map((s, idx) => (
            <div
              key={s.number}
              className="p-6 sm:p-7 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl flex flex-col justify-between space-y-6 transition-all group"
            >
              <div className="space-y-4">
                {/* Step Top Bar */}
                <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                  <span className="text-2xl font-black font-mono text-rose-500">
                    {s.number}
                  </span>
                  <div className="p-2 bg-neutral-900 rounded-lg text-neutral-300">
                    {s.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-rose-500 transition-colors">
                    {s.title}
                  </h3>
                  <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mt-0.5 font-semibold">
                    {s.tagline}
                  </span>
                </div>

                <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                  {s.description}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-900 text-[10px] font-mono text-neutral-500">
                Stage {idx + 1} of 5
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Callout Banner */}
        <div className="p-6 sm:p-8 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">
              Ready to see the pipeline in action?
            </h4>
            <p className="text-xs sm:text-sm text-neutral-400">
              Create a free book project and experience real DOM-measured text reflow and instant preflight.
            </p>
          </div>
          <Link
            href="/books/new"
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap self-start sm:self-auto"
          >
            Create Your Book
          </Link>
        </div>
      </div>
    </section>
  );
};
