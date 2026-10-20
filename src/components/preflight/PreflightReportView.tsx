'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Download,
  Wrench,
  Columns,
  Layers,
  Palette,
  Type,
  Image as ImageIcon,
  FileCode,
  FileText,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Lock,
  Printer,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { PreflightJob, PreflightIssueSeverity, PreflightIssueCategory, PreflightIssue } from '@/types/preflight';
import { getPreflightProfile } from '@/services/preflight/preflightProfiles';
import { preflightJobRepository } from '@/services/preflight/preflightJobRepository';
import { generatePreflightCertificatePdf, generatePreflightJsonReport } from '@/services/preflight/pdfReportGenerator';
import { PreflightRepairModal } from './PreflightRepairModal';
import { PreflightCompareView } from './PreflightCompareView';
import { PreflightCommentsPanel } from './PreflightCommentsPanel';
import { ImpositionLaunchModal } from '@/components/imposition/ImpositionLaunchModal';
import { createHandoffFromPreflightJob } from '@/services/imposition/impositionHandoffService';

interface PreflightReportViewProps {
  job: PreflightJob;
  onJobUpdated: (updatedJob: PreflightJob) => void;
}

export const PreflightReportView: React.FC<PreflightReportViewProps> = ({ job, onJobUpdated }) => {
  const [activeTab, setActiveTab] = useState<'issues' | 'geometry' | 'color' | 'fonts' | 'images' | 'compare'>('issues');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPageNumber, setSelectedPageNumber] = useState<number | undefined>(undefined);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isImpositionModalOpen, setIsImpositionModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingJson, setIsDownloadingJson] = useState(false);

  const report = job.latestReport;
  const profile = getPreflightProfile(job.profileId);

  if (!report) {
    return (
      <div className="p-8 text-center text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl">
        <p className="text-sm font-semibold">Preflight report is pending or was not generated for this file.</p>
      </div>
    );
  }

  // Issues filtering
  const allIssues = report.issues;
  const filteredIssues = allIssues.filter((iss) => {
    if (severityFilter !== 'all' && iss.severity !== severityFilter) return false;
    if (selectedPageNumber !== undefined && iss.pageNumber !== selectedPageNumber) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        iss.title.toLowerCase().includes(q) ||
        iss.description.toLowerCase().includes(q) ||
        iss.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownloadPdfCertificate = async () => {
    try {
      setIsDownloadingPdf(true);
      const pdfBytes = await generatePreflightCertificatePdf(job, report, profile);
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.title}-preflight-certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate preflight certificate PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadJsonReport = () => {
    try {
      setIsDownloadingJson(true);
      const jsonStr = generatePreflightJsonReport(job, report);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job.title}-preflight-report.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export JSON report:', err);
    } finally {
      setIsDownloadingJson(false);
    }
  };

  const handleIssueStatusChange = async (issueId: string, status: any) => {
    try {
      const updated = await preflightJobRepository.updateIssueStatus(job.id, issueId, status);
      onJobUpdated(updated);
    } catch (err) {
      console.error('Failed to update issue status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header Summary */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-neutral-800">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400">
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                {profile.name}
              </span>
              <span>•</span>
              <span>{report.totalPageCount} Pages</span>
              <span>•</span>
              <span>{(job.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {job.title}
            </h1>
            <p className="text-xs text-neutral-400 font-mono">
              Source: {job.originalFilename} • Inspected: {new Date(report.inspectedAt).toLocaleString()}
            </p>
          </div>

          {/* KPI Gauges & Compliance Badge */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Score Card */}
            <div className="px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-center min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Score
              </span>
              <span
                className={`text-2xl font-black font-mono ${
                  report.score >= 90
                    ? 'text-emerald-400'
                    : report.score >= 70
                    ? 'text-amber-400'
                    : 'text-rose-500'
                }`}
              >
                {report.score}/100
              </span>
            </div>

            {/* Verdict Card */}
            <div
              className={`px-4 py-2.5 rounded-lg border flex items-center space-x-2.5 ${
                report.isCompliant
                  ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
              }`}
            >
              {report.isCompliant ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">
                  {report.isCompliant ? 'Print Ready / Compliant' : 'Non-Compliant File'}
                </p>
                <p className="text-[11px] opacity-80">
                  {report.summary.errors} Errors • {report.summary.warnings} Warnings
                </p>
              </div>
            </div>

            {/* Imposition Readiness */}
            {job.impositionReadyMetadata ? (
              <div className="px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center space-x-1">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imposition Ready</span>
                </span>
                <span className="font-mono text-[11px] text-neutral-300">
                  {job.impositionReadyMetadata.trimWidthInches.toFixed(2)}&quot; ×{' '}
                  {job.impositionReadyMetadata.trimHeightInches.toFixed(2)}&quot; • {job.impositionReadyMetadata.bindingType}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="open-repair-plan-btn"
              onClick={() => setIsRepairModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
            >
              <Wrench className="w-4 h-4" />
              <span>Repair Workspace</span>
            </button>

            {job.repairedReport && (
              <button
                type="button"
                id="view-comparison-btn"
                onClick={() => setActiveTab('compare')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Columns className="w-4 h-4 text-emerald-400" />
                <span>Original vs Repaired</span>
              </button>
            )}

            {job.impositionReadyMetadata && (
              <button
                type="button"
                id="handoff-preflight-to-imposition-btn"
                onClick={() => setIsImpositionModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-rose-400 border border-neutral-700 hover:border-rose-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Layers className="w-4 h-4 text-rose-500" />
                <span>Imposition Handoff</span>
              </button>
            )}
          </div>

          {/* Download Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="download-pdf-cert-btn"
              onClick={handleDownloadPdfCertificate}
              disabled={isDownloadingPdf}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Preflight Certificate (PDF)'}</span>
            </button>

            <button
              type="button"
              id="download-json-report-btn"
              onClick={handleDownloadJsonReport}
              disabled={isDownloadingJson}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingJson ? 'Exporting...' : 'JSON Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Disclaimer Notice */}
      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-xs flex items-center justify-between text-neutral-400">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
          <span>
            ATS Preflight independently verifies PDF structure against print-industry standards. {profile.disclaimer}
          </span>
        </div>
        <span className="font-mono text-[10px] text-neutral-500 uppercase">
          Profile ID: {profile.id}
        </span>
      </div>

      {/* Main Grid: Tabs & Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Navigation Tabs & Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs Navigation */}
          <div className="flex items-center space-x-1 border-b border-neutral-800 pb-2 overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('issues')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'issues'
                  ? 'bg-rose-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Issues ({report.issues.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('geometry')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'geometry'
                  ? 'bg-rose-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Geometry & Bleed</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('color')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'color'
                  ? 'bg-rose-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Color & Overprint</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fonts')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'fonts'
                  ? 'bg-rose-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Fonts ({report.fonts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('images')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'images'
                  ? 'bg-rose-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Images ({report.images.length})</span>
            </button>

            {job.repairedReport && (
              <button
                type="button"
                onClick={() => setActiveTab('compare')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'compare'
                    ? 'bg-rose-600 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verification Compare</span>
              </button>
            )}
          </div>

          {/* TAB 1: ISSUES LIST */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900 p-3 rounded-xl border border-neutral-800 text-xs">
                {/* Severity buttons */}
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setSeverityFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      severityFilter === 'all'
                        ? 'bg-neutral-800 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    All ({allIssues.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverityFilter('error')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center space-x-1 ${
                      severityFilter === 'error'
                        ? 'bg-rose-600 text-white'
                        : 'text-rose-400 hover:bg-neutral-800'
                    }`}
                  >
                    <span>Errors ({report.summary.errors})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverityFilter('warning')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center space-x-1 ${
                      severityFilter === 'warning'
                        ? 'bg-amber-600 text-white'
                        : 'text-amber-400 hover:bg-neutral-800'
                    }`}
                  >
                    <span>Warnings ({report.summary.warnings})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverityFilter('info')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center space-x-1 ${
                      severityFilter === 'info'
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-400 hover:bg-neutral-800'
                    }`}
                  >
                    <span>Info ({report.summary.info})</span>
                  </button>
                </div>

                {/* Search input */}
                <div className="relative min-w-[180px]">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search issues..."
                    className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              {/* Issues items */}
              {filteredIssues.length === 0 ? (
                <div className="p-8 text-center bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-white">No issues found in this view</p>
                  <p className="text-xs text-neutral-400">
                    Document complies with active filter criteria.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredIssues.map((iss) => (
                    <div
                      key={iss.id}
                      className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2.5 transition-colors hover:border-neutral-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          {iss.severity === 'error' ? (
                            <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          ) : iss.severity === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-white">{iss.title}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-bold ${
                                  iss.severity === 'error'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : iss.severity === 'warning'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}
                              >
                                {iss.severity}
                              </span>
                              <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded font-mono uppercase">
                                {iss.category}
                              </span>
                              {iss.pageNumber && (
                                <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.2 rounded font-mono">
                                  Page {iss.pageNumber}
                                </span>
                              )}
                              {iss.autoFixable && (
                                <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-800 px-1.5 py-0.2 rounded font-mono">
                                  Auto-Fixable
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-300 leading-relaxed">
                              {iss.description}
                            </p>
                          </div>
                        </div>

                        {/* Status selector */}
                        <select
                          value={iss.status || 'pending'}
                          onChange={(e) => handleIssueStatusChange(iss.id, e.target.value)}
                          className="bg-neutral-950 border border-neutral-700 text-neutral-300 text-[11px] rounded px-2 py-1 focus:outline-none focus:border-rose-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="acknowledged">Acknowledged</option>
                          <option value="resolved">Resolved</option>
                          <option value="requires-source-correction">Source Fix Req</option>
                        </select>
                      </div>

                      {/* Technical Recommendation */}
                      {iss.recommendation && (
                        <div className="p-2.5 bg-neutral-950/80 border border-neutral-800/80 rounded-lg text-[11px] text-neutral-300 flex items-start space-x-2">
                          <ArrowRight className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-white">Recommendation:</strong> {iss.recommendation}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GEOMETRY & BLEED */}
          {activeTab === 'geometry' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 text-xs">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-rose-500" />
                  <span>Page Box Standard Hierarchy</span>
                </h4>
                <p className="text-neutral-400 leading-relaxed">
                  ISO 15930 PDF/X specifications require explicit MediaBox and TrimBox definitions. For bleed printing, the BleedBox must extend at least 0.125 inches (9 points) beyond TrimBox edges.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                      First Page MediaBox
                    </span>
                    <span className="font-mono text-white text-sm font-bold">
                      {report.pages[0]?.pageBoxes.mediaBox.widthInches}&quot; ×{' '}
                      {report.pages[0]?.pageBoxes.mediaBox.heightInches}&quot;
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                      First Page TrimBox
                    </span>
                    <span className="font-mono text-emerald-400 text-sm font-bold">
                      {report.pages[0]?.pageBoxes.trimBox
                        ? `${report.pages[0].pageBoxes.trimBox.widthInches}" × ${report.pages[0].pageBoxes.trimBox.heightInches}"`
                        : 'Missing (Fails PDF/X)'}
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                      Measured Bleed
                    </span>
                    <span className="font-mono text-white text-sm font-bold">
                      {report.pages[0]?.pageBoxes.bleedAmountInches.top.toFixed(3)}&quot;
                    </span>
                  </div>
                </div>
              </div>

              {/* Pages Geometry Table */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-neutral-950 text-neutral-400 text-[10px] uppercase font-bold border-b border-neutral-800">
                    <tr>
                      <th className="p-3">Page</th>
                      <th className="p-3">MediaBox</th>
                      <th className="p-3">TrimBox</th>
                      <th className="p-3">Bleed (Top)</th>
                      <th className="p-3">Orientation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300 font-mono">
                    {report.pages.map((p) => (
                      <tr key={p.pageNumber} className="hover:bg-neutral-950/40">
                        <td className="p-3 font-bold text-white">Page {p.pageNumber}</td>
                        <td className="p-3">
                          {p.pageBoxes.mediaBox.widthInches}&quot; × {p.pageBoxes.mediaBox.heightInches}&quot;
                        </td>
                        <td className="p-3">
                          {p.pageBoxes.trimBox
                            ? `${p.pageBoxes.trimBox.widthInches}" × ${p.pageBoxes.trimBox.heightInches}"`
                            : 'None'}
                        </td>
                        <td className="p-3">{p.pageBoxes.bleedAmountInches.top.toFixed(3)}&quot;</td>
                        <td className="p-3 capitalize">{p.pageBoxes.orientation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COLOR & OVERPRINT */}
          {activeTab === 'color' && (
            <div className="space-y-4">
              <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3 text-xs">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-rose-500" />
                  <span>Color Separations & Overprint</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                      CMYK Compliance
                    </span>
                    <span
                      className={`font-bold ${
                        report.colorSummary.cmykCompliant ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {report.colorSummary.cmykCompliant ? 'Verified CMYK Only' : 'RGB Objects Detected'}
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                      PDF/X OutputIntent
                    </span>
                    <span className="font-mono text-neutral-200">
                      {report.outputIntent ? report.outputIntent.conditionId : 'None'}
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                      100K Pure Black Text
                    </span>
                    <span className="font-bold text-emerald-400">
                      {report.colorSummary.pure100kBlackEnforced ? 'Compliant' : 'Unverified'}
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                      Black Overprint (/GS_OP)
                    </span>
                    <span className="font-mono text-neutral-200">
                      {report.colorSummary.overprintActive ? 'Active' : 'Knockout'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FONTS */}
          {activeTab === 'fonts' && (
            <div className="space-y-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-neutral-950 text-neutral-400 text-[10px] uppercase font-bold border-b border-neutral-800">
                    <tr>
                      <th className="p-3">Font Name</th>
                      <th className="p-3">Subtype</th>
                      <th className="p-3">Embedded</th>
                      <th className="p-3">Subset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300 font-mono">
                    {report.fonts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-neutral-500">
                          No embedded or external font dictionaries registered in document.
                        </td>
                      </tr>
                    ) : (
                      report.fonts.map((f, i) => (
                        <tr key={i} className="hover:bg-neutral-950/40">
                          <td className="p-3 font-bold text-white">{f.name}</td>
                          <td className="p-3">{f.subtype}</td>
                          <td className="p-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                (f.isEmbedded ?? f.embedded)
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {(f.isEmbedded ?? f.embedded) ? 'Embedded' : 'Missing'}
                            </span>
                          </td>
                          <td className="p-3">
                            {(f.isSubset ?? f.subset) ? (
                              <span className="text-emerald-400">Yes</span>
                            ) : (
                              <span className="text-neutral-500">Full</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: IMAGES */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-neutral-950 text-neutral-400 text-[10px] uppercase font-bold border-b border-neutral-800">
                    <tr>
                      <th className="p-3">Page</th>
                      <th className="p-3">Color Space</th>
                      <th className="p-3">Pixel Dimensions</th>
                      <th className="p-3">Effective DPI</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300 font-mono">
                    {report.images.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-neutral-500">
                          No raster images found in this document.
                        </td>
                      </tr>
                    ) : (
                      report.images.map((img, i) => (
                        <tr key={i} className="hover:bg-neutral-950/40">
                          <td className="p-3 font-bold text-white">Page {img.pageNumber}</td>
                          <td className="p-3 uppercase">{img.colorSpace}</td>
                          <td className="p-3">{(img.pixelWidth ?? img.widthPx)} × {(img.pixelHeight ?? img.heightPx)} px</td>
                          <td className="p-3">
                            {(() => {
                              const dpi = img.effectiveDpi ?? Math.round(Math.min(img.effectiveDpiX, img.effectiveDpiY));
                              return (
                                <span
                                  className={`font-bold ${
                                    dpi >= 300
                                      ? 'text-emerald-400'
                                      : dpi >= 150
                                      ? 'text-amber-400'
                                      : 'text-rose-500'
                                  }`}
                                >
                                  {dpi} DPI
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-3">
                            {(() => {
                              const dpi = img.effectiveDpi ?? Math.round(Math.min(img.effectiveDpiX, img.effectiveDpiY));
                              return dpi >= 300 ? (
                                <span className="text-emerald-400">Print Quality</span>
                              ) : (
                                <span className="text-amber-400">Low Resolution</span>
                              );
                            })()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: VERIFICATION COMPARE */}
          {activeTab === 'compare' && job.repairedReport && (
            <PreflightCompareView job={job} />
          )}
        </div>

        {/* Right Column (1 Col): Page Navigator & Anchored Collaboration Notes */}
        <div className="space-y-4">
          {/* Page Navigator Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Columns className="w-3.5 h-3.5 text-rose-500" />
                <span>Page Explorer</span>
              </h4>
              {selectedPageNumber !== undefined && (
                <button
                  type="button"
                  onClick={() => setSelectedPageNumber(undefined)}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Show All Pages
                </button>
              )}
            </div>

            {/* Page grid thumbnails / buttons */}
            <div className="grid grid-cols-4 gap-2">
              {report.pages.map((p) => {
                const isSelected = selectedPageNumber === p.pageNumber;
                const pageIssues = p.issues ?? report.issues.filter((i) => i.pageNumber === p.pageNumber);
                const hasPageErrors = (p.issuesCount?.error ?? 0) > 0 || pageIssues.some((i) => i.severity === 'error');
                const hasPageWarnings = (p.issuesCount?.warning ?? 0) > 0 || pageIssues.some((i) => i.severity === 'warning');

                return (
                  <button
                    key={p.pageNumber}
                    type="button"
                    onClick={() =>
                      setSelectedPageNumber(isSelected ? undefined : p.pageNumber)
                    }
                    className={`p-2.5 rounded-lg border text-center font-mono text-xs transition-colors ${
                      isSelected
                        ? 'border-rose-500 bg-rose-950/40 text-white font-bold'
                        : hasPageErrors
                        ? 'border-rose-900/60 bg-neutral-950 text-rose-300 hover:border-rose-700'
                        : hasPageWarnings
                        ? 'border-amber-900/60 bg-neutral-950 text-amber-300 hover:border-amber-700'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span>Pg {p.pageNumber}</span>
                    <span className="block text-[9px] text-neutral-500 mt-0.5">
                      {pageIssues.length} iss
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anchored Prepress Notes Panel */}
          <PreflightCommentsPanel
            job={job}
            onJobUpdated={onJobUpdated}
            selectedPageNumber={selectedPageNumber}
          />
        </div>
      </div>

      {/* Repair Modal */}
      {isRepairModalOpen && (
        <PreflightRepairModal
          isOpen={isRepairModalOpen}
          job={job}
          onClose={() => setIsRepairModalOpen(false)}
          onRepairCompleted={(updated) => {
            onJobUpdated(updated);
            setActiveTab('compare');
          }}
        />
      )}

      {/* Imposition Handoff & Launch Modal */}
      {isImpositionModalOpen && (
        <ImpositionLaunchModal
          isOpen={isImpositionModalOpen}
          onClose={() => setIsImpositionModalOpen(false)}
          handoffPayload={createHandoffFromPreflightJob(job)}
        />
      )}
    </div>
  );
};
