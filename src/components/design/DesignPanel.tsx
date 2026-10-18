'use client';

import React, { useRef } from 'react';
import { PageDesignSettings, BorderStyle, BackgroundImageSize } from '@/types/book';
import {
  Palette,
  Image as ImageIcon,
  Square,
  Type,
  RotateCcw,
  Upload,
  Trash2,
  Sliders,
  Check,
} from 'lucide-react';

interface DesignPanelProps {
  design: Partial<PageDesignSettings> | undefined;
  onUpdateDesign: (updated: Partial<PageDesignSettings>) => void;
  onResetDesign: () => void;
}

const PRESET_PALETTES: {
  name: string;
  bg: string;
  text: string;
  heading: string;
  borderEnabled?: boolean;
  borderColor?: string;
  borderStyle?: BorderStyle;
  borderInsetInches?: number;
}[] = [
  {
    name: 'Classic White',
    bg: '#ffffff',
    text: '#1e1e1e',
    heading: '#141414',
    borderEnabled: false,
  },
  {
    name: 'Warm Ivory',
    bg: '#fdfbf7',
    text: '#292524',
    heading: '#1c1917',
    borderEnabled: false,
  },
  {
    name: 'Antique Parchment',
    bg: '#faf5eb',
    text: '#3c3028',
    heading: '#2a201a',
    borderEnabled: true,
    borderColor: '#9a7b56',
    borderStyle: 'solid',
    borderInsetInches: 0.3,
  },
  {
    name: 'Modern Slate',
    bg: '#f8fafc',
    text: '#0f172a',
    heading: '#1e293b',
    borderEnabled: true,
    borderColor: '#cbd5e1',
    borderStyle: 'solid',
    borderInsetInches: 0.25,
  },
];

