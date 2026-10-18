'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookProject, PagePreviewData } from '@/types/book';
import { bookRepository } from '@/services/storage/bookRepository';
import { parseManuscript } from '@/services/formatting/manuscriptParser';
import { defaultPaginationEngine } from '@/services/pagination/paginationEngine';
import { getTemplateById } from '@/services/templates/templateRegistry';
import { Navbar } from '@/components/common/Navbar';
import { ManuscriptEditor } from '@/components/editor/ManuscriptEditor';
import { BookSpreadPreview } from '@/components/preview/BookSpreadPreview';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Columns,
  Eye,
  PenTool,
  BookOpen,
} from 'lucide-react';

export default function BookEditorPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const [book, setBook] = useState<BookProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Desktop view layout modes: 'split' | 'editor-only' | 'preview-only'
  const [layoutMode, setLayoutMode] = useState<'split' | 'editor-only' | 'preview-only'>('split');

  // Computed paginated pages
  const [pages, setPages] = useState<PagePreviewData[]>([]);

  // Ref for debounced autosave timer
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Book
  useEffect(() => {
    let isMounted = true;
    async function fetchBook() {
      try {
        setIsLoading(true);
        setError(null);
        const existing = await bookRepository.getBookById(bookId);
        if (!existing) {
          setError(`Book project with ID "${bookId}" was not found.`);
          return;
        }
        if (isMounted) {
          setBook(existing);
          const template = getTemplateById(existing.templateId);
          const blocks = existing.formattedBlocks?.length
            ? existing.formattedBlocks
            : parseManuscript(existing.rawManuscript);
          const paginated = defaultPaginationEngine.paginate(blocks, template, {
            bookTitle: existing.title,
          });
          setPages(paginated);
          setLastSavedAt(new Date(existing.updatedAt));
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError('Failed to load book project.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (bookId) {
      fetchBook();
    }

    return () => {
      isMounted = false;
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [bookId]);

  // Recalculate pagination whenever manuscript blocks or template changes
  const refreshPagination = useCallback((currentBook: BookProject) => {
    const template = getTemplateById(currentBook.templateId);
    const blocks = parseManuscript(currentBook.rawManuscript);
    const paginated = defaultPaginationEngine.paginate(blocks, template, {
      bookTitle: currentBook.title,
    });
    setPages(paginated);
  }, []);

  // Save changes to storage repository
  const handleSave = useCallback(async () => {
    if (!book) return;
    try {
      setIsSaving(true);
      const saved = await bookRepository.saveBook(book);
      setBook(saved);
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date(saved.updatedAt));
    } catch (err) {
      console.error('Failed to save book:', err);
    } finally {
      setIsSaving(false);
    }
  }, [book]);

  // Update book state and schedule autosave
  const handleUpdateBook = useCallback(
    (updatedFields: Partial<BookProject>) => {
      setBook((prev) => {
        if (!prev) return null;
        const updated = { ...prev, ...updatedFields };

        // Real-time pagination update
        refreshPagination(updated);

        setHasUnsavedChanges(true);

        // Schedule autosave after 1200ms debounce
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
        }
        autosaveTimerRef.current = setTimeout(async () => {
          setIsSaving(true);
          try {
            const saved = await bookRepository.saveBook(updated);
            setHasUnsavedChanges(false);
            setLastSavedAt(new Date(saved.updatedAt));
          } catch (e) {
            console.error('Autosave failed:', e);
          } finally {
            setIsSaving(false);
          }
        }, 1200);

        return updated;
      });
    },
    [refreshPagination]
  );

  // Explicit Format Action
  const handleFormatManuscript = useCallback(() => {
    if (!book) return;
    const blocks = parseManuscript(book.rawManuscript);
    const updated = {
      ...book,
      formattedBlocks: blocks,
    };
    setBook(updated);
    refreshPagination(updated);
    handleSave();
  }, [book, refreshPagination, handleSave]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-600">Loading studio...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Book Not Found</h2>
          <p className="mt-1 text-sm text-slate-600 max-w-sm mb-6">
            {error || "The requested book could not be found."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentTemplate = getTemplateById(book.templateId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/90 text-slate-900">
      <Navbar currentBookTitle={book.title} />

      {/* Studio Sub-Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <span className="text-slate-300">/</span>

          <span className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
            {book.title || 'Untitled Manuscript'}
          </span>
        </div>

        {/* View Layout Mode Buttons (Split / Editor Only / Preview Only) */}
        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setLayoutMode('split')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              layoutMode === 'split'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Split view (Editor and Preview side-by-side)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Split View</span>
          </button>

          <button
            type="button"
            onClick={() => setLayoutMode('editor-only')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              layoutMode === 'editor-only'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Editor only"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Editor</span>
          </button>

          <button
            type="button"
            onClick={() => setLayoutMode('preview-only')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
              layoutMode === 'preview-only'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Preview only"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Preview</span>
          </button>
        </div>
      </div>

      {/* Main Studio Work Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-6 overflow-hidden flex flex-col">
        <div className="flex-1 grid grid-cols-1 gap-6 h-[calc(100vh-140px)] min-h-[600px] overflow-hidden lg:grid-cols-12">
          {/* Manuscript Editor Column */}
          {(layoutMode === 'split' || layoutMode === 'editor-only') && (
            <div
              className={`h-full overflow-hidden ${
                layoutMode === 'editor-only'
                  ? 'lg:col-span-12 max-w-4xl mx-auto w-full'
                  : 'lg:col-span-5'
              }`}
            >
              <ManuscriptEditor
                book={book}
                onUpdateBook={handleUpdateBook}
                onFormatManuscript={handleFormatManuscript}
                onSave={handleSave}
                isSaving={isSaving}
                hasUnsavedChanges={hasUnsavedChanges}
                lastSavedAt={lastSavedAt}
              />
            </div>
          )}

          {/* Book Preview Column */}
          {(layoutMode === 'split' || layoutMode === 'preview-only') && (
            <div
              className={`h-full overflow-hidden ${
                layoutMode === 'preview-only' ? 'lg:col-span-12' : 'lg:col-span-7'
              }`}
            >
              <BookSpreadPreview
                pages={pages}
                template={currentTemplate}
                bookTitle={book.title}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
