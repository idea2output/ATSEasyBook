'use client';

import React from 'react';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PreflightDashboard } from '@/components/preflight/PreflightDashboard';

export default function PreflightDashboardPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      <PublicNavbar />
      <main className="flex-1">
        <PreflightDashboard />
      </main>
      <PublicFooter />
    </div>
  );
}
