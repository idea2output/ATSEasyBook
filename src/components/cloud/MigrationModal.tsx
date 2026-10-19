'use client';

import React, { useState, useEffect } from 'react';
import { BookProject } from '@/types/book';
import { MigrationPreview, MigrationResult } from '@/types/cloud';
import { migrationService } from '@/services/cloud/migrationService';
import { bookRepository } from '@/services/storage/bookRepository';
import {
  X,
  CloudUpload,
  Layers,
  FileText,
  Image as ImageIcon,
  Type,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete: (result: MigrationResult) => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  onClose,
  onMigrationComplete,
}) => {
  const [localBooks, setLocalBooks] = useState<BookProject[]>([]);
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [retainLocalCopy, setRetainLocalCopy] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const local = bookRepository.getLocalRepository().getStoredBooks();
      setLocalBooks(local);
      const prev = migrationService.generateMigrationPreview(local);
      setPreview(prev);
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartMigration = async () => {
    const activeUser = bookRepository.getActiveUser();
    if (!activeUser) {
      setError('You must be signed in to migrate local books to your cloud account.');
      return;
    }

    setIsMigrating(true);
    setError(null);

    try {
      const res = await migrationService.executeMigration(localBooks, activeUser, {
        retainLocalCopy,
      });

      setResult(res);
      if (res.success) {
        onMigrationComplete(res);
      } else {
        setError(`Migration completed with errors: ${res.errors.join('; ')}`);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during migration.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="migration-modal-title"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h2 id="migration-modal-title" className="text-base font-bold text-slate-900">
                Migrate Local Projects to Cloud
              </h2>
              <p className="text-xs text-slate-500">
                Preserve manuscript formatting, images, custom fonts, and templates in your cloud publisher account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result?.success ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Migration Complete!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Successfully migrated <span className="font-bold text-slate-900">{result.migratedCount}</span> project(s) to cloud persistence. Your team can now collaborate on these books in real time.
              </p>
              {result.localDataRetained ? (
                <p className="text-[11px] text-slate-400">
                  (A local backup copy was safely retained in this browser.)
                </p>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs shadow-xs hover:bg-indigo-700"
              >
                View Cloud Projects
              </button>
            </div>
          ) : (
            <>
              {preview && (
                <>
                  {/* Summary Scope Stats */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-base font-bold text-slate-900">{preview.totalProjects}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Projects</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-base font-bold text-slate-900">{preview.totalImagesCount}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Images</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-base font-bold text-slate-900">{preview.totalFontsCount}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Custom Fonts</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-base font-bold text-slate-900">{preview.estimatedSizeKB} KB</div>
                      <div className="text-[10px] text-slate-500 font-medium">Est. Payload</div>
                    </div>
                  </div>

                  {/* Projects List */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Projects Scheduled for Migration:</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        All formatting and metadata preserved
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {preview.projects.map((proj) => (
                        <div key={proj.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{proj.title}</p>
                            <p className="text-[11px] text-slate-500">
                              By {proj.author} • {proj.wordCount.toLocaleString()} words • Template: {proj.templateId}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                            {proj.imagesCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded">
                                {proj.imagesCount} img
                              </span>
                            )}
                            {proj.fontsCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded font-medium">
                                {proj.fontsCount} font
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Safety & Retention Options */}
                  <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-indigo-950">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Zero Data Loss Protection</span>
                    </div>
                    <p className="text-[11px] text-indigo-900 leading-relaxed">
                      Local manuscript data is verified in cloud storage before any local storage changes are made.
                    </p>

                    <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={retainLocalCopy}
                        onChange={(e) => setRetainLocalCopy(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-medium text-slate-800">
                        Retain local backup copy in browser localStorage (Recommended)
                      </span>
                    </label>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!result?.success && (
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isMigrating}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              id="confirm-migration-btn"
              onClick={handleStartMigration}
              disabled={isMigrating || localBooks.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center space-x-2 disabled:opacity-50"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Migrating Projects...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  <span>Confirm Cloud Migration ({localBooks.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
