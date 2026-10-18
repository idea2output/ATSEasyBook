'use client';

import React, { useState } from 'react';
import { BookProject, BookTemplate } from '@/types/book';
import { templateRepository } from '@/services/templates/templateRepository';
import { Bookmark, Sparkles, X, Check, Layers } from 'lucide-react';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: BookProject;
  baseTemplate: BookTemplate;
  onSaved: (newTemplate: BookTemplate) => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  project,
  baseTemplate,
  onSaved,
}) => {
  const [name, setName] = useState(`${project.title} Custom Template`);
  const [description, setDescription] = useState(
    `Customized ${baseTemplate.name} layout with custom styling and typography.`
  );
  const [suitabilityText, setSuitabilityText] = useState('Custom Publishing, Trade');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    try {
      setIsSaving(true);
      const tags = suitabilityText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const newId = `custom-tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const saved = await templateRepository.saveCustomTemplate({
        id: newId,
        name: name.trim(),
        description: description.trim(),
        category: baseTemplate.category,
        isCustom: true,
        suitability: tags.length > 0 ? tags : ['Custom'],
        pageWidthInches: baseTemplate.pageWidthInches,
        pageHeightInches: baseTemplate.pageHeightInches,
        bleedInches: baseTemplate.bleedInches,
        safeAreaInches: baseTemplate.safeAreaInches,
        margins: { ...baseTemplate.margins },
        columns: { ...baseTemplate.columns },
        typography: {
          ...baseTemplate.typography,
          ...(project.typography || {}),
        },
        headersFooters: { ...baseTemplate.headersFooters },
        imageConstraints: { ...baseTemplate.imageConstraints },
        linesPerPage: baseTemplate.linesPerPage,
        charsPerLine: baseTemplate.charsPerLine,
        design: {
          ...(baseTemplate.design || {}),
          ...(project.design || {}),
        },
      });

      onSaved(saved);
      onClose();
    } catch (err) {
      console.error('Failed to save custom template:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-template-dialog-title"
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 id="save-template-dialog-title" className="text-base font-bold text-slate-900">
                Save Layout as Reusable Template
              </h3>
              <p className="text-xs text-slate-500">
                Capture current trim, margins, typography, and visual design settings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Deluxe Illustrated Novel"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe trim size and layout characteristics..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Suitability Tags (Comma Separated)
            </label>
            <input
              type="text"
              value={suitabilityText}
              onChange={(e) => setSuitabilityText(e.target.value)}
              placeholder="e.g. Novels, Memoirs, Deluxe Editions"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Captured Attributes Summary */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 text-slate-600">
            <span className="font-semibold text-slate-800 block">Captured Properties:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <div>• Trim: {baseTemplate.pageWidthInches}″ × {baseTemplate.pageHeightInches}″</div>
              <div>• Columns: {baseTemplate.columns.count === 2 ? 'Two Columns' : 'Single Column'}</div>
              <div>• Background: {project.design?.backgroundColor || baseTemplate.design?.backgroundColor || '#ffffff'}</div>
              <div>• Border: {project.design?.borderEnabled ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving Template...' : 'Save Reusable Template'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
