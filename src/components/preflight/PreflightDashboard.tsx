'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  UploadCloud,
  FileCheck2,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Trash2,
  Download,
  ArrowRight,
  Printer,
  Sparkles,
  Layers,
  Wrench,
} from 'lucide-react';
import { PreflightJob } from '@/types/preflight';
import { preflightJobRepository } from '@/services/preflight/preflightJobRepository';
import { bookRepository } from '@/services/storage/bookRepository';
import { PreflightUploadModal } from './PreflightUploadModal';

export const PreflightDashboard: React.FC = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<PreflightJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'issues' | 'repaired'>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const activeUser = bookRepository.getActiveUser();

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const list = await preflightJobRepository.listJobs(
        activeUser?.userId
      );
      setJobs(list);
    } catch (err) {
      console.error('Failed to load preflight jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this preflight job and inspection report?')) {
      return;
    }
    try {
      await preflightJobRepository.deleteJob(jobId, {
        userId: activeUser?.userId || 'guest',
        role: activeUser?.globalRole || 'administrator',
      });
      loadJobs();
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === 'compliant' && !job.latestReport?.isCompliant) return false;
    if (statusFilter === 'issues' && job.latestReport?.isCompliant) return false;
    if (statusFilter === 'repaired' && !job.repairedReport) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.originalFilename.toLowerCase().includes(q) ||
        job.profileId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCompliant = jobs.filter((j) => j.latestReport?.isCompliant || j.repairedReport?.isCompliant).length;
  const totalRepaired = jobs.filter((j) => j.repairedReport !== undefined).length;
  const totalImpositionReady = jobs.filter((j) => j.impositionReadyMetadata !== undefined).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Prepress Quality Assurance</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            ATS PDF Preflight & Repair Workspace
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Deep PDF inspection for color separations, font embedding, page boxes, bleed, and print certification.
          </p>
        </div>

        <button
          type="button"
          id="upload-preflight-pdf-btn"
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold tracking-wide shadow-md hover:scale-[1.01] transition-all self-start md:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Inspect New PDF</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
            Total Inspected PDFs
          </span>
          <p className="text-2xl font-black font-mono text-white">{jobs.length}</p>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
            Print Compliance Rate
          </span>
          <p className="text-2xl font-black font-mono text-emerald-400">
            {jobs.length > 0 ? `${Math.round((totalCompliant / jobs.length) * 100)}%` : '0%'}
          </p>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
            Repaired Production Copies
          </span>
          <p className="text-2xl font-black font-mono text-amber-400">{totalRepaired}</p>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
            Imposition Ready
          </span>
          <p className="text-2xl font-black font-mono text-rose-500">{totalImpositionReady}</p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-rose-600 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            All ({jobs.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('compliant')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'compliant'
                ? 'bg-rose-600 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Compliant ({jobs.filter((j) => j.latestReport?.isCompliant).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('issues')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'issues'
                ? 'bg-rose-600 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Issues Detected ({jobs.filter((j) => !j.latestReport?.isCompliant).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('repaired')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'repaired'
                ? 'bg-rose-600 text-white'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            Repaired ({totalRepaired})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            id="search-preflight-jobs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents or profiles..."
            className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>
      </div>

      {/* Jobs Table or Empty State */}
      {isLoading ? (
        <div className="py-16 text-center text-neutral-500 text-xs">
          Loading preflight inspection records...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900 border border-neutral-800 rounded-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No PDF Preflight Jobs Yet</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
              Upload any PDF interior or cover to inspect page geometries, CMYK compliance, font embedding, and image resolution against print standards.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload First PDF</span>
          </button>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl text-xs">
          <table className="w-full text-left">
            <thead className="bg-neutral-950 text-neutral-400 text-[10px] uppercase font-bold border-b border-neutral-800">
              <tr>
                <th className="p-4">Document</th>
                <th className="p-4">Preflight Profile</th>
                <th className="p-4">Compliance & Score</th>
                <th className="p-4">Issues</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-neutral-300">
              {filteredJobs.map((job) => {
                const rep = job.latestReport;
                return (
                  <tr
                    key={job.id}
                    onClick={() => router.push(`/preflight/${job.id}`)}
                    className="hover:bg-neutral-950/60 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-bold text-white text-xs hover:text-rose-400 transition-colors">
                        {job.title}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                        {job.originalFilename} • {job.pageCount} pgs • {(job.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </td>

                    <td className="p-4 font-mono text-[11px]">
                      <span className="px-2 py-0.5 bg-neutral-800 rounded text-neutral-300">
                        {job.profileId}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono font-bold text-xs ${
                            (rep?.score ?? 0) >= 90
                              ? 'text-emerald-400'
                              : (rep?.score ?? 0) >= 70
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {rep ? `${rep.score}/100` : 'Pending'}
                        </span>
                        {rep && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              rep.isCompliant
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {rep.isCompliant ? 'Passed' : 'Issues'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-[11px] space-x-2">
                        <span className="text-rose-400 font-semibold">
                          {rep?.summary?.errors ?? 0} err
                        </span>
                        <span className="text-amber-400 font-semibold">
                          {rep?.summary?.warnings ?? 0} warn
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      {job.repairedReport ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-bold uppercase">
                          Repaired Copy
                        </span>
                      ) : job.impositionReadyMetadata ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase flex items-center space-x-1 w-fit">
                          <Printer className="w-3 h-3" />
                          <span>Imposition Ready</span>
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">Original Inspected</span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/preflight/${job.id}`}
                          className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] font-semibold transition-colors"
                        >
                          Report
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteJob(job.id, e)}
                          title="Delete job"
                          className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      <PreflightUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onJobCreated={(jobId) => {
          loadJobs();
          router.push(`/preflight/${jobId}`);
        }}
      />
    </div>
  );
};
