'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AtsLogo } from '@/components/brand/AtsLogo';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserProfileModal } from '@/components/auth/UserProfileModal';
import { bookRepository } from '@/services/storage/bookRepository';
import { UserProfile, AuthSession } from '@/types/auth';
import {
  Menu,
  X,
  LogIn,
  LayoutDashboard,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface PublicNavbarProps {
  onSampleBookLaunch?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ onSampleBookLaunch }) => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const checkUser = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('ats_auth_session_v1');
        if (stored) {
          const sess = JSON.parse(stored);
          if (sess?.user) {
            setUser(sess.user);
            bookRepository.setAuthenticatedUser(sess.user);
          }
        } else {
          setUser(null);
          bookRepository.setAuthenticatedUser(null);
        }
      } catch (e) {
        console.warn('Session parse error', e);
      }
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const handleAuthSuccess = (session: AuthSession) => {
    setUser(session.user);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#030712]/80 backdrop-blur-2xl border-b border-white/[0.08] text-white transition-all shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center space-x-3 focus:outline-none">
            <AtsLogo variant="dark" size="md" showSubtitle />
          </Link>

          {/* Desktop Navigation Links (Material 3 Pill Nav) */}
          <nav className="hidden md:flex items-center space-x-1 text-sm font-medium text-slate-300 p-1.5 rounded-full glass-pill">
            <Link
              href="/#products"
              className="hover:text-white hover:bg-white/[0.08] transition-all px-4 py-1.5 rounded-full text-xs font-semibold"
            >
              Products
            </Link>
            <Link
              href="/#coming-soon"
              className="hover:text-white hover:bg-white/[0.08] transition-all px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2"
            >
              <span>Coming Soon</span>
              <span className="px-2 py-0.5 bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[10px] font-mono rounded-full font-bold shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                12
              </span>
            </Link>
            <Link
              href="/#how-it-works"
              className="hover:text-white hover:bg-white/[0.08] transition-all px-4 py-1.5 rounded-full text-xs font-semibold"
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              className="hover:text-white hover:bg-white/[0.08] transition-all px-4 py-1.5 rounded-full text-xs font-semibold"
            >
              Pricing
            </Link>
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden lg:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  id="navbar-dashboard-btn"
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold text-slate-200 glass-pill hover:bg-white/[0.08] rounded-xl transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 text-rose-500" />
                  <span>Publisher Dashboard</span>
                </button>

                <button
                  type="button"
                  id="user-profile-btn"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl glass-pill hover:border-rose-500/40 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-[0_0_8px_rgba(225,29,72,0.5)]">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {user.displayName}
                  </span>
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  id="navbar-auth-btn"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold text-slate-200 hover:text-white glass-pill hover:bg-white/[0.08] rounded-xl transition-all"
                >
                  <LogIn className="w-4 h-4 text-slate-400" />
                  <span>Sign In</span>
                </button>

                <Link
                  href="/books/new"
                  id="navbar-create-book-btn"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_-3px_rgba(225,29,72,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.02] border border-rose-500/40"
                >
                  <BookOpen className="w-4 h-4 text-rose-100" />
                  <span>Create a Book</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            aria-label="Toggle Navigation Menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-xl glass-pill transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-white/[0.08] px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-300">
              <Link
                href="/#products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-white/[0.06] hover:text-white"
              >
                Products
              </Link>
              <Link
                href="/#coming-soon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white flex items-center justify-between"
              >
                <span>Coming Soon</span>
                <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 text-[10px] font-mono rounded font-bold">12</span>
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white"
              >
                How It Works
              </Link>
              <Link
                href="/#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white"
              >
                Pricing
              </Link>
            </nav>

            <div className="pt-3 border-t border-slate-800 flex flex-col space-y-2">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push('/dashboard');
                    }}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-rose-500" />
                    <span>Go to Publisher Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full py-2 px-4 border border-slate-700 text-slate-300 hover:bg-slate-900 rounded-lg text-xs font-semibold"
                  >
                    Account Profile ({user.displayName})
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 border border-slate-700 text-slate-200 hover:bg-slate-900 rounded-lg text-xs font-bold flex items-center justify-center space-x-2"
                  >
                    <LogIn className="w-4 h-4 text-slate-400" />
                    <span>Sign In to Account</span>
                  </button>

                  <Link
                    href="/books/new"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center space-x-2 shadow-md"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Create a Book</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth & Profile Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {user && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          user={user}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdateUser={(updated) => setUser(updated)}
          onLoggedOut={() => {
            setUser(null);
            setIsProfileModalOpen(false);
          }}
        />
      )}
    </>
  );
};
