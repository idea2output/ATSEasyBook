'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, Layers } from 'lucide-react';

export const FinalCtaSection: React.FC = () => {
  return (
    <section className="py-24 bg-neutral-950 text-white border-b border-neutral-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 text-rose-500 font-mono text-xs uppercase tracking-widest font-bold">
            <span className="w-2 h-0.5 bg-rose-500" />
            <span>Get Started with ATS Tech</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Create Your First Book.
          </h2>

          <p className="text-base sm:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Join authors, independent publishers, and commercial print production teams formatting manuscripts and producing print-certified files with total confidence.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/books/new"
            className="w-full sm:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold transition-all hover:scale-[1.02] flex items-center justify-center space-x-2.5 shadow-md"
          >
            <BookOpen className="w-4 h-4" />
            <span>Create a Book</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/#products"
            className="w-full sm:w-auto px-7 py-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-sm font-bold border border-neutral-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span>Explore ATS Products</span>
            <Layers className="w-4 h-4 text-neutral-400" />
          </Link>
        </div>
      </div>
    </section>
  );
};
