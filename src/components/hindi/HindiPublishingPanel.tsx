'use client';

import React, { useState } from 'react';
import {
  BookProject,
  BookTemplate,
  HindiDocumentSettings,
  HindiFontLayoutOption,
  HindiInputMode,
  PagePreviewData,
} from '@/types/book';
import {
  transliteratePhoneticToHindi,
  deriveUnicodeRepresentation,
} from '@/services/hindi/hindiEncodingService';
import { FontManagerModal } from './FontManagerModal';
import {
  Keyboard,
  Type,
  FileDown,
  Sparkles,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface HindiPublishingPanelProps {
  project: BookProject;
  template: BookTemplate;
  pages: PagePreviewData[];
  onUpdateHindiSettings: (settings: HindiDocumentSettings) => void;
  onGenerateHindiPdf: () => void;
}

export const HindiPublishingPanel: React.FC<HindiPublishingPanelProps> = ({
  project,
  template,
  pages,
  onUpdateHindiSettings,
  onGenerateHindiPdf,
}) => {
  const [showFontManager, setShowFontManager] = useState<boolean>(false);
  const [testInput, setTestInput] = useState<string>('namaste bharat');

  const settings: HindiDocumentSettings = project.hindiSettings || {
    layoutOption: 'unicode-phonetic',
    encodingType: 'unicode',
    inputMode: 'phonetic',
    enableDerivedUnicode: true,
  };

  const handleLayoutOptionChange = (option: HindiFontLayoutOption) => {
    let enc: 'unicode' | 'legacy' = 'unicode';
    let mode: HindiInputMode = 'phonetic';

    if (option === 'krutidev') {
      enc = 'legacy';
      mode = 'keyboard-mapped';
    } else if (option === 'chanakya') {
      enc = 'legacy';
      mode = 'keyboard-mapped';
    } else if (option === 'unicode-inscript') {
      enc = 'unicode';
      mode = 'keyboard-mapped';
    } else {
      enc = 'unicode';
      mode = 'phonetic';
    }

    onUpdateHindiSettings({
      ...settings,
      layoutOption: option,
      encodingType: enc,
      inputMode: mode,
    });
  };

  const handleInputModeChange = (mode: HindiInputMode) => {
    onUpdateHindiSettings({
      ...settings,
      inputMode: mode,
    });
  };

  const handleDerivedToggle = (enable: boolean) => {
    onUpdateHindiSettings({
      ...settings,
      enableDerivedUnicode: enable,
    });
  };

  const derivedPreview =
    settings.inputMode === 'phonetic'
      ? transliteratePhoneticToHindi(testInput)
      : deriveUnicodeRepresentation(testInput, settings.encodingType, settings.layoutOption);

  return (
    <div className="space-y-6 text-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Keyboard className="w-4 h-4 text-orange-600" />
            <span>Hindi Publishing & Keyboard Layouts</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Support for Unicode Devanagari, phonetic typing, and legacy Kruti Dev / Chanakya workflows.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowFontManager(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg text-xs font-semibold transition-colors border border-orange-200"
        >
          <Type className="w-3.5 h-3.5" />
          <span>Font Manager</span>
        </button>
      </div>

      {/* Font & Keyboard Layout Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Font / Keyboard Layout Workflow
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            {
              id: 'unicode-phonetic',
              name: 'Unicode — Phonetic Typing',
              desc: 'Type in English (namaste) → renders Hindi (नमस्ते)',
              badge: 'Unicode',
            },
            {
              id: 'unicode-inscript',
              name: 'Unicode — InScript Layout',
              desc: 'Official Standard Indian InScript layout mapping',
              badge: 'Unicode',
            },
            {
              id: 'krutidev',
              name: 'Kruti Dev 010 (Legacy)',
              desc: 'Remington typewriter keyboard with legacy font encoding',
              badge: 'Legacy',
            },
            {
              id: 'chanakya',
              name: 'Walkman Chanakya (Legacy)',
              desc: 'Chanakya DTP keyboard layout with legacy font encoding',
              badge: 'Legacy',
            },
          ].map((item) => {
            const isSelected = settings.layoutOption === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLayoutOptionChange(item.id as HindiFontLayoutOption)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/60 ring-1 ring-orange-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{item.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      item.badge === 'Unicode'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Mode Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Typing Input Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'phonetic', label: 'Phonetic Input', sub: 'Transliteration' },
            { id: 'keyboard-mapped', label: 'Hardware Mapped', sub: 'Remington / InScript' },
            { id: 'direct', label: 'Direct Pasting', sub: 'Exact glyph preservation' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleInputModeChange(mode.id as HindiInputMode)}
              className={`p-2 rounded-lg border text-left transition-all ${
                settings.inputMode === mode.id
                  ? 'border-orange-500 bg-orange-50 text-orange-950 font-medium'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-semibold">{mode.label}</div>
              <div className="text-[10px] text-slate-500">{mode.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Derived Unicode Search Toggle */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-900">
            Maintain Derived Unicode for Search & Accessibility
          </div>
          <div className="text-[11px] text-slate-500">
            Preserves original legacy text while generating clean Unicode for EPUB and indexing
          </div>
        </div>
        <input
          type="checkbox"
          checked={settings.enableDerivedUnicode}
          onChange={(e) => handleDerivedToggle(e.target.checked)}
          className="w-4 h-4 text-orange-600 rounded-sm border-slate-300 focus:ring-orange-500"
        />
      </div>

      {/* Interactive Transliteration / Encoding Sandbox */}
      <div className="space-y-2 border border-slate-200 rounded-xl p-3.5 bg-white">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Interactive Hindi Input Sandbox</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Active: {settings.layoutOption}
          </span>
        </div>

        <input
          type="text"
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder={
            settings.inputMode === 'phonetic'
              ? 'Type phonetically in English (e.g. namaste bharat, shanti, aap)...'
              : 'Type text in selected layout...'
          }
          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-sans"
        />

        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Rendered Output:</span>
          <span className="text-base font-bold text-slate-900 font-serif">
            {derivedPreview || '(Type above to preview)'}
          </span>
        </div>
      </div>

      {/* Hindi PDF Export Action */}
      <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-xl flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-orange-950">
            Generate Print-Ready Hindi PDF
          </h4>
          <p className="text-[11px] text-orange-800">
            Exports full book PDF with embedded Devanagari fonts, 100K text black, and CMYK prepress output intent.
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerateHindiPdf}
          className="flex items-center space-x-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <FileDown className="w-4 h-4" />
          <span>Export Hindi PDF</span>
        </button>
      </div>

      {/* Font Manager Modal */}
      {showFontManager && (
        <FontManagerModal onClose={() => setShowFontManager(false)} />
      )}
    </div>
  );
};
