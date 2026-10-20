'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { CustomPageSettingsModal } from '@/components/templates/CustomPageSettingsModal';
import { TemplateLibraryModal } from '@/components/templates/TemplateLibraryModal';
import { ReflowWarningModal } from '@/components/templates/ReflowWarningModal';
import { versionService } from '@/services/cloud/versionService';
import { useRouter } from 'next/navigation';
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
  Menu,
  ChevronDown,
  X,
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
  const router = useRouter();
  const [internalTab, setInternalTab] = useState<EditorTabType>('raw');
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState<boolean>(false);
  const [isCustomPageModalOpen, setIsCustomPageModalOpen] = useState<boolean>(false);
  const [isTemplateLibraryModalOpen, setIsTemplateLibraryModalOpen] = useState<boolean>(false);
  const [pendingReflowTemplate, setPendingReflowTemplate] = useState<BookTemplate | null>(null);
  const [reflowDifferences, setReflowDifferences] = useState<string[]>([]);
  const [isEpubModalOpen, setIsEpubModalOpen] = useState<boolean>(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState<boolean>(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsToolsMenuOpen(false);
      }
    };

    if (isToolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isToolsMenuOpen]);

  const isExpert = book.editorMode === 'expert';
  const isViewer = book.currentUserRole === 'viewer';
  const isReviewer = book.currentUserRole === 'reviewer';

  const rawActiveTab = controlledTab || internalTab;
  const activeTab = !isExpert && (rawActiveTab === 'design' || rawActiveTab === 'fonts' || rawActiveTab === 'color')
    ? 'typography'
    : rawActiveTab;
  const setActiveTab = onTabChange || setInternalTab;

  const allTemplates = templateRepository.getAllTemplatesSync();

  const handleSelectTemplateWithReflowCheck = async (targetTemplateId: string) => {
    if (targetTemplateId === 'custom-page-template') {
      onUpdateBook({ templateId: 'custom-page-template' });
      setIsCustomPageModalOpen(true);
      return;
    }

    const target = templateRepository.getTemplateById(targetTemplateId);
    const impact = templateRepository.detectReflowImpact(template, target);
    if (impact.hasMaterialImpact) {
      setPendingReflowTemplate(target);
      setReflowDifferences(impact.differences);
    } else {
      onUpdateBook({ templateId: target.id });
    }
  };

  const handleConfirmReflowTemplate = async () => {
    if (!pendingReflowTemplate) return;
    try {
      await versionService.createSnapshot(
        book,
        'auto-pre-template',
        `Switched template to "${pendingReflowTemplate.name}"`
      );
    } catch (err) {
      console.warn('Could not snapshot version before template change:', err);
    }
    onUpdateBook({ templateId: pendingReflowTemplate.id });
    setPendingReflowTemplate(null);
    setReflowDifferences([]);
  };

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

  const getActiveTabInfo = (tab: EditorTabType) => {
    switch (tab) {
      case 'blocks':
        return { label: `Blocks (${blocksCount})`, icon: <ListTree className="w-3.5 h-3.5 text-indigo-600" /> };
      case 'language':
        return { label: `Language (${docLang.toUpperCase()} • ${docDir.toUpperCase()})`, icon: <Globe className="w-3.5 h-3.5 text-indigo-600" /> };
      case 'hindi':
        return { label: 'Hindi Publishing', icon: <Keyboard className="w-3.5 h-3.5 text-orange-600" /> };
      case 'images':
        return { label: `Images (${images.length})`, icon: <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> };
      case 'typography':
        return { label: 'Typography', icon: <Type className="w-3.5 h-3.5 text-indigo-600" /> };
      case 'design':
        return { label: 'Design', icon: <Palette className="w-3.5 h-3.5 text-purple-600" /> };
      case 'fonts':
        return { label: `Fonts (${book.customFonts?.length || 0})`, icon: <Type className="w-3.5 h-3.5 text-purple-600" /> };
      case 'color':
        return { label: 'Color (CMYK)', icon: <Printer className="w-3.5 h-3.5 text-purple-600" /> };
      case 'preflight':
        return {
          label: 'Preflight',
          icon: <FileCheck className="w-3.5 h-3.5 text-indigo-600" />,
          badge: preflightSummary.errorsCount > 0 ? (
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
          ),
        };
      case 'comments':
        return { label: 'Comments', icon: <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> };
      case 'versions':
        return { label: 'Versions', icon: <History className="w-3.5 h-3.5 text-indigo-600" /> };
      case 'print':
        return { label: 'Print Specs', icon: <Package className="w-3.5 h-3.5 text-amber-600" /> };
      case 'raw':
      default:
        return { label: 'Manuscript Editor', icon: <FileText className="w-3.5 h-3.5 text-indigo-600" /> };
    }
  };

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
              onChange={(e) => handleSelectTemplateWithReflowCheck(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {allTemplates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} {tmpl.isCustom ? '• Custom ' : ''}({tmpl.pageWidthInches}&quot; × {tmpl.pageHeightInches}&quot;)
                </option>
              ))}
              {isExpert && (
                <option value="custom-page-template">✦ Custom Page (Configurable)</option>
              )}
            </select>

            {isExpert && !isViewer && !isReviewer && (
              <div className="flex items-center space-x-1.5">
                {(book.templateId === 'custom-page-template' || template.isCustom) && (
                  <button
                    type="button"
                    id="open-custom-page-settings-btn"
                    onClick={() => setIsCustomPageModalOpen(true)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
                    title="Configure Custom Page Geometry & Margins"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Page Settings</span>
                  </button>
                )}

                <button
                  type="button"
                  id="open-template-library-btn"
                  onClick={() => setIsTemplateLibraryModalOpen(true)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-colors"
                  title="Browse Reusable & Organization Templates"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Template Library</span>
                </button>

                <button
                  type="button"
                  id="save-as-template-btn"
                  onClick={() => setIsSaveTemplateModalOpen(true)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors"
                  title="Save current layout as a reusable template"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save as Template</span>
                </button>
              </div>
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

      {/* Editor Tabs - Manuscript Editor + Hamburger Menu */}
      <div className="px-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center space-x-2 shrink-0 py-1" role="tablist" aria-label="Editor views">
          {/* 1. Permanent Primary Tab: Manuscript Editor */}
          <button
            type="button"
            role="tab"
            id="tab-manuscript-editor"
            aria-selected={activeTab === 'raw'}
            onClick={() => {
              setActiveTab('raw');
              setIsToolsMenuOpen(false);
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'raw'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className={`w-3.5 h-3.5 ${activeTab === 'raw' ? 'text-indigo-600' : 'text-slate-500'}`} />
            <span>Manuscript Editor</span>
          </button>

          {/* 2. Active Secondary Tool Breadcrumb Chip (When user chooses a tool from Hamburger menu) */}
          {activeTab !== 'raw' && (
            <div className="flex items-center space-x-1 pl-1">
              <span className="text-slate-300 text-xs font-light">/</span>
              <span className="py-1 px-2.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center space-x-1.5 shadow-xs">
                {getActiveTabInfo(activeTab).icon}
                <span>{getActiveTabInfo(activeTab).label}</span>
                {getActiveTabInfo(activeTab).badge}
                <button
                  type="button"
                  onClick={() => setActiveTab('raw')}
                  className="ml-1 p-0.5 hover:bg-indigo-200/70 rounded text-indigo-500 hover:text-indigo-900 transition-colors"
                  title="Return to Manuscript Editor"
                  aria-label="Close view and return to Manuscript Editor"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Hamburger Tools Menu & Stats */}
        <div className="flex items-center space-x-3 py-1">
          <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-500 shrink-0">
            <span>{wordsCount.toLocaleString()} words</span>
            <span>•</span>
            <span>{placements.length} {placements.length === 1 ? 'placement' : 'placements'}</span>
          </div>

          {/* Hamburger Menu Dropdown */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              type="button"
              id="btn-tools-hamburger-menu"
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              className={`py-1.5 px-3 text-xs font-medium rounded-md border flex items-center space-x-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isToolsMenuOpen || activeTab !== 'raw'
                  ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
              aria-expanded={isToolsMenuOpen}
              aria-haspopup="true"
              title="Open more tools &amp; views"
            >
              <Menu className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-semibold text-xs">Tools</span>
              {preflightSummary.errorsCount > 0 ? (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title={`${preflightSummary.errorsCount} Preflight Error(s)`} />
              ) : preflightSummary.warningsCount > 0 ? (
                <span className="w-2 h-2 rounded-full bg-amber-500" title={`${preflightSummary.warningsCount} Preflight Warning(s)`} />
              ) : null}
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {isToolsMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-2 divide-y divide-slate-100 text-xs animate-in fade-in zoom-in-95 duration-100"
                role="menu"
                aria-label="Editor Tools Menu"
              >
                {/* Group 1: Content & Structure */}
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Content &amp; Structure
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    id="tab-blocks"
                    onClick={() => {
                      setActiveTab('blocks');
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                      activeTab === 'blocks'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <ListTree className="w-3.5 h-3.5 text-slate-500" />
                      <span>Blocks</span>
                    </span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                      {blocksCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    id="tab-comments"
                    onClick={() => {
                      setActiveTab('comments');
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                      activeTab === 'comments'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>Comments</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    id="tab-versions"
                    onClick={() => {
                      setActiveTab('versions');
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                      activeTab === 'versions'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Versions</span>
                    </span>
                  </button>
                </div>

                {/* Group 2: Language & Typography */}
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Language &amp; Typography
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    id="tab-language"
                    onClick={() => {
                      setActiveTab('language');
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                      activeTab === 'language'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <span>Language</span>
                    </span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono uppercase font-semibold">
                      {docLang} • {docDir}
                    </span>
                  </button>

                  {(isExpert || docLang === 'hi' || book.hindiSettings) && (
                    <button
                      type="button"
                      role="menuitem"
                      id="tab-hindi"
                      onClick={() => {
                        setActiveTab('hindi');
                        setIsToolsMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                        activeTab === 'hindi'
                          ? 'bg-orange-50 text-orange-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <Keyboard className="w-3.5 h-3.5 text-orange-500" />
                        <span>Hindi Publishing</span>
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    id="tab-typography"
                    onClick={() => {
                      setActiveTab('typography');
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                      activeTab === 'typography'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <Type className="w-3.5 h-3.5 text-slate-500" />
                      <span>Typography</span>
                    </span>
                  </button>

                  {isExpert && (
                    <button
                      type="button"
                      role="menuitem"
                      id="tab-fonts"
                      onClick={() => {
                        setActiveTab('fonts');
                        setIsToolsMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                        activeTab === 'fonts'
                          ? 'bg-purple-50 text-purple-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <Type className="w-3.5 h-3.5 text-purple-500" />
                        <span>Custom Fonts</span>
                      </span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                        {book.customFonts?.length || 0}
                      </span>
                    </button>
                  )}
                </div>

                {/* Group 3: Media */}
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Media
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    id="tab-images"
                    onClick={() => {
                      setActiveTab('images');
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                      activeTab === 'images'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Images</span>
                    </span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                      {images.length}
                    </span>
                  </button>
                </div>

                {/* Group 4: Prepress & Print */}
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Prepress &amp; Print
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    id="tab-preflight"
                    onClick={() => {
                      setActiveTab('preflight');
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                      activeTab === 'preflight'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Preflight</span>
                    </span>
                    {preflightSummary.errorsCount > 0 ? (
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 font-bold rounded-full text-[10px]">
                        {preflightSummary.errorsCount} Error(s)
                      </span>
                    ) : preflightSummary.warningsCount > 0 ? (
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px]">
                        {preflightSummary.warningsCount} Warning(s)
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                        ✓ Pass
                      </span>
                    )}
                  </button>

                  {isExpert && (
                    <button
                      type="button"
                      role="menuitem"
                      id="tab-color"
                      onClick={() => {
                        setActiveTab('color');
                        setIsToolsMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                        activeTab === 'color'
                          ? 'bg-purple-50 text-purple-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <Printer className="w-3.5 h-3.5 text-purple-500" />
                        <span>Color (CMYK)</span>
                      </span>
                    </button>
                  )}

                  {isExpert && (
                    <button
                      type="button"
                      role="menuitem"
                      id="tab-design"
                      onClick={() => {
                        setActiveTab('design');
                        setIsToolsMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                        activeTab === 'design'
                          ? 'bg-purple-50 text-purple-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <Palette className="w-3.5 h-3.5 text-purple-500" />
                        <span>Design</span>
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    id="tab-print"
                    onClick={() => {
                      setActiveTab('print');
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left transition-colors ${
                      activeTab === 'print'
                        ? 'bg-amber-50 text-amber-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <Package className="w-3.5 h-3.5 text-amber-600" />
                      <span>Print Specs</span>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
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

      {isCustomPageModalOpen && (
        <CustomPageSettingsModal
          isOpen={isCustomPageModalOpen}
          onClose={() => setIsCustomPageModalOpen(false)}
          currentTemplate={template}
          onApplyCustomPage={async (customTmpl) => {
            try {
              const saved = await templateRepository.saveCustomTemplate(customTmpl);
              onUpdateBook({
                templateId: saved.id,
                design: { ...(book.design || {}), ...(saved.design || {}) },
              });
            } catch (err) {
              console.error('Failed to apply custom page:', err);
            }
          }}
        />
      )}

      {isTemplateLibraryModalOpen && (
        <TemplateLibraryModal
          isOpen={isTemplateLibraryModalOpen}
          onClose={() => setIsTemplateLibraryModalOpen(false)}
          currentBook={book}
          currentTemplate={template}
          onSelectTemplate={(selectedTmpl) => {
            onUpdateBook({ templateId: selectedTmpl.id });
          }}
          onOpenAdminEditor={() => {
            router.push('/admin/templates');
          }}
          onOpenCustomPage={() => {
            setIsCustomPageModalOpen(true);
          }}
        />
      )}

      {pendingReflowTemplate && (
        <ReflowWarningModal
          isOpen={Boolean(pendingReflowTemplate)}
          onClose={() => {
            setPendingReflowTemplate(null);
            setReflowDifferences([]);
          }}
          onConfirm={handleConfirmReflowTemplate}
          currentTemplate={template}
          newTemplate={pendingReflowTemplate}
          differences={reflowDifferences}
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
