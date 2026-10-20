'use client';

import React from 'react';
import { PlatformHeader } from './PlatformHeader';

interface PlatformShellProps {
  children: React.ReactNode;
  currentModule?: 'easybook' | 'preflight' | 'impose' | 'dashboard' | 'admin';
}

export const PlatformShell: React.FC<PlatformShellProps> = ({ children, currentModule }) => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      <PlatformHeader currentModule={currentModule} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};
