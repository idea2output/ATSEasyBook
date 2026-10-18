'use client';

import React, { useState } from 'react';
import { BookProject, BookTemplate, PagePreviewData, PdfExportOptions } from '@/types/book';
import { generatePrintPdf, sanitizePdfFilename } from '@/services/pdf/pdfExportService';
import {
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Crop,
  Layers,
  Loader2,
} from 'lucide-react';

interface PdfExportModalProps {
  project: BookProject;
  template: BookTemplate;
  pages: PagePreviewData[];
  onClose: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  project,
  template,
  pages,
  onClose,
}) => {
  const [includeBleed, setIncludeBleed] = useState<boolean>(project.exportOptions?.includeBleed ?? false);
  const [includeCropMarks, setIncludeCropMarks] = useState<boolean>(
    project.exportOptions?.includeCropMarks ?? false
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [exportError, setExportError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const filename = sanitizePdfFilename(project.title);

  const handleStartExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setProgressPercent(5);
    setProgressStatus('Initializing PDF document structure...');

    try {
      const options: PdfExportOptions = {
        includeBleed,
        includeCropMarks,
        acknowledgedWarnings: true,
      };

      const doc = await generatePrintPdf(project, template, pages, options, (pct, status) => {
        setProgressPercent(pct);
        setProgressStatus(status);
      });

      setProgressStatus('Finalizing PDF stream and triggering download...');
      setProgressPercent(100);

      // Trigger client-side file download
      doc.save(filename);
      setIsComplete(true);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setExportError(err.message || 'An unexpected error occurred during PDF compilation.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-export-title"
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <h3 id="pdf-export-title" className="text-sm font-bold">
              Export Print-Ready PDF
            </h3>
          </div>

          {!isExporting && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* File Spec Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-600">Selected Template</span>
              <span className="font-bold text-slate-900">{template.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Page Trim Dimensions</span>
              <span className="font-mono font-bold text-slate-800">
                {template.pageWidthInches} × {template.pageHeightInches} inches
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Total Book Pages</span>
              <span className="font-mono font-bold text-slate-800">{pages.length} pages</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Download Filename</span>
              <span className="font-mono text-indigo-600 font-bold truncate max-w-[200px]">
                {filename}
              </span>
            </div>
          </div>

          {/* Export Settings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Print Production Options
            </h4>

            {/* Bleed Toggle */}
            <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/70 transition-colors cursor-pointer">
              <input
                type="checkbox"
                id="export-include-bleed"
                checked={includeBleed}
                disabled={isExporting}
                onChange={(e) => setIncludeBleed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Include Standard Bleed (+0.125&quot;)</span>
                <span className="text-slate-500">
                  Extends sheet dimensions by 1/8 inch on all edges for professional trimming.
                </span>
              </div>
            </label>

            {/* Crop Marks Toggle */}
            <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/70 transition-colors cursor-pointer">
              <input
                type="checkbox"
                id="export-include-crop-marks"
                checked={includeCropMarks}
                disabled={isExporting}
                onChange={(e) => setIncludeCropMarks(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Render Crop & Trim Registration Marks</span>
                <span className="text-slate-500">
                  Draws fine corner trim marks showing bindery operators where to slice sheets.
                </span>
              </div>
            </label>
          </div>

          {/* Export Progress Bar */}
          {isExporting && (
            <div className="space-y-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span>Generating PDF...</span>
                </span>
                <span className="font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-indigo-700 truncate">{progressStatus}</p>
            </div>
          )}

          {/* Error Banner */}
          {exportError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Export Failed</p>
                <p className="mt-0.5 text-rose-800">{exportError}</p>
              </div>
            </div>
          )}

          {/* Complete Success State */}
          {isComplete && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">PDF Export Completed Successfully!</p>
                <p className="text-emerald-800 mt-0.5">Your browser download has started for &ldquo;{filename}&rdquo;.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            id="close-pdf-export-modal-btn"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            {isComplete ? 'Close' : 'Cancel'}
          </button>

          {!isComplete && (
            <button
              type="button"
              id="start-pdf-export-btn"
              onClick={handleStartExport}
              disabled={isExporting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Download PDF Now'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
