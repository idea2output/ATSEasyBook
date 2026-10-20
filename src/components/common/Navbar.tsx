'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Layers, BookText, User, LogIn, LogOut, CloudUpload, ShieldCheck, HardDrive } from 'lucide-react';
import { bookRepository } from '@/services/storage/bookRepository';
import { UserProfile, AuthSession } from '@/types/auth';
import { AuthModal } from '../auth/AuthModal';
import { UserProfileModal } from '../auth/UserProfileModal';
import { MigrationModal } from '../cloud/MigrationModal';
import { ImpositionLaunchModal } from '../imposition/ImpositionLaunchModal';

interface NavbarProps {
  currentBookTitle?: string;
  onRefreshProjects?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentBookTitle, onRefreshProjects }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isImpositionModalOpen, setIsImpositionModalOpen] = useState(false);
  const [localBooksCount, setLocalBooksCount] = useState(0);

  const checkUserAndLocal = () => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('ats_auth_session_v1');
        if (raw) {
          const sess: AuthSession = JSON.parse(raw);
          if (sess?.user) {
            setUser(sess.user);
            bookRepository.setAuthenticatedUser(sess.user);
          }
        } else {
          setUser(null);
          bookRepository.setAuthenticatedUser(null);
        }
      } catch (err) {
        console.warn('Failed to parse session', err);
      }

      const localList = bookRepository.getLocalRepository().getStoredBooks();
      setLocalBooksCount(localList.length);
    }
  };

  useEffect(() => {
    checkUserAndLocal();
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('ats_auth_session_v1');
    }
    setUser(null);
    bookRepository.setAuthenticatedUser(null);
    if (onRefreshProjects) onRefreshProjects();
  };

  const handleAuthSuccess = (session: AuthSession) => {
    setUser(session.user);
    if (onRefreshProjects) onRefreshProjects();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="flex items-center space-x-2.5 text-indigo-700 hover:text-indigo-800 transition-colors font-semibold text-lg"
            >
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-bold tracking-tight text-slate-900">
                ATS <span className="text-indigo-600">EasyBook</span>
              </span>
            </Link>

            {currentBookTitle && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-500 pl-3 border-l border-slate-200">
                <BookText className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-800 truncate max-w-xs md:max-w-md">
                  {currentBookTitle}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Storage Mode Badge */}
            {user ? (
              <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cloud Connected ({user.role})</span>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                <span>Local-First</span>
              </div>
            )}

            {/* Migrate Local Books button if signed in and local books exist */}
            {user && localBooksCount > 0 && (
              <button
                type="button"
                id="open-migration-btn"
                onClick={() => setIsMigrationModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Migrate Local ({localBooksCount})</span>
              </button>
            )}

            <Link
              href="/dashboard"
              className="text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100"
            >
              All Books
            </Link>

            <Link
              href="/preflight"
              id="navbar-preflight-link"
              className="text-xs font-medium text-slate-600 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100 flex items-center space-x-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
              <span>Preflight</span>
            </Link>

            <button
              type="button"
              id="navbar-imposition-btn"
              onClick={() => setIsImpositionModalOpen(true)}
              className="text-xs font-medium text-slate-600 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100 flex items-center space-x-1"
            >
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              <span>Imposition</span>
            </button>

            {/* User Account Controls */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  id="user-profile-btn"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors text-xs font-bold text-slate-800"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline truncate max-w-[120px]">{user.displayName}</span>
                </button>

                <button
                  type="button"
                  id="logout-btn"
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="pl-2 border-l border-slate-200">
                <button
                  type="button"
                  id="open-auth-btn"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
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
          onLoggedOut={handleLogout}
        />
      )}

      <MigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onMigrationComplete={() => {
          checkUserAndLocal();
          if (onRefreshProjects) onRefreshProjects();
        }}
      />

      <ImpositionLaunchModal
        isOpen={isImpositionModalOpen}
        onClose={() => setIsImpositionModalOpen(false)}
      />
    </>
  );
};
