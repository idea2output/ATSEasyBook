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
  ManuscriptBlock,
  BlockType,
} from '@/types/book';
import { templateRepository } from '@/services/templates/templateRepository';
import { createDefaultPlacement } from '@/services/images/imageService';
import { ImageLibrary } from '@/components/images/ImageLibrary';
import { TypographyPanel } from '@/components/typography/TypographyPanel';
import { PreflightPanel } from '@/components/preflight/PreflightPanel';
import { DesignPanel } from '@/components/design/DesignPanel';
import { FontManagerPanel } from '@/components/fonts/FontManagerPanel';
import { ColorManagementPanel } from '@/components/color/ColorManagementPanel';
import { LanguageSettingsPanel } from '@/components/language/LanguageSettingsPanel';
import { HindiPublishingPanel } from '@/components/hindi/HindiPublishingPanel';
import { EpubExportModal } from '@/components/export/EpubExportModal';
import { SaveTemplateModal } from '@/components/templates/SaveTemplateModal';
import { CommentsPanel } from '@/components/collaboration/CommentsPanel';
import { VersionHistoryPanel } from '@/components/version/VersionHistoryPanel';
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
  Printer,
  Globe,
  Keyboard,
  BookOpen,
  MessageSquare,
  History,
  Package,
  Lock,
} from 'lucide-react';

