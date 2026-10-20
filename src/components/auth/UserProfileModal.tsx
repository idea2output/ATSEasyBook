'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/types/auth';
import { authService } from '@/services/cloud/authService';
import { bookRepository } from '@/services/storage/bookRepository';
import {
  X,
  User,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
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
      setError(err.message || 'An error occurred while saving profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await authService.exportUserData(user.id);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ats-user-export-${user.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export user data.');
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
        window.localStorage.removeItem('ats_user_dp_v1');
      }
      onLoggedOut();
      onClose();
    } catch (err: any) {
      setError('Failed to delete account.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        className="bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800 max-w-lg w-full overflow-hidden text-white"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-600/10 border border-rose-500/20 rounded-lg text-rose-500">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-base font-bold text-white tracking-tight">
                Account &amp; Publisher Profile
              </h2>
              <p className="text-xs text-neutral-400">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-850 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start space-x-2 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-rose-500" />
                <span className="font-semibold text-neutral-300">Account Access Role:</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-rose-600/20 border border-rose-500/30 text-rose-400 font-mono">
                {user.role}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Publisher / Organization
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-neutral-800 rounded-lg bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                >
                  <option value="en">English (LTR)</option>
                  <option value="ar">Arabic (العربية, RTL)</option>
                  <option value="ur">Urdu (اردو, RTL)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Default CMYK Profile
                </label>
                <select
                  value={preferredColorProfile}
                  onChange={(e) => setPreferredColorProfile(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-neutral-800 rounded-lg bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                >
                  <option value="FOGRA39">FOGRA39 / ISO Coated</option>
                  <option value="FOGRA51">FOGRA51 / PSO Coated</option>
                  <option value="GRACoL">GRACoL 2006</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors font-mono"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-rose-950/50 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Profile Settings</span>}
              </button>
            </div>
          </form>

          {/* GDPR Data Export & Danger Zone */}
          <div className="pt-4 border-t border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Download Account Data</p>
                <p className="text-[11px] text-neutral-400">
                  Export all your projects, metadata, and audit activity as JSON.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                disabled={isExporting}
                className="px-3 py-1.5 border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:border-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Data</span>
              </button>
            </div>

            <div className="p-3.5 bg-rose-950/30 border border-rose-900/50 rounded-xl space-y-2">
              <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-xs">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Danger Zone: Account Deletion</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Deleting your account immediately terminates all active sessions and wipes your personal credentials.
              </p>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-1.5 bg-rose-600/20 border border-rose-500/40 hover:bg-rose-600 hover:text-white text-rose-400 rounded-lg text-xs font-bold transition-colors"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-bold text-rose-300">
                    Are you absolutely certain? This action cannot be reversed.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-medium text-neutral-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700"
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
