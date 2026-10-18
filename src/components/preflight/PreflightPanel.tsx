'use client';

import React, { useState } from 'react';
import { PreflightSummary, PreflightIssue } from '@/types/book';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Download,
  ArrowRight,
  ShieldAlert,
  HardDrive,
  BookOpen,
} from 'lucide-react';

interface PreflightPanelProps {
  summary: PreflightSummary;
  isAcknowledged: boolean;
  onToggleAcknowledge: (val: boolean) => void;
  onTriggerExport: () => void;
  onExecuteAction: (issue: PreflightIssue) => void;
}

export const PreflightPanel: React.FC<PreflightPanelProps> = ({
  summary,
  isAcknowledged,
  onToggleAcknowledge,
  onTriggerExport,
  onExecuteAction,
}) => {
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings'>('all');

  const filteredIssues = summary.issues.filter((issue) => {
    if (filter === 'errors') return issue.severity === 'error';
    if (filter === 'warnings') return issue.severity === 'warning';
    return true;
  });

  const canExport = summary.errorsCount === 0 && (summary.warningsCount === 0 || isAcknowledged);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-indigo-600" />
            <span>Print Preflight & Quality Gate</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic verification of resolution, bleed, margins, typography, and manuscript integrity before PDF generation.
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={onTriggerExport}
            disabled={!canExport}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              canExport
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export Print-Ready PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-4 border-b border-slate-200 bg-slate-50/20 text-xs">
        <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
          <p className="text-[10px] uppercase font-bold text-slate-400">Errors</p>
          <p className={`text-base font-bold ${summary.errorsCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            {summary.errorsCount}
          </p>
        </div>

        <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
          <p className="text-[10px] uppercase font-bold text-slate-400">Warnings</p>
          <p className={`text-base font-bold ${summary.warningsCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
            {summary.warningsCount}
          </p>
        </div>

        <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
          <p className="text-[10px] uppercase font-bold text-slate-400">Passed Checks</p>
          <p className="text-base font-bold text-emerald-600">{summary.passedCount}</p>
        </div>

        <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
          <p className="text-[10px] uppercase font-bold text-slate-400">Page Count</p>
          <p className="text-base font-bold text-slate-800">{summary.totalPages}</p>
        </div>

        <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
          <p className="text-[10px] uppercase font-bold text-slate-400">Trim Size</p>
          <p className="text-xs font-bold text-slate-800 mt-1 truncate">{summary.trimSize}</p>
        </div>

        <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
          <p className="text-[10px] uppercase font-bold text-slate-400">Est. PDF Size</p>
          <p className="text-base font-bold text-slate-800">~{summary.estimatedPdfSizeMb} MB</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 border-b border-slate-200 bg-slate-50/50 flex items-center space-x-2 text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`py-2 px-3 font-semibold border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-indigo-600 text-indigo-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Issues ({summary.issues.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('errors')}
          className={`py-2 px-3 font-semibold border-b-2 transition-colors ${
            filter === 'errors'
              ? 'border-rose-600 text-rose-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Errors ({summary.errorsCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('warnings')}
          className={`py-2 px-3 font-semibold border-b-2 transition-colors ${
            filter === 'warnings'
              ? 'border-amber-600 text-amber-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Warnings ({summary.warningsCount})
        </button>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-8 text-center bg-emerald-50/30 border border-dashed border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2" />
            <h3 className="text-sm font-bold text-emerald-950">
              {filter === 'all' ? 'All Print Preflight Checks Passed' : `No ${filter} found`}
            </h3>
            <p className="text-xs text-emerald-800 mt-1 max-w-sm">
              Your manuscript, typography, image resolutions, and trim margins meet commercial trade print standards.
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className={`p-3.5 rounded-xl border transition-shadow ${
                issue.severity === 'error'
                  ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                  : 'bg-amber-50/50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-2.5">
                  {issue.severity === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs">{issue.title}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          issue.severity === 'error'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {issue.severity}
                      </span>
                      {issue.pageNumber && (
                        <span className="text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                          Page {issue.pageNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{issue.description}</p>
                  </div>
                </div>

                {issue.actionLabel && (
                  <button
                    type="button"
                    onClick={() => onExecuteAction(issue)}
                    className="shrink-0 inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 shadow-xs hover:bg-slate-50 text-slate-800 transition-colors"
                  >
                    <span>{issue.actionLabel}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Warnings Acknowledgement Bar */}
      {summary.warningsCount > 0 && summary.errorsCount === 0 && (
        <div className="p-3 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs text-amber-950">
          <label className="flex items-center space-x-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="acknowledge-warnings-checkbox"
              checked={isAcknowledged}
              onChange={(e) => onToggleAcknowledge(e.target.checked)}
              className="h-4 w-4 rounded border-amber-400 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium">
              I acknowledge the <span className="font-bold">{summary.warningsCount}</span> warning(s) above and confirm
              this layout is ready for print export.
            </span>
          </label>
        </div>
      )}
    </div>
  );
};
