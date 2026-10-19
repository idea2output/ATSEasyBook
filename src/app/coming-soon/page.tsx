'use client';

import React from 'react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { ComingSoonSection } from '@/components/public/ComingSoonSection';
import { FinalCtaSection } from '@/components/public/FinalCtaSection';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-rose-600 selection:text-white">
      <PublicNavbar />
      <main className="flex-1">
        <ComingSoonSection />
        <FinalCtaSection />
      </main>
      <PublicFooter />
    </div>
  );
}
