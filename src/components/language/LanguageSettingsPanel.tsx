'use client';

import React from 'react';
import {
  BookProject,
  DocumentLanguage,
  WritingDirection,
  NumeralSystem,
  LanguageSettings,
} from '@/types/book';
import { Globe, AlignRight, AlignLeft, Hash, Info, Check } from 'lucide-react';

interface LanguageSettingsPanelProps {
  project: BookProject;
  onUpdateLanguageSettings: (settings: LanguageSettings) => void;
}

export const LanguageSettingsPanel: React.FC<LanguageSettingsPanelProps> = ({
  project,
  onUpdateLanguageSettings,
}) => {
  const currentSettings: LanguageSettings = project.languageSettings || {
    language: 'en',
    direction: 'ltr',
    numeralSystem: 'western',
    mixedDirectionMode: 'auto',
  };

  const handleLanguageChange = (lang: DocumentLanguage) => {
    // When switching language, auto-configure recommended direction
    let dir: WritingDirection = 'ltr';
    let numSystem: NumeralSystem = 'western';

    if (lang === 'ar') {
      dir = 'rtl';
      numSystem = 'arabic-indic';
    } else if (lang === 'ur') {
      dir = 'rtl';
      numSystem = 'urdu-eastern';
    } else if (lang === 'hi') {
      dir = 'ltr';
      numSystem = 'western';
    }

    onUpdateLanguageSettings({
      ...currentSettings,
      language: lang,
      direction: dir,
      numeralSystem: numSystem,
    });
  };

  const handleDirectionChange = (direction: WritingDirection) => {
    onUpdateLanguageSettings({
      ...currentSettings,
      direction,
    });
  };

  const handleNumeralSystemChange = (numeralSystem: NumeralSystem) => {
    onUpdateLanguageSettings({
      ...currentSettings,
      numeralSystem,
    });
  };

  return (
    <div className="space-y-6 text-slate-800">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          <span>Language & Writing Direction</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure document-level script, text direction, and page spread progression.
        </p>
      </div>

      {/* Language Options */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Document Primary Language
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'en', label: 'English / Latin', sub: 'Left-to-Right' },
            { id: 'ar', label: 'Arabic (العربية)', sub: 'Right-to-Left (Naskh)' },
            { id: 'ur', label: 'Urdu (اردو)', sub: 'Right-to-Left (Nastaliq)' },
            { id: 'hi', label: 'Hindi (हिन्दी)', sub: 'Devanagari script' },
            { id: 'mixed', label: 'Mixed Language', sub: 'Bidirectional auto-detect' },
          ].map((item) => {
            const isSelected = currentSettings.language === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLanguageChange(item.id as DocumentLanguage)}
                className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <span className="text-[10px] text-slate-500 mt-1">{item.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Writing Direction */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Page Progression & Writing Direction
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleDirectionChange('ltr')}
            className={`p-3 rounded-lg border text-left flex items-center space-x-3 transition-all ${
              currentSettings.direction === 'ltr'
                ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <AlignLeft className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">Left-to-Right (LTR)</div>
              <div className="text-[10px] text-slate-500">Standard Western book binding</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleDirectionChange('rtl')}
            className={`p-3 rounded-lg border text-left flex items-center space-x-3 transition-all ${
              currentSettings.direction === 'rtl'
                ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <AlignRight className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-900">Right-to-Left (RTL)</div>
              <div className="text-[10px] text-slate-500">Spine on right, mirrored spreads</div>
            </div>
          </button>
        </div>
      </div>

      {/* Numeral System */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 flex items-center space-x-1">
          <Hash className="w-3.5 h-3.5 text-slate-500" />
          <span>Folio & Page Numeral System</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'western', label: 'Western', example: '1, 2, 3, 4' },
            { id: 'arabic-indic', label: 'Arabic-Indic', example: '١, ٢, ٣, ٤' },
            { id: 'urdu-eastern', label: 'Urdu Eastern', example: '۱, ۲, ۳, ۴' },
          ].map((item) => {
            const isSelected = (currentSettings.numeralSystem || 'western') === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNumeralSystemChange(item.id as NumeralSystem)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-medium'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-semibold">{item.label}</div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">{item.example}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Informational Guidance Notice */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-2 text-xs text-blue-800">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Professional RTL Book Binding</p>
          <p className="text-[11px] leading-relaxed text-blue-700">
            In RTL mode, the spine gutter moves to the right edge on recto pages. Two-page spreads read right-to-left, and exported PDFs embed shaped Arabic/Urdu Unicode with PDF/X-4 CMYK prepress compliance.
          </p>
        </div>
      </div>
    </div>
  );
};
