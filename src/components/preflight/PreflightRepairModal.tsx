'use client';

import React, { useState } from 'react';
import {
  X,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Info,
} from 'lucide-react';
import { PreflightJob, PreflightRepairActionType } from '@/types/preflight';
import { generateRepairPlan } from '@/services/preflight/pdfRepairEngine';
import { getPreflightProfile } from '@/services/preflight/preflightProfiles';
import { preflightJobRepository } from '@/services/preflight/preflightJobRepository';
import { bookRepository } from '@/services/storage/bookRepository';

interface PreflightRepairModalProps {
  isOpen: boolean;
  job: PreflightJob;
  onClose: () => void;
  onRepairCompleted: (updatedJob: PreflightJob) => void;
}

export const PreflightRepairModal: React.FC<PreflightRepairModalProps> = ({
  isOpen,
  job,
  onClose,
  onRepairCompleted,
}) => {
  const profile = getPreflightProfile(job.profileId);
  const repairPlan = generateRepairPlan(job.latestReport, profile);

  // Default all proposed safe actions to checked
  const [selectedActions, setSelectedActions] = useState<PreflightRepairActionType[]>(
    repairPlan.actions.map((a) => a.type)
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleAction = (actionType: PreflightRepairActionType) => {
    if (selectedActions.includes(actionType)) {
      setSelectedActions(selectedActions.filter((a) => a !== actionType));
    } else {
      setSelectedActions([...selectedActions, actionType]);
    }
  };

  const handleExecuteRepair = async () => {
    if (selectedActions.length === 0) {
      setErrorMessage('Please select at least one repair action to execute.');
      return;
    }

    setIsExecuting(true);
    setErrorMessage(null);

    try {
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

      const updatedJob = await preflightJobRepository.executeRepair(
        job.id,
        selectedActions,
        user
      );

      setIsExecuting(false);
      onRepairCompleted(updatedJob);
      onClose();
    } catch (err: any) {
      console.error('Repair execution failed:', err);
      setIsExecuting(false);
      setErrorMessage(err.message || 'Repair execution failed.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preflight-repair-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-2xl w-full text-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 id="preflight-repair-title" className="text-base font-bold text-white tracking-wide">
                Transparent PDF Repair Plan
              </h3>
              <p className="text-xs text-neutral-400">
                Non-destructive fixes with independent post-repair re-inspection
              </p>
            </div>
          </div>
          {!isExecuting && (
            <button
              type="button"
              onClick={onClose}
              id="close-preflight-repair-btn"
              aria-label="Close dialog"
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Non-destructive guarantee notice */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-xs space-y-2">
            <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>ATS Non-Destructive Integrity Guarantee</span>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              Your original file <strong className="text-white font-mono">{job.originalFilename}</strong> is preserved untouched. Repaired output will be saved as <strong className="text-white font-mono">repaired-v1.pdf</strong> and will immediately undergo an independent preflight check to verify that issues were legitimately resolved.
            </p>
            <p className="text-neutral-400 text-[11px]">
              ATS Preflight never silently rasterizes pages, never fabricates low-DPI image details, and never invents missing font glyphs.
            </p>
          </div>

          {/* Action List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Automated Safe Fixes ({repairPlan.actions.length})
              </h4>
              <span className="text-[11px] text-neutral-400">
                {selectedActions.length} of {repairPlan.actions.length} selected
              </span>
            </div>

            {repairPlan.actions.length === 0 ? (
              <div className="p-4 text-center bg-neutral-950 rounded-lg text-neutral-400 text-xs">
                No automated fixes required for this document. It is either fully compliant or only has issues requiring source file corrections.
              </div>
            ) : (
              <div className="space-y-2">
                {repairPlan.actions.map((act) => {
                  const isChecked = selectedActions.includes(act.type);
                  return (
                    <label
                      key={act.type}
                      className={`flex items-start space-x-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-neutral-600 bg-neutral-950'
                          : 'border-neutral-800 bg-neutral-950/40 opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isExecuting}
                        onChange={() => toggleAction(act.type)}
                        className="mt-0.5 h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-rose-600 focus:ring-rose-500"
                      />
                      <div className="text-xs space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{act.title}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                            {act.type}
                          </span>
                        </div>
                        <p className="text-neutral-300 text-[11px] leading-relaxed">
                          {act.description}
                        </p>
                        {act.riskWarning && (
                          <p className="text-amber-400 text-[10px] flex items-center space-x-1 pt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{act.riskWarning}</span>
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unrepairable / Requires Source Designer Correction */}
          {repairPlan.unrepairableIssues.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Requires Source Application / Designer Correction ({repairPlan.unrepairableIssues.length})</span>
              </h4>
              <p className="text-[11px] text-neutral-400">
                The following issues cannot be ethically automated without quality loss and must be corrected in the authoring tool (InDesign, Illustrator, Word, etc.):
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {repairPlan.unrepairableIssues.map((iss) => (
                  <div
                    key={iss.id}
                    className="p-2.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-200">
                        {iss.pageNumber ? `Page ${iss.pageNumber}: ` : ''}
                        {iss.title}
                      </span>
                      <span className="text-[10px] text-neutral-500 uppercase">{iss.category}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">{iss.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg flex items-start space-x-2 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Repair Execution Error</p>
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
            disabled={isExecuting}
            className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            id="execute-pdf-repair-btn"
            onClick={handleExecuteRepair}
            disabled={isExecuting || selectedActions.length === 0}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing Safe Repair...</span>
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4" />
                <span>Execute & Re-Inspect ({selectedActions.length} Actions)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
