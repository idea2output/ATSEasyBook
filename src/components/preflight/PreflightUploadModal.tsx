'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Info,
} from 'lucide-react';
import { PREFLIGHT_PROFILES, getPreflightProfile } from '@/services/preflight/preflightProfiles';
import { preflightJobRepository } from '@/services/preflight/preflightJobRepository';
import { bookRepository } from '@/services/storage/bookRepository';

interface PreflightUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated?: (jobId: string) => void;
  initialFile?: File | null;
  initialProfileId?: string;
}

export const PreflightUploadModal: React.FC<PreflightUploadModalProps> = ({
  isOpen,
  onClose,
  onJobCreated,
  initialFile = null,
  initialProfileId = 'ats-standard-print',
}) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(initialProfileId);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentProfile = getPreflightProfile(selectedProfileId);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setErrorMessage(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Unsupported file format. ATS Preflight only accepts valid .pdf files.');
      setSelectedFile(null);
      return;
    }

    // Size limit: 100MB
    const maxBytes = 100 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`File exceeds 100MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleStartInspection = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a PDF document to inspect.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressPercent(15);
    setProgressStage('Validating PDF format & security header...');

    try {
      // 1. Read file buffer
      const buffer = await selectedFile.arrayBuffer();
      const u8 = new Uint8Array(buffer);

      // Verify magic bytes %PDF-
      const headerStr = String.fromCharCode(...Array.from(u8.slice(0, 5)));
      if (headerStr !== '%PDF-') {
        throw new Error('Malformed PDF file: Missing standard %PDF- header magic bytes.');
      }

      setProgressPercent(45);
      setProgressStage('Analyzing page boxes, trim geometries & fonts...');

      // Get authenticated user or local guest
      const activeUser = bookRepository.getActiveUser();
      const user = activeUser
        ? {
            userId: activeUser.userId,
            displayName: activeUser.displayName,
            email: activeUser.userEmail,
          }
        : {
            userId: 'guest-publisher',
            displayName: 'Guest Publisher',
            email: 'publisher@ats.local',
          };

      setProgressPercent(75);
      setProgressStage('Checking color separations, 100K black & overprint...');

      // 2. Run inspection pipeline via repository
      const job = await preflightJobRepository.createJob(
        u8,
        selectedFile.name,
        selectedProfileId,
        user
      );

      setProgressPercent(100);
      setProgressStage('Inspection completed! Loading production report...');

      setTimeout(() => {
        setIsProcessing(false);
        onClose();
        if (onJobCreated) {
          onJobCreated(job.id);
        } else {
          router.push(`/preflight/${job.id}`);
        }
      }, 400);
    } catch (err: any) {
      console.error('Preflight inspection error:', err);
      setIsProcessing(false);
      setErrorMessage(err.message || 'An error occurred during PDF inspection.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preflight-upload-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-xl w-full text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-600/10 border border-rose-600/30 text-rose-500 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="preflight-upload-title" className="text-base font-bold text-white tracking-wide">
                ATS PDF Preflight & Inspection
              </h3>
              <p className="text-xs text-neutral-400">
                Independent prepress validation for production-ready print PDFs
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              type="button"
              onClick={onClose}
              id="close-preflight-upload-btn"
              aria-label="Close dialog"
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Profile Selection */}
          <div className="space-y-2">
            <label htmlFor="preflight-profile-select" className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center justify-between">
              <span>Target Preflight Profile</span>
              <span className="text-[10px] text-rose-400 lowercase font-mono">Independent inspection</span>
            </label>
            <select
              id="preflight-profile-select"
              value={selectedProfileId}
              disabled={isProcessing}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 text-white text-xs font-medium rounded-lg p-2.5 focus:border-rose-500 focus:outline-none transition-colors"
            >
              {PREFLIGHT_PROFILES.map((prof) => (
                <option key={prof.id} value={prof.id} className="bg-neutral-900 text-white">
                  {prof.name} ({prof.targetIntent?.toUpperCase() || prof.rules.targetPdfxLevel || prof.rules.defaultOutputIntentId.toUpperCase()})
                </option>
              ))}
            </select>

            {/* Profile Info & Disclaimer Banner */}
            <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs space-y-1.5 text-neutral-300">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{currentProfile.description}</p>
              </div>
              <p className="text-[11px] text-neutral-400 pl-6 italic">
                {currentProfile.disclaimer}
              </p>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              PDF Document (PDF Only, up to 100MB)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-rose-500 bg-rose-950/20'
                  : selectedFile
                  ? 'border-neutral-600 bg-neutral-950'
                  : 'border-neutral-700 hover:border-neutral-500 bg-neutral-950/40 hover:bg-neutral-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                id="preflight-file-input"
                disabled={isProcessing}
                onChange={handleFileSelect}
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-sm mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for inspection
                    </p>
                  </div>
                  <span className="inline-block text-[11px] text-rose-400 hover:underline pt-1">
                    Click to change PDF
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-200">
                      Drop your print-ready PDF here or browse
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Accepts standard, CMYK, PDF/X, digital, and book interior PDFs
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="space-y-2 p-3 bg-neutral-950 border border-neutral-800 rounded-lg">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-neutral-300 flex items-center space-x-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  <span>{progressStage}</span>
                </span>
                <span className="text-rose-400 font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg flex items-start space-x-2 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Inspection Warning</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            id="start-preflight-btn"
            onClick={handleStartInspection}
            disabled={!selectedFile || isProcessing}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Inspecting PDF...</span>
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4" />
                <span>Run Deep Preflight</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
