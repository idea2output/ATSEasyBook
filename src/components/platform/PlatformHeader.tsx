'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AtsLogo } from '@/components/brand/AtsLogo';
import { UserProfileModal } from '@/components/auth/UserProfileModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { bookRepository } from '@/services/storage/bookRepository';
import { UserProfile, AuthSession } from '@/types/auth';
import { getAvailableProducts, ProductRegistryItem } from '@/services/products/productRegistry';
import {
  LayoutDashboard,
  BookOpen,
  ShieldCheck,
  Layers,
  ChevronDown,
  Coins,
  Bell,
  HelpCircle,
  LogOut,
  Building2,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface PlatformHeaderProps {
  currentModule?: 'easybook' | 'preflight' | 'impose' | 'dashboard' | 'admin';
}

export const PlatformHeader: React.FC<PlatformHeaderProps> = ({ currentModule }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Available products from registry
  const availableProducts = getAvailableProducts();

  const loadSession = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('ats_auth_session_v1');
        if (stored) {
          const sess = JSON.parse(stored);
          if (sess?.user) {
            setUser(sess.user);
            bookRepository.setAuthenticatedUser(sess.user);
            return;
          }
        }
      } catch (e) {
        console.warn('Session parse error', e);
      }
      setUser(null);
      bookRepository.setAuthenticatedUser(null);
    }
  };

  useEffect(() => {
    loadSession();

    // Close dropdowns on outside click
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#platform-product-switcher') && !target.closest('#platform-product-btn')) {
        setIsProductMenuOpen(false);
      }
      if (!target.closest('#platform-user-menu') && !target.closest('#platform-user-btn')) {
        setIsUserMenuOpen(false);
      }
      if (!target.closest('#platform-notif-menu') && !target.closest('#platform-notif-btn')) {
        setIsNotificationOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('ats_auth_session_v1');
    }
    setUser(null);
    bookRepository.setAuthenticatedUser(null);
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const getProductIcon = (id: string) => {
    switch (id) {
      case 'easybook':
        return <BookOpen className="w-4 h-4 text-rose-500" />;
      case 'preflight':
        return <ShieldCheck className="w-4 h-4 text-rose-500" />;
      case 'impose':
        return <Layers className="w-4 h-4 text-rose-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-rose-500" />;
    }
  };

  const currentProductItem = availableProducts.find((p) => p.id === currentModule) || {
    id: currentModule || 'dashboard',
    name: currentModule === 'dashboard' ? 'Platform Dashboard' : 'ATS Tech',
    shortName: currentModule === 'dashboard' ? 'Dashboard' : 'Platform',
    tagline: 'Enterprise Publishing & Prepress',
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 text-white select-none">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* LEFT: Brand Logo + Product Switcher */}
          <div className="flex items-center space-x-3 sm:space-x-6">
            <Link href="/dashboard" className="group flex items-center focus:outline-none shrink-0" aria-label="ATS Tech Home">
              <AtsLogo variant="dark" size="sm" />
            </Link>

            <div className="h-6 w-px bg-neutral-800 hidden sm:block" />

            {/* Dashboard Link */}
            <Link
              href="/dashboard"
              id="platform-dashboard-link"
              className={`hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-rose-500" />
              <span>Dashboard</span>
            </Link>

            {/* Unified Product Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="platform-product-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProductMenuOpen(!isProductMenuOpen);
                }}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg text-xs font-semibold text-white transition-all shadow-xs"
                aria-expanded={isProductMenuOpen}
              >
                {getProductIcon(currentModule || 'dashboard')}
                <span className="font-bold">{currentProductItem.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isProductMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProductMenuOpen && (
                <div
                  id="platform-product-switcher"
                  className="absolute left-0 mt-2 w-80 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold border-b border-neutral-800">
                    Switch ATS Tech Module
                  </div>
                  <div className="py-1 space-y-1">
                    {availableProducts.map((prod) => {
                      const isActive = prod.id === currentModule;
                      return (
                        <Link
                          key={prod.id}
                          href={prod.authenticatedUrl}
                          id={`switcher-${prod.id}-link`}
                          onClick={() => setIsProductMenuOpen(false)}
                          className={`flex items-start space-x-3 p-2.5 rounded-lg text-xs transition-colors ${
                            isActive
                              ? 'bg-rose-600/10 border border-rose-600/30 text-white'
                              : 'hover:bg-neutral-900 text-neutral-300 hover:text-white'
                          }`}
                        >
                          <div className="p-2 rounded-md bg-neutral-900 border border-neutral-800 shrink-0 mt-0.5">
                            {getProductIcon(prod.id)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs">{prod.name}</span>
                              {isActive ? (
                                <span className="text-[10px] text-rose-400 font-mono font-bold uppercase">Current</span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.2 bg-neutral-800 rounded font-mono text-neutral-400">
                                  {prod.version}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5">{prod.tagline}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-neutral-900 text-center">
                    <Link
                      href="/#coming-soon"
                      onClick={() => setIsProductMenuOpen(false)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-medium inline-flex items-center space-x-1"
                    >
                      <span>Explore 12 upcoming modules</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Credits, Notifications, Org Badge, User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Credits Balance Display (Clarified as Demo Credits / Preview) */}
            <div
              id="platform-credits-pill"
              title="Billing and credit deduction are not active yet."
              className="hidden md:flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-xs font-mono"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-amber-300">1,000 Demo Credits</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                Credits Preview
              </span>
            </div>

            {/* Current Organization Badge */}
            {user && (
              <div
                id="platform-org-badge"
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-medium text-neutral-300"
                title={`Organization: ${user.organizationName || 'Default Organization'}`}
              >
                <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                <span className="truncate max-w-[120px]">{user.organizationName || 'Default Org'}</span>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                id="platform-notif-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotificationOpen(!isNotificationOpen);
                }}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors relative"
                aria-label="Platform Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-black" />
              </button>

              {isNotificationOpen && (
                <div
                  id="platform-notif-menu"
                  className="absolute right-0 mt-2 w-72 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-3 z-50 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800 font-bold">
                    <span>Platform Activity</span>
                    <span className="text-[10px] text-neutral-500 font-mono">Live</span>
                  </div>
                  <div className="space-y-2 text-[11px]">
                    <div className="p-2 rounded bg-neutral-900/60 border border-neutral-800/80 space-y-1">
                      <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ATS Impose Ready</span>
                      </div>
                      <p className="text-neutral-400">Submodule integration verified at /Impose/ with one-time handoffs.</p>
                    </div>
                    <div className="p-2 rounded bg-neutral-900/60 border border-neutral-800/80 space-y-1">
                      <div className="flex items-center space-x-1.5 text-rose-400 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Preflight Engine Operational</span>
                      </div>
                      <p className="text-neutral-400">PDF/X inspection and transparent repair active.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Help & Support Button */}
            <button
              type="button"
              id="platform-help-btn"
              onClick={() => setIsHelpModalOpen(true)}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors"
              aria-label="Platform Documentation & Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* User Profile Menu or Sign In */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  id="platform-user-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-neutral-900 transition-colors"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="w-7 h-7 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-semibold hidden md:inline truncate max-w-[100px]">
                    {user.displayName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-neutral-400 hidden sm:inline" />
                </button>

                {isUserMenuOpen && (
                  <div
                    id="platform-user-menu"
                    className="absolute right-0 mt-2 w-56 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="p-2.5 border-b border-neutral-800 space-y-0.5">
                      <p className="font-bold text-white truncate">{user.displayName}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold uppercase">
                        Role: {user.role}
                      </span>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        type="button"
                        id="user-profile-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
                      >
                        Account Profile &amp; Settings
                      </button>

                      <Link
                        href="/admin/templates"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-3 py-2 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
                      >
                        Template Studio
                      </Link>

                      <button
                        type="button"
                        id="platform-signout-btn"
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 flex items-center space-x-2 transition-colors border-t border-neutral-900 mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                id="platform-signin-btn"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger Trigger */}
            <button
              type="button"
              aria-label="Toggle Mobile Platform Menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-neutral-300 hover:text-white rounded-md hover:bg-neutral-900 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-neutral-950 border-b border-neutral-800 px-6 pt-4 pb-6 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block mb-1">
                Active Modules
              </span>
              {availableProducts.map((p) => (
                <Link
                  key={p.id}
                  href={p.authenticatedUrl}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-neutral-900 text-neutral-300 hover:text-white"
                >
                  {getProductIcon(p.id)}
                  <span>{p.name}</span>
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-900 flex flex-col space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white"
              >
                <LayoutDashboard className="w-4 h-4 text-rose-500" />
                <span>Publisher Dashboard</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Profile Modal */}
      {user && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          user={user}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdateUser={(up) => setUser(up)}
          onLoggedOut={handleSignOut}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(sess) => {
          setUser(sess.user);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-rose-500">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ATS Platform Help &amp; Specs</h3>
                  <p className="text-xs text-neutral-400">FOGRA39, PDF/X, and Impose Architecture</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <strong className="text-white block font-mono text-[11px] uppercase">Unified URLs</strong>
                <p>• ATS EasyBook: <code className="text-rose-400">https://atstech.com/easybook/</code></p>
                <p>• ATS Preflight: <code className="text-rose-400">https://atstech.com/preflight/</code></p>
                <p>• ATS Impose: <code className="text-rose-400">https://atstech.com/Impose/</code></p>
              </div>

              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1">
                <strong className="text-white block font-mono text-[11px] uppercase">Prepress Standards</strong>
                <p>All modules enforce ISO 12647-2 commercial offset tolerances, 0.125&quot; bleed geometry, 100K black overprint, and certified PDF/X-4 output intents.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
