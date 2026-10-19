'use client';

import React, { useState } from 'react';
import {
  FileCheck,
  CheckSquare,
  Calculator,
  Globe,
  Kanban,
  Cpu,
  Database,
  Barcode,
  Maximize,
  Scissors,
  Droplet,
  Languages,
  Clock,
  Sparkles,
  Mail,
  Check,
  ArrowRight,
} from 'lucide-react';

interface ComingSoonProduct {
  id: string;
  name: string;
  category: 'Publishing' | 'Prepress' | 'Workflow' | 'Automation';
  description: string;
  scopeHighlight: string;
  icon: React.ReactNode;
}

const UPCOMING_PRODUCTS: ComingSoonProduct[] = [
  // Publishing
  {
    id: 'multilingual-suite',
    name: 'ATS Multilingual Publishing Suite',
    category: 'Publishing',
    description: 'Enterprise translation memory and multi-direction publishing pipeline for parallel English, Arabic, Urdu, Hindi, and CJK edition synchronisation.',
    scopeHighlight: 'Side-by-Side RTL/LTR Alignment & Translation Sync',
    icon: <Languages className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'variable-data',
    name: 'ATS Variable Data Printing',
    category: 'Publishing',
    description: 'Dynamic template population from structured CSV/JSON data: high-speed multi-record PDF composition with batch-level preflight validation.',
    scopeHighlight: 'High-Throughput VDP Engine with Dynamic Text Fitting',
    icon: <Database className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'label-packaging',
    name: 'ATS Label, Barcode & Packaging Studio',
    category: 'Publishing',
    description: 'Vector barcode generator (EAN-13, ISBN-13, QR, DataMatrix), dieline layout, and packaging compliance tools for box and label production.',
    scopeHighlight: 'ISO/IEC Compliant Barcodes with Dieline Separation',
    icon: <Barcode className="w-5 h-5 text-rose-500" />,
  },

  // Prepress
  {
    id: 'preflight-repair',
    name: 'ATS Preflight & PDF Repair',
    category: 'Prepress',
    description: 'Automated post-rip PDF fixing: converts stray RGB elements to target CMYK profiles, downsamples oversized rasters, and fixes font subsetting errors.',
    scopeHighlight: 'PDF/X-1a, PDF/X-4 & Ghent Workgroup Compliance',
    icon: <FileCheck className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'color-ink-coverage',
    name: 'ATS Color & Ink Coverage Analyzer',
    category: 'Prepress',
    description: 'Pixel-level Total Area Coverage (TAC) auditing, ink consumption calculation per separation (CMYK + spot), and high-TAC warnings.',
    scopeHighlight: 'Per-Plate Ink Volume Estimation & TAC Limit Audits',
    icon: <Droplet className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'imposition-bridge',
    name: 'ATS Imposition + CTP Workflow Bridge',
    category: 'Prepress',
    description: 'Direct JDF/JMF imposition ticket export for commercial CTP RIP engines (Harlequin, Apogee, Prinergy) with press registration crosshairs.',
    scopeHighlight: 'JDF/JMF Commercial RIP Export & Offset Plate Binding',
    icon: <Cpu className="w-5 h-5 text-rose-500" />,
  },

  // Workflow
  {
    id: 'job-portal',
    name: 'ATS Print Job Portal',
    category: 'Workflow',
    description: 'White-label customer-facing file upload and ordering portal with automated flight checks, live pre-pricing, and instantaneous order routing.',
    scopeHighlight: 'Self-Serve File Submission & Automated Preflight',
    icon: <Globe className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'production-board',
    name: 'ATS Production Board / Print MIS Lite',
    category: 'Workflow',
    description: 'Shop-floor kanban board tracking jobs through prepress, press, bindery, finishing, and dispatch with machine-hour scheduling.',
    scopeHighlight: 'Real-Time Floor Tracking & Stage Gating',
    icon: <Kanban className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'proofing-approval',
    name: 'ATS Proofing & Client Approval',
    category: 'Workflow',
    description: 'Interactive browser proofing platform with soft-proofing color accuracy, color-blind simulation, version compare overlays, and digital sign-off.',
    scopeHighlight: 'Client Annotations & Cryptographic Audit Sign-off',
    icon: <CheckSquare className="w-5 h-5 text-rose-500" />,
  },

  // Automation
  {
    id: 'quote-calculator',
    name: 'ATS Quote & Print Calculator',
    category: 'Automation',
    description: 'Instant press estimation for sheet-fed and digital presses: calculates substrate costs, ink consumption, click charges, and bindery surcharges.',
    scopeHighlight: 'Dynamic Margin & Multi-Volume Tier Estimation',
    icon: <Calculator className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'sheet-optimizer',
    name: 'ATS Paper & Sheet Optimizer',
    category: 'Automation',
    description: 'Substrate cutting algorithm and combination run calculator: optimizes gang runs and grain direction across standard mill parent sheets.',
    scopeHighlight: 'N-Up Gang Run Yield Optimization & Waste Reduction',
    icon: <Maximize className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'bindery-finishing',
    name: 'ATS Bindery & Finishing Calculator',
    category: 'Automation',
    description: 'Calculates folding, trimming, saddle-stitch, and perfect-bind production timings, spine bulk thickness, and glue consumption.',
    scopeHighlight: 'Spine Width Calculation by Paper Caliper (PPI)',
    icon: <Scissors className="w-5 h-5 text-rose-500" />,
  },
];

