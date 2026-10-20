'use client';

import React from 'react';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { PreflightDashboard } from '@/components/preflight/PreflightDashboard';

export default function PreflightDashboardPage() {
  return (
    <PlatformShell currentModule="preflight">
      <PreflightDashboard />
    </PlatformShell>
  );
}
