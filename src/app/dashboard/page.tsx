'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookProject } from '@/types/book';
import { bookRepository } from '@/services/storage/bookRepository';
import { BookCard } from '@/components/dashboard/BookCard';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { UnifiedActivityFeed } from '@/components/dashboard/UnifiedActivityFeed';
import { Plus, BookOpen, Sparkles, FileText, Loader2, AlertCircle, HardDrive, ShieldCheck, Layers, ExternalLink } from 'lucide-react';
import { ImpositionLaunchModal } from '@/components/imposition/ImpositionLaunchModal';

export default function PublisherDashboardPage() {
  const router = useRouter();
  const [books, setBooks] = useState<BookProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; title: string } | null>(null);
  const [isImpositionModalOpen, setIsImpositionModalOpen] = useState(false);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await bookRepository.getAllBooks();
      setBooks(list);
    } catch (err) {
      console.error(err);
      setError('Unable to load your book projects. Please refresh or check browser settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleCreateNewBook = async (withSample: boolean = false) => {
    try {
      setIsCreating(true);
      const newBook = withSample
        ? await bookRepository.getOrCreateSampleBook()
        : await bookRepository.createBook('Untitled Manuscript');
      router.push(`/books/${newBook.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create or load book. Please try again.');
      setIsCreating(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!deleteConfirmation) return;
    try {
      await bookRepository.deleteBook(deleteConfirmation.id);
      setDeleteConfirmation(null);
      await loadBooks();
    } catch (err) {
      console.error(err);
      setError('Failed to delete book.');
    }
  };

  return (
    <PlatformShell currentModule="dashboard">
      <div className="bg-slate-50 text-slate-900 min-h-[calc(100vh-4rem)]">
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="tracking-tight flex items-baseline space-x-2">
              <span className="font-palagio text-2xl sm:text-3xl font-bold text-slate-900">
                Publisher Project Library
              </span>
              <span className="font-sans text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-600 font-mono">
                • Production Hub
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your manuscripts, team reviews, version histories, and certified print-ready exports.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              id="dashboard-imposition-btn"
              onClick={() => setIsImpositionModalOpen(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg shadow-2xs hover:bg-rose-100 transition-colors"
              title="Launch ATS Impose Workspace"
            >
              <Layers className="w-4 h-4 text-rose-600" />
              <span>ATS Impose</span>
            </button>

            <button
              type="button"
              id="dashboard-admin-templates-btn"
              onClick={() => router.push('/admin/templates')}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg shadow-2xs hover:bg-purple-100 transition-colors"
              title="Admin Template Editor"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Admin Templates</span>
            </button>

            <button
              type="button"
              id="load-sample-novel-btn"
              onClick={() => handleCreateNewBook(true)}
              disabled={isCreating}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Load Sample Novel</span>
            </button>

            <button
              type="button"
              id="create-new-book-btn"
              onClick={() => router.push('/books/new')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-4 h-4" />
              <span>Create new book</span>
            </button>
          </div>
        </div>

        {/* ATS Production Suite Quick-Access Strip */}
        <div className="mt-6 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-sm font-bold text-slate-900">ATS Impose Engine</h2>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-rose-100 text-rose-800">
                    Submodule v0.2.0
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Commercial sheet impose, 8/16-page signatures, progressive creep compensation, and press marks.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <button
                type="button"
                id="dashboard-launch-imposition-banner-btn"
                onClick={() => setIsImpositionModalOpen(true)}
                className="w-full md:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                <span>Launch ATS Impose</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">{error}</div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Section */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium">Loading your publishing projects...</p>
          </div>
        ) : books.length === 0 ? (
          /* Empty state */
          <div className="mt-12 max-w-lg mx-auto text-center bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-7 h-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">No book projects yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              Start your first manuscript project or load our pre-formatted sample novel to see the accurate typography engine in action.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/books/new')}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create new book</span>
              </button>
              <button
                type="button"
                id="load-sample-novel-btn-empty"
                onClick={() => handleCreateNewBook(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Load Sample Novel</span>
              </button>
            </div>
          </div>
        ) : (
          /* Grid of books */
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {books.length} {books.length === 1 ? 'Project' : 'Projects'} Saved
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDelete={(id) => setDeleteConfirmation({ id, title: book.title })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Phase 11 Unified Platform Activity Feed */}
        <div className="mt-12">
          <UnifiedActivityFeed />
        </div>
      </main>
    </div>

    {/* Delete confirmation modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200"
          >
            <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900">
              Delete Project
            </h3>
            <p id="delete-dialog-desc" className="text-sm text-slate-600">
              Are you sure you want to delete &ldquo;<strong>{deleteConfirmation.title}</strong>&rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBook}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ATS Imposition Launch & Handoff Modal */}
      <ImpositionLaunchModal
        isOpen={isImpositionModalOpen}
        onClose={() => setIsImpositionModalOpen(false)}
      />
    </PlatformShell>
  );
}
