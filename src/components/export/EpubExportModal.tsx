'use client';

import React, { useState } from 'react';
import { BookProject, BookTemplate, EpubExportOptions } from '@/types/book';
import {
  generateEpub,
  downloadEpubBlob,
  sanitizeEpubFilename,
  validateForEpub,
} from '@/services/epub/epubExportService';
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Eye,
  Loader2,
  FileCheck,
} from 'lucide-react';

interface EpubExportModalProps {
  project: BookProject;
  template: BookTemplate;
  onClose: () => void;
}

export const EpubExportModal: React.FC<EpubExportModalProps> = ({
  project,
  template,
  onClose,
}) => {
  const images = project.images || [];
  const initialValidation = validateForEpub(project, images);

  const [title, setTitle] = useState<string>(project.title || '');
  const [author, setAuthor] = useState<string>(project.author || '');
  const [language, setLanguage] = useState<string>(project.languageSettings?.language || 'en');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(
    project.languageSettings?.direction || 'ltr'
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [exportError, setExportError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const filename = sanitizeEpubFilename(title);

  const handleStartExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setProgressPercent(5);
    setProgressStatus('Initializing EPUB package structure...');

    try {
      const options: EpubExportOptions = {
        title,
        author,
        language,
        direction,
        includeFonts: true,
      };

      const result = await generateEpub(
        { ...project, title, author },
        template,
        options,
        (pct, status) => {
          setProgressPercent(pct);
          setProgressStatus(status);
        }
      );

      setProgressPercent(100);
      setProgressStatus('Packaging complete! Downloading EPUB...');
      setIsComplete(true);

      // Trigger browser download
      downloadEpubBlob(result.blob, result.filename);
    } catch (err: any) {
      console.error('EPUB Export error:', err);
      setExportError(err?.message || 'An error occurred during EPUB export.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="epub-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="epub-modal-title" className="text-base font-bold text-slate-900">
                Export Accessible EPUB 3
              </h2>
              <p className="text-xs text-slate-500">
                Standard reflowable eBook with full RTL and accessibility support
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Metadata Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                eBook Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Book Title"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Author Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="en">English (en)</option>
                  <option value="ar">Arabic (ar)</option>
                  <option value="ur">Urdu (ur)</option>
                  <option value="hi">Hindi (hi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Writing Direction
                </label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as 'ltr' | 'rtl')}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="ltr">Left-to-Right (LTR)</option>
                  <option value="rtl">Right-to-Left (RTL)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Accessibility Verification Notice */}
          {!initialValidation.valid ? (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900">
                    Accessibility Pre-flight Blocked
                  </h4>
                  <ul className="text-xs text-rose-700 mt-1 list-disc list-inside space-y-1">
                    {initialValidation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="text-[11px] text-rose-600">
                Add alt text to images in the Image Library before exporting EPUB 3.
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3">
              <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900">
                  Accessibility Standards Passed
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  All illustrations have verified alternative text and Dublin Core metadata is complete.
                </p>
              </div>
            </div>
          )}

          {/* Export Spec Summary Card */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Target Standard:</span>
              <span className="font-semibold text-slate-800">EPUB 3.2 Reflowable</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Page Progression:</span>
              <span className="font-semibold text-slate-800">
                {direction === 'rtl' ? 'Right-to-Left (page-progression-direction="rtl")' : 'Left-to-Right (LTR)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Output File:</span>
              <span className="font-mono text-[11px] text-slate-800 font-semibold">{filename}</span>
            </div>
          </div>

          {/* Progress Indicator */}
          {isExporting && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span className="flex items-center space-x-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>{progressStatus || 'Compiling EPUB...'}</span>
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Export Error */}
          {exportError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="whitespace-pre-line">{exportError}</div>
            </div>
          )}

          {/* Complete Success Notice */}
          {isComplete && !isExporting && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>eBook package generated and downloaded successfully!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStartExport}
            disabled={isExporting || !initialValidation.valid}
            className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download EPUB 3</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
