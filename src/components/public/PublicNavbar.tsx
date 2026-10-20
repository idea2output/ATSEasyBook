'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface PublicNavbarProps {
  onSampleBookLaunch?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ onSampleBookLaunch }) => {
  const router = useRouter();
  const pathname = usePathname();
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
      <header className="sticky top-0 z-40 w-full bg-black/90 backdrop-blur-md border-b border-neutral-800 text-white transition-all">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
          {/* Brand Logo - Positioned prominently at Left */}
          <Link href="/" className="group flex items-center focus:outline-none shrink-0" aria-label="ATS Tech Home">
            <AtsLogo variant="dark" size="md" />
          </Link>

          {/* Navigation Links: Products, How It Works, Coming Soon, Pricing */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium text-neutral-300">
            <Link
              href="/#products"
              className="hover:text-white hover:bg-neutral-900 transition-colors px-3.5 py-2 rounded-md text-xs font-semibold uppercase tracking-wider"
            >
              Products
            </Link>
            <Link
              href="/products/impose"
              id="public-nav-impose-link"
              className={`hover:text-white hover:bg-neutral-900 transition-colors px-3.5 py-2 rounded-md text-xs font-semibold uppercase tracking-wider ${
                pathname?.startsWith('/products/impose') || pathname?.startsWith('/Impose')
                  ? 'text-rose-500 font-bold'
                  : 'text-neutral-300'
              }`}
            >
              Impose
            </Link>
            <Link
              href="/products/preflight"
              id="public-nav-preflight-link"
              className={`hover:text-white hover:bg-neutral-900 transition-colors px-3.5 py-2 rounded-md text-xs font-semibold uppercase tracking-wider ${
                pathname?.startsWith('/products/preflight') || pathname?.startsWith('/preflight')
                  ? 'text-rose-500 font-bold'
                  : 'text-neutral-300'
              }`}
            >
              Preflight
            </Link>
            <Link
              href="/#how-it-works"
              className="hover:text-white hover:bg-neutral-900 transition-colors px-3.5 py-2 rounded-md text-xs font-semibold uppercase tracking-wider"
            >
              How It Works
            </Link>
            <Link
              href="/#coming-soon"
              className="hover:text-white hover:bg-neutral-900 transition-colors px-3.5 py-2 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5"
            >
              <span>Coming Soon</span>
              <span className="px-1.5 py-0.5 bg-rose-600/20 text-rose-400 text-[10px] font-mono font-bold rounded">
                12
              </span>
            </Link>
            <Link
              href="/#pricing"
              className="hover:text-white hover:bg-neutral-900 transition-colors px-3.5 py-2 rounded-md text-xs font-semibold uppercase tracking-wider"
            >
              Pricing
            </Link>
          </nav>

          {/* Right Action CTAs: Secondary Sign In + Primary Create a Book */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  id="navbar-dashboard-btn"
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold text-neutral-200 bg-neutral-900 hover:bg-neutral-800 rounded-md border border-neutral-700 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-rose-500" />
                  <span>Publisher Dashboard</span>
                </button>

                <button
                  type="button"
                  id="user-profile-btn"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-neutral-200 truncate max-w-[120px]">
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
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-neutral-300 hover:text-white transition-colors rounded-md hover:bg-neutral-900"
                >
                  <LogIn className="w-4 h-4 text-neutral-400" />
                  <span>Sign In</span>
                </button>

                <Link
                  href="/books/new"
                  id="navbar-create-book-btn"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold transition-all hover:scale-[1.02] shadow-sm tracking-wide"
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
            className="md:hidden p-2 text-neutral-300 hover:text-white rounded-md hover:bg-neutral-900 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black border-b border-neutral-800 px-6 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col space-y-1 text-sm font-medium text-neutral-300">
              <Link
                href="/#products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-md hover:bg-neutral-900 hover:text-white font-semibold"
              >
                Products
              </Link>
              <Link
                href="/products/impose"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-md hover:bg-neutral-900 font-semibold flex items-center justify-between ${
                  pathname?.startsWith('/products/impose') || pathname?.startsWith('/Impose')
                    ? 'text-rose-500 font-bold bg-neutral-900/50'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <span>Impose</span>
                <span className="px-2 py-0.5 bg-rose-600/20 text-rose-400 text-[10px] font-mono font-bold rounded">
                  Live
                </span>
              </Link>
              <Link
                href="/products/preflight"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-md hover:bg-neutral-900 font-semibold flex items-center justify-between ${
                  pathname?.startsWith('/products/preflight') || pathname?.startsWith('/preflight')
                    ? 'text-rose-500 font-bold bg-neutral-900/50'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <span>Preflight</span>
                <span className="px-2 py-0.5 bg-rose-600/20 text-rose-400 text-[10px] font-mono font-bold rounded">
                  Live
                </span>
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-md hover:bg-neutral-900 hover:text-white font-semibold"
              >
                How It Works
              </Link>
              <Link
                href="/#coming-soon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-md hover:bg-neutral-900 hover:text-white font-semibold flex items-center justify-between"
              >
                <span>Coming Soon</span>
                <span className="px-2 py-0.5 bg-rose-600/20 text-rose-400 text-[10px] font-mono font-bold rounded">
                  12 Modules
                </span>
              </Link>
              <Link
                href="/#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-md hover:bg-neutral-900 hover:text-white font-semibold"
              >
                Pricing
              </Link>
            </nav>

            <div className="pt-4 border-t border-neutral-800 flex flex-col space-y-2.5">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push('/dashboard');
                    }}
                    className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs font-bold flex items-center justify-center space-x-2 border border-neutral-700"
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
                    className="w-full py-2.5 px-4 text-neutral-300 hover:text-white rounded-md text-xs font-semibold"
                  >
                    Account Profile ({user.displayName})
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/books/new"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold text-center flex items-center justify-center space-x-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Create a Book</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white rounded-md text-xs font-bold flex items-center justify-center space-x-2"
                  >
                    <LogIn className="w-4 h-4 text-neutral-400" />
                    <span>Sign In to Account</span>
                  </button>
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
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          onUpdateUser={(updated) => setUser(updated)}
          onLoggedOut={() => setUser(null)}
        />
      )}
    </>
  );
};