export const ComingSoonSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('');
  const [isEarlyAccessSubmitted, setIsEarlyAccessSubmitted] = useState(false);

  const categories = ['All', 'Publishing', 'Prepress', 'Workflow', 'Automation'];

  const filteredProducts = selectedCategory === 'All'
    ? UPCOMING_PRODUCTS
    : UPCOMING_PRODUCTS.filter((p) => p.category === selectedCategory);

  const handleEarlyAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (earlyAccessEmail.trim() && earlyAccessEmail.includes('@')) {
      setIsEarlyAccessSubmitted(true);
    }
  };

  return (
    <section id="coming-soon" className="py-24 bg-black text-white border-b border-neutral-800 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 text-rose-500 font-mono text-xs uppercase tracking-widest font-bold">
              <span className="w-2 h-0.5 bg-rose-500" />
              <span>Platform Roadmap</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Coming Soon: The Full Engineering Suite
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
              Twelve specialized modules under active development to complete the entire digital-to-press manufacturing cycle.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-neutral-900 rounded-lg border border-neutral-800 self-start md:self-auto text-xs font-bold">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-md transition-all ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 12-Card Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="p-6 sm:p-7 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl flex flex-col justify-between space-y-5 transition-all group"
            >
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-rose-500 group-hover:bg-neutral-850 transition-colors">
                    {prod.icon}
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                    Coming Soon
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-500 block font-bold">
                    {prod.category}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors mt-0.5">
                    {prod.name}
                  </h3>
                </div>

                <p className="text-neutral-300 text-xs leading-relaxed">
                  {prod.description}
                </p>
              </div>

              {/* Technical Scope Highlight */}
              <div className="pt-3.5 border-t border-neutral-900">
                <span className="text-[10px] font-mono text-neutral-500 block truncate" title={prod.scopeHighlight}>
                  {prod.scopeHighlight}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Early Access Notification Form Interaction */}
        <div className="p-8 sm:p-12 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-mono uppercase tracking-wider text-rose-500 font-bold">
              Early-Access Program
            </span>
            <h3 className="text-2xl font-black text-white">
              Be first to test upcoming modules
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Join our private beta pool to evaluate early builds of Preflight Repair, CTP Bridge, and Print MIS Lite before public rollout.
            </p>
          </div>

          <div className="w-full lg:max-w-md">
            {isEarlyAccessSubmitted ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Thank you! You have been added to the early-access list. We will notify you as modules open.</span>
              </div>
            ) : (
              <form onSubmit={handleEarlyAccessSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  value={earlyAccessEmail}
                  onChange={(e) => setEarlyAccessEmail(e.target.value)}
                  placeholder="Enter your work email..."
                  required
                  className="flex-1 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                >
                  Join Early Access
                </button>
              </form>
            )}
            <p className="text-[11px] text-neutral-500 mt-2">
              No marketing spam. Only engineering update releases and beta access invitations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
