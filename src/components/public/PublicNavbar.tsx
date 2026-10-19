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
      <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur border-b border-slate-800 text-white transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center space-x-3 focus:outline-none">
            <AtsLogo variant="dark" size="md" showSubtitle />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <Link
              href="/#products"
              className="hover:text-white transition-colors py-1"
            >
              Products
            </Link>
            <Link
              href="/#coming-soon"
              className="hover:text-white transition-colors py-1 flex items-center space-x-1.5"
            >
              <span>Coming Soon</span>
              <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 text-[10px] font-mono rounded font-bold">12</span>
            </Link>
            <Link
              href="/#how-it-works"
              className="hover:text-white transition-colors py-1"
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              className="hover:text-white transition-colors py-1"
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
                  className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-rose-500" />
                  <span>Publisher Dashboard</span>
                </button>

                <button
                  type="button"
                  id="user-profile-btn"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
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
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-900"
                >
                  <LogIn className="w-4 h-4 text-slate-400" />
                  <span>Sign In</span>
                </button>

                <Link
                  href="/books/new"
                  id="navbar-create-book-btn"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-900/30 transition-all hover:scale-[1.02]"
                >
                  <BookOpen className="w-4 h-4" />
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
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-300">
              <Link
                href="/#products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-white"
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
