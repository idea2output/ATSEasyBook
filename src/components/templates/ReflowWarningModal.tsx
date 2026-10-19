'use client';

import React from 'react';
import { BookTemplate } from '@/types/book';
import { AlertTriangle, History, ArrowRight, X } from 'lucide-react';

interface ReflowWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentTemplate: BookTemplate;
  newTemplate: BookTemplate;
  differences: string[];
}

export const ReflowWarningModal: React.FC<ReflowWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentTemplate,
  newTemplate,
  differences,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reflow-warning-title"
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="reflow-warning-title" className="text-base font-bold text-slate-900">
                Confirm Layout & Template Change
              </h3>
              <p className="text-xs text-slate-500">
                Material typography or trim changes will reflow pages.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
            <p className="font-semibold">
              Applying &ldquo;{newTemplate.name}&rdquo; differs from current layout &ldquo;{currentTemplate.name}&rdquo;:
            </p>
            <ul className="list-disc list-inside space-y-1 text-amber-800">
              {differences.map((diff, idx) => (
                <li key={idx}>{diff}</li>
              ))}
            </ul>
          </div>

          <div className="flex items-start space-x-2.5 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900">
            <History className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Automatic Recovery Snapshot</p>
              <p className="text-indigo-700 mt-0.5">
                EasyBook will automatically create a version snapshot before applying this change. Your manuscript text, images, captions, and language settings are 100% preserved.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-template-reflow-btn"
            onClick={onConfirm}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            <span>Apply Template & Reflow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
