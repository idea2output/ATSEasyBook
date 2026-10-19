'use client';

import React, { useState } from 'react';
import { ManagedFont, CustomFontFormat } from '@/types/book';
import {
  getAllManagedFonts,
  saveCustomManagedFont,
} from '@/services/hindi/hindiFontManager';
import { validateFontFile } from '@/services/fonts/fontService';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Type,
  ShieldCheck,
  FileText,
  Plus,
} from 'lucide-react';

interface FontManagerModalProps {
  onClose: () => void;
  onSelectFont?: (font: ManagedFont) => void;
}

export const FontManagerModal: React.FC<FontManagerModalProps> = ({
  onClose,
  onSelectFont,
}) => {
  const [fonts, setFonts] = useState<ManagedFont[]>(getAllManagedFonts());
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);

  // New Font Form State
  const [displayName, setDisplayName] = useState<string>('');
  const [familyName, setFamilyName] = useState<string>('');
  const [encodingType, setEncodingType] = useState<'unicode' | 'legacy'>('unicode');
  const [supportedScript, setSupportedScript] = useState<
    'devanagari' | 'arabic' | 'urdu' | 'latin' | 'other'
  >('devanagari');
  const [keyboardLayout, setKeyboardLayout] = useState<
    'remington-kruti' | 'chanakya' | 'inscript' | 'phonetic' | 'none'
  >('inscript');
  const [fontFile, setFontFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFontFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid font file.');
      return;
    }

    setFontFile(file);
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    if (!displayName) setDisplayName(baseName);
    if (!familyName) setFamilyName(baseName);
  };

  const handleSaveFont = async () => {
    if (!fontFile || !displayName || !familyName) {
      setUploadError('Please specify font name, family, and upload a valid font file.');
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read font file'));
        reader.readAsDataURL(fontFile);
      });

      const ext = fontFile.name.split('.').pop()?.toLowerCase() as CustomFontFormat;
      const newFont: ManagedFont = {
        id: `managed-${Date.now()}`,
        displayName,
        familyName,
        encodingType,
        supportedScript,
        associatedKeyboardLayout: keyboardLayout,
        format: ext || 'ttf',
        fileName: fontFile.name,
        fileSizeBytes: fontFile.size,
        dataUrl,
        createdAt: new Date().toISOString(),
        canEmbedInPdf: ext === 'ttf' || ext === 'otf',
        license: 'Custom Uploaded Font',
        isSystemPreset: false,
      };

      saveCustomManagedFont(newFont);
      setFonts(getAllManagedFonts());
      setUploadSuccess(`Font "${displayName}" successfully registered and ready for publishing!`);
      setShowUploadForm(false);
      setFontFile(null);
      setDisplayName('');
      setFamilyName('');
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to save font.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="font-manager-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 id="font-manager-title" className="text-base font-bold text-slate-900">
                Font Management Module
              </h2>
              <p className="text-xs text-slate-500">
                Manage Unicode Devanagari, legacy Kruti Dev / Chanakya, Arabic, and Urdu fonts
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Registered Publishing Fonts ({fonts.length})
            </span>
            <button
              type="button"
              onClick={() => {
                setShowUploadForm(!showUploadForm);
                setUploadError(null);
                setUploadSuccess(null);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showUploadForm ? 'Cancel Upload' : 'Upload New Font (TTF/OTF)'}</span>
            </button>
          </div>

          {/* Upload Form (collapsible) */}
          {showUploadForm && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 animate-in slide-in-from-top-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Add Font to Management Registry</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Kruti Dev 010 or Mangal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Font Family Name (CSS)
                  </label>
                  <input
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Kruti Dev 010"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Encoding Type
                  </label>
                  <select
                    value={encodingType}
                    onChange={(e) => setEncodingType(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="unicode">Unicode Standard</option>
                    <option value="legacy">Legacy (Kruti/Chanakya)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supported Script
                  </label>
                  <select
                    value={supportedScript}
                    onChange={(e) => setSupportedScript(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="devanagari">Devanagari (Hindi)</option>
                    <option value="arabic">Arabic (Naskh)</option>
                    <option value="urdu">Urdu (Nastaliq)</option>
                    <option value="latin">Latin / English</option>
                    <option value="other">Other Script</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Associated Layout
                  </label>
                  <select
                    value={keyboardLayout}
                    onChange={(e) => setKeyboardLayout(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="remington-kruti">Remington (Kruti)</option>
                    <option value="chanakya">Chanakya Layout</option>
                    <option value="inscript">InScript (Unicode)</option>
                    <option value="phonetic">Phonetic Input</option>
                    <option value="none">None (Standard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Font File (.ttf or .otf)
                </label>
                <input
                  type="file"
                  accept=".ttf,.otf"
                  onChange={handleFileChange}
                  className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveFont}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs"
                >
                  Save & Register Font
                </button>
              </div>
            </div>
          )}

          {/* Font List */}
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            {fonts.map((f) => (
              <div
                key={f.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900">{f.displayName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        f.encodingType === 'unicode'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {f.encodingType.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                      {f.supportedScript}
                    </span>
                    {f.isSystemPreset && (
                      <span className="text-[10px] text-slate-400 font-medium">System Preset</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center space-x-3">
                    <span>Family: {f.familyName}</span>
                    <span>Format: {f.format.toUpperCase()}</span>
                    <span>Keyboard: {f.associatedKeyboardLayout || 'None'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center space-x-1 text-[11px] font-medium ${
                      f.canEmbedInPdf ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>PDF Embeddable</span>
                  </span>

                  {onSelectFont && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectFont(f);
                        onClose();
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold rounded-md transition-colors"
                    >
                      Use
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
