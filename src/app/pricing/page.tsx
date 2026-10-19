'use client';

import React from 'react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PricingSection } from '@/components/public/PricingSection';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-rose-600 selection:text-white">
      <PublicNavbar />
      <main className="flex-1 pt-12">
        <PricingSection />
      </main>
      <PublicFooter />
    </div>
  );
}
