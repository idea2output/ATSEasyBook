'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookProject,
  PagePreviewData,
  ImagePlacement,
  PreflightIssue,
  PreflightSummary,
} from '@/types/book';
import { bookRepository } from '@/services/storage/bookRepository';
import { parseManuscript } from '@/services/formatting/manuscriptParser';
import { defaultPaginationEngine } from '@/services/pagination/paginationEngine';
import { getTemplateById } from '@/services/templates/templateRegistry';
import { runPrintPreflight } from '@/services/preflight/preflightService';
import { loadFontFaceInBrowser } from '@/services/fonts/fontService';
import { Navbar } from '@/components/common/Navbar';
import { ManuscriptEditor, EditorTabType } from '@/components/editor/ManuscriptEditor';
import { BookSpreadPreview } from '@/components/preview/BookSpreadPreview';
import { ImageInspector } from '@/components/images/ImageInspector';
import { PdfExportModal } from '@/components/export/PdfExportModal';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Columns,
  Eye,
  PenTool,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sliders,
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

  // Active editor tab
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTabType>('raw');

  // Computed paginated pages
  const [pages, setPages] = useState<PagePreviewData[]>([]);

  // Export Modal state & Warning Acknowledgement
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isAcknowledgedWarnings, setIsAcknowledgedWarnings] = useState<boolean>(false);

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
          setIsAcknowledgedWarnings(existing.exportOptions?.acknowledgedWarnings ?? false);
          const template = getTemplateById(existing.templateId);
          const blocks = existing.formattedBlocks?.length
            ? existing.formattedBlocks
            : parseManuscript(existing.rawManuscript);
          const paginated = defaultPaginationEngine.paginate(blocks, template, {
            bookTitle: existing.title,
            authorName: existing.author,
            images: existing.images,
            placements: existing.placements,
            typography: existing.typography,
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

  // Keep refs for unmount and beforeunload synchronous flushing
  const bookRef = useRef<BookProject | null>(book);
  const hasUnsavedChangesRef = useRef<boolean>(false);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);

  useEffect(() => {
    bookRef.current = book;
  }, [book]);

  // Automatically register any uploaded custom fonts in the browser DOM
  useEffect(() => {
    if (book?.customFonts && book.customFonts.length > 0) {
      book.customFonts.forEach((cf) => {
        loadFontFaceInBrowser(cf);
      });
    }
  }, [book?.customFonts]);

  // Recalculate pagination whenever manuscript blocks, images, placements, or typography change
  const refreshPagination = useCallback((currentBook: BookProject) => {
    const template = getTemplateById(currentBook.templateId);
    const blocks = parseManuscript(currentBook.rawManuscript);
    const paginated = defaultPaginationEngine.paginate(blocks, template, {
      bookTitle: currentBook.title,
      authorName: currentBook.author,
      images: currentBook.images,
      placements: currentBook.placements,
      typography: currentBook.typography,
    });
    setPages(paginated);
  }, []);

  // Compute print preflight summary
  const currentTemplate = useMemo(() => {
    return getTemplateById(book?.templateId || 'classic-novel-6x9');
  }, [book?.templateId]);

  const preflightSummary: PreflightSummary = useMemo(() => {
    if (!book) {
      return {
        errorsCount: 0,
        warningsCount: 0,
        passedCount: 0,
        totalPages: 0,
        trimSize: '',
        estimatedPdfSizeMb: 0,
        issues: [],
      };
    }
    return runPrintPreflight(book, currentTemplate, pages);
  }, [book, currentTemplate, pages]);

  // Synchronous flush of any pending unsaved edits (used on beforeunload, unmount, and navigation)
  const flushPendingSaveSync = useCallback(() => {
    if (hasUnsavedChangesRef.current && bookRef.current) {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      const saved = bookRepository.saveBookSync(bookRef.current);
      bookRef.current = saved;
      hasUnsavedChangesRef.current = false;
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date(saved.updatedAt));
      return saved;
    }
    return null;
  }, []);

  // Listen for beforeunload to guarantee no data loss on page refresh or tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingSaveSync();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushPendingSaveSync();
    };
  }, [flushPendingSaveSync]);

  // Save changes explicitly to storage repository
  const handleSave = useCallback(async () => {
    if (!bookRef.current) return;
    try {
      setIsSaving(true);
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      const saved = bookRepository.saveBookSync(bookRef.current);
      bookRef.current = saved;
      setBook(saved);
      hasUnsavedChangesRef.current = false;
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date(saved.updatedAt));
    } catch (err) {
      console.error('Failed to save book:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Update book state and schedule autosave
  const handleUpdateBook = useCallback(
    (updatedFields: Partial<BookProject>) => {
      const current = bookRef.current;
      if (!current) return;
      const updated = { ...current, ...updatedFields };

      bookRef.current = updated;
      setBook(updated);
      hasUnsavedChangesRef.current = true;
      setHasUnsavedChanges(true);

      // Real-time pagination update
      refreshPagination(updated);

      // Schedule autosave after 600ms debounce
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        setIsSaving(true);
        try {
          if (bookRef.current) {
            const saved = bookRepository.saveBookSync(bookRef.current);
            bookRef.current = saved;
            hasUnsavedChangesRef.current = false;
            setHasUnsavedChanges(false);
            setLastSavedAt(new Date(saved.updatedAt));
          }
        } catch (e) {
          console.error('Autosave failed:', e);
        } finally {
          setIsSaving(false);
        }
      }, 600);
    },
    [refreshPagination]
  );

  // Update individual image placement
  const handleUpdatePlacement = useCallback(
    (placementId: string, updates: Partial<ImagePlacement>) => {
      if (!bookRef.current) return;
      const updatedPlacements = (bookRef.current.placements || []).map((p) =>
        p.id === placementId ? { ...p, ...updates } : p
      );
      handleUpdateBook({ placements: updatedPlacements });
    },
    [handleUpdateBook]
  );

  // Remove placement while preserving image in library
  const handleRemovePlacement = useCallback(
    (placementId: string) => {
      if (!bookRef.current) return;
      const updatedPlacements = (bookRef.current.placements || []).filter((p) => p.id !== placementId);
      if (selectedPlacementId === placementId) {
        setSelectedPlacementId(null);
      }
      handleUpdateBook({ placements: updatedPlacements });
    },
    [handleUpdateBook, selectedPlacementId]
  );

  // Explicit Format Action
  const handleFormatManuscript = useCallback(() => {
    if (!bookRef.current) return;
    const blocks = parseManuscript(bookRef.current.rawManuscript);
    const updated = {
      ...bookRef.current,
      formattedBlocks: blocks,
    };
    bookRef.current = updated;
    setBook(updated);
    refreshPagination(updated);
    handleSave();
  }, [refreshPagination, handleSave]);

  // Execute direct actions from preflight issues
  const handleExecutePreflightAction = useCallback((issue: PreflightIssue) => {
    if (issue.actionType === 'open-typography') {
      setActiveEditorTab('typography');
    } else if (issue.actionType === 'open-library') {
      setActiveEditorTab('images');
    } else if (issue.actionType === 'open-blocks') {
      setActiveEditorTab('blocks');
    } else if (issue.actionType === 'select-image' && issue.placementId) {
      setSelectedPlacementId(issue.placementId);
    }
  }, []);

  const handleToggleAcknowledge = useCallback(
    (val: boolean) => {
      setIsAcknowledgedWarnings(val);
      if (book) {
        const updatedExportOptions = { ...(book.exportOptions || {}), acknowledgedWarnings: val };
        handleUpdateBook({ exportOptions: updatedExportOptions });
      }
    },
    [book, handleUpdateBook]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading your manuscript studio...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Project Not Found</h2>
            <p className="text-sm text-slate-600">{error || 'Unable to open the requested book project.'}</p>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedPlacement = (book.placements || []).find((p) => p.id === selectedPlacementId);
  const canExport = preflightSummary.errorsCount === 0 && (preflightSummary.warningsCount === 0 || isAcknowledgedWarnings);

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col">
      <Navbar />

      {/* Studio Header Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
        {/* Left: Back Link and Book Title */}
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            onClick={flushPendingSaveSync}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <span className="text-slate-300">/</span>

          <span className="text-xs font-bold text-slate-800 truncate max-w-[160px] sm:max-w-xs">
            {book.title || 'Untitled Manuscript'}
          </span>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Mode Toggle (Beginner / Expert) */}
          <button
            type="button"
            id="toggle-editor-mode-btn"
            onClick={() => {
              const nextMode = book.editorMode === 'expert' ? 'beginner' : 'expert';
              handleUpdateBook({ editorMode: nextMode });
            }}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              book.editorMode === 'expert'
                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title={
              book.editorMode === 'expert'
                ? 'Expert Mode Active (Visual design, custom fonts, reusable templates). Click to switch to Beginner Mode.'
                : 'Beginner Mode Active. Click to unlock Expert visual styling, custom fonts, and templates.'
            }
          >
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>{book.editorMode === 'expert' ? 'Expert Mode' : 'Beginner Mode'}</span>
          </button>

          {/* Preflight & PDF Export Button */}
          <button
            type="button"
            onClick={() => {
              if (canExport) {
                setIsExportModalOpen(true);
              } else {
                setActiveEditorTab('preflight');
              }
            }}
            id="open-pdf-export-btn"
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
              preflightSummary.errorsCount > 0
                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                : preflightSummary.warningsCount > 0 && !isAcknowledgedWarnings
                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {preflightSummary.errorsCount > 0 ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Preflight: {preflightSummary.errorsCount} Error(s)</span>
              </>
            ) : preflightSummary.warningsCount > 0 && !isAcknowledgedWarnings ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Preflight: {preflightSummary.warningsCount} Warning(s)</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </>
            )}
          </button>

          {/* View Layout Mode Buttons (Split / Editor Only / Preview Only) */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs" role="group" aria-label="Layout view mode">
            <button
              type="button"
              onClick={() => setLayoutMode('split')}
              aria-pressed={layoutMode === 'split'}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
              aria-pressed={layoutMode === 'editor-only'}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
              aria-pressed={layoutMode === 'preview-only'}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
      </div>

      {/* Main Studio Work Area */}
      <div className="flex-1 p-4 sm:p-6 lg:p-6 overflow-hidden flex flex-col">
        <div className="flex-1 grid grid-cols-1 gap-6 h-[calc(100vh-140px)] min-h-[600px] overflow-hidden lg:grid-cols-12">
          {/* Manuscript Editor Column */}
          {(layoutMode === 'split' || layoutMode === 'editor-only') && (
            <div
              className={`h-full overflow-hidden flex flex-col ${
                layoutMode === 'editor-only'
                  ? 'lg:col-span-12 max-w-4xl mx-auto w-full'
                  : 'lg:col-span-5'
              }`}
            >
              {selectedPlacement && (
                <div className="mb-4 shrink-0">
                  <ImageInspector
                    placement={selectedPlacement}
                    images={book.images || []}
                    onUpdatePlacement={handleUpdatePlacement}
                    onRemovePlacement={handleRemovePlacement}
                    onClose={() => setSelectedPlacementId(null)}
                  />
                </div>
              )}

              <div className="flex-1 overflow-hidden">
                <ManuscriptEditor
                  book={book}
                  template={currentTemplate}
                  pages={pages}
                  preflightSummary={preflightSummary}
                  isAcknowledged={isAcknowledgedWarnings}
                  onToggleAcknowledge={handleToggleAcknowledge}
                  onUpdateBook={handleUpdateBook}
                  onFormatManuscript={handleFormatManuscript}
                  onSave={handleSave}
                  onTriggerExport={() => setIsExportModalOpen(true)}
                  onExecuteAction={handleExecutePreflightAction}
                  isSaving={isSaving}
                  hasUnsavedChanges={hasUnsavedChanges}
                  lastSavedAt={lastSavedAt}
                  selectedPlacementId={selectedPlacementId}
                  onSelectPlacement={setSelectedPlacementId}
                  activeTab={activeEditorTab}
                  onTabChange={setActiveEditorTab}
                />
              </div>
            </div>
          )}

          {/* Book Preview Column */}
          {(layoutMode === 'split' || layoutMode === 'preview-only') && (
            <div
              className={`h-full overflow-hidden relative ${
                layoutMode === 'preview-only' ? 'lg:col-span-12' : 'lg:col-span-7'
              }`}
            >
              <BookSpreadPreview
                pages={pages}
                template={currentTemplate}
                bookTitle={book.title}
                authorName={book.author}
                typographyOverrides={book.typography}
                design={book.design || currentTemplate.design}
                selectedPlacementId={selectedPlacementId}
                onSelectPlacement={setSelectedPlacementId}
              />

              {/* Floating Inspector in Preview-Only mode */}
              {selectedPlacement && layoutMode === 'preview-only' && (
                <div className="fixed bottom-8 right-8 w-96 max-w-[90vw] z-50 shadow-2xl">
                  <ImageInspector
                    placement={selectedPlacement}
                    images={book.images || []}
                    onUpdatePlacement={handleUpdatePlacement}
                    onRemovePlacement={handleRemovePlacement}
                    onClose={() => setSelectedPlacementId(null)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PDF Export Modal */}
      {isExportModalOpen && (
        <PdfExportModal
          project={book}
          template={currentTemplate}
          pages={pages}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
}
