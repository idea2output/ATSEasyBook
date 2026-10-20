'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  ExternalLink,
  ShieldAlert,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  FileCode,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  getImpositionConfig,
  setCustomImpositionUrl,
  ImpositionServiceConfig,
  DEFAULT_IMPOSITION_DEV_URL,
  RECOMMENDED_PROD_SUBDOMAIN,
} from '@/services/imposition/impositionConfig';
import { ImpositionHandoffPayload } from '@/types/impositionHandoff';
import { downloadHandoffPacket } from '@/services/imposition/impositionHandoffService';
import { handoffRepository } from '@/services/handoff/handoffRepository';
import { authService } from '@/services/cloud/authService';

interface ImpositionLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  handoffPayload?: ImpositionHandoffPayload;
}

export const ImpositionLaunchModal: React.FC<ImpositionLaunchModalProps> = ({
  isOpen,
  onClose,
  handoffPayload,
}) => {
  const [config, setConfig] = useState<ImpositionServiceConfig>({
    url: '',
    isConfigured: false,
    environment: 'unconfigured',
    source: 'none',
    statusDescription: '',
  });
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      const active = getImpositionConfig();
      setConfig(active);
      setCustomInputUrl(active.url);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCustomUrl = () => {
    setCustomImpositionUrl(customInputUrl);
    const updated = getImpositionConfig();
    setConfig(updated);
    setIsEditingUrl(false);
  };

  const handleResetToDefault = () => {
    setCustomImpositionUrl(null);
    const updated = getImpositionConfig();
    setConfig(updated);
    setCustomInputUrl(updated.url);
    setIsEditingUrl(false);
  };

  const handleLaunch = async () => {
    if (handoffPayload) {
      try {
        const res = await fetch('/api/handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: handoffPayload }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          console.warn('Server handoff creation error:', data);
        }
      } catch (err) {
        console.warn('Network error setting server-side handoff cookie:', err);
      }
    }

    // Launch inside the current browser window on the same host (never new tab, never localhost:5173)
    window.location.href = '/Impose/';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="imposition-launch-title"
        className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white"
      >
        {/* Modal Header */}
        <div className="p-6 bg-neutral-900/60 border-b border-neutral-800 flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-rose-500">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="imposition-launch-modal-title" className="text-xl font-black text-white">
                  ATS Impose
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Submodule Module
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Commercial Press Sheet &amp; Multi-Page Signature Layouts (MyDraw Engine)
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-imposition-modal-btn"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-neutral-900/40 border border-neutral-800/80 rounded-xl text-xs">
            <div>
              <span className="text-neutral-500 block font-mono text-[10px] uppercase">Engine</span>
              <strong className="text-neutral-200">MyDraw / ArtCraft</strong>
            </div>
            <div>
              <span className="text-neutral-500 block font-mono text-[10px] uppercase">Binding Modes</span>
              <strong className="text-neutral-200">Saddle &amp; Perfect</strong>
            </div>
            <div>
              <span className="text-neutral-500 block font-mono text-[10px] uppercase">Mark Types</span>
              <strong className="text-neutral-200">Crop, Fold, Collate</strong>
            </div>
            <div>
              <span className="text-neutral-500 block font-mono text-[10px] uppercase">File Format</span>
              <strong className="text-neutral-200">.ats &amp; .atst v1</strong>
            </div>
          </div>

          {/* Integrated Endpoint Mounting Status */}
          <div className="space-y-2 p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-1.5">
                <Settings className="w-3.5 h-3.5 text-rose-500" />
                <span>Integrated Application Route</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded border bg-emerald-950/40 text-emerald-300 border-emerald-800 font-bold">
                Same-Origin Mounted
              </span>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-white">/Impose/</span>
              <span className="text-neutral-500 font-mono text-[11px]">• Unified ATS Tech Host (No separate localhost port)</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              ATS Impose runs inside the current window at <code className="text-neutral-300">/Impose/</code> with shared authentication, unified navigation, and secure handoffs.
            </p>
          </div>

          {/* Hand-off Packet Preview (if provided) */}
          {handoffPayload && (
            <div className="space-y-3 p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Certified Handoff Contract (Schema 1.0)</span>
                </span>
                <button
                  type="button"
                  id="download-handoff-spec-btn"
                  onClick={() => downloadHandoffPacket(handoffPayload)}
                  className="inline-flex items-center space-x-1 text-[11px] font-mono text-rose-300 hover:text-white bg-rose-900/40 px-2.5 py-1 rounded border border-rose-800/60 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download .ats-job.json</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-neutral-300 pt-1">
                <div>
                  <span className="text-neutral-500 block">Document</span>
                  <span className="font-semibold text-white truncate block">{handoffPayload.document.title}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Trim Size</span>
                  <span className="font-semibold text-white">
                    {handoffPayload.document.trimWidthInches}&quot; × {handoffPayload.document.trimHeightInches}&quot;
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Estimated Signatures</span>
                  <span className="font-semibold text-white">
                    {handoffPayload.impositionIntent.estimatedSignaturesCount} × {handoffPayload.impositionIntent.pagesPerSignature}-up
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Security & Access Boundary Notice */}
          <div className="p-4 bg-neutral-900/40 border border-neutral-800 rounded-xl text-xs space-y-2">
            <div className="flex items-center space-x-2 text-rose-400 font-bold font-mono text-[11px] uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Independent Application Boundary</span>
            </div>
            <p className="text-neutral-300 leading-relaxed text-[11px]">
              ATS Impose operates as an autonomous, high-speed vector prepress engine. Session authentication and
              job handoffs are governed server-side via short-lived, single-use HttpOnly cookies scoped to <code className="text-rose-300">/Impose/</code>.
              To preserve prepress integrity, no tokens, passwords, signed URLs, or payloads are ever placed in query strings or URL fragments.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-neutral-900/80 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400 font-mono">
            Mounts in current window at <code className="text-rose-400 font-bold">/Impose/</code>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              id="cancel-imposition-launch-btn"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-semibold border border-neutral-800 transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              id="confirm-launch-imposition-btn"
              onClick={handleLaunch}
              disabled={!config.isConfigured}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.02] shadow-sm"
            >
              <span>Open ATS Impose</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
