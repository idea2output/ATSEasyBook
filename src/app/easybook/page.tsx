'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookProject } from '@/types/book';
import { bookRepository } from '@/services/storage/bookRepository';
import { PlatformShell } from '@/components/platform/PlatformShell';
import {
  BookOpen,
  Plus,
  Sparkles,
  FileText,
  Clock,
  Layers,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Trash2,
  Edit3,
} from 'lucide-react';

export default function EasyBookPortalPage() {
  const router = useRouter();
  const [books, setBooks] = useState<BookProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const list = await bookRepository.getAllBooks();
      setBooks(list);
    } catch (e) {
      console.error('Failed to load books in EasyBook portal:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleCreateNew = async (withSample: boolean = false) => {
    try {
      setIsCreating(true);
      const newBook = withSample
        ? await bookRepository.getOrCreateSampleBook()
        : await bookRepository.createBook('New Publication');
      router.push(`/books/${newBook.id}`);
    } catch (e) {
      console.error('Failed to create book:', e);
      setIsCreating(false);
    }
  };

  return (
    <PlatformShell currentModule="easybook">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Module Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-neutral-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider font-mono">
              <BookOpen className="w-4 h-4" />
              <span>ATS Publishing Platform • Target URL: /easybook/</span>
            </div>
            <h1 className="tracking-tight flex items-baseline space-x-2.5">
              <span className="font-palagio text-2xl sm:text-4xl font-bold text-white">
                ATS EasyBook Workspace
              </span>
              <span className="font-sans text-sm sm:text-base font-bold text-rose-500 uppercase tracking-wider font-mono">
                • Manuscript Studio
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              DOM-measured text flow, multilingual RTL typography, custom page templates, and certified CMYK PDF/X prepress export.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="easybook-create-sample-btn"
              onClick={() => handleCreateNew(true)}
              disabled={isCreating}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Load Print Sample</span>
            </button>

            <button
              type="button"
              id="easybook-create-new-btn"
              onClick={() => handleCreateNew(false)}
              disabled={isCreating}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold tracking-wide shadow-md hover:scale-[1.01] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? 'Creating...' : 'New Book Project'}</span>
            </button>
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase font-mono">
              <FileText className="w-4 h-4" />
              <span>Pagination Engine</span>
            </div>
            <h3 className="text-sm font-bold text-white">True DOM Text Flow</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Fills all vertical space dynamically, respecting exact font metrics, columns, margins, and widow/orphan rules.
            </p>
          </div>

          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified Prepress</span>
            </div>
            <h3 className="text-sm font-bold text-white">ISO 12647-2 &amp; FOGRA39</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              DeviceCMYK color separations with pure 100K black body text and automatic prepress overprint flags.
            </p>
          </div>

          <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase font-mono">
              <Layers className="w-4 h-4" />
              <span>Template Governance</span>
            </div>
            <h3 className="text-sm font-bold text-white">Custom Page Geometry</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Reusable templates with fixed visual layers, editable text/image zones, and organization governance.
            </p>
          </div>
        </div>

        {/* Books Grid or Empty State */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Your Book Projects ({books.length})</h2>
            <Link
              href="/admin/templates"
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
            >
              Manage Templates &rarr;
            </Link>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-neutral-500 text-xs font-mono">
              Loading book manuscripts...
            </div>
          ) : books.length === 0 ? (
            <div className="p-12 text-center bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-neutral-500 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">No Books Created Yet</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  Create your first manuscript to experience accurate pagination, multilingual typography, and CMYK export.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCreateNew(false)}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Book</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="p-5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl space-y-4 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                      <span>{(book as any).pageCount || (book as any).formattedBlocks?.length || 1} Pages</span>
                      <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300">
                        {(book as any).trimSize || (book as any).exportOptions?.paperSize || '6x9'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-2">
                      {book.author ? `By ${book.author}` : 'No author specified'} • Last edited{' '}
                      {new Date(book.updatedAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-900 flex items-center justify-between">
                    <Link
                      href={`/books/${book.id}`}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Open Editor</span>
                    </Link>

                    <Link
                      href={`/books/${book.id}`}
                      className="text-xs text-rose-500 hover:text-rose-400 font-bold inline-flex items-center space-x-1"
                    >
                      <span>Export &amp; Impose</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PlatformShell>
  );
}
