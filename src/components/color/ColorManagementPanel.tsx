'use client';

import React, { useState, useRef } from 'react';
import {
  BookProject,
  PrintColorSettings,
  StandardCmykProfileId,
  CmykOutputProfileMetadata,
} from '@/types/book';
import {
  STANDARD_CMYK_PROFILES,
  DEFAULT_CMYK_PROFILE_ID,
  validateCustomIccProfile,
} from '@/services/cmyk/cmykProfiles';
import {
  Printer,
  ShieldAlert,
  CheckCircle2,
  Upload,
  Layers,
  Sparkles,
  Info,
  Sliders,
  Check,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

interface ColorManagementPanelProps {
  project: BookProject;
  onUpdateBook: (updatedFields: Partial<BookProject>) => void;
}

export const ColorManagementPanel: React.FC<ColorManagementPanelProps> = ({
  project,
  onUpdateBook,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const colorSettings: PrintColorSettings = {
    outputProfileId: project.colorSettings?.outputProfileId || DEFAULT_CMYK_PROFILE_ID,
    customProfile: project.colorSettings?.customProfile,
    blackHandling: project.colorSettings?.blackHandling || 'standard-text',
    overprintBlackText: project.colorSettings?.overprintBlackText ?? true,
    overprintBlackRules: project.colorSettings?.overprintBlackRules ?? true,
    maxTacPercent: project.colorSettings?.maxTacPercent || 300,
  };

  const handleUpdateColor = (updates: Partial<PrintColorSettings>) => {
    const updated = { ...colorSettings, ...updates };
    onUpdateBook({ colorSettings: updated });
  };

  const handleProfileSelect = (id: StandardCmykProfileId) => {
    let maxTac = 300;
    if (id === 'gracol') maxTac = 320;
    if (id === 'custom' && colorSettings.customProfile) {
      maxTac = colorSettings.customProfile.maxTacPercent || 320;
    }
    handleUpdateColor({
      outputProfileId: id,
      maxTacPercent: maxTac,
    });
  };

  const handleIccFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    try {
      const buffer = await file.arrayBuffer();
      const result = validateCustomIccProfile(buffer, file.name);

      if (!result.valid || !result.metadata) {
        setUploadError(result.error || 'Invalid ICC profile file.');
        return;
      }

      handleUpdateColor({
        outputProfileId: 'custom',
        customProfile: result.metadata,
        maxTacPercent: result.metadata.maxTacPercent,
      });

      setUploadSuccess(`Successfully loaded printer ICC profile: "${result.metadata.name}"`);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse ICC profile file.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6" data-testid="color-management-panel">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-xl text-white border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <Printer className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold">Print Color Management & Prepress</h3>
        </div>
        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
          Configure commercial press color profiles, 100K black separation rules, and PDF/X-4 overprint graphics states.
        </p>
      </div>

      {/* Printer ICC Priority Notice */}
      <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Commercial Printer ICC Priority</span>
          <p className="mt-0.5 text-amber-800 leading-normal">
            Always prioritize the specific ICC color profile provided by your book printer or bindery.
            If your printer has not supplied a custom profile, choose the standard matching your geographic press region below.
          </p>
        </div>
      </div>

      {/* Profile Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Output Intent / CMYK ICC Profile
          </label>
          <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
            Max TAC: {colorSettings.maxTacPercent}%
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* FOGRA39 */}
          <button
            type="button"
            onClick={() => handleProfileSelect('fogra39')}
            className={`p-3 text-left rounded-xl border transition-all ${
              colorSettings.outputProfileId === 'fogra39'
                ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                {STANDARD_CMYK_PROFILES.fogra39.name}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-medium">
                Default
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              {STANDARD_CMYK_PROFILES.fogra39.description}
            </p>
            <div className="flex items-center space-x-3 mt-2 text-[10px] text-slate-500 font-mono">
              <span>Standard: {STANDARD_CMYK_PROFILES.fogra39.standard}</span>
              <span>•</span>
              <span>TAC: 300%</span>
            </div>
          </button>

          {/* FOGRA51 */}
          <button
            type="button"
            onClick={() => handleProfileSelect('fogra51')}
            className={`p-3 text-left rounded-xl border transition-all ${
              colorSettings.outputProfileId === 'fogra51'
                ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                {STANDARD_CMYK_PROFILES.fogra51.name}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-medium">
                ISO 2013
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              {STANDARD_CMYK_PROFILES.fogra51.description}
            </p>
            <div className="flex items-center space-x-3 mt-2 text-[10px] text-slate-500 font-mono">
              <span>Standard: {STANDARD_CMYK_PROFILES.fogra51.standard}</span>
              <span>•</span>
              <span>TAC: 300%</span>
            </div>
          </button>

          {/* GRACoL */}
          <button
            type="button"
            onClick={() => handleProfileSelect('gracol')}
            className={`p-3 text-left rounded-xl border transition-all ${
              colorSettings.outputProfileId === 'gracol'
                ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                {STANDARD_CMYK_PROFILES.gracol.name}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-medium">
                North America
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              {STANDARD_CMYK_PROFILES.gracol.description}
            </p>
            <div className="flex items-center space-x-3 mt-2 text-[10px] text-slate-500 font-mono">
              <span>Standard: {STANDARD_CMYK_PROFILES.gracol.standard}</span>
              <span>•</span>
              <span>TAC: 320%</span>
            </div>
          </button>

          {/* Custom Upload Card */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              colorSettings.outputProfileId === 'custom'
                ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-500'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-xs text-slate-900">
                  Custom Printer ICC Profile
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".icc,.icm"
                onChange={handleIccFileUpload}
                className="hidden"
                id="upload-custom-icc-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
              >
                Upload .icc/.icm
              </button>
            </div>

            {colorSettings.customProfile ? (
              <div className="mt-2.5 p-2 bg-white/80 rounded border border-indigo-200 text-xs">
                <div className="flex items-center justify-between font-bold text-indigo-950">
                  <span>{colorSettings.customProfile.name}</span>
                  <span className="text-[10px] text-indigo-600 font-mono">Active</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Identifier: {colorSettings.customProfile.conditionIdentifier}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1.5">
                Upload a press calibration file provided by your printer (ICC.1 specification, CMYK output).
              </p>
            )}

            {uploadError && (
              <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800 flex items-start space-x-2">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-800 flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{uploadSuccess}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Black Separation & Handling */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Black Ink & Separation Strategy
        </label>

        <div className="space-y-2">
          {/* Standard 100K Text Black */}
          <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors bg-white">
            <input
              type="radio"
              name="blackHandlingMode"
              checked={colorSettings.blackHandling === 'standard-text'}
              onChange={() => handleUpdateColor({ blackHandling: 'standard-text' })}
              className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                Standard Text Black (C0 M0 Y0 K100)
              </span>
              <span className="text-slate-500 leading-relaxed block mt-0.5">
                Body text, headings, captions, and thin rules are strictly routed to the pure Black plate.
                Guarantees needle-sharp text without CMY misregistration or color halos on press. (Recommended).
              </span>
            </div>
          </label>

          {/* Rich Black for Backgrounds */}
          <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors bg-white">
            <input
              type="radio"
              name="blackHandlingMode"
              checked={colorSettings.blackHandling === 'rich-black-preset'}
              onChange={() => handleUpdateColor({ blackHandling: 'rich-black-preset' })}
              className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                Rich Black Preset (C60 M40 Y40 K100 — Backgrounds Only)
              </span>
              <span className="text-slate-500 leading-relaxed block mt-0.5">
                Generates a deep, luxurious 4-color black for large solid page background fills only (240% TAC).
                Body text and small rules remain protected on the pure 100K plate.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Overprint Settings */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          PDF Graphics State Overprint (/GS_OP)
        </label>

        <div className="space-y-2">
          {/* Overprint Text */}
          <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors bg-white">
            <input
              type="checkbox"
              id="overprint-black-text-toggle"
              checked={colorSettings.overprintBlackText}
              onChange={(e) => handleUpdateColor({ overprintBlackText: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                Overprint 100K Black Text (/OP true, /op true, /OPM 1)
              </span>
              <span className="text-slate-500 leading-relaxed block mt-0.5">
                Prints 100K black vector text directly over underlying ink separations without plate knockouts, eliminating white gaps during press paper shift.
              </span>
            </div>
          </label>

          {/* Overprint Rules */}
          <label className="flex items-start space-x-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors bg-white">
            <input
              type="checkbox"
              id="overprint-black-rules-toggle"
              checked={colorSettings.overprintBlackRules}
              onChange={(e) => handleUpdateColor({ overprintBlackRules: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">
                Overprint Thin Black Rules & Registration Marks
              </span>
              <span className="text-slate-500 leading-relaxed block mt-0.5">
                Enables overprint for crop marks and borders under 2 pt. White, colored, and background boxes are never overprinted.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Screen Preview Overprint Limitation Notice */}
      <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
        <div className="flex items-center space-x-2 font-bold text-slate-900">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Screen Proofing vs. Press Overprint</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          Browser rendering engines use RGB display composition and cannot accurately simulate press overprint separations.
          Always verify the exported print PDF using Adobe Acrobat Pro (Output Preview), Enfocus PitStop, or our automated prepress inspection tool.
        </p>
      </div>
    </div>
  );
};
