import React from 'react';
import Link from 'next/link';
import { AtsLogo } from '@/components/brand/AtsLogo';
import { ShieldCheck, Mail, ArrowUpRight, FileText, Globe } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <AtsLogo variant="dark" size="lg" showSubtitle />
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The high-precision technology foundation for modern digital publishing, commercial prepress, automated imposition, and cloud book production.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ATS Platform Operational • PDF/X-4 & CMYK Prepress Verified</span>
            </div>
          </div>

          {/* Column 2: Available Products */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200">
              Active Products
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#products" className="hover:text-white transition-colors flex items-center space-x-1">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>ATS EasyBook</span>
                </Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-white transition-colors flex items-center space-x-1">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>ATS Imposition</span>
                </Link>
              </li>
              <li>
                <Link href="/books/new" className="hover:text-white transition-colors flex items-center space-x-1">
                  <span>Create Book Project</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Coming Soon Pipeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200">
              Upcoming Systems
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/#coming-soon" className="hover:text-white transition-colors">
                  Preflight & PDF Repair
                </Link>
              </li>
              <li>
                <Link href="/#coming-soon" className="hover:text-white transition-colors">
                  Proofing & Client Approval
                </Link>
              </li>
              <li>
                <Link href="/#coming-soon" className="hover:text-white transition-colors">
                  Print Job Portal & MIS Lite
                </Link>
              </li>
              <li>
                <Link href="/#coming-soon" className="hover:text-white transition-colors">
                  CTP Workflow Bridge
                </Link>
              </li>
              <li>
                <Link href="/#coming-soon" className="hover:text-white transition-colors text-rose-400 font-medium">
                  View all 12 modules →
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-200">
              Legal & Policies
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-1.5">
                <span className="text-slate-300">Terms of Service</span>
                <span className="text-[10px] text-amber-500/80 font-mono">[Placeholder]</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="text-slate-300">Privacy & GDPR</span>
                <span className="text-[10px] text-amber-500/80 font-mono">[Placeholder]</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="text-slate-300">Security Whitepaper</span>
                <span className="text-[10px] text-amber-500/80 font-mono">[Placeholder]</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="text-slate-300">Commercial Imprint</span>
                <span className="text-[10px] text-amber-500/80 font-mono">[Placeholder]</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
          <div className="flex items-center space-x-2">
            <span>© {new Date().getFullYear()} ATS Tech. All rights reserved.</span>
            <span>•</span>
            <span className="text-slate-400">Master Brand for Print & Publishing Systems</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Editorial Red Accent (#E11D48)</span>
            <span>•</span>
            <span className="text-slate-400">FOGRA39 / ISO 12647-2 Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
