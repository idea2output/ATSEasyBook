'use client';

import React, { useState } from 'react';
import {
  BookProject,
  BookImage,
  ImagePlacement,
  BookTemplate,
  PagePreviewData,
  PreflightSummary,
  PreflightIssue,
  TypographySettings,
  PageDesignSettings,
  CustomFont,
} from '@/types/book';
import { templateRepository } from '@/services/templates/templateRepository';
import { createDefaultPlacement } from '@/services/images/imageService';
import { ImageLibrary } from '@/components/images/ImageLibrary';
import { TypographyPanel } from '@/components/typography/TypographyPanel';
import { PreflightPanel } from '@/components/preflight/PreflightPanel';
import { DesignPanel } from '@/components/design/DesignPanel';
import { FontManagerPanel } from '@/components/fonts/FontManagerPanel';
import { SaveTemplateModal } from '@/components/templates/SaveTemplateModal';
import {
  Save,
  Check,
  Wand2,
  HelpCircle,
  FileText,
  ListTree,
  ImageIcon,
  Type,
  FileCheck,
  Plus,
  Sliders,
  Trash2,
  Sparkles,
  User,
  Palette,
  Bookmark,
} from 'lucide-react';

export type EditorTabType =
  | 'raw'
  | 'blocks'
  | 'images'
  | 'typography'
  | 'design'
  | 'fonts'
  | 'preflight';

interface ManuscriptEditorProps {
  book: BookProject;
  template: BookTemplate;
  pages: PagePreviewData[];
  preflightSummary: PreflightSummary;
  isAcknowledged: boolean;
  onToggleAcknowledge: (val: boolean) => void;
  onUpdateBook: (updatedFields: Partial<BookProject>) => void;
  onFormatManuscript: () => void;
  onSave: () => void;
  onTriggerExport: () => void;
  onExecuteAction: (issue: PreflightIssue) => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;
  selectedPlacementId?: string | null;
  onSelectPlacement?: (placementId: string | null) => void;
  activeTab?: EditorTabType;
  onTabChange?: (tab: EditorTabType) => void;
}

