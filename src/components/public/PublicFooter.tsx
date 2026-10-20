'use client';

import React from 'react';
import Link from 'next/link';
import { AtsLogo } from '@/components/brand/AtsLogo';
import { ShieldCheck, Mail, ArrowUpRight, FileText, Globe } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-black text-neutral-400 border-t border-neutral-800 pt-16 pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block" aria-label="ATS Tech Home">
              <AtsLogo variant="dark" size="md" />
            </Link>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              The high-precision publishing foundation for author manuscript formatting, certified CMYK PDF/X prepress, and commercial offset impose.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ATS Platform Operational • FOGRA39 / ISO 12647-2 Ready</span>
            </div>
          </div>

          {/* Column 2: Core Products */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              Products
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/#products" className="hover:text-white transition-colors flex items-center space-x-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>ATS EasyBook</span>
                </Link>
              </li>
              <li>
                <Link href="/products/preflight" className="hover:text-white transition-colors flex items-center space-x-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>ATS Preflight</span>
                </Link>
              </li>
              <li>
                <Link href="/products/impose" className="hover:text-white transition-colors flex items-center space-x-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>ATS Impose</span>
                </Link>
              </li>
              <li>
                <Link href="/books/new" className="hover:text-white transition-colors flex items-center space-x-1">
                  <span>Create Book Project</span>
                  <ArrowUpRight className="w-3 h-3 text-neutral-400" />
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Publisher Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Roadmap Modules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              Coming Soon
            </h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <Link href="/#coming-soon" className="hover:text-white transition-colors">
                  Preflight &amp; PDF Repair
                </Link>
              </li>
              <li>
                <Link href="/#coming-soon" className="hover:text-white transition-colors">
                  Proofing &amp; Client Approval
                </Link>
              </li>
              <li>
                <Link href="/#coming-soon" className="hover:text-white transition-colors">
                  Print Job Portal &amp; MIS Lite
                </Link>
              </li>
              <li>
                <Link href="/#coming-soon" className="hover:text-white transition-colors">
                  CTP Workflow Bridge
                </Link>
              </li>
              <li>
                <Link href="/#coming-soon" className="hover:text-white transition-colors text-rose-500 font-medium">
                  View all 12 modules →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              Legal &amp; Support
            </h4>
            <ul className="space-y-2 text-neutral-400">
              <li className="flex items-center space-x-1.5">
                <span className="text-neutral-300">Terms of Service</span>
                <span className="text-[10px] text-neutral-400 font-mono">[Placeholder]</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="text-neutral-300">Privacy &amp; GDPR</span>
                <span className="text-[10px] text-neutral-400 font-mono">[Placeholder]</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="text-neutral-300">Security Whitepaper</span>
                <span className="text-[10px] text-neutral-400 font-mono">[Placeholder]</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="text-neutral-300">Commercial Imprint</span>
                <span className="text-[10px] text-neutral-400 font-mono">[Placeholder]</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="text-neutral-300">Support Desk</span>
                <span className="text-[10px] text-rose-500 font-mono">[Placeholder]</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 gap-4">
          <div className="flex items-center space-x-2">
            <span>© {new Date().getFullYear()} ATS Tech. All rights reserved.</span>
            <span>•</span>
            <span className="text-neutral-400">The Engineering Platform for Modern Print &amp; Publishing</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-rose-500 font-mono font-semibold">ATS Red Accent (#E11D48)</span>
            <span>•</span>
            <span className="text-neutral-400">PDF/X-4 &amp; CMYK Prepress Certified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
