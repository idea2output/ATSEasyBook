import React from 'react';
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
} from 'lucide-react';

interface ComingSoonProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  scopeHighlight: string;
  icon: React.ReactNode;
}

const UPCOMING_PRODUCTS: ComingSoonProduct[] = [
  {
    id: 'preflight-repair',
    name: 'ATS Preflight & PDF Repair',
    category: 'Prepress Engine',
    description: 'Automated post-rip PDF fixing: converts stray RGB elements to target CMYK profiles, downsamples oversized rasters, and fixes font subsetting errors.',
    scopeHighlight: 'PDF/X-1a, PDF/X-4 & Ghent Workgroup Compliance',
    icon: <FileCheck className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'proofing-approval',
    name: 'ATS Proofing & Client Approval',
    category: 'Collaboration',
    description: 'Interactive browser proofing platform with soft-proofing color accuracy, color-blind simulation, version compare overlays, and digital sign-off.',
    scopeHighlight: 'Client Annotations & Cryptographic Audit Sign-off',
    icon: <CheckSquare className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'quote-calculator',
    name: 'ATS Quote & Print Calculator',
    category: 'Commercial MIS',
    description: 'Instant press estimation for sheet-fed and digital presses: calculates substrate costs, ink consumption, click charges, and bindery surcharges.',
    scopeHighlight: 'Dynamic Margin & Multi-Volume Tier Estimation',
    icon: <Calculator className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'job-portal',
    name: 'ATS Print Job Portal',
    category: 'Workflow Portal',
    description: 'White-label customer-facing file upload and ordering portal with automated flight checks, live pre-pricing, and instantaneous order routing.',
    scopeHighlight: 'Self-Serve File Submission & Automated Preflight',
    icon: <Globe className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'production-board',
    name: 'ATS Production Board / Print MIS Lite',
    category: 'Shop Floor MIS',
    description: 'Real-time pressroom kanban board tracking jobs through prepress, plate making, press run, bindery, trimming, and shipping dispatch.',
    scopeHighlight: 'Real-Time Pressroom Kanban & Operator Dashboards',
    icon: <Kanban className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'ctp-bridge',
    name: 'ATS Imposition + CTP Workflow Bridge',
    category: 'Press Hardware Bridge',
    description: 'Direct RIP and CTP (Computer-to-Plate) integration bridge dispatching 1-bit TIFF plates and CIP3/CIP4 ink zone presetting data to press consoles.',
    scopeHighlight: 'CIP3 Ink Presets & Direct 1-Bit TIFF CTP Spooling',
    icon: <Cpu className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'vdp',
    name: 'ATS Variable Data Printing',
    category: 'Direct Marketing',
    description: 'High-speed variable text, image, and QR-code personalization engine for direct-mail campaigns, certificates, tickets, and multi-version publications.',
    scopeHighlight: 'CSV/JSON Data-Merge with Ultra-Fast PDF/VT Output',
    icon: <Database className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'packaging-studio',
    name: 'ATS Label, Barcode & Packaging Studio',
    category: 'Industrial Packaging',
    description: 'Dedicated vector layout studio for product labels, die-cut packaging boxes, dynamic ISBN/EAN barcodes, and GS1 QR codes with print margins.',
    scopeHighlight: 'Vector Dielines, Crease Folds & Certified ISBN/GS1',
    icon: <Barcode className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'sheet-optimizer',
    name: 'ATS Paper & Sheet Optimizer',
    category: 'Resource Efficiency',
    description: 'Algorithmic 2D nesting engine that calculates optimal sheet size, grain direction, and cut sequences to reduce paper waste and trim scrap.',
    scopeHighlight: '2D Rectangular Nesting & Grain Direction Optimization',
    icon: <Maximize className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'bindery-finishing',
    name: 'ATS Bindery & Finishing Calculator',
    category: 'Post-Press Bindery',
    description: 'Engineers precise spine width calculations based on paper caliper (microns/PPI), folding schemes, foil-stamping dies, and embossing blocks.',
    scopeHighlight: 'Substrate Caliper (PPI) & Dynamic Spine Thickness',
    icon: <Scissors className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'color-ink-analyzer',
    name: 'ATS Color & Ink Coverage Analyzer',
    category: 'Color Science',
    description: 'Pixel-level TAC (Total Area Coverage) auditor that computes exact cyan, magenta, yellow, and black square-meter ink consumption per signature.',
    scopeHighlight: '300% TAC Enforcement & Ink Weight/Volume Forecasts',
    icon: <Droplet className="w-5 h-5 text-rose-500" />,
  },
  {
    id: 'multilingual-suite',
    name: 'ATS Multilingual Publishing Suite',
    category: 'Internationalization',
    description: 'Enterprise translation memory and multi-direction publishing pipeline for parallel English, Arabic, Urdu, Hindi, and CJK edition synchronisation.',
    scopeHighlight: 'Side-by-Side RTL/LTR Alignment & Translation Sync',
    icon: <Languages className="w-5 h-5 text-rose-500" />,
  },
];

export const ComingSoonSection: React.FC = () => {
  return (
    <section id="coming-soon" className="relative py-28 bg-[#030712] text-white border-b border-white/[0.08] scroll-mt-16 overflow-hidden">
      {/* Ambient Red Glow */}
      <div className="absolute top-1/2 right-10 w-[600px] h-[600px] bg-rose-600/8 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-rose-500" />
            <span>Platform Roadmap</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Upcoming ATS Tech Systems
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            The next generation of specialized engineering modules designed to complete the full enterprise print-manufacturing workflow.
          </p>
        </div>

        {/* 12-Card Grid (Material 3 Glassmorphism) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {UPCOMING_PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              className="p-6 glass-panel hover:glass-panel-elevated hover:border-rose-500/50 rounded-2xl flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(225,29,72,0.18)] group relative overflow-hidden"
            >
              <div className="space-y-3.5">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 group-hover:bg-rose-500/20 group-hover:border-rose-500/40 transition-colors">
                    {prod.icon}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(244,63,94,0.25)]">
                    Roadmap
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                    {prod.category}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors mt-1">
                    {prod.name}
                  </h3>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  {prod.description}
                </p>
              </div>

              {/* Technical Scope Highlight */}
              <div className="pt-3.5 border-t border-white/[0.08]">
                <span className="text-[10px] font-mono text-slate-400 block truncate font-medium group-hover:text-rose-300 transition-colors" title={prod.scopeHighlight}>
                  {prod.scopeHighlight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
