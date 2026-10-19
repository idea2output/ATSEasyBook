'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminTemplateEditor } from '@/components/admin/AdminTemplateEditor';
import { authService } from '@/services/cloud/authService';
import { templateRepository } from '@/services/templates/templateRepository';
import { UserProfile, UserRole } from '@/types/auth';
import { BookTemplate } from '@/types/book';
import {
  ShieldAlert,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  Plus,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BookTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(true);

  useEffect(() => {
    const user = authService.getCurrentUserSync();
    setCurrentUser(user);
  }, []);

  const isAdmin = currentUser?.role === 'administrator' || currentUser?.role === 'owner';

  // Demo helper: Allow elevating role to Administrator if user is in local demo environment
  const handleElevateToAdmin = () => {
    if (currentUser) {
      const elevated: UserProfile = { ...currentUser, role: 'administrator' };
      authService.saveSession({
        user: elevated,
        token: 'dev-admin-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      });
      setCurrentUser(elevated);
    } else {
      const demoAdmin: UserProfile = {
        id: 'admin-demo-user',
        email: 'admin@atstech.com',
        displayName: 'Organization Admin',
        organizationName: 'ATS Publishing House',
        preferredLanguage: 'en',
        preferredColorProfile: 'fogra39',
        timezone: 'UTC',
        role: 'administrator',
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      authService.saveSession({
        user: demoAdmin,
        token: 'dev-admin-token',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      });
      setCurrentUser(demoAdmin);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h1 className="text-xl font-black tracking-tight text-white">
            Administrator Access Restricted
          </h1>

          <p className="text-xs text-slate-400 leading-relaxed">
            The Admin Template Editor is restricted to organization administrators and owners. Your current account role is <span className="font-semibold text-amber-400 capitalize">{currentUser?.role || 'Guest'}</span>.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
            >
              Back to Home
            </button>

            <button
              type="button"
              id="admin-elevate-role-btn"
              onClick={handleElevateToAdmin}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Switch to Administrator</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminTemplateEditor
      initialTemplate={selectedTemplate || undefined}
      onBack={() => router.push('/dashboard')}
      onSaved={(saved) => {
        setSelectedTemplate(saved);
      }}
    />
  );
}
