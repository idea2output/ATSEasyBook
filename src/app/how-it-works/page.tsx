'use client';

import React from 'react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { HowItWorksSection } from '@/components/public/HowItWorksSection';
import { FinalCtaSection } from '@/components/public/FinalCtaSection';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-rose-600 selection:text-white">
      <PublicNavbar />
      <main className="flex-1">
        <HowItWorksSection />
        <FinalCtaSection />
      </main>
      <PublicFooter />
    </div>
  );
}
