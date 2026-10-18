'use client';

import React, { useState } from 'react';
import { BookProject, BookImage, ImagePlacement, ManuscriptBlock } from '@/types/book';
import { AVAILABLE_TEMPLATES } from '@/services/templates/templateRegistry';
import { ImageLibrary } from '@/components/images/ImageLibrary';
import { createDefaultPlacement } from '@/services/images/imageService';
import {
  Save,
  Check,
  Wand2,
  ListTree,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Plus,
  Sliders,
  Trash2,
} from 'lucide-react';

interface ManuscriptEditorProps {
  book: BookProject;
  onUpdateBook: (updated: Partial<BookProject>) => void;
  onFormatManuscript: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;
  selectedPlacementId?: string | null;
  onSelectPlacement?: (placementId: string | null) => void;
  activeTab?: 'raw' | 'blocks' | 'images';
  onTabChange?: (tab: 'raw' | 'blocks' | 'images') => void;
}

export const ManuscriptEditor: React.FC<ManuscriptEditorProps> = ({
  book,
  onUpdateBook,
  onFormatManuscript,
  onSave,
  isSaving,
  hasUnsavedChanges,
  lastSavedAt,
  selectedPlacementId,
  onSelectPlacement,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'raw' | 'blocks' | 'images'>('raw');
  const activeTab = controlledTab || internalTab;
  const setActiveTab = onTabChange || setInternalTab;

  const [showFormattingTips, setShowFormattingTips] = useState<boolean>(false);
  const [insertDropdownBlockId, setInsertDropdownBlockId] = useState<string | null>(null);

  const images = book.images || [];
  const placements = book.placements || [];
  const blocks = book.formattedBlocks || [];

  const wordsCount = book.rawManuscript
    ? book.rawManuscript.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charsCount = book.rawManuscript ? book.rawManuscript.length : 0;
  const blocksCount = blocks.length;
  const chapterHeadingsCount = blocks.filter((b) => b.type === 'chapter-heading').length;

  const handleAddImage = (newImage: BookImage) => {
    const updatedImages = [newImage, ...images];
    onUpdateBook({ images: updatedImages });
  };

  const handleUpdateImage = (imageId: string, updates: Partial<BookImage>) => {
    const updatedImages = images.map((img) => (img.id === imageId ? { ...img, ...updates } : img));
    onUpdateBook({ images: updatedImages });
  };

  const handleDeleteImage = (imageId: string) => {
    const filteredImages = images.filter((img) => img.id !== imageId);
    // Also safely remove all placements referencing this image
    const filteredPlacements = placements.filter((p) => p.imageId !== imageId);
    if (selectedPlacementId && placements.some((p) => p.id === selectedPlacementId && p.imageId === imageId)) {
      onSelectPlacement && onSelectPlacement(null);
    }
    onUpdateBook({ images: filteredImages, placements: filteredPlacements });
  };

  const handleInsertPlacement = (placement: ImagePlacement) => {
    const updatedPlacements = [...placements, placement];
    onUpdateBook({ placements: updatedPlacements });
    onSelectPlacement && onSelectPlacement(placement.id);
  };

  const handleRemovePlacement = (placementId: string) => {
    const filteredPlacements = placements.filter((p) => p.id !== placementId);
    if (selectedPlacementId === placementId) {
      onSelectPlacement && onSelectPlacement(null);
    }
    onUpdateBook({ placements: filteredPlacements });
  };

  const handleQuickInsertForBlock = (blockId: string, imageId: string) => {
    const newPlacement = createDefaultPlacement(imageId, blockId, 'inline');
    handleInsertPlacement(newPlacement);
    setInsertDropdownBlockId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Editor Header: Title Input & Quick Actions */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
        {/* Title and Save Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label htmlFor="book-title-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Book Project Title
            </label>
            <input
              id="book-title-input"
              type="text"
              value={book.title}
              onChange={(e) => onUpdateBook({ title: e.target.value })}
              placeholder="e.g. The Eldridge Voyage"
              className="w-full text-base sm:text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            {/* Save Status Indicator */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 px-2.5 py-1">
              {isSaving ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Saving...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-700 font-medium">Unsaved edits</span>
                </>
              ) : lastSavedAt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-500">
                    Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              ) : null}
            </div>

            {/* Manual Save Button */}
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              aria-label="Save manuscript now"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Template Selector & Format Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-2">
            <label htmlFor="template-select" className="text-xs font-medium text-slate-600 shrink-0">
              Template:
            </label>
            <select
              id="template-select"
              value={book.templateId}
              onChange={(e) => onUpdateBook({ templateId: e.target.value })}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {AVAILABLE_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowFormattingTips(!showFormattingTips)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Formatting Rules & Tips"
              aria-label="Formatting Rules and Tips"
              aria-expanded={showFormattingTips}
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onFormatManuscript}
              aria-label="Format manuscript"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Format manuscript</span>
            </button>
          </div>
        </div>

        {/* Formatting Rules Banner collapsible */}
        {showFormattingTips && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 space-y-1">
            <p className="font-semibold text-indigo-950">Manuscript Formatting Rules:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-indigo-800">
              <li>Separate body paragraphs with at least one blank line.</li>
              <li>
                Lines beginning with <code className="bg-indigo-100 px-1 py-0.5 rounded">Chapter &lt;number&gt;</code> (e.g. <em>Chapter 1</em>) start a new chapter.
              </li>
              <li>
                Short uppercase lines (&lt;80 chars, e.g. <code className="bg-indigo-100 px-1 py-0.5 rounded">PROLOGUE</code> or <code className="bg-indigo-100 px-1 py-0.5 rounded">PART ONE</code>) are also parsed as chapter headings.
              </li>
              <li>Your original manuscript text is always preserved in full.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Editor Tabs: Raw Manuscript vs Structured Blocks vs Image Library */}
      <div className="px-4 border-b border-slate-200 bg-slate-50/30 flex items-center justify-between">
        <div className="flex space-x-2" role="tablist" aria-label="Editor views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'raw'}
            onClick={() => setActiveTab('raw')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'raw'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Manuscript Editor</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'blocks'}
            onClick={() => setActiveTab('blocks')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'blocks'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Structured Blocks ({blocksCount})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'images'}
            onClick={() => setActiveTab('images')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'images'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Image Library ({images.length})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-3 text-[11px] text-slate-500 py-1">
          <span>{wordsCount.toLocaleString()} words</span>
          <span>•</span>
          <span>{placements.length} {placements.length === 1 ? 'placement' : 'placements'}</span>
          <span>•</span>
          <span>{chapterHeadingsCount} {chapterHeadingsCount === 1 ? 'chapter' : 'chapters'}</span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'raw' && (
          <div className="h-full flex flex-col">
            <label htmlFor="raw-manuscript-input" className="sr-only">
              Manuscript Text Content
            </label>
            <textarea
              id="raw-manuscript-input"
              value={book.rawManuscript}
              onChange={(e) => onUpdateBook({ rawManuscript: e.target.value })}
              placeholder="Paste or write your manuscript here...

Chapter 1: The Beginning

It was a crisp autumn morning when the expedition set sail. The sea was still, reflecting the morning sky like polished glass...

Separate paragraphs with blank lines. Use 'Chapter 1' or ALL CAPS for headings."
              aria-label="Manuscript content"
              className="flex-1 w-full min-h-[350px] p-4 text-sm font-serif leading-relaxed text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-normal"
            />
          </div>
        )}

        {activeTab === 'blocks' && (
          <div className="h-full overflow-y-auto space-y-4">
            {blocksCount === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No structured blocks parsed yet. Click &ldquo;Format manuscript&rdquo; or type content with blank lines.
              </div>
            ) : (
              blocks.map((block, idx) => {
                const blockPlacements = placements.filter((p) => p.blockId === block.id);
                const isDropdownOpen = insertDropdownBlockId === block.id;

                return (
                  <div
                    key={block.id || idx}
                    data-testid="structured-block"
                    className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-shadow ${
                      block.type === 'chapter-heading'
                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="uppercase font-bold tracking-wider text-indigo-600">
                        {block.type === 'chapter-heading' ? 'Chapter Heading' : 'Paragraph'}
                      </span>
                      <span>Block #{idx + 1}</span>
                    </div>

                    <p className={block.type === 'chapter-heading' ? 'text-sm font-bold' : 'leading-relaxed'}>
                      {block.text}
                    </p>

                    {/* Anchored Image Placements List */}
                    {blockPlacements.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Anchored Placements:
                        </span>
                        <div className="space-y-1.5">
                          {blockPlacements.map((plc) => {
                            const img = images.find((i) => i.id === plc.imageId);
                            const isSelected = selectedPlacementId === plc.id;
                            return (
                              <div
                                key={plc.id}
                                className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                                  isSelected
                                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 truncate">
                                  {img && (
                                    <img
                                      src={img.dataUrl}
                                      alt={img.filename}
                                      className="w-8 h-8 rounded object-cover border border-slate-200 shrink-0"
                                    />
                                  )}
                                  <div className="truncate">
                                    <p className="font-bold text-slate-900 truncate">
                                      {img?.filename || 'Image'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 capitalize">
                                      Mode: {plc.mode} • Width: {plc.widthPercent}%
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1 shrink-0 ml-2">
                                  <button
                                    type="button"
                                    onClick={() => onSelectPlacement && onSelectPlacement(plc.id)}
                                    aria-label={`Inspect placement for ${img?.filename}`}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded"
                                    title="Edit Size & Crop"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePlacement(plc.id)}
                                    aria-label={`Remove placement for ${img?.filename}`}
                                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded"
                                    title="Remove Placement"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Insert Image Button */}
                    <div className="pt-1 flex items-center justify-between">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setInsertDropdownBlockId(isDropdownOpen ? null : block.id)}
                          aria-label={`Insert image after block ${idx + 1}`}
                          className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Insert Image After Block</span>
                        </button>

                        {/* Quick Pick Dropdown */}
                        {isDropdownOpen && (
                          <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-30 p-2 space-y-1">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase px-2 py-1">
                              Select from Library:
                            </span>
                            {images.length === 0 ? (
                              <div className="p-2 text-center text-[11px] text-slate-500">
                                <p>Library is empty.</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInsertDropdownBlockId(null);
                                    setActiveTab('images');
                                  }}
                                  className="mt-1 text-indigo-600 underline font-semibold"
                                >
                                  Upload an image first
                                </button>
                              </div>
                            ) : (
                              images.map((img) => (
                                <button
                                  key={img.id}
                                  type="button"
                                  onClick={() => handleQuickInsertForBlock(block.id, img.id)}
                                  className="w-full flex items-center space-x-2 p-1.5 rounded hover:bg-indigo-50 text-left text-slate-800 transition-colors"
                                >
                                  <img
                                    src={img.dataUrl}
                                    alt={img.filename}
                                    className="w-7 h-7 rounded object-cover border border-slate-200 shrink-0"
                                  />
                                  <span className="truncate text-xs font-medium">{img.filename}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <ImageLibrary
            images={images}
            placements={placements}
            blocks={blocks}
            onAddImage={handleAddImage}
            onUpdateImage={handleUpdateImage}
            onDeleteImage={handleDeleteImage}
            onInsertPlacement={handleInsertPlacement}
          />
        )}
      </div>
    </div>
  );
};
