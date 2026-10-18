'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookProject } from '@/types/book';
import { bookRepository } from '@/services/storage/bookRepository';
import { BookCard } from '@/components/dashboard/BookCard';
import { Navbar } from '@/components/common/Navbar';
import { Plus, BookOpen, Sparkles, FileText, Loader2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [books, setBooks] = useState<BookProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; title: string } | null>(null);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await bookRepository.getAllBooks();
      setBooks(list);
    } catch (err) {
      console.error(err);
      setError('Unable to load your book projects from local storage. Please refresh or check browser settings.');
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
      const title = withSample ? 'The Eldridge Voyage (Sample Book)' : 'Untitled Manuscript';
      const newBook = await bookRepository.createBook(title, withSample);
      router.push(`/books/${newBook.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create new book. Please try again.');
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Book Projects
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your manuscripts and preview them in standard 6 × 9-inch trade novel formats.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handleCreateNewBook(true)}
              disabled={isCreating}
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Load Sample Novel</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateNewBook(false)}
              disabled={isCreating}
              className="inline-flex items-center space-x-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create new book</span>
                </>
              )}
            </button>
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
            <p className="text-sm font-medium">Loading your book library...</p>
          </div>
        ) : books.length === 0 ? (
          /* Empty state */
          <div className="mt-12 max-w-lg mx-auto text-center bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <BookOpen className="w-7 h-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">No book projects yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              Start your first manuscript project or load our pre-formatted sample novel to see the 6 × 9 pagination engine in action.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleCreateNewBook(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create new book</span>
              </button>
              <button
                type="button"
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
                  onDelete={(id, title) => setDeleteConfirmation({ id, title })}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200"
          >
            <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900">
              Delete Book Project?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-800">&ldquo;{deleteConfirmation.title}&rdquo;</span>? This action removes the manuscript from local storage and cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBook}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