export type EditorTabType =
  | 'raw'
  | 'blocks'
  | 'images'
  | 'typography'
  | 'design'
  | 'fonts'
  | 'color'
  | 'language'
  | 'hindi'
  | 'preflight'
  | 'comments'
  | 'versions'
  | 'print';

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
  onOpenPrintModal?: () => void;
  onOpenSharingModal?: () => void;
  onOpenJobModal?: () => void;
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
  onOpenPrintModal,
  onOpenSharingModal,
  onOpenJobModal,
}) => {
  const [internalTab, setInternalTab] = useState<EditorTabType>('raw');
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState<boolean>(false);
  const [isEpubModalOpen, setIsEpubModalOpen] = useState<boolean>(false);

  const isExpert = book.editorMode === 'expert';
  const isViewer = book.currentUserRole === 'viewer';
  const isReviewer = book.currentUserRole === 'reviewer';

  const rawActiveTab = controlledTab || internalTab;
  const activeTab = !isExpert && (rawActiveTab === 'design' || rawActiveTab === 'fonts' || rawActiveTab === 'color')
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
    const updatedImages = images.filter((img) => img.id !== imageId);
    const updatedPlacements = placements.filter((p) => p.imageId !== imageId);
    if (selectedPlacementId && placements.find((p) => p.id === selectedPlacementId)?.imageId === imageId) {
      if (onSelectPlacement) onSelectPlacement(null);
    }
    onUpdateBook({
      images: updatedImages,
      placements: updatedPlacements,
    });
  };

  const handlePlacementCreated = (placement: ImagePlacement) => {
    const updatedPlacements = [...placements, placement];
    onUpdateBook({ placements: updatedPlacements });
    if (onSelectPlacement) {
      onSelectPlacement(placement.id);
    }
  };

  const handleInsertPlacement = (imageId: string, anchoredBlockId?: string) => {
    let targetBlockId = anchoredBlockId;
    if (!targetBlockId) {
      targetBlockId = blocks.length > 0 ? blocks[0].id : 'block-0';
    }
    const newPlacement = createDefaultPlacement(imageId, targetBlockId);
    handlePlacementCreated(newPlacement);
  };

  const handleRemovePlacement = (placementId: string) => {
    const updatedPlacements = placements.filter((p) => p.id !== placementId);
    if (selectedPlacementId === placementId && onSelectPlacement) {
      onSelectPlacement(null);
    }
    onUpdateBook({ placements: updatedPlacements });
  };

  const handleQuickInsertForBlock = (blockId: string, imageId: string) => {
    handleInsertPlacement(imageId, blockId);
    setInsertDropdownBlockId(null);
  };

  const handleUpdateTypography = (overrides: Partial<TypographySettings>, authorName?: string) => {
    onUpdateBook({
      typography: { ...(book.typography || {}), ...overrides },
      author: authorName !== undefined ? authorName : book.author,
    });
  };

  const handleResetTypography = () => {
    onUpdateBook({ typography: undefined });
  };

  const handleUpdateBlockSemantic = (blockId: string, updates: Partial<ManuscriptBlock>) => {
    const updatedBlocks = blocks.map((b) =>
      b.id === blockId ? { ...b, ...updates, isManualOverride: true } : b
    );
    onUpdateBook({ formattedBlocks: updatedBlocks });
  };

  const docLang = book.languageSettings?.language || 'en';
  const docDir = book.languageSettings?.direction || 'ltr';

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Editor Header: Title, Author & Metadata Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5">
            <label htmlFor="book-title-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Book Title {isViewer && <span className="text-amber-600 font-normal">(Read-Only)</span>}
            </label>
            <input
              id="book-title-input"
              type="text"
              disabled={isViewer}
              value={book.title}
              onChange={(e) => onUpdateBook({ title: e.target.value })}
              placeholder="e.g. The Eldridge Voyage"
              aria-label="Book Title"
              className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label htmlFor="book-author-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Author Name {isViewer && <span className="text-amber-600 font-normal">(Read-Only)</span>}
            </label>
            <input
              id="book-author-input"
              type="text"
              disabled={isViewer}
              value={book.author || ''}
              onChange={(e) => onUpdateBook({ author: e.target.value })}
              placeholder="e.g. Captain Arthur Vance"
              aria-label="Author Name"
              className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div className="sm:col-span-3 flex items-end justify-between sm:justify-end space-x-2">
            {/* Save Status Indicator */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 px-1 py-1">
              {isViewer ? (
                <span className="text-amber-600 font-medium flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Viewer</span>
                </span>
              ) : isSaving ? (
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
              disabled={isSaving || isViewer}
              aria-label="Save manuscript now"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* Template Selector & Format Button & EPUB Export Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/60">
          <div className="flex items-center space-x-2">
            <label htmlFor="template-select" className="text-xs font-medium text-slate-600 shrink-0">
              Template:
            </label>
            <select
              id="template-select"
              disabled={isViewer || isReviewer}
              value={book.templateId}
              onChange={(e) => onUpdateBook({ templateId: e.target.value })}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {allTemplates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} {tmpl.isCustom ? '• Custom ' : ''}({tmpl.pageWidthInches}&quot; × {tmpl.pageHeightInches}&quot;)
                </option>
              ))}
            </select>

            {isExpert && !isViewer && !isReviewer && (
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
            {/* EPUB 3 Export Quick Action */}
            <button
              type="button"
              id="editor-export-epub-btn"
              onClick={() => setIsEpubModalOpen(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
              title="Export Accessible EPUB 3 reflowable eBook"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EPUB 3</span>
            </button>

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
              disabled={isViewer}
              aria-label="Format manuscript"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 disabled:opacity-50"
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
                Lines beginning with <code className="bg-indigo-100 px-1 py-0.5 rounded">Chapter &lt;number&gt;</code>, Arabic <code className="bg-indigo-100 px-1 py-0.5 rounded">الفصل 1</code>, or Urdu <code className="bg-indigo-100 px-1 py-0.5 rounded">باب 1</code> start a new chapter.
              </li>
              <li>
                Short uppercase lines (&lt;80 chars Latin) are also parsed as chapter headings.
              </li>
              <li>Use the Blocks tab to manually designate blockquotes, captions, and page breaks.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Editor Tabs */}
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
            id="tab-language"
            aria-selected={activeTab === 'language'}
            onClick={() => setActiveTab('language')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'language'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span>Language ({docLang.toUpperCase()} • {docDir.toUpperCase()})</span>
          </button>

          {(isExpert || docLang === 'hi' || book.hindiSettings) && (
            <button
              type="button"
              role="tab"
              id="tab-hindi"
              aria-selected={activeTab === 'hindi'}
              onClick={() => setActiveTab('hindi')}
              className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                activeTab === 'hindi'
                  ? 'border-orange-600 text-orange-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-orange-600" />
              <span>Hindi Publishing</span>
            </button>
          )}

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

          {isExpert && (
            <button
              type="button"
              role="tab"
              id="tab-color"
              aria-selected={activeTab === 'color'}
              onClick={() => setActiveTab('color')}
              className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                activeTab === 'color'
                  ? 'border-purple-600 text-purple-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-purple-600" />
              <span>Color (CMYK)</span>
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

          <button
            type="button"
            role="tab"
            id="tab-comments"
            aria-selected={activeTab === 'comments'}
            onClick={() => setActiveTab('comments')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'comments'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Comments</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-versions"
            aria-selected={activeTab === 'versions'}
            onClick={() => setActiveTab('versions')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'versions'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>Versions</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-print"
            aria-selected={activeTab === 'print'}
            onClick={() => setActiveTab('print')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              activeTab === 'print'
                ? 'border-amber-600 text-amber-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-amber-600" />
            <span>Print Specs</span>
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
          <div className="h-full flex flex-col space-y-2">
            {isViewer && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You have <strong>Viewer</strong> access to this project. Manuscript editing is read-only.</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Writing Direction: <strong className="uppercase">{docDir}</strong> • Language: <strong className="uppercase">{docLang}</strong>
              </span>
              {docDir === 'rtl' && (
                <span className="text-indigo-600 font-medium">
                  RTL typing enabled with Unicode bidirectional text support
                </span>
              )}
            </div>

            <textarea
              id="raw-manuscript-input"
              dir={docDir}
              lang={docLang}
              readOnly={isViewer}
              value={book.rawManuscript}
              onChange={(e) => onUpdateBook({ rawManuscript: e.target.value })}
              placeholder={
                docDir === 'rtl'
                  ? 'اكتب أو الصق نص مخطوطتك هنا...\n\nالفصل الأول: البداية\n\nكان صباحاً هادئاً حين بدأت الرحلة...'
                  : "Paste or write your manuscript here...\n\nChapter 1: The Beginning\n\nIt was a crisp autumn morning when the expedition set sail..."
              }
              aria-label="Manuscript content"
              style={{
                direction: docDir,
                textAlign: docDir === 'rtl' ? 'right' : 'left',
                unicodeBidi: 'plaintext',
              }}
              className={`flex-1 w-full min-h-[350px] p-4 text-sm font-serif leading-relaxed text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-normal ${
                isViewer ? 'bg-slate-50 cursor-not-allowed text-slate-600' : ''
              }`}
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
                const blockDir = block.direction || docDir;

                return (
                  <div
                    key={block.id || idx}
                    dir={blockDir}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5 transition-shadow hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold border-b border-slate-200/60 pb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          #{idx + 1}
                        </span>

                        {/* Semantic Block Type Selector */}
                        <select
                          value={block.type}
                          onChange={(e) =>
                            handleUpdateBlockSemantic(block.id, {
                              type: e.target.value as BlockType,
                            })
                          }
                          aria-label={`Block #${idx + 1} semantic type`}
                          className="text-[11px] font-semibold bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="paragraph">Paragraph</option>
                          <option value="chapter-heading">Chapter Heading</option>
                          <option value="quote">Blockquote</option>
                          <option value="caption">Caption</option>
                          <option value="page-break">Page Break</option>
                        </select>

                        {/* Block Direction Selector */}
                        <select
                          value={block.direction || 'auto'}
                          onChange={(e) =>
                            handleUpdateBlockSemantic(block.id, {
                              direction: e.target.value as 'ltr' | 'rtl' | 'auto',
                            })
                          }
                          aria-label={`Block #${idx + 1} writing direction`}
                          className="text-[10px] bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-600"
                        >
                          <option value="auto">Dir: Auto</option>
                          <option value="ltr">Dir: LTR</option>
                          <option value="rtl">Dir: RTL</option>
                        </select>
                      </div>

                      <span className="font-mono text-[10px] text-slate-400">ID: {block.id}</span>
                    </div>

                    <p
                      className={`text-slate-800 ${
                        block.type === 'chapter-heading'
                          ? 'font-bold text-sm text-slate-900'
                          : block.type === 'quote'
                          ? 'italic border-l-2 border-slate-300 pl-2'
                          : 'leading-relaxed'
                      }`}
                    >
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

        {activeTab === 'language' && (
          <LanguageSettingsPanel
            project={book}
            onUpdateLanguageSettings={(s) => onUpdateBook({ languageSettings: s })}
          />
        )}

        {activeTab === 'hindi' && (
          <HindiPublishingPanel
            project={book}
            template={template}
            pages={pages}
            onUpdateHindiSettings={(hs) => onUpdateBook({ hindiSettings: hs })}
            onGenerateHindiPdf={onTriggerExport}
          />
        )}

        {activeTab === 'images' && (
          <ImageLibrary
            images={images}
            placements={placements}
            blocks={blocks}
            onAddImage={handleAddImage}
            onUpdateImage={handleUpdateImage}
            onDeleteImage={handleDeleteImage}
            onInsertPlacement={handlePlacementCreated}
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

        {activeTab === 'color' && (
          <ColorManagementPanel
            project={book}
            onUpdateBook={onUpdateBook}
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

        {activeTab === 'comments' && (
          <div className="h-full flex flex-col">
            <CommentsPanel
              projectId={book.id}
              blocks={blocks}
              images={images}
              selectedBlockId={null}
            />
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="h-full flex flex-col">
            <VersionHistoryPanel
              project={book}
              onVersionRestored={(restored) => onUpdateBook(restored)}
              onDuplicateCreated={(cloned) => {
                window.location.href = `/books/${cloned.id}`;
              }}
            />
          </div>
        )}

        {activeTab === 'print' && (
          <div className="h-full overflow-y-auto space-y-4 p-2">
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-amber-700" />
                  <h3 className="font-bold text-slate-900 text-sm">Print Production & Press Readiness</h3>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full">
                  POD Ready
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Verify specifications and review prepress readiness for print-on-demand services (e.g. IngramSpark, Lulu, KDP).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-amber-100 space-y-1">
                  <div className="text-slate-500 font-medium">Trim Dimensions</div>
                  <div className="font-bold text-slate-800">
                    {template.pageWidthInches}&quot; × {template.pageHeightInches}&quot; ({template.name})
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-100 space-y-1">
                  <div className="text-slate-500 font-medium">Page Count & Binding</div>
                  <div className="font-bold text-slate-800">
                    {pages.length} Pages • {pages.length >= 48 ? 'Perfect Bound Paperback' : 'Saddle Stitch / Staple'}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-100 space-y-1">
                  <div className="text-slate-500 font-medium">Output Intent & Color Space</div>
                  <div className="font-bold text-slate-800">
                    {book.colorSettings?.outputProfileId ? book.colorSettings.outputProfileId.toUpperCase() : 'FOGRA39 / ISO Coated v2 (CMYK)'}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-100 space-y-1">
                  <div className="text-slate-500 font-medium">Black Overprint (/GS_OP)</div>
                  <div className="font-bold text-slate-800">
                    {book.colorSettings?.overprintBlackText !== false ? 'Active (Pure 100K Overprint)' : 'Disabled'}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-amber-200/60">
                <div className="text-xs text-slate-600">
                  Preflight Status:{' '}
                  {preflightSummary.errorsCount === 0 ? (
                    <span className="text-emerald-700 font-semibold">0 Errors (Passed)</span>
                  ) : (
                    <span className="text-rose-700 font-semibold">{preflightSummary.errorsCount} Error(s)</span>
                  )}
                </div>

                <button
                  type="button"
                  id="open-print-modal-from-tab"
                  onClick={onOpenPrintModal}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Configure Print Order & Validate</span>
                </button>
              </div>
            </div>
          </div>
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

      {isEpubModalOpen && (
        <EpubExportModal
          project={book}
          template={template}
          onClose={() => setIsEpubModalOpen(false)}
        />
      )}
    </div>
  );
};