export const DesignPanel: React.FC<DesignPanelProps> = ({
  design = {},
  onUpdateDesign,
  onResetDesign,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentBg = design.backgroundColor || '#ffffff';
  const currentText = design.textColor || '#1e1e1e';
  const currentHeading = design.headingColor || '#141414';
  const currentHeaderFooter = design.headerFooterColor || '#5a5a5a';

  const borderEnabled = !!design.borderEnabled;
  const borderColor = design.borderColor || '#000000';
  const borderWidthPt = design.borderWidthPt ?? 1;
  const borderStyle: BorderStyle = design.borderStyle || 'solid';
  const borderRadiusPt = design.borderRadiusPt ?? 0;
  const borderInsetInches = design.borderInsetInches ?? 0.25;

  const bgImageSize: BackgroundImageSize = design.backgroundImageSize || 'cover';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/i)) {
      alert('Please upload a valid PNG, JPG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Background image must be smaller than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateDesign({
          ...design,
          backgroundImage: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeBackgroundImage = () => {
    const next = { ...design };
    delete next.backgroundImage;
    onUpdateDesign(next);
  };

  const applyPreset = (preset: typeof PRESET_PALETTES[0]) => {
    onUpdateDesign({
      ...design,
      backgroundColor: preset.bg,
      textColor: preset.text,
      headingColor: preset.heading,
      headerFooterColor: preset.text,
      borderEnabled: preset.borderEnabled ?? false,
      borderColor: preset.borderColor ?? borderColor,
      borderStyle: preset.borderStyle ?? borderStyle,
      borderInsetInches: preset.borderInsetInches ?? borderInsetInches,
    });
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Palette className="w-5 h-5 text-purple-600" />
            <span>Visual Design & Styling</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize page backgrounds, decorative inset borders, and typographic colors.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetDesign}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          title="Reset to template defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Preset Palettes */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Design Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESET_PALETTES.map((preset) => {
            const isMatch =
              currentBg.toLowerCase() === preset.bg.toLowerCase() &&
              borderEnabled === (preset.borderEnabled ?? false);

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                  isMatch
                    ? 'border-purple-600 ring-2 ring-purple-600/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className="w-full h-8 rounded-lg border border-slate-200 mb-2 flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: preset.bg }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: preset.heading }}
                  >
                    Aa
                  </span>
                  {preset.borderEnabled && (
                    <div
                      className="absolute inset-1 border pointer-events-none rounded-sm"
                      style={{ borderColor: preset.borderColor }}
                    />
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 1: Page Background Color */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Palette className="w-4 h-4 text-purple-600" />
          <span>Page Background Color</span>
        </h4>

        <div className="flex items-center space-x-4">
          <input
            type="color"
            value={currentBg}
            onChange={(e) => onUpdateDesign({ ...design, backgroundColor: e.target.value })}
            className="w-12 h-12 rounded-lg cursor-pointer border border-slate-300 p-1 bg-white"
          />
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Hex Color Code
            </label>
            <input
              type="text"
              value={currentBg}
              onChange={(e) => onUpdateDesign({ ...design, backgroundColor: e.target.value })}
              className="w-full sm:w-48 px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="#ffffff"
            />
          </div>
        </div>

        {/* Quick Swatches */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Quick swatches:</span>
          {['#ffffff', '#fdfbf7', '#fef9c3', '#fef3c7', '#f8fafc', '#f1f5f9'].map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => onUpdateDesign({ ...design, backgroundColor: hex })}
              className={`w-6 h-6 rounded-full border shadow-xs transition-transform hover:scale-110 ${
                currentBg.toLowerCase() === hex ? 'ring-2 ring-purple-600 ring-offset-1' : 'border-slate-300'
              }`}
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
      </div>

      {/* Section 2: Page Background Image */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <ImageIcon className="w-4 h-4 text-purple-600" />
          <span>Background Image / Texture</span>
        </h4>

        {design.backgroundImage ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div
                className="w-16 h-16 rounded-lg border border-slate-300 bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url(${design.backgroundImage})` }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">Background Image Active</p>
                <p className="text-[11px] text-slate-500">Will render behind manuscript pages</p>
                <button
                  type="button"
                  onClick={removeBackgroundImage}
                  className="mt-1.5 inline-flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Image</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Image Sizing Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['cover', 'contain', 'tile'] as BackgroundImageSize[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onUpdateDesign({ ...design, backgroundImageSize: mode })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold capitalize border transition-all ${
                      bgImageSize === mode
                        ? 'border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-purple-500 hover:bg-purple-50/20 transition-colors"
            >
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-800">
                Upload Background Image / Texture
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                PNG, JPG, or WebP up to 5 MB
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Section 3: Decorative Inset Border */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Square className="w-4 h-4 text-purple-600" />
            <span>Decorative Inset Border</span>
          </h4>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={borderEnabled}
              onChange={(e) => onUpdateDesign({ ...design, borderEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {borderEnabled && (
          <div className="space-y-4 pt-3 border-t border-slate-100">
            {/* Color & Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Border Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => onUpdateDesign({ ...design, borderColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={borderColor}
                    onChange={(e) => onUpdateDesign({ ...design, borderColor: e.target.value })}
                    className="w-28 px-2.5 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Border Style
                </label>
                <select
                  value={borderStyle}
                  onChange={(e) =>
                    onUpdateDesign({ ...design, borderStyle: e.target.value as BorderStyle })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none"
                >
                  <option value="solid">Solid Line</option>
                  <option value="dashed">Dashed Line</option>
                  <option value="dotted">Dotted Line</option>
                  <option value="double">Double Line</option>
                </select>
              </div>
            </div>

            {/* Width, Inset & Radius Sliders */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Border Width</span>
                  <span className="font-mono text-slate-500">{borderWidthPt} pt</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.5"
                  value={borderWidthPt}
                  onChange={(e) =>
                    onUpdateDesign({ ...design, borderWidthPt: parseFloat(e.target.value) })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Page Inset</span>
                  <span className="font-mono text-slate-500">{borderInsetInches} in</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.75"
                  step="0.05"
                  value={borderInsetInches}
                  onChange={(e) =>
                    onUpdateDesign({ ...design, borderInsetInches: parseFloat(e.target.value) })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Corner Radius</span>
                  <span className="font-mono text-slate-500">{borderRadiusPt} pt</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="2"
                  value={borderRadiusPt}
                  onChange={(e) =>
                    onUpdateDesign({ ...design, borderRadiusPt: parseFloat(e.target.value) })
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Typographic Color Palette */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Type className="w-4 h-4 text-purple-600" />
          <span>Typographic Colors</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Body Text
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={currentText}
                onChange={(e) => onUpdateDesign({ ...design, textColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={currentText}
                onChange={(e) => onUpdateDesign({ ...design, textColor: e.target.value })}
                className="w-full px-2 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chapter Headings
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={currentHeading}
                onChange={(e) => onUpdateDesign({ ...design, headingColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={currentHeading}
                onChange={(e) => onUpdateDesign({ ...design, headingColor: e.target.value })}
                className="w-full px-2 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Header & Footer
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={currentHeaderFooter}
                onChange={(e) => onUpdateDesign({ ...design, headerFooterColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={currentHeaderFooter}
                onChange={(e) => onUpdateDesign({ ...design, headerFooterColor: e.target.value })}
                className="w-full px-2 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
