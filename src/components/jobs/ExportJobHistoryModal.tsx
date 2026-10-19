'use client';

import React, { useState, useEffect } from 'react';
import { ExportJob } from '@/types/jobs';
import { jobQueue } from '@/services/jobs/jobQueueService';
import { bookRepository } from '@/services/storage/bookRepository';
import {
  X,
  FileDown,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  BookOpen,
  Layers,
  FileCheck,
} from 'lucide-react';

interface ExportJobHistoryModalProps {
  isOpen: boolean;
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}

export const ExportJobHistoryModal: React.FC<ExportJobHistoryModalProps> = ({
  isOpen,
  projectId,
  projectTitle,
  onClose,
}) => {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activeUser = bookRepository.getActiveUser();

  const loadJobs = async () => {
    if (!activeUser) return;
    try {
      const list = await jobQueue.listJobsForProject(projectId, activeUser);
      setJobs(list);
    } catch (err) {
      console.error('Failed to load export jobs:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadJobs().finally(() => setIsLoading(false));

      // Poll every 3 seconds while modal is open
      const interval = setInterval(loadJobs, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-history-title"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 id="job-history-title" className="text-base font-bold text-slate-900">
                Background Export Queue & History
              </h2>
              <p className="text-xs text-slate-500">
                {projectTitle} • Reliable print PDF and reflowable EPUB generation
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-jobs-modal-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {isLoading && jobs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
              <p className="text-xs">Checking export queue...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="text-xs font-bold text-slate-700">No export jobs recorded</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Background exports requested via &ldquo;Export PDF&rdquo; or &ldquo;Export EPUB 3&rdquo; will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const isPdf = job.format === 'pdf';
                return (
                  <div
                    key={job.id}
                    className="p-4 border border-slate-200 rounded-xl bg-white shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                  >
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isPdf ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {job.format.toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {isPdf ? 'Print-Ready CMYK PDF' : 'Accessible Reflowable EPUB 3'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          #{job.id.slice(-6)}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {job.status === 'queued' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Queued</span>
                          </span>
                        )}
                        {job.status === 'processing' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Processing ({job.progress}%)</span>
                          </span>
                        )}
                        {job.status === 'completed' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Completed</span>
                          </span>
                        )}
                        {job.status === 'failed' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>Failed</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar for active jobs */}
                    {job.status === 'processing' && (
                      <div className="space-y-1">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500">{job.statusMessage}</p>
                      </div>
                    )}

                    {/* Snapshot Metadata info */}
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span>Template: <strong>{job.settingsSnapshot.templateId}</strong></span>
                      {job.settingsSnapshot.outputIntent && (
                        <span>Output Intent: <strong>{job.settingsSnapshot.outputIntent}</strong></span>
                      )}
                      <span>Requested by: <strong>{job.requestedBy.displayName}</strong></span>
                      <span>
                        Time: {new Date(job.queuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Download or Error Banner */}
                    {job.status === 'completed' && job.signedDownloadUrl && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500">
                          File Size: {job.fileSizeBytes ? `${Math.round(job.fileSizeBytes / 1024)} KB` : 'Ready'}
                        </span>
                        <a
                          href={job.signedDownloadUrl}
                          download={job.downloadFilename || `${job.format}-export`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Export</span>
                        </a>
                      </div>
                    )}

                    {job.status === 'failed' && (
                      <div className="p-2 bg-rose-50 border border-rose-100 rounded text-rose-800 text-[11px]">
                        Error: {job.errorMessage}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Exports are stored securely with time-limited signed access links.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
