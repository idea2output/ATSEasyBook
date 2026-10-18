'use client';

import React, { useState } from 'react';
import { BookImage, ImagePlacement, NormalizedCrop, PlacementMode } from '@/types/book';
import { getDefaultCrop, sanitizeCrop } from '@/services/images/imageService';
import {
  X,
  Crop as CropIcon,
  Maximize2,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  Sliders,
  AlignRight,
  AlignJustify,
  Minimize2,
  Sparkles,
} from 'lucide-react';

interface ImageInspectorProps {
  placement: ImagePlacement;
  images: BookImage[];
  onUpdatePlacement: (placementId: string, updates: Partial<ImagePlacement>) => void;
  onRemovePlacement: (placementId: string) => void;
  onClose: () => void;
}

export const ImageInspector: React.FC<ImageInspectorProps> = ({
  placement,
  images,
  onUpdatePlacement,
  onRemovePlacement,
  onClose,
}) => {
  const currentImage = images.find((img) => img.id === placement.imageId);
  const [isReplacing, setIsReplacing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'layout' | 'crop'>('layout');

  const crop = placement.crop || getDefaultCrop();

  const handleModeChange = (mode: PlacementMode) => {
    const updates: Partial<ImagePlacement> = { mode };
    // Auto-adjust default width when switching modes
    if (mode === 'float-right' && placement.widthPercent > 65) {
      updates.widthPercent = 45;
    } else if (mode === 'full-width') {
      updates.widthPercent = 100;
    }
    onUpdatePlacement(placement.id, updates);
  };

  const handleWidthChange = (val: number) => {
    const clamped = Math.max(15, Math.min(100, Math.round(val)));
    onUpdatePlacement(placement.id, { widthPercent: clamped });
  };

  const handleCropChange = (field: keyof NormalizedCrop, value: number) => {
    const updatedCrop = sanitizeCrop({
      ...crop,
      [field]: value / 100, // convert percentage 0..100 to 0..1
    });
    onUpdatePlacement(placement.id, { crop: updatedCrop });
  };

  const handleResetCrop = () => {
    onUpdatePlacement(placement.id, { crop: getDefaultCrop() });
  };

  const handleApplyPresetCrop = (type: 'center-square' | 'wide' | 'tall') => {
    if (!currentImage) return;
    if (type === 'center-square') {
      onUpdatePlacement(placement.id, {
        crop: sanitizeCrop({ x: 0.15, y: 0.15, width: 0.7, height: 0.7 }),
      });
    } else if (type === 'wide') {
      onUpdatePlacement(placement.id, {
        crop: sanitizeCrop({ x: 0, y: 0.2, width: 1, height: 0.6 }),
      });
    } else if (type === 'tall') {
      onUpdatePlacement(placement.id, {
        crop: sanitizeCrop({ x: 0.2, y: 0, width: 0.6, height: 1 }),
      });
    }
  };

  if (!currentImage) {
    return (
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-lg">
        <p className="text-xs text-rose-600">Referenced image was not found in the project library.</p>
        <button
          type="button"
          onClick={() => onRemovePlacement(placement.id)}
          className="mt-2 text-xs text-slate-600 underline"
        >
          Remove invalid placement
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="image-inspector"
      className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col text-xs"
    >
      {/* Inspector Header */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-xs">Image Placement Inspector</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Inspector"
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs: Layout & Sizing vs Visual Cropping */}
      <div className="flex border-b border-slate-200 bg-slate-50 text-[11px] font-semibold" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'layout'}
          onClick={() => setActiveTab('layout')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 ${
            activeTab === 'layout'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Placement & Size
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'crop'}
          onClick={() => setActiveTab('crop')}
          className={`flex-1 py-2 text-center transition-colors border-b-2 ${
            activeTab === 'crop'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Crop Tool
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[460px] overflow-y-auto">
        {activeTab === 'layout' ? (
          <>
            {/* Placement Mode */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Placement Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleModeChange('inline')}
                  aria-pressed={placement.mode === 'inline'}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    placement.mode === 'inline'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-1 ring-indigo-500'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <AlignJustify className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                  <span>Inline</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('full-width')}
                  aria-pressed={placement.mode === 'full-width'}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    placement.mode === 'full-width'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-1 ring-indigo-500'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <Maximize2 className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                  <span>Full-width</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange('float-right')}
                  aria-pressed={placement.mode === 'float-right'}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    placement.mode === 'float-right'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-1 ring-indigo-500'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <AlignRight className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                  <span>Float Right</span>
                </button>
              </div>
            </div>

            {/* Resize Slider & Aspect Ratio Lock */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  Display Width (% of text area)
                </span>
                <span className="font-mono font-bold text-indigo-600 text-xs">
                  {placement.widthPercent}%
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={placement.widthPercent}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  aria-label="Image width percentage"
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePlacement(placement.id, {
                      aspectRatioLocked: !placement.aspectRatioLocked,
                    })
                  }
                  className="flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 font-medium"
                >
                  {placement.aspectRatioLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Aspect Ratio Locked</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-amber-800 font-semibold">Aspect Ratio Free</span>
                    </>
                  )}
                </button>

                <div className="space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleWidthChange(35)}
                    className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-100"
                  >
                    35%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWidthChange(50)}
                    className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-100"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWidthChange(100)}
                    className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-100"
                  >
                    100%
                  </button>
                </div>
              </div>
            </div>

            {/* Editable Caption */}
            <div>
              <label htmlFor="inspector-caption-input" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Figure Caption (Displayed under image in preview)
              </label>
              <input
                id="inspector-caption-input"
                type="text"
                value={placement.caption || ''}
                onChange={(e) => onUpdatePlacement(placement.id, { caption: e.target.value })}
                placeholder="e.g. Figure 1: The flagship setting sail into Eldridge Harbor."
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-normal"
              />
            </div>

            {/* Replace Image Source */}
            <div className="pt-1">
              {isReplacing ? (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                  <span className="block font-bold text-indigo-900 text-xs">
                    Select Replacement Image from Library:
                  </span>
                  <select
                    value={placement.imageId}
                    onChange={(e) => {
                      onUpdatePlacement(placement.id, { imageId: e.target.value });
                      setIsReplacing(false);
                    }}
                    className="w-full p-1.5 bg-white border border-indigo-300 rounded text-xs text-slate-800"
                  >
                    {images.map((img) => (
                      <option key={img.id} value={img.id}>
                        {img.filename} ({img.width} × {img.height} px)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsReplacing(false)}
                    className="text-xs text-slate-500 underline"
                  >
                    Cancel replacement
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsReplacing(true)}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace Source Image (Keep placement & crop)</span>
                </button>
              )}
            </div>
          </>
        ) : (
          /* Visual Crop Tab */
          <div className="space-y-4">
            {/* Visual Crop Preview Canvas */}
            <div className="relative aspect-video w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
              {/* Full ghost original image */}
              <img
                src={currentImage.dataUrl}
                alt={currentImage.altText}
                className="w-full h-full object-contain opacity-35"
              />

              {/* Cropped viewing highlight */}
              <div
                className="absolute border-2 border-amber-400 bg-amber-400/20 shadow-md transition-all pointer-events-none"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.width * 100}%`,
                  height: `${crop.height * 100}%`,
                }}
              >
                <div className="absolute top-1 left-1 px-1 bg-amber-400 text-slate-950 font-bold text-[9px] rounded">
                  Crop Area
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPresetCrop('center-square')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] text-slate-700 font-medium"
              >
                Center Square (1:1)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetCrop('wide')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] text-slate-700 font-medium"
              >
                Cinematic (16:9)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetCrop('tall')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] text-slate-700 font-medium"
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={handleResetCrop}
                className="px-2 py-1 text-indigo-600 hover:bg-indigo-50 rounded text-[11px] font-bold"
              >
                Reset (100%)
              </button>
            </div>

            {/* Fine Crop Sliders */}
            <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Left Offset (X)</span>
                    <span className="font-mono">{Math.round(crop.x * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={Math.round(crop.x * 100)}
                    onChange={(e) => handleCropChange('x', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Top Offset (Y)</span>
                    <span className="font-mono">{Math.round(crop.y * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={Math.round(crop.y * 100)}
                    onChange={(e) => handleCropChange('y', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Crop Width</span>
                    <span className="font-mono">{Math.round(crop.width * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round(crop.width * 100)}
                    onChange={(e) => handleCropChange('width', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Crop Height</span>
                    <span className="font-mono">{Math.round(crop.height * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round(crop.height * 100)}
                    onChange={(e) => handleCropChange('height', Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inspector Footer Actions */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onRemovePlacement(placement.id)}
          className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors flex items-center space-x-1 font-semibold"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove from Book (Keep in Library)</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded text-xs font-semibold shadow-xs"
        >
          Done
        </button>
      </div>
    </div>
  );
};
