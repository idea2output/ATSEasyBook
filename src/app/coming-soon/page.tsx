'use client';

import React from 'react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { ComingSoonSection } from '@/components/public/ComingSoonSection';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-rose-600 selection:text-white">
      <PublicNavbar />
      <main className="flex-1 pt-12">
        <ComingSoonSection />
      </main>
      <PublicFooter />
    </div>
  );
}
