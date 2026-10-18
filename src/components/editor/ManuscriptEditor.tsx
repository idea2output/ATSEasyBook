'use client';

import React, { useState } from 'react';
import { BookProject, ManuscriptBlock } from '@/types/book';
import { AVAILABLE_TEMPLATES } from '@/services/templates/templateRegistry';
import {
  Save,
  Check,
  Wand2,
  ListTree,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface ManuscriptEditorProps {
  book: BookProject;
  onUpdateBook: (updated: Partial<BookProject>) => void;
  onFormatManuscript: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: Date | null;
}

export const ManuscriptEditor: React.FC<ManuscriptEditorProps> = ({
  book,
  onUpdateBook,
  onFormatManuscript,
  onSave,
  isSaving,
  hasUnsavedChanges,
  lastSavedAt,
}) => {
  const [activeTab, setActiveTab] = useState<'raw' | 'blocks'>('raw');
  const [showFormattingTips, setShowFormattingTips] = useState<boolean>(false);

  const wordsCount = book.rawManuscript
    ? book.rawManuscript.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charsCount = book.rawManuscript ? book.rawManuscript.length : 0;
  const blocksCount = book.formattedBlocks?.length || 0;
  const chapterHeadingsCount =
    book.formattedBlocks?.filter((b) => b.type === 'chapter-heading').length || 0;

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
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
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
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded"
              title="Formatting Rules & Tips"
              aria-label="Formatting Rules"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onFormatManuscript}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
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

      {/* Editor Tabs: Raw Manuscript vs Structured Blocks breakdown */}
      <div className="px-4 border-b border-slate-200 bg-slate-50/30 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
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
            onClick={() => setActiveTab('blocks')}
            className={`py-2 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'blocks'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTree className="w-3.5 h-3.5" />
            <span>Structured Blocks ({blocksCount})</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-3 text-[11px] text-slate-500 py-1">
          <span>{wordsCount.toLocaleString()} words</span>
          <span>•</span>
          <span>{charsCount.toLocaleString()} chars</span>
          <span>•</span>
          <span>{chapterHeadingsCount} {chapterHeadingsCount === 1 ? 'chapter' : 'chapters'}</span>
        </div>
      </div>

      {/* Main Manuscript Textarea or Structured Blocks */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'raw' ? (
          <div className="h-full flex flex-col">
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
        ) : (
          /* Structured Blocks Inspector */
          <div className="h-full overflow-y-auto space-y-3">
            {blocksCount === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No structured blocks parsed yet. Click &ldquo;Format manuscript&rdquo; or type content with blank lines.
              </div>
            ) : (
              book.formattedBlocks.map((block, idx) => (
                <div
                  key={block.id || idx}
                  className={`p-3 rounded-lg border text-xs ${
                    block.type === 'chapter-heading'
                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="uppercase font-bold tracking-wider text-indigo-600">
                      {block.type === 'chapter-heading' ? 'Chapter Heading' : 'Paragraph'}
                    </span>
                    <span>Block #{idx + 1}</span>
                  </div>
                  <p className={block.type === 'chapter-heading' ? 'text-sm font-bold' : 'leading-relaxed'}>
                    {block.text}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
