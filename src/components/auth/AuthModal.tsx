'use client';

import React, { useState } from 'react';
import { authService } from '@/services/cloud/authService';
import { UserProfile, AuthSession } from '@/types/auth';
import { bookRepository } from '@/services/storage/bookRepository';
import {
  X,
  Mail,
  Lock,
  User,
  Building,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (session: AuthSession) => void;
  initialTab?: 'signin' | 'signup' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialTab = 'signin',
}) => {
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [preferredColorProfile, setPreferredColorProfile] = useState('FOGRA39');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await authService.login(email, password);
      if (!res.success || !res.session) {
        setError(res.error || 'Failed to sign in.');
        return;
      }

      bookRepository.setAuthenticatedUser(res.session.user);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ats_auth_session_v1', JSON.stringify(res.session));
      }

      onAuthSuccess(res.session);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await authService.register({
        email,
        password,
        displayName: displayName || email.split('@')[0],
        organizationName,
        preferredLanguage,
        preferredColorProfile,
        timezone,
      });

      if (!res.success || !res.session) {
        setError(res.error || 'Failed to create account.');
        return;
      }

      bookRepository.setAuthenticatedUser(res.session.user);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ats_auth_session_v1', JSON.stringify(res.session));
      }

      onAuthSuccess(res.session);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError(null);
    try {
      const dummyId = `oauth-${provider}-${Date.now().toString().slice(-6)}`;
      const dummyEmail = `${provider}.publisher@easybook.io`;
      const dummyName = provider === 'google' ? 'Google Publisher' : 'GitHub Collaborator';

      const res = await authService.loginWithOAuth(provider, dummyId, dummyEmail, dummyName);
      if (!res.success || !res.session) {
        setError(res.error || 'OAuth authentication failed.');
        return;
      }

      bookRepository.setAuthenticatedUser(res.session.user);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ats_auth_session_v1', JSON.stringify(res.session));
      }

      onAuthSuccess(res.session);
      onClose();
    } catch (err: any) {
      setError(err.message || 'OAuth error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.requestPasswordReset(email);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setSuccessMessage('Password reset token generated (simulated delivery). Enter a new password below.');
      } else {
        setSuccessMessage('If the email exists, a password reset link has been dispatched.');
      }
    } catch (err: any) {
      setError(err.message || 'Password reset request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.resetPassword(resetToken, newPassword);
      if (!res.success) {
        setError(res.error || 'Password reset failed.');
        return;
      }
      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
      setResetToken(null);
      setTab('signin');
    } catch (err: any) {
      setError(err.message || 'Error completing password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800 max-w-md w-full overflow-hidden text-white"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-600/10 border border-rose-500/20 rounded-lg text-rose-500">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-base font-bold text-white tracking-tight">
                {tab === 'signin' && 'Sign in to ATS Tech'}
                {tab === 'signup' && 'Create Publisher Account'}
                {tab === 'forgot' && 'Reset Account Password'}
              </h2>
              <p className="text-xs text-neutral-400">
                {tab === 'signin' && 'Access cloud projects, prepress tools, and print history'}
                {tab === 'signup' && 'Professional publishing with cloud persistence'}
                {tab === 'forgot' && 'Secure account recovery'}
              </p>
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

        {/* Tab Switcher */}
        <div className="px-6 pt-3 flex border-b border-neutral-800 bg-neutral-950">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'signin'
                ? 'border-rose-500 text-rose-400 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-auth-signup"
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'signup'
                ? 'border-rose-500 text-rose-400 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('forgot');
              setError(null);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'forgot'
                ? 'border-rose-500 text-rose-400 font-bold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Forgot Password
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start space-x-2 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="editor@publishing.com"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 shadow-lg shadow-rose-950/50 disabled:opacity-50 mt-1"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2.5 bg-neutral-950 text-neutral-500 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading}
                  className="py-2 px-3 border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:border-neutral-700 rounded-lg text-xs font-semibold text-neutral-200 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('github')}
                  disabled={isLoading}
                  className="py-2 px-3 border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:border-neutral-700 rounded-lg text-xs font-semibold text-neutral-200 transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>GitHub</span>
                </button>
              </div>
            </form>
          )}

          {/* SIGN UP FORM */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                    <input
                      id="register-name-input"
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Publisher / Org
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                    <input
                      id="register-org-input"
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Acme Books"
                      className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  <input
                    id="register-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="publisher@acme.com"
                    className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Password (min 8 characters)
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  <input
                    id="register-password-input"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Language
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-neutral-800 rounded-lg bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic (العربية)</option>
                    <option value="ur">Urdu (اردو)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Print CMYK Profile
                  </label>
                  <select
                    value={preferredColorProfile}
                    onChange={(e) => setPreferredColorProfile(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-neutral-800 rounded-lg bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                  >
                    <option value="FOGRA39">FOGRA39 / ISO Coated</option>
                    <option value="FOGRA51">FOGRA51 / PSO Coated</option>
                    <option value="GRACoL">GRACoL 2006</option>
                  </select>
                </div>
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 shadow-lg shadow-rose-950/50 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Account</span>}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {tab === 'forgot' && (
            <div className="space-y-4">
              {!resetToken ? (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your-email@domain.com"
                        className="w-full text-xs pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 shadow-lg shadow-rose-950/50 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset Token</span>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompleteReset} className="space-y-3">
                  <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-[11px] text-rose-300 font-mono break-all">
                    Reset Token: {resetToken}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Enter New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full text-xs px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save New Password</span>}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
