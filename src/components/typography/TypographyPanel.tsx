'use client';

import React from 'react';
import { BookTemplate, TypographySettings, CustomFont } from '@/types/book';
import { getEffectiveTypography } from '@/services/templates/templateRegistry';
import {
  Type,
  AlignLeft,
  AlignJustify,
  Sliders,
  RotateCcw,
  BookOpen,
  User,
  Hash,
} from 'lucide-react';

interface TypographyPanelProps {
  template: BookTemplate;
  typographyOverrides?: Partial<TypographySettings>;
  authorName?: string;
  customFonts?: CustomFont[];
  onUpdateTypography: (updated: Partial<TypographySettings>) => void;
  onResetTypography: () => void;
}

const BUILTIN_FONT_OPTIONS = [
  { name: 'Georgia (Classic Editorial)', value: 'Georgia, Cambria, "Times New Roman", serif' },
  { name: 'Garamond (Literary Standard)', value: 'Garamond, "EB Garamond", Georgia, serif' },
  { name: 'Times New Roman (Trade Traditional)', value: '"Times New Roman", Times, Georgia, serif' },
  { name: 'Merriweather (Modern Nonfiction)', value: 'Merriweather, Georgia, serif' },
  { name: 'Palatino (Art & Illustrated)', value: 'Palatino, "Palatino Linotype", Georgia, serif' },
  { name: 'Inter (Clean Technical Sans)', value: 'Inter, system-ui, -apple-system, sans-serif' },
];

export const TypographyPanel: React.FC<TypographyPanelProps> = ({
  template,
  typographyOverrides,
  authorName = '',
  customFonts = [],
  onUpdateTypography,
  onResetTypography,
}) => {
  const current = getEffectiveTypography(template, typographyOverrides, authorName);

  const customFontOptions = customFonts.map((cf) => ({
    name: `Custom: ${cf.familyName} (${cf.format.toUpperCase()})`,
    value: `'${cf.familyName}', serif`,
  }));

  const fontOptions = [...customFontOptions, ...BUILTIN_FONT_OPTIONS];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Type className="w-4 h-4 text-indigo-600" />
            <span>Typography & Layout Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize typography, chapter-opening behavior, running headers, and paragraph geometry.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetTypography}
          aria-label="Reset to Template Defaults"
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Section 1: Body Typography */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1.5">
            <Type className="w-3.5 h-3.5 text-indigo-500" />
            <span>Body Typography</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Body Font Family */}
            <div>
              <label htmlFor="body-font-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Body Typeface
              </label>
              <select
                id="body-font-select"
                value={current.bodyFontFamily}
                onChange={(e) => onUpdateTypography({ bodyFontFamily: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {fontOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Alignment */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-1">Text Alignment</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateTypography({ textAlign: 'justify' })}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    current.textAlign === 'justify'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                  <span>Justified</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateTypography({ textAlign: 'left' })}
                  className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    current.textAlign === 'left'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>Left-aligned</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Body Font Size */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Body Font Size</span>
                <span className="font-mono text-indigo-600 font-bold">{current.bodyFontSizePt} pt</span>
              </div>
              <input
                id="body-font-size-slider"
                type="range"
                min="8.5"
                max="14.0"
                step="0.5"
                value={current.bodyFontSizePt}
                onChange={(e) => onUpdateTypography({ bodyFontSizePt: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Line Height */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Line Height (Leading)</span>
                <span className="font-mono text-indigo-600 font-bold">{current.bodyLineHeight.toFixed(2)}</span>
              </div>
              <input
                id="body-line-height-slider"
                type="range"
                min="1.20"
                max="1.90"
                step="0.05"
                value={current.bodyLineHeight}
                onChange={(e) => onUpdateTypography({ bodyLineHeight: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Paragraph Indent */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Paragraph First-Line Indent</span>
                <span className="font-mono text-indigo-600 font-bold">
                  {current.paragraphIndentInches === 0 ? 'None' : `${current.paragraphIndentInches}"`}
                </span>
              </div>
              <input
                id="paragraph-indent-slider"
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={current.paragraphIndentInches}
                onChange={(e) => onUpdateTypography({ paragraphIndentInches: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Paragraph Spacing */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>Space After Paragraph</span>
                <span className="font-mono text-indigo-600 font-bold">{current.paragraphSpacingPt} pt</span>
              </div>
              <input
                id="paragraph-spacing-slider"
                type="range"
                min="0"
                max="12"
                step="1"
                value={current.paragraphSpacingPt}
                onChange={(e) => onUpdateTypography({ paragraphSpacingPt: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Chapter Headings & Flow */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Chapter Structure & Opening Rules</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="heading-font-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Heading Typeface
              </label>
              <select
                id="heading-font-select"
                value={current.headingFontFamily}
                onChange={(e) => onUpdateTypography({ headingFontFamily: e.target.value })}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {fontOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="chapter-opening-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Chapter Opening Page
              </label>
              <select
                id="chapter-opening-select"
                value={current.chapterOpening}
                onChange={(e) =>
                  onUpdateTypography({ chapterOpening: e.target.value as 'always-new-page' | 'recto-only' })
                }
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="always-new-page">Always Start on Fresh Page</option>
                <option value="recto-only">Start on Right Page (Recto-Only with Blank Leaf)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <input
              id="suppress-chapter-header"
              type="checkbox"
              checked={current.suppressChapterHeader}
              onChange={(e) => onUpdateTypography({ suppressChapterHeader: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="suppress-chapter-header" className="text-xs font-medium text-slate-700 cursor-pointer">
              Suppress running header on chapter opening page
            </label>
          </div>
        </div>

        {/* Section 3: Headers & Footers */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-1.5">
            <Hash className="w-3.5 h-3.5 text-indigo-500" />
            <span>Running Headers & Page Numbers</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Author Name */}
            <div>
              <label htmlFor="author-name-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Author Name
              </label>
              <input
                id="author-name-input"
                type="text"
                value={current.authorName}
                onChange={(e) => onUpdateTypography({ authorName: e.target.value })}
                placeholder="e.g. Amjad Vance"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Running Header Format */}
            <div>
              <label htmlFor="running-header-format-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Running Header Format
              </label>
              <select
                id="running-header-format-select"
                value={current.runningHeaderContent}
                onChange={(e) =>
                  onUpdateTypography({
                    runningHeaderContent: e.target.value as 'title-chapter' | 'author-title' | 'none',
                  })
                }
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="title-chapter">Verso: Book Title | Recto: Chapter Title</option>
                <option value="author-title">Verso: Author Name | Recto: Book Title</option>
                <option value="none">Suppress Running Headers</option>
              </select>
            </div>

            {/* Page Number Position */}
            <div>
              <label htmlFor="page-number-position-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Page Number Position
              </label>
              <select
                id="page-number-position-select"
                value={current.pageNumberPosition}
                onChange={(e) =>
                  onUpdateTypography({
                    pageNumberPosition: e.target.value as 'bottom-center' | 'bottom-outside' | 'top-outside',
                  })
                }
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="bottom-center">Bottom Center (Standard)</option>
                <option value="bottom-outside">Bottom Outside Corners</option>
                <option value="top-outside">Top Outside Corners</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
