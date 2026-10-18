'use client';

import React, { useState, useRef } from 'react';
import { CustomFont } from '@/types/book';
import {
  createCustomFontFromFile,
  loadFontFaceInBrowser,
} from '@/services/fonts/fontService';
import {
  Type,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface FontManagerPanelProps {
  fonts: CustomFont[];
  onAddFont: (font: CustomFont) => void;
  onRemoveFont: (fontId: string) => void;
}

export const FontManagerPanel: React.FC<FontManagerPanelProps> = ({
  fonts = [],
  onAddFont,
  onRemoveFont,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customName, setCustomName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const customFont = await createCustomFontFromFile(file, customName.trim() || undefined);
      // Register in browser DOM
      await loadFontFaceInBrowser(customFont);
      onAddFont(customFont);
      setCustomName('');
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to process and load font file.'
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Type className="w-5 h-5 text-purple-600" />
          <span>Custom Typography & Fonts</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload custom TrueType (.ttf), OpenType (.otf), or Web fonts (.woff, .woff2) to use in headings and body text.
        </p>
      </div>

      {/* Legal & Rights Reminder Alert */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">Font License & Embedding Rights Responsibility</p>
          <p className="text-amber-800 leading-relaxed">
            Ensure you own the legal commercial license and print-embedding rights for any font file you upload.
            TrueType (.ttf) and OpenType (.otf) fonts will be directly embedded into your print-ready PDF.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Upload className="w-4 h-4 text-purple-600" />
          <span>Upload Font File</span>
        </h4>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-xs text-rose-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Family Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. EB Garamond Pro"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
            className="hidden"
          />

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-purple-500 hover:bg-purple-50/20 transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2 text-purple-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-semibold">Processing & loading font into DOM...</span>
              </div>
            ) : (
              <>
                <FileText className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-800">
                  Select Font File (.ttf, .otf, .woff, .woff2)
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Maximum file size: 5 MB
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Installed Fonts List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Installed Custom Fonts ({fonts.length})
          </label>
        </div>

        {fonts.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
            No custom fonts uploaded yet. Standard Serif, Sans-Serif, and Monospace system fonts remain available.
          </div>
        ) : (
          <div className="space-y-3">
            {fonts.map((f) => {
              const sizeKb = Math.round((f.fileSizeBytes || 0) / 1024);

              return (
                <div
                  key={f.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">
                          {f.familyName}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 uppercase font-mono font-bold text-[10px] rounded">
                          {f.format}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {sizeKb} KB
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-mono truncate max-w-xs">
                        {f.fileName}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveFont(f.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Font"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sample Preview in this font */}
                  <div
                    className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 text-base overflow-hidden"
                    style={{ fontFamily: `'${f.familyName}', serif` }}
                  >
                    The quick brown fox jumps over the lazy dog. 1234567890
                  </div>

                  {/* Embed status badge */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    {f.canEmbedInPdf ? (
                      <span className="flex items-center space-x-1 text-emerald-700 font-medium text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PDF Print Embed Ready</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-amber-700 font-medium text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Web Preview Only (PDF uses standard fallback)</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
