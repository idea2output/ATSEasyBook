'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { PreflightReportView } from '@/components/preflight/PreflightReportView';
import { PreflightJob } from '@/types/preflight';
import { preflightJobRepository } from '@/services/preflight/preflightJobRepository';
import { ArrowLeft, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function PreflightJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<PreflightJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJob = async () => {
    if (!jobId) return;
    setIsLoading(true);
    setError(null);
    try {
      const found = await preflightJobRepository.getJobById(jobId);
      if (!found) {
        setError('Preflight job not found or has been removed.');
      } else {
        setJob(found);
      }
    } catch (err: any) {
      console.error('Failed to load preflight job:', err);
      setError(err.message || 'Failed to load preflight job details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [jobId]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb / Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/preflight"
            id="back-to-preflight-dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Preflight Workspace</span>
          </Link>

          <div className="flex items-center space-x-2 text-xs text-neutral-500 font-mono">
            <span>Job ID: {jobId}</span>
          </div>
        </div>

        {/* Content State */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500" />
            <p className="text-xs text-neutral-400 font-medium">Loading preflight inspection report...</p>
          </div>
        ) : error || !job ? (
          <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg mx-auto text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <div>
              <h2 className="text-base font-bold text-white">Inspection Report Not Available</h2>
              <p className="text-xs text-neutral-400 mt-1">{error || 'Job not found.'}</p>
            </div>
            <Link
              href="/preflight"
              className="inline-block px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <PreflightReportView
            job={job}
            onJobUpdated={(updated) => setJob(updated)}
          />
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
