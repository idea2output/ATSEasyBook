'use client';

import React, { useState, useEffect } from 'react';
import { ProjectVersionSnapshot, VersionDiff } from '@/types/version';
import { versionService } from '@/services/cloud/versionService';
import { BookProject } from '@/types/book';
import { bookRepository } from '@/services/storage/bookRepository';
import {
  History,
  Camera,
  RotateCcw,
  Copy,
  GitCompare,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface VersionHistoryPanelProps {
  project: BookProject;
  onVersionRestored: (restored: BookProject) => void;
  onDuplicateCreated: (cloned: BookProject) => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  project,
  onVersionRestored,
  onDuplicateCreated,
}) => {
  const [versions, setVersions] = useState<ProjectVersionSnapshot[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersionSnapshot | null>(null);
  const [compareVersion, setCompareVersion] = useState<ProjectVersionSnapshot | null>(null);
  const [diff, setDiff] = useState<VersionDiff | null>(null);

  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeUser = bookRepository.getActiveUser();

  const loadVersions = async () => {
    if (!activeUser) return;
    try {
      const list = await versionService.listVersions(project.id, activeUser);
      setVersions(list);
      if (list.length > 0 && !selectedVersion) {
        setSelectedVersion(list[0]);
      }
    } catch (err: any) {
      console.error('Error loading versions:', err);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [project.id]);

  useEffect(() => {
    if (selectedVersion && compareVersion) {
      const computed = versionService.compareVersions(compareVersion, selectedVersion);
      setDiff(computed);
    } else {
      setDiff(null);
    }
  }, [selectedVersion, compareVersion]);

  const handleCreateManualSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;

    try {
      const created = await versionService.createSnapshot(
        project,
        'manual',
        newLabel || undefined,
        newDescription || undefined,
        activeUser
      );
      setNewLabel('');
      setNewDescription('');
      setIsCreatingSnapshot(false);
      setStatusMessage(`Snapshot #${created.versionNumber} created.`);
      await loadVersions();
    } catch (err: any) {
      setError(err.message || 'Error creating snapshot.');
    }
  };

  const handleRestore = async (version: ProjectVersionSnapshot) => {
    if (!activeUser) return;
    if (
      !confirm(
        `Are you sure you want to restore Version #${version.versionNumber} ("${version.label}")? A safety backup of your current state will be saved first.`
      )
    ) {
      return;
    }

    try {
      const restored = await versionService.restoreVersion(project.id, version.versionNumber, activeUser);
      setStatusMessage(`Restored project to Version #${version.versionNumber}.`);
      onVersionRestored(restored);
      await loadVersions();
    } catch (err: any) {
      setError(err.message || 'Error restoring version.');
    }
  };

  const handleDuplicate = async (version: ProjectVersionSnapshot) => {
    if (!activeUser) return;
    const title = prompt('Enter a title for the new duplicated project:', `${version.snapshotData.title} (Clone v${version.versionNumber})`);
    if (!title) return;

    try {
      const duplicated = await versionService.duplicateVersionAsNewProject(
        project.id,
        version.versionNumber,
        title,
        activeUser
      );
      setStatusMessage(`Project duplicated into "${duplicated.title}".`);
      onDuplicateCreated(duplicated);
    } catch (err: any) {
      setError(err.message || 'Error duplicating version.');
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Header and Snapshot Creator */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Version History & Milestones</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic recovery points, revision diffing, and non-destructive rollbacks
          </p>
        </div>

        <button
          type="button"
          id="take-manual-snapshot-btn"
          onClick={() => setIsCreatingSnapshot(!isCreatingSnapshot)}
          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Save Snapshot</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isCreatingSnapshot && (
        <form onSubmit={handleCreateManualSnapshot} className="p-3.5 border border-indigo-200 rounded-xl bg-indigo-50/40 space-y-3">
          <p className="text-xs font-bold text-indigo-950">Record Version Milestone</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              id="snapshot-label-input"
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Chapter 3 Draft Complete"
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description or notes (optional)"
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCreatingSnapshot(false)}
              className="px-3 py-1 border border-slate-300 rounded text-xs text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              id="confirm-save-snapshot-btn"
              type="submit"
              className="px-3.5 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700"
            >
              Save Milestone
            </button>
          </div>
        </form>
      )}

      {/* Version List and Inspector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Versions List */}
        <div className="md:col-span-5 border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-96 overflow-y-auto bg-white">
          {versions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No historical snapshots recorded yet. Snapshots are created automatically before exports and template changes.
            </div>
          ) : (
            versions.map((ver) => {
              const isSelected = selectedVersion?.id === ver.id;
              const isComparing = compareVersion?.id === ver.id;
              return (
                <div
                  key={ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  className={`p-3 cursor-pointer transition-colors text-left ${
                    isSelected ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      v{ver.versionNumber}: {ver.label}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {ver.trigger}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                    {ver.description || `${ver.summary.wordCount.toLocaleString()} words • ${ver.summary.blockCount} blocks`}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>{new Date(ver.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    <span>By {ver.createdBy.displayName}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Version Details & Diff */}
        <div className="md:col-span-7 border border-slate-200 rounded-xl p-4 bg-white space-y-4">
          {selectedVersion ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Version #{selectedVersion.versionNumber} Details
                  </h4>
                  <p className="text-xs text-slate-500">{selectedVersion.label}</p>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleRestore(selectedVersion)}
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded text-xs font-semibold border border-amber-200 flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(selectedVersion)}
                    className="px-2.5 py-1 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold border border-slate-200 flex items-center space-x-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Fork</span>
                  </button>
                </div>
              </div>

              {/* Version Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="block font-bold text-slate-900">
                    {selectedVersion.summary.wordCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">Words</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="block font-bold text-slate-900">
                    {selectedVersion.summary.blockCount}
                  </span>
                  <span className="text-[10px] text-slate-400">Blocks</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="block font-bold text-slate-900 truncate">
                    {selectedVersion.summary.templateId}
                  </span>
                  <span className="text-[10px] text-slate-400">Template</span>
                </div>
              </div>

              {/* Diff Comparison Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Compare with Another Version:</span>
                  </span>

                  <select
                    value={compareVersion?.id || ''}
                    onChange={(e) => {
                      const found = versions.find((v) => v.id === e.target.value);
                      setCompareVersion(found || null);
                    }}
                    className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Select version to compare...</option>
                    {versions
                      .filter((v) => v.id !== selectedVersion.id)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          v{v.versionNumber}: {v.label}
                        </option>
                      ))}
                  </select>
                </div>

                {diff ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <p className="font-semibold text-slate-800">
                      Changes between v{diff.baseVersion} and v{diff.targetVersion}:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                      {diff.summary.map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Select a version above to view high-level structural diffs.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Select a version on the left to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
