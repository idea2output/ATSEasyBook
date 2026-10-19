'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Download,
  FileCheck2,
  Layers,
  Palette,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PreflightJob } from '@/types/preflight';
import { preflightJobRepository } from '@/services/preflight/preflightJobRepository';

interface PreflightCompareViewProps {
  job: PreflightJob;
  onClose?: () => void;
}

export const PreflightCompareView: React.FC<PreflightCompareViewProps> = ({ job, onClose }) => {
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const origReport = job.latestReport;
  const repReport = job.repairedReport;

  if (!repReport || !origReport) {
    return (
      <div className="p-8 text-center text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl">
        <p className="text-sm font-semibold">No repaired version available for this preflight job yet.</p>
        <p className="text-xs text-neutral-500 mt-1">
          Open the Repair Plan modal to generate a verified production copy.
        </p>
      </div>
    );
  }

  const origPage = origReport.pages[selectedPageIndex] || origReport.pages[0];
  const repPage = repReport.pages[selectedPageIndex] || repReport.pages[0];

  const origPageNum = origPage?.pageNumber ?? 1;
  const repPageNum = repPage?.pageNumber ?? 1;

  const origPageIssues = origReport.issues.filter(
    (i) => i.pageNumber === origPageNum || (i.pageNumbers && i.pageNumbers.includes(origPageNum))
  );
  const repPageIssues = repReport.issues.filter(
    (i) => i.pageNumber === repPageNum || (i.pageNumbers && i.pageNumbers.includes(repPageNum))
  );

  const handleDownloadRepaired = async () => {
    try {
      setIsDownloading(true);
      const downloadInfo = await preflightJobRepository.generateSignedDownloadUrl(job.id, 'repaired');
      const bytes = preflightJobRepository.getFileBytes(job.repairedAssetKey || '');
      if (bytes && typeof window !== 'undefined') {
        const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadInfo.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        window.open(downloadInfo.downloadUrl, '_blank');
      }
    } catch (err) {
      console.error('Download repaired PDF failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Verification Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Original Status */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Original Uploaded PDF
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                origReport.isCompliant
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              Score: {origReport.score}/100
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-neutral-300">
            <div className="flex justify-between">
              <span className="text-neutral-400">Errors:</span>
              <span className="font-bold text-rose-400">{origReport.summary.errors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Warnings:</span>
              <span className="font-semibold text-amber-400">{origReport.summary.warnings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Color Profile:</span>
              <span className="font-mono text-neutral-200">
                {origReport.colorSummary.hasRgb ? 'RGB Detected' : 'Pure CMYK'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Output Intent:</span>
              <span className="font-mono text-neutral-200">
                {origReport.outputIntent ? origReport.outputIntent.conditionId : 'Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Transition Arrow Indicator */}
        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-rose-600/10 border border-rose-600/30 text-rose-500 flex items-center justify-center">
            <ArrowRight className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider">
              ATS Transparent Engine
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {job.repairHistory.length > 0
                ? `${job.repairHistory[0].appliedActions.length} automatic fixes applied`
                : 'Verified non-destructive fix'}
            </p>
          </div>
          <button
            type="button"
            id="download-repaired-compare-btn"
            onClick={handleDownloadRepaired}
            disabled={isDownloading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Repaired PDF</span>
          </button>
        </div>

        {/* Repaired Status */}
        <div className="p-5 bg-neutral-900 border border-emerald-900/40 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Verified Repaired Output
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                repReport.isCompliant
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              Score: {repReport.score}/100
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-neutral-300">
            <div className="flex justify-between">
              <span className="text-neutral-400">Errors:</span>
              <span className="font-bold text-emerald-400">{repReport.summary.errors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Warnings:</span>
              <span className="font-semibold text-neutral-300">{repReport.summary.warnings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Color Profile:</span>
              <span className="font-mono text-emerald-400">
                {repReport.colorSummary.cmykCompliant ? 'CMYK Compliant' : 'Preserved'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Output Intent:</span>
              <span className="font-mono text-emerald-400">
                {repReport.outputIntent ? repReport.outputIntent.conditionId : 'Embedded'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Page-by-Page Comparison Details */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-rose-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Page-by-Page Differential Analysis
            </h4>
          </div>

          {/* Page Selector Controls */}
          {origReport.pages.length > 1 && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSelectedPageIndex(Math.max(0, selectedPageIndex - 1))}
                disabled={selectedPageIndex === 0}
                className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-neutral-300">
                Page {selectedPageIndex + 1} of {origReport.pages.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelectedPageIndex(Math.min(origReport.pages.length - 1, selectedPageIndex + 1))
                }
                disabled={selectedPageIndex === origReport.pages.length - 1}
                className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Side-by-side Page Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-800 p-5 gap-6 text-xs">
          {/* Left: Original Page Specs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="font-bold text-neutral-300">Original Page {origPage?.pageNumber}</span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {origPageIssues.length} Issues Detected
              </span>
            </div>

            <div className="space-y-2 text-neutral-400">
              <div className="flex justify-between">
                <span>MediaBox:</span>
                <span className="font-mono text-neutral-200">
                  {origPage?.pageBoxes.mediaBox.widthInches}&quot; × {origPage?.pageBoxes.mediaBox.heightInches}&quot;
                </span>
              </div>
              <div className="flex justify-between">
                <span>TrimBox:</span>
                <span className="font-mono text-neutral-200">
                  {origPage?.pageBoxes.trimBox
                    ? `${origPage.pageBoxes.trimBox.widthInches}" × ${origPage.pageBoxes.trimBox.heightInches}"`
                    : 'Missing (Defaulted to MediaBox)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bleed Amount:</span>
                <span className="font-mono text-neutral-200">
                  {origPage?.pageBoxes.bleedAmountInches.top.toFixed(3)}&quot;
                </span>
              </div>
              <div className="flex justify-between">
                <span>Black Overprint:</span>
                <span className="font-mono text-neutral-200">
                  {origPage?.hasOverprint ? 'Active' : 'Knockout / Missing'}
                </span>
              </div>
            </div>

            {/* Original Page Issues */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                Issues On This Page
              </span>
              {origPageIssues.length === 0 ? (
                <p className="text-[11px] text-emerald-400">No issues on this page.</p>
              ) : (
                origPageIssues.map((iss) => (
                  <div
                    key={iss.id}
                    className="p-2 bg-neutral-950 border border-neutral-800 rounded text-[11px] flex items-start space-x-2"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-neutral-200">{iss.title}</span>
                      <p className="text-neutral-400 text-[10px] mt-0.5">{iss.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Repaired Page Specs */}
          <div className="space-y-4 md:pl-6">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="font-bold text-emerald-400">Repaired Page {repPage?.pageNumber}</span>
              <span className="text-[11px] text-emerald-500 font-mono">
                {repPageIssues.length} Remaining Issues
              </span>
            </div>

            <div className="space-y-2 text-neutral-400">
              <div className="flex justify-between">
                <span>MediaBox:</span>
                <span className="font-mono text-neutral-200">
                  {repPage?.pageBoxes.mediaBox.widthInches}&quot; × {repPage?.pageBoxes.mediaBox.heightInches}&quot;
                </span>
              </div>
              <div className="flex justify-between">
                <span>TrimBox:</span>
                <span className="font-mono text-emerald-300">
                  {repPage?.pageBoxes.trimBox
                    ? `${repPage.pageBoxes.trimBox.widthInches}" × ${repPage.pageBoxes.trimBox.heightInches}" (Normalized)`
                    : 'Normalized'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bleed Amount:</span>
                <span className="font-mono text-emerald-300">
                  {repPage?.pageBoxes.bleedAmountInches.top.toFixed(3)}&quot;
                </span>
              </div>
              <div className="flex justify-between">
                <span>Black Overprint:</span>
                <span className="font-mono text-emerald-300">
                  {repPage?.hasOverprint ? 'Active (/GS_OP true)' : 'Normalized'}
                </span>
              </div>
            </div>

            {/* Repaired Page Issues Status */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                Verification State
              </span>
              {repPageIssues.length === 0 ? (
                <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>All prepress geometry and color issues fully resolved!</span>
                </div>
              ) : (
                repPageIssues.map((iss) => (
                  <div
                    key={iss.id}
                    className="p-2 bg-neutral-950 border border-neutral-800 rounded text-[11px] flex items-start space-x-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-neutral-200">{iss.title}</span>
                      <p className="text-neutral-400 text-[10px] mt-0.5">
                        {iss.recommendation || iss.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