export const ManuscriptEditor: React.FC<ManuscriptEditorProps> = ({
  book,
  template,
  pages,
  preflightSummary,
  isAcknowledged,
  onToggleAcknowledge,
  onUpdateBook,
  onFormatManuscript,
  onSave,
  onTriggerExport,
  onExecuteAction,
  isSaving,
  hasUnsavedChanges,
  lastSavedAt,
  selectedPlacementId,
  onSelectPlacement,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<EditorTabType>('raw');
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState<boolean>(false);
  const isExpert = book.editorMode === 'expert';
  const rawActiveTab = controlledTab || internalTab;
  const activeTab = !isExpert && (rawActiveTab === 'design' || rawActiveTab === 'fonts')
    ? 'typography'
    : rawActiveTab;
  const setActiveTab = onTabChange || setInternalTab;

  const allTemplates = templateRepository.getAllTemplatesSync();

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

  const handleUpdateTypography = (updated: Partial<TypographySettings>) => {
    const merged = { ...(book.typography || {}), ...updated };
    onUpdateBook({ typography: merged });
  };

  const handleResetTypography = () => {
    onUpdateBook({ typography: {} });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Editor Header: Title Input & Quick Actions */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
        {/* Title and Author Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label htmlFor="book-title-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Book Project Title
            </label>
            <input
              id="book-title-input"
              type="text"
              value={book.title}
              onChange={(e) => onUpdateBook({ title: e.target.value })}
              placeholder="e.g. The Eldridge Voyage"
              className="w-full text-sm sm:text-base font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="book-author-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Author
            </label>
            <input
              id="book-author-input"
              type="text"
              value={book.author || ''}
              onChange={(e) => onUpdateBook({ author: e.target.value })}
              placeholder="Author Name"
              className="w-full text-xs sm:text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-3 flex items-end justify-between sm:justify-end space-x-2">
            {/* Save Status Indicator */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 px-1 py-1">
              {isSaving ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Saving...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-700 font-medium">Unsaved</span>
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
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Template Selector & Format Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
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
              {allTemplates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} {tmpl.isCustom ? '• Custom ' : ''}({tmpl.pageWidthInches}&quot; × {tmpl.pageHeightInches}&quot;)
                </option>
              ))}
            </select>

            {isExpert && (
              <button
                type="button"
                id="save-as-template-btn"
                onClick={() => setIsSaveTemplateModalOpen(true)}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors"
                title="Save current layout as a reusable template"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save as Template</span>
              </button>
            )}
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

      {/* Editor Tabs: Raw Manuscript vs Structured Blocks vs Image Library vs Typography vs Preflight */}
      <div className="px-4 border-b border-slate-200 bg-slate-50/30 flex items-center justify-between overflow-x-auto">
        <div className="flex space-x-2 shrink-0" role="tablist" aria-label="Editor views">
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
            <span>Blocks ({blocksCount})</span>
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
            <span>Images ({images.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'typography'}
            onClick={() => setActiveTab('typography')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'typography'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-indigo-600" />
            <span>Typography</span>
          </button>

          {isExpert && (
            <button
              type="button"
              role="tab"
              id="tab-design"
              aria-selected={activeTab === 'design'}
              onClick={() => setActiveTab('design')}
              className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                activeTab === 'design'
                  ? 'border-purple-600 text-purple-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-purple-600" />
              <span>Design</span>
            </button>
          )}

          {isExpert && (
            <button
              type="button"
              role="tab"
              id="tab-fonts"
              aria-selected={activeTab === 'fonts'}
              onClick={() => setActiveTab('fonts')}
              className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                activeTab === 'fonts'
                  ? 'border-purple-600 text-purple-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Type className="w-3.5 h-3.5 text-purple-600" />
              <span>Fonts ({book.customFonts?.length || 0})</span>
            </button>
          )}

          <button
            type="button"
            role="tab"
            id="tab-preflight"
            aria-selected={activeTab === 'preflight'}
            onClick={() => setActiveTab('preflight')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'preflight'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Preflight</span>
            {preflightSummary.errorsCount > 0 ? (
              <span className="ml-1 px-1.5 py-0.2 bg-rose-100 text-rose-700 font-bold rounded-full text-[10px]">
                {preflightSummary.errorsCount}
              </span>
            ) : preflightSummary.warningsCount > 0 ? (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px]">
                {preflightSummary.warningsCount}
              </span>
            ) : (
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                ✓
              </span>
            )}
          </button>
        </div>

        <div className="hidden lg:flex items-center space-x-3 text-[11px] text-slate-500 py-1 shrink-0">
          <span>{wordsCount.toLocaleString()} words</span>
          <span>•</span>
          <span>{placements.length} {placements.length === 1 ? 'placement' : 'placements'}</span>
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
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5 transition-shadow hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold border-b border-slate-200/60 pb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          #{idx + 1}
                        </span>
                        <span
                          className={`uppercase tracking-wider ${
                            block.type === 'chapter-heading' ? 'text-amber-700 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {block.type === 'chapter-heading' ? 'Chapter Heading' : 'Paragraph'}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">ID: {block.id}</span>
                    </div>

                    <p className={`text-slate-800 ${block.type === 'chapter-heading' ? 'font-bold text-sm text-slate-900' : 'leading-relaxed'}`}>
                      {block.text}
                    </p>

                    {/* Placements anchored to this block */}
                    {blockPlacements.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Anchored Images ({blockPlacements.length}):
                        </span>
                        {blockPlacements.map((p) => {
                          const img = images.find((i) => i.id === p.imageId);
                          const isSelected = selectedPlacementId === p.id;
                          return (
                            <div
                              key={p.id}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                                isSelected ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-400' : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 overflow-hidden">
                                {img && (
                                  <img
                                    src={img.dataUrl}
                                    alt={p.caption || img.filename}
                                    className="w-9 h-9 rounded object-cover border border-slate-200 shrink-0"
                                  />
                                )}
                                <div className="truncate">
                                  <p className="font-bold text-slate-900 truncate">
                                    {img ? img.filename : 'Unknown Image'}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    Mode: <span className="font-semibold uppercase">{p.mode}</span> • Width: {p.widthPercent}%
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => onSelectPlacement && onSelectPlacement(p.id)}
                                  className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded"
                                >
                                  Inspect
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePlacement(p.id)}
                                  aria-label="Remove image placement"
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick Insert Image Action for this block */}
                    <div className="relative pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setInsertDropdownBlockId(isDropdownOpen ? null : block.id)}
                        className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50/50"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Insert Image After Block</span>
                      </button>

                      {/* Dropdown menu */}
                      {isDropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-1 z-30 w-56 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 space-y-1">
                          <p className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">
                            Choose Image from Library:
                          </p>
                          {images.length === 0 ? (
                            <p className="text-xs text-slate-500 px-2 py-1.5">No images uploaded yet.</p>
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

        {activeTab === 'typography' && (
          <TypographyPanel
            template={template}
            typographyOverrides={book.typography}
            authorName={book.author}
            customFonts={book.customFonts || []}
            onUpdateTypography={handleUpdateTypography}
            onResetTypography={handleResetTypography}
          />
        )}

        {activeTab === 'design' && (
          <DesignPanel
            design={book.design || template.design}
            onUpdateDesign={(d) => onUpdateBook({ design: d })}
            onResetDesign={() => onUpdateBook({ design: {} })}
          />
        )}

        {activeTab === 'fonts' && (
          <FontManagerPanel
            fonts={book.customFonts || []}
            onAddFont={(f) =>
              onUpdateBook({ customFonts: [...(book.customFonts || []), f] })
            }
            onRemoveFont={(fId) =>
              onUpdateBook({
                customFonts: (book.customFonts || []).filter((f) => f.id !== fId),
              })
            }
          />
        )}

        {activeTab === 'preflight' && (
          <PreflightPanel
            summary={preflightSummary}
            isAcknowledged={isAcknowledged}
            onToggleAcknowledge={onToggleAcknowledge}
            onTriggerExport={onTriggerExport}
            onExecuteAction={onExecuteAction}
          />
        )}
      </div>

      {isSaveTemplateModalOpen && (
        <SaveTemplateModal
          isOpen={isSaveTemplateModalOpen}
          onClose={() => setIsSaveTemplateModalOpen(false)}
          project={book}
          baseTemplate={template}
          onSaved={(newTmpl) => {
            onUpdateBook({ templateId: newTmpl.id });
          }}
        />
      )}
    </div>
  );
};
