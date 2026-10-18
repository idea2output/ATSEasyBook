'use client';

import React, { useState, useMemo } from 'react';
import { PagePreviewData, BookTemplate } from '@/types/book';
import { BookPage } from './BookPage';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Columns,
  Square,
  FileQuestion,
  Maximize2,
} from 'lucide-react';

interface BookSpreadPreviewProps {
  pages: PagePreviewData[];
  template: BookTemplate;
  bookTitle?: string;
  selectedPlacementId?: string | null;
  onSelectPlacement?: (placementId: string) => void;
}

export const BookSpreadPreview: React.FC<BookSpreadPreviewProps> = ({
  pages,
  template,
  bookTitle,
  selectedPlacementId = null,
  onSelectPlacement,
}) => {
  const [zoomScale, setZoomScale] = useState<number>(0.75); // Good desktop default scale for 6x9 in
  const [viewMode, setViewMode] = useState<'spread' | 'single'>('spread');
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState<number>(0);

  // Group pages into two-page spreads:
  // Spread 0: [Empty left / Page 1 right] (Page 1 is always recto/right)
  // Spread 1: [Page 2 left / Page 3 right]
  // Spread 2: [Page 4 left / Page 5 right]
  const spreads = useMemo(() => {
    if (pages.length === 0) return [];

    const result: Array<{ left?: PagePreviewData; right?: PagePreviewData }> = [];

    // Page 1 is on the right side of the opening spread
    const page1 = pages.find((p) => p.pageNumber === 1);
    result.push({ left: undefined, right: page1 });

    let currentEven = 2;
    while (currentEven <= pages.length) {
      const leftPage = pages.find((p) => p.pageNumber === currentEven);
      const rightPage = pages.find((p) => p.pageNumber === currentEven + 1);
      if (leftPage || rightPage) {
        result.push({ left: leftPage, right: rightPage });
      }
      currentEven += 2;
    }

    return result;
  }, [pages]);

  const totalSpreads = spreads.length;

  // Single page index tracker
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Handle bounds
  const activeSpread = spreads[Math.min(currentSpreadIndex, Math.max(0, totalSpreads - 1))];
  const activeSinglePage = pages[Math.min(currentPageIndex, Math.max(0, pages.length - 1))];

  const handleSwitchToSpread = () => {
    const pageNum = activeSinglePage ? activeSinglePage.pageNumber : 1;
    const targetSpread = spreads.findIndex(
      (s) => s.left?.pageNumber === pageNum || s.right?.pageNumber === pageNum
    );
    if (targetSpread !== -1) {
      setCurrentSpreadIndex(targetSpread);
    }
    setViewMode('spread');
  };

  const handleSwitchToSingle = () => {
    const pageNum = activeSpread?.left?.pageNumber || activeSpread?.right?.pageNumber || 1;
    setCurrentPageIndex(Math.max(0, Math.min(pages.length - 1, pageNum - 1)));
    setViewMode('single');
  };

  const handlePrev = () => {
    if (viewMode === 'spread') {
      setCurrentSpreadIndex((prev) => Math.max(0, prev - 1));
    } else {
      setCurrentPageIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'spread') {
      setCurrentSpreadIndex((prev) => Math.min(totalSpreads - 1, prev + 1));
    } else {
      setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
    }
  };

  const handleZoom = (delta: number) => {
    setZoomScale((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      return Math.min(1.2, Math.max(0.45, next));
    });
  };

  if (pages.length === 0) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-slate-100/70 border border-dashed border-slate-300 rounded-xl">
        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Manuscript Content</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">
          Enter or paste your text in the manuscript editor, then click &ldquo;Format manuscript&rdquo; to flow text into 6 × 9-inch book pages.
        </p>
      </div>
    );
  }

  // Auto-navigate to spread/page containing selected image if reflow shifted it
  React.useEffect(() => {
    if (!selectedPlacementId) return;
    const pageWithPlacement = pages.find((p) =>
      p.blocks.some((b) => b.type === 'image' && b.placement?.id === selectedPlacementId)
    );
    if (!pageWithPlacement) return;

    if (viewMode === 'spread') {
      const targetSpread = spreads.findIndex(
        (s) =>
          s.left?.pageNumber === pageWithPlacement.pageNumber ||
          s.right?.pageNumber === pageWithPlacement.pageNumber
      );
      if (targetSpread !== -1) {
        setCurrentSpreadIndex(targetSpread);
      }
    } else {
      setCurrentPageIndex(Math.max(0, Math.min(pages.length - 1, pageWithPlacement.pageNumber - 1)));
    }
  }, [selectedPlacementId, pages, spreads, viewMode]);

  return (
    <div className="flex flex-col h-full bg-slate-200/80 rounded-xl overflow-hidden border border-slate-300 shadow-inner">
      {/* Control Bar */}
      <div className="bg-white px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Navigation Controls */}
        <div className="flex items-center space-x-1.5" role="navigation" aria-label="Book page navigation">
          <button
            type="button"
            onClick={() => {
              if (viewMode === 'spread') setCurrentSpreadIndex(0);
              else setCurrentPageIndex(0);
            }}
            disabled={viewMode === 'spread' ? currentSpreadIndex === 0 : currentPageIndex === 0}
            className="p-1.5 rounded text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:hover:bg-transparent"
            title="First Page"
            aria-label="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePrev}
            disabled={viewMode === 'spread' ? currentSpreadIndex === 0 : currentPageIndex === 0}
            className="p-1.5 rounded text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:hover:bg-transparent"
            title="Previous"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 font-medium text-slate-700 min-w-[110px] text-center" aria-live="polite">
            {viewMode === 'spread' ? (
              activeSpread?.left && activeSpread?.right ? (
                `Pages ${activeSpread.left.pageNumber}–${activeSpread.right.pageNumber} of ${pages.length}`
              ) : activeSpread?.right ? (
                `Page ${activeSpread.right.pageNumber} of ${pages.length}`
              ) : activeSpread?.left ? (
                `Page ${activeSpread.left.pageNumber} of ${pages.length}`
              ) : (
                'Spread'
              )
            ) : (
              `Page ${activeSinglePage?.pageNumber || 1} of ${pages.length}`
            )}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={
              viewMode === 'spread'
                ? currentSpreadIndex >= totalSpreads - 1
                : currentPageIndex >= pages.length - 1
            }
            className="p-1.5 rounded text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:hover:bg-transparent"
            title="Next"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (viewMode === 'spread') setCurrentSpreadIndex(totalSpreads - 1);
              else setCurrentPageIndex(pages.length - 1);
            }}
            disabled={
              viewMode === 'spread'
                ? currentSpreadIndex >= totalSpreads - 1
                : currentPageIndex >= pages.length - 1
            }
            className="p-1.5 rounded text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:hover:bg-transparent"
            title="Last Page"
            aria-label="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode & Zoom Controls */}
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200" role="group" aria-label="View mode">
            <button
              type="button"
              onClick={handleSwitchToSpread}
              aria-pressed={viewMode === 'spread'}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                viewMode === 'spread'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Two-page spread view"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Spread</span>
            </button>
            <button
              type="button"
              onClick={handleSwitchToSingle}
              aria-pressed={viewMode === 'single'}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                viewMode === 'single'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Single page view"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Single</span>
            </button>
          </div>

          {/* Zoom buttons */}
          <div className="flex items-center space-x-1" role="group" aria-label="Zoom controls">
            <button
              type="button"
              onClick={() => handleZoom(-0.1)}
              className="p-1.5 rounded text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs w-10 text-center text-slate-600">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.1)}
              className="p-1.5 rounded text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(0.75)}
              className="p-1.5 rounded text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Reset Zoom to 75%"
              aria-label="Reset zoom to 75%"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Pages Canvas Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-start justify-center">
        <div
          className="m-auto transition-transform duration-150 origin-top flex items-center justify-center py-4"
          style={{ transform: `scale(${zoomScale})` }}
        >
          {viewMode === 'spread' ? (
            /* Side-by-side spread */
            <div className="flex items-stretch justify-center relative shadow-2xl rounded-sm">
              {/* Left (Verso) Page */}
              <BookPage
                page={activeSpread?.left}
                template={template}
                isPlaceholder={!activeSpread?.left}
                selectedPlacementId={selectedPlacementId}
                onSelectPlacement={onSelectPlacement}
              />

              {/* Book Spine Center Divider */}
              <div className="w-[1px] bg-slate-300 relative z-20" />

              {/* Right (Recto) Page */}
              <BookPage
                page={activeSpread?.right}
                template={template}
                isPlaceholder={!activeSpread?.right}
                selectedPlacementId={selectedPlacementId}
                onSelectPlacement={onSelectPlacement}
              />
            </div>
          ) : (
            /* Single Page */
            <div className="flex items-center justify-center shadow-2xl rounded-sm">
              <BookPage
                page={activeSinglePage}
                template={template}
                selectedPlacementId={selectedPlacementId}
                onSelectPlacement={onSelectPlacement}
              />
            </div>
          )}
        </div>
      </div>

      {/* Spread Footer Information */}
      <div className="bg-white/80 border-t border-slate-200 px-4 py-1.5 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Template: {template.name}</span>
        <span>
          Total Pages: {pages.length} • Size: {template.pageWidthInches}&quot; × {template.pageHeightInches}&quot;
        </span>
      </div>
    </div>
  );
};
