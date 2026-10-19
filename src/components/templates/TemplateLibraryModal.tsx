'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BookTemplate, BookProject } from '@/types/book';
import { UserProfile } from '@/types/auth';
import { templateRepository, ReflowImpactCheck } from '@/services/templates/templateRepository';
import { authService } from '@/services/cloud/authService';
import { versionService } from '@/services/cloud/versionService';
import { ReflowWarningModal } from './ReflowWarningModal';
import {
  Bookmark,
  Sparkles,
  Copy,
  Archive,
  Trash2,
  Check,
  Eye,
  Sliders,
  X,
  Search,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBook?: BookProject;
  currentTemplate: BookTemplate;
  onSelectTemplate: (template: BookTemplate) => void;
  onOpenAdminEditor?: (templateId?: string) => void;
  onOpenCustomPage?: () => void;
}

export const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  currentBook,
  currentTemplate,
  onSelectTemplate,
  onOpenAdminEditor,
  onOpenCustomPage,
}) => {
  const [templates, setTemplates] = useState<BookTemplate[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'builtin' | 'custom' | 'organization' | 'archived'>('all');

  // Preview modal/drawer state
  const [previewTemplate, setPreviewTemplate] = useState<BookTemplate | null>(null);

  // Reflow confirmation state
  const [pendingApplyTemplate, setPendingApplyTemplate] = useState<BookTemplate | null>(null);
  const [reflowCheck, setReflowCheck] = useState<ReflowImpactCheck | null>(null);

  // Status message
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const loadTemplates = () => {
    const user = authService.getCurrentUserSync();
    setCurrentUser(user);
    const list = templateRepository.getAllTemplatesSync(true);
    setTemplates(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const isAdmin = currentUser?.role === 'administrator' || currentUser?.role === 'owner';

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tmpl) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = tmpl.name.toLowerCase().includes(q);
        const descMatch = (tmpl.description || '').toLowerCase().includes(q);
        const tagsMatch = Array.isArray(tmpl.suitability)
          ? tmpl.suitability.some((t) => t.toLowerCase().includes(q))
          : typeof tmpl.suitability === 'string' && tmpl.suitability.toLowerCase().includes(q);
        if (!nameMatch && !descMatch && !tagsMatch) return false;
      }

      // 2. Active Tab Filter
      if (activeFilter === 'archived') {
        return Boolean(tmpl.isArchived || tmpl.governance?.status === 'archived');
      }

      // Don't show archived templates in normal tabs
      if (tmpl.isArchived || tmpl.governance?.status === 'archived') {
        return false;
      }

      if (activeFilter === 'builtin') {
        return !tmpl.isCustom;
      }
      if (activeFilter === 'custom') {
        return Boolean(tmpl.isCustom && tmpl.governance?.visibility !== 'organization');
      }
      if (activeFilter === 'organization') {
        return tmpl.governance?.visibility === 'organization';
      }

      return true;
    });
  }, [templates, searchQuery, activeFilter]);

  if (!isOpen) return null;

  const handleDuplicate = async (sourceId: string) => {
    try {
      const duplicated = await templateRepository.duplicateTemplate(sourceId, undefined, currentUser);
      loadTemplates();
      setFeedbackMessage(`Duplicated template "${duplicated.name}".`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setFeedbackMessage(err.message || 'Failed to duplicate template.');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await templateRepository.archiveTemplate(id, currentUser);
      loadTemplates();
      setFeedbackMessage('Template moved to archive.');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setFeedbackMessage(err.message || 'Failed to archive template.');
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      await templateRepository.unarchiveTemplate(id, currentUser);
      loadTemplates();
      setFeedbackMessage('Template restored from archive.');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setFeedbackMessage(err.message || 'Failed to restore template.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this custom template?')) return;
    try {
      const result = await templateRepository.deleteCustomTemplate(id, 'classic-novel-6x9', currentUser);
      loadTemplates();
      if (result.wasArchivedInstead) {
        setFeedbackMessage(
          `Template is in use by ${result.affectedBookCount} active book(s). It was safely archived instead to prevent breaking projects.`
        );
      } else {
        setFeedbackMessage('Template deleted successfully.');
      }
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setFeedbackMessage(err.message || 'Failed to delete template.');
    }
  };

  const handleInitiateApply = (targetTemplate: BookTemplate) => {
    if (targetTemplate.id === currentTemplate.id) {
      onClose();
      return;
    }

    const check = templateRepository.detectReflowImpact(currentTemplate, targetTemplate);
    if (check.hasMaterialImpact) {
      setPendingApplyTemplate(targetTemplate);
      setReflowCheck(check);
    } else {
      applyTemplateDirectly(targetTemplate);
    }
  };

  const applyTemplateDirectly = async (targetTemplate: BookTemplate) => {
    if (currentBook) {
      // Create version snapshot before applying
      try {
        await versionService.createSnapshot(
          currentBook,
          'auto-pre-template',
          `Changed template to "${targetTemplate.name}"`
        );
      } catch (err) {
        console.warn('Could not create version snapshot before template change', err);
      }
    }

    onSelectTemplate(targetTemplate);
    setPendingApplyTemplate(null);
    setReflowCheck(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-library-title"
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 id="template-library-title" className="text-base font-bold text-slate-900">
                Book Template Library & Governance
              </h2>
              <p className="text-xs text-slate-500">
                Manage reusable publisher templates, geometry presets, and organization designs.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isAdmin && onOpenAdminEditor && (
              <button
                type="button"
                id="open-admin-template-editor-btn"
                onClick={() => {
                  onClose();
                  onOpenAdminEditor();
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Template Editor</span>
              </button>
            )}

            {onOpenCustomPage && (
              <button
                type="button"
                id="library-custom-page-btn"
                onClick={() => {
                  onClose();
                  onOpenCustomPage();
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Custom Page</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="px-5 py-2.5 bg-indigo-50 border-b border-indigo-100 text-xs text-indigo-800 font-medium flex items-center justify-between">
            <span>{feedbackMessage}</span>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-indigo-600 hover:text-indigo-900 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Controls Bar: Search & Filter Tabs */}
        <div className="p-3 sm:px-5 sm:py-3 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search templates by name, size, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-medium">
            {[
              { id: 'all', label: 'All' },
              { id: 'builtin', label: 'Standard' },
              { id: 'custom', label: 'My Custom' },
              { id: 'organization', label: 'Organization' },
              { id: 'archived', label: 'Archived' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeFilter === f.id
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {filteredTemplates.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto stroke-1" />
              <p className="text-sm font-medium text-slate-600">No templates found</p>
              <p className="text-xs">Try adjusting your search query or selected filter tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((tmpl) => {
                const isSelected = tmpl.id === currentTemplate.id;
                const isArchived = Boolean(tmpl.isArchived || tmpl.governance?.status === 'archived');
                const canEdit = templateRepository.canEditTemplate(tmpl, currentUser);

                return (
                  <div
                    key={tmpl.id}
                    className={`rounded-xl border p-4.5 flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-600/10 bg-indigo-50/20'
                        : isArchived
                        ? 'border-slate-200 bg-slate-50/70 opacity-75'
                        : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              !tmpl.isCustom
                                ? 'bg-slate-100 text-slate-700'
                                : tmpl.governance?.visibility === 'organization'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {!tmpl.isCustom
                              ? 'Standard'
                              : tmpl.governance?.visibility === 'organization'
                              ? 'Org Governed'
                              : 'Custom'}
                          </span>

                          {isArchived && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Archived
                            </span>
                          )}

                          {isSelected && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>Current</span>
                            </span>
                          )}
                        </div>

                        <span className="text-xs font-mono font-semibold text-slate-500">
                          {tmpl.pageWidthInches}&quot; × {tmpl.pageHeightInches}&quot;
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-bold text-sm text-slate-900">{tmpl.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tmpl.description}</p>

                      {/* Suitability / Tags */}
                      {tmpl.suitability && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {(Array.isArray(tmpl.suitability)
                            ? tmpl.suitability
                            : String(tmpl.suitability).split(',')
                          ).map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Toolbar */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(tmpl.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Duplicate this template"
                          aria-label={`Duplicate ${tmpl.name}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {tmpl.isCustom && canEdit && (
                          <>
                            {isArchived ? (
                              <button
                                type="button"
                                onClick={() => handleUnarchive(tmpl.id)}
                                className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Restore from archive"
                                aria-label={`Restore ${tmpl.name}`}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleArchive(tmpl.id)}
                                className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Archive this template"
                                aria-label={`Archive ${tmpl.name}`}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(tmpl.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete template"
                              aria-label={`Delete ${tmpl.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {!isSelected && !isArchived && (
                          <button
                            type="button"
                            onClick={() => handleInitiateApply(tmpl)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <span>Apply</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500">
            {templates.length} total templates • Built-in templates are immutable
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Reflow Warning Modal */}
      {pendingApplyTemplate && reflowCheck && (
        <ReflowWarningModal
          isOpen={Boolean(pendingApplyTemplate)}
          onClose={() => {
            setPendingApplyTemplate(null);
            setReflowCheck(null);
          }}
          onConfirm={() => applyTemplateDirectly(pendingApplyTemplate)}
          currentTemplate={currentTemplate}
          newTemplate={pendingApplyTemplate}
          differences={reflowCheck.differences}
        />
      )}
    </div>
  );
};
