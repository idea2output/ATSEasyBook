'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/types/auth';
import { authService } from '@/services/cloud/authService';
import { bookRepository } from '@/services/storage/bookRepository';
import {
  X,
  User,
  Building,
  Globe,
  Palette,
  Clock,
  Download,
  Trash2,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  user: UserProfile;
  onClose: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLoggedOut: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onUpdateUser,
  onLoggedOut,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [organizationName, setOrganizationName] = useState(user.organizationName);
  const [preferredLanguage, setPreferredLanguage] = useState(user.preferredLanguage || 'en');
  const [preferredColorProfile, setPreferredColorProfile] = useState(user.preferredColorProfile || 'FOGRA39');
  const [timezone, setTimezone] = useState(user.timezone || 'UTC');

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await authService.updateProfile(user.id, {
        displayName,
        organizationName,
        preferredLanguage,
        preferredColorProfile,
        timezone,
      });

      if (!updated) {
        setError('Failed to update profile.');
        return;
      }

      onUpdateUser(updated);
      bookRepository.setAuthenticatedUser(updated);

      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('ats_auth_session_v1');
        if (raw) {
          const session = JSON.parse(raw);
          session.user = updated;
          window.localStorage.setItem('ats_auth_session_v1', JSON.stringify(session));
        }
      }

      setMessage('Profile settings updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Error updating profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await authService.exportUserData(user.id);
      if (!data) return;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `easybook-user-export-${user.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to export account data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await authService.deleteAccount(user.id);
      bookRepository.setAuthenticatedUser(null);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('ats_auth_session_v1');
      }
      onLoggedOut();
      onClose();
    } catch (err: any) {
      setError('Failed to delete account.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-base font-bold text-slate-900">
                Account & Publisher Profile
              </h2>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-700">Account Access Role:</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-indigo-100 text-indigo-700">
                {user.role}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Publisher / Organization
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="en">English (LTR)</option>
                  <option value="ar">Arabic (العربية, RTL)</option>
                  <option value="ur">Urdu (اردو, RTL)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default CMYK Profile
                </label>
                <select
                  value={preferredColorProfile}
                  onChange={(e) => setPreferredColorProfile(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="FOGRA39">FOGRA39 / ISO Coated</option>
                  <option value="FOGRA51">FOGRA51 / PSO Coated</option>
                  <option value="GRACoL">GRACoL 2006</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Profile Settings</span>}
              </button>
            </div>
          </form>

          {/* GDPR Data Export & Danger Zone */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Download Account Data</p>
                <p className="text-[11px] text-slate-500">
                  Export all your projects, metadata, and audit activity as JSON.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Data</span>
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-1.5 text-rose-900 font-bold text-xs">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Danger Zone: Account Deletion</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Deleting your account immediately terminates all active sessions and wipes your personal credentials.
              </p>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-bold text-rose-950">
                    Are you absolutely certain? This action cannot be reversed.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      className="px-3 py-1 bg-rose-700 text-white rounded text-xs font-bold hover:bg-rose-800"
                    >
                      Confirm Permanent Deletion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
