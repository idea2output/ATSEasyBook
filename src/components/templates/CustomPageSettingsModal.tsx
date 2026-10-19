'use client';

import React, { useState, useMemo } from 'react';
import {
  BookTemplate,
  TemplateUnit,
  PageDesignSettings,
  BorderStyle,
  BackgroundImageSize,
} from '@/types/book';
import {
  convertUnits,
  fromInches,
  toInches,
  formatUnit,
  validatePageGeometry,
} from '@/services/templates/geometryValidator';
import {
  Sliders,
  X,
  Check,
  AlertTriangle,
  AlertCircle,
  Bookmark,
  Layers,
  Sparkles,
  Maximize2,
  Columns as ColumnsIcon,
  Palette,
  Type,
  ShieldAlert,
} from 'lucide-react';

interface CustomPageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplate: BookTemplate;
  onApplyCustomPage: (customTemplate: BookTemplate) => void;
  onSaveAsTemplate?: (customTemplate: BookTemplate) => void;
}

export const CustomPageSettingsModal: React.FC<CustomPageSettingsModalProps> = ({
  isOpen,
  onClose,
  currentTemplate,
  onApplyCustomPage,
  onSaveAsTemplate,
}) => {
  const [unit, setUnit] = useState<TemplateUnit>(currentTemplate.unit || 'in');

  // Page Dimensions (stored internally in inches)
  const [pageWidth, setPageWidth] = useState<number>(currentTemplate.pageWidthInches);
  const [pageHeight, setPageHeight] = useState<number>(currentTemplate.pageHeightInches);
  const [bleed, setBleed] = useState<number>(currentTemplate.bleedInches ?? 0.125);
  const [safeArea, setSafeArea] = useState<number>(currentTemplate.safeAreaInches ?? 0.25);

  // Margins (in inches)
  const [topMargin, setTopMargin] = useState<number>(currentTemplate.margins.topInches);
  const [bottomMargin, setBottomMargin] = useState<number>(currentTemplate.margins.bottomInches);
  const [insideMargin, setInsideMargin] = useState<number>(currentTemplate.margins.insideInches);
  const [outsideMargin, setOutsideMargin] = useState<number>(currentTemplate.margins.outsideInches);
  const [gutter, setGutter] = useState<number>(currentTemplate.margins.gutterInches ?? 0.125);

  // Columns
  const [columnCount, setColumnCount] = useState<1 | 2>(currentTemplate.columns.count);
  const [columnGap, setColumnGap] = useState<number>(currentTemplate.columns.gapInches ?? 0.25);

  // Headers & Footers
  const [showHeaders, setShowHeaders] = useState<boolean>(currentTemplate.headersFooters.showRunningHeaders);
  const [showFooters, setShowFooters] = useState<boolean>(currentTemplate.headersFooters.showPageNumbers);
  const [pageNumberPos, setPageNumberPos] = useState<'bottom-center' | 'bottom-outside' | 'top-outside'>(
    currentTemplate.headersFooters.pageNumberPosition
  );
  const [runningHeaderFormat, setRunningHeaderFormat] = useState<'title-chapter' | 'author-title' | 'none'>(
    currentTemplate.headersFooters.runningHeaderFormat
  );

  // Chapter behavior
  const [chapterOpening, setChapterOpening] = useState<'always-new-page' | 'recto-only'>('always-new-page');

  // Typography defaults
  const [bodyFont, setBodyFont] = useState<string>(currentTemplate.typography.fontFamily);
  const [bodyFontSize, setBodyFontSize] = useState<number>(currentTemplate.typography.bodyFontSizePt);
  const [bodyLineHeight, setBodyLineHeight] = useState<number>(currentTemplate.typography.bodyLineHeight);
  const [headingFont, setHeadingFont] = useState<string>(currentTemplate.typography.headingStyle.fontFamily);
  const [headingFontSize, setHeadingFontSize] = useState<number>(currentTemplate.typography.chapterHeadingFontSizePt);
  const [textAlign, setTextAlign] = useState<'left' | 'justify'>(currentTemplate.typography.textAlign);

  // Background & Borders
  const [backgroundColor, setBackgroundColor] = useState<string>(
    currentTemplate.design?.backgroundColor || '#ffffff'
  );
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>(
    currentTemplate.design?.backgroundImageUrl || currentTemplate.design?.backgroundImage || ''
  );
  const [backgroundImageSize, setBackgroundImageSize] = useState<BackgroundImageSize>(
    currentTemplate.design?.backgroundImageSize || 'cover'
  );
  const [borderEnabled, setBorderEnabled] = useState<boolean>(
    currentTemplate.design?.borderEnabled || false
  );
  const [borderColor, setBorderColor] = useState<string>(
    currentTemplate.design?.borderColor || '#cbd5e1'
  );
  const [borderWidthPt, setBorderWidthPt] = useState<number>(
    currentTemplate.design?.borderWidthPt || 1
  );
  const [borderStyle, setBorderStyle] = useState<BorderStyle>(
    currentTemplate.design?.borderStyle || 'solid'
  );
  const [borderRadiusPt, setBorderRadiusPt] = useState<number>(
    currentTemplate.design?.borderRadiusPt || 0
  );
  const [borderInset, setBorderInset] = useState<number>(
    currentTemplate.design?.borderInsetInches ?? 0.35
  );

  // Colors
  const [textColor, setTextColor] = useState<string>(currentTemplate.design?.textColor || '#0f172a');
  const [headingColor, setHeadingColor] = useState<string>(currentTemplate.design?.headingColor || '#1e293b');
  const [headerFooterColor, setHeaderFooterColor] = useState<string>(
    currentTemplate.design?.headerFooterColor || '#64748b'
  );

  // Active settings tab
  const [activeTab, setActiveTab] = useState<'geometry' | 'margins' | 'typography' | 'design'>('geometry');

  // Continuous Geometry Validation
  const validation = useMemo(() => {
    return validatePageGeometry({
      pageWidthInches: pageWidth,
      pageHeightInches: pageHeight,
      bleedInches: bleed,
      safeAreaInches: safeArea,
      margins: {
        topInches: topMargin,
        bottomInches: bottomMargin,
        insideInches: insideMargin,
        outsideInches: outsideMargin,
        gutterInches: gutter,
      },
      columns: {
        count: columnCount,
        gapInches: columnGap,
      },
    });
  }, [pageWidth, pageHeight, bleed, safeArea, topMargin, bottomMargin, insideMargin, outsideMargin, gutter, columnCount, columnGap]);

  if (!isOpen) return null;

  // Convert display values based on active unit
  const displayVal = (inchesVal: number) => {
    const converted = fromInches(inchesVal, unit);
    return Number(converted.toFixed(unit === 'mm' ? 1 : unit === 'pt' ? 0 : 3));
  };

  const handleUnitChange = (newUnit: TemplateUnit) => {
    setUnit(newUnit);
  };

  const handleApply = () => {
    if (!validation.isValid) return;

    const updatedTemplate: BookTemplate = {
      ...currentTemplate,
      id: currentTemplate.isCustom ? currentTemplate.id : 'custom-page-template',
      name: currentTemplate.isCustom ? currentTemplate.name : 'Custom Page',
      isCustom: true,
      unit,
      pageWidthInches: pageWidth,
      pageHeightInches: pageHeight,
      bleedInches: bleed,
      safeAreaInches: safeArea,
      margins: {
        top: `${topMargin}in`,
        bottom: `${bottomMargin}in`,
        inside: `${insideMargin}in`,
        outside: `${outsideMargin}in`,
        gutter: `${gutter}in`,
        topInches: topMargin,
        bottomInches: bottomMargin,
        insideInches: insideMargin,
        outsideInches: outsideMargin,
        gutterInches: gutter,
      },
      columns: {
        count: columnCount,
        gap: `${columnGap}in`,
        gapInches: columnGap,
      },
      headersFooters: {
        showRunningHeaders: showHeaders,
        showPageNumbers: showFooters,
        pageNumberPosition: pageNumberPos,
        runningHeaderFormat: runningHeaderFormat,
      },
      typography: {
        ...currentTemplate.typography,
        fontFamily: bodyFont,
        bodyFontSizePt: bodyFontSize,
        bodyLineHeight: bodyLineHeight,
        chapterHeadingFontSizePt: headingFontSize,
        textAlign,
        headingStyle: {
          ...currentTemplate.typography.headingStyle,
          fontFamily: headingFont,
          fontSizePt: headingFontSize,
        },
      },
      design: {
        ...(currentTemplate.design || {}),
        backgroundColor,
        backgroundImage: backgroundImageUrl || undefined,
        backgroundImageUrl: backgroundImageUrl || undefined,
        backgroundImageSize,
        borderEnabled,
        borderColor,
        borderWidthPt,
        borderStyle,
        borderRadiusPt,
        borderInsetInches: borderInset,
        textColor,
        headingColor,
        headerFooterColor,
      },
    };

    onApplyCustomPage(updatedTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-page-modal-title"
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[92vh] border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="custom-page-modal-title" className="text-base font-bold text-slate-900">
                Custom Page Geometry & Layout Settings
              </h2>
              <p className="text-xs text-slate-500">
                Continuous physical prepress validation for custom book trim and margins.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Unit Selector */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              {(['in', 'mm', 'pt'] as TemplateUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUnitChange(u)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    unit === u
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {u.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/50 px-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('geometry')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'geometry'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Trim & Bleed</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('margins')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'margins'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ColumnsIcon className="w-3.5 h-3.5" />
            <span>Margins & Columns</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('typography')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'typography'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Typography & Headers</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('design')}
            className={`py-3 px-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'design'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Background & Borders</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Continuous Validation Alert */}
          {!validation.isValid ? (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Invalid Page Geometry</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {validation.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : validation.warnings.length > 0 ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Geometry Notice</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {validation.warnings.map((warn, idx) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Geometry is prepress valid. Usable text area: {(pageWidth - insideMargin - outsideMargin - gutter).toFixed(2)}&quot; × {(pageHeight - topMargin - bottomMargin).toFixed(2)}&quot;</span>
            </div>
          )}

          {/* TAB 1: TRIM & BLEED */}
          {activeTab === 'geometry' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="custom-width-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Trim Width ({unit})
                  </label>
                  <input
                    id="custom-width-input"
                    type="number"
                    step={unit === 'mm' ? 1 : 0.125}
                    min={1}
                    value={displayVal(pageWidth)}
                    onChange={(e) => setPageWidth(toInches(parseFloat(e.target.value) || 0, unit))}
                    className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Standard: 6.0&quot; (152.4mm) or 5.5&quot; (139.7mm)</p>
                </div>

                <div>
                  <label htmlFor="custom-height-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Trim Height ({unit})
                  </label>
                  <input
                    id="custom-height-input"
                    type="number"
                    step={unit === 'mm' ? 1 : 0.125}
                    min={1}
                    value={displayVal(pageHeight)}
                    onChange={(e) => setPageHeight(toInches(parseFloat(e.target.value) || 0, unit))}
                    className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Standard: 9.0&quot; (228.6mm) or 8.5&quot; (215.9mm)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label htmlFor="custom-bleed-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Bleed Allowance ({unit})
                  </label>
                  <input
                    id="custom-bleed-input"
                    type="number"
                    step={unit === 'mm' ? 0.5 : 0.025}
                    min={0}
                    value={displayVal(bleed)}
                    onChange={(e) => setBleed(toInches(parseFloat(e.target.value) || 0, unit))}
                    className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Commercial default: 0.125&quot; (3.175mm / 9pt)</p>
                </div>

                <div>
                  <label htmlFor="custom-safearea-input" className="block text-xs font-semibold text-slate-700 mb-1">
                    Safe Area Margin ({unit})
                  </label>
                  <input
                    id="custom-safearea-input"
                    type="number"
                    step={unit === 'mm' ? 0.5 : 0.05}
                    min={0}
                    value={displayVal(safeArea)}
                    onChange={(e) => setSafeArea(toInches(parseFloat(e.target.value) || 0, unit))}
                    className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Keep essential content inside this boundary</p>
                </div>
              </div>

              {/* Standard presets quick buttons */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Presets:</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {[
                    { label: '6 × 9 Trade', w: 6.0, h: 9.0 },
                    { label: '5.5 × 8.5 Digest', w: 5.5, h: 8.5 },
                    { label: '5 × 8 Pocket', w: 5.0, h: 8.0 },
                    { label: '8 × 10 Photo', w: 8.0, h: 10.0 },
                    { label: '8.5 × 11 Letter', w: 8.5, h: 11.0 },
                    { label: 'A4 (210 × 297mm)', w: 8.27, h: 11.69 },
                    { label: 'A5 (148 × 210mm)', w: 5.83, h: 8.27 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setPageWidth(p.w);
                        setPageHeight(p.h);
                      }}
                      className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MARGINS & COLUMNS */}
          {activeTab === 'margins' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="custom-margin-inside" className="block text-xs font-semibold text-slate-700 mb-1">
                    Inside (Binding) ({unit})
                  </label>
                  <input
                    id="custom-margin-inside"
                    type="number"
                    step={0.05}
                    value={displayVal(insideMargin)}
                    onChange={(e) => setInsideMargin(toInches(parseFloat(e.target.value) || 0, unit))}
                    className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="custom-margin-outside" className="block text-xs font-semibold text-slate-700 mb-1">
                    Outside ({unit})
                  </label>
                  <input
                    id="custom-margin-outside"
                    type="number"
                    step={0.05}
                    value={displayVal(outsideMargin)}
                    onChange={(e) => setOutsideMargin(toInches(parseFloat(e.target.value) || 0, unit))}
                    className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="custom-margin-gutter" className="block text-xs font-semibold text-slate-700 mb-1">
                    Gutter Allowance ({unit})
                  </label>
                  <input
                    id="custom-margin-gutter"
                    type="number"
                    step={0.025}
                    value={displayVal(gutter)}
                    onChange={(e) => setGutter(toInches(parseFloat(e.target.value) || 0, unit))}
                    className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="custom-margin-top" className="block text-xs font-semibold text-slate-700 mb-1">
                    Top Margin ({unit})
                  </label>
                  <input
                    id="custom-margin-top"
                    type="number"
                    step={0.05}
                    value={displayVal(topMargin)}
                    onChange={(e) => setTopMargin(toInches(parseFloat(e.target.value) || 0, unit))}
                    className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="custom-margin-bottom" className="block text-xs font-semibold text-slate-700 mb-1">
                    Bottom Margin ({unit})
                  </label>
                  <input
                    id="custom-margin-bottom"
                    type="number"
                    step={0.05}
                    value={displayVal(bottomMargin)}
                    onChange={(e) => setBottomMargin(toInches(parseFloat(e.target.value) || 0, unit))}
                    className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Columns */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Columns</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Column Count</label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setColumnCount(1)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          columnCount === 1
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        1 Column (Novels / Trade)
                      </button>
                      <button
                        type="button"
                        onClick={() => setColumnCount(2)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          columnCount === 2
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        2 Columns (Reports / Mag)
                      </button>
                    </div>
                  </div>

                  {columnCount === 2 && (
                    <div>
                      <label htmlFor="custom-col-gap" className="block text-xs font-medium text-slate-700 mb-1">
                        Column Gutter Gap ({unit})
                      </label>
                      <input
                        id="custom-col-gap"
                        type="number"
                        step={0.05}
                        min={0.05}
                        value={displayVal(columnGap)}
                        onChange={(e) => setColumnGap(toInches(parseFloat(e.target.value) || 0, unit))}
                        className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TYPOGRAPHY & HEADERS */}
          {activeTab === 'typography' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="custom-body-font" className="block text-xs font-medium text-slate-700 mb-1">
                    Body Font Family
                  </label>
                  <select
                    id="custom-body-font"
                    value={bodyFont}
                    onChange={(e) => setBodyFont(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value='Georgia, Cambria, "Times New Roman", serif'>Georgia (Serif)</option>
                    <option value='Garamond, "EB Garamond", serif'>Garamond (Editorial Serif)</option>
                    <option value='"Baskerville", "Libre Baskerville", serif'>Baskerville (Literary)</option>
                    <option value='system-ui, -apple-system, sans-serif'>System Sans-Serif</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="custom-body-size" className="block text-xs font-medium text-slate-700 mb-1">
                    Body Font Size (pt)
                  </label>
                  <input
                    id="custom-body-size"
                    type="number"
                    step={0.5}
                    min={8}
                    max={18}
                    value={bodyFontSize}
                    onChange={(e) => setBodyFontSize(parseFloat(e.target.value) || 10.5)}
                    className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Running Headers & Page Numbers */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Headers & Footers</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showHeaders}
                        onChange={(e) => setShowHeaders(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Enable Running Headers</span>
                    </label>

                    {showHeaders && (
                      <select
                        value={runningHeaderFormat}
                        onChange={(e) => setRunningHeaderFormat(e.target.value as any)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                      >
                        <option value="title-chapter">Book Title / Chapter Title</option>
                        <option value="author-title">Author Name / Book Title</option>
                        <option value="none">Blank</option>
                      </select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFooters}
                        onChange={(e) => setShowFooters(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Enable Page Numbers</span>
                    </label>

                    {showFooters && (
                      <select
                        value={pageNumberPos}
                        onChange={(e) => setPageNumberPos(e.target.value as any)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
                      >
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-outside">Bottom Outside Edge</option>
                        <option value="top-outside">Top Outside Edge</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKGROUND & BORDERS */}
          {activeTab === 'design' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="custom-bg-color" className="block text-xs font-medium text-slate-700 mb-1">
                    Page Background Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="custom-bg-color"
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 text-xs font-mono border border-slate-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="custom-text-color" className="block text-xs font-medium text-slate-700 mb-1">
                    Body Text Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="custom-text-color"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1 text-xs font-mono border border-slate-300 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                </div>
              </div>

              {/* Decorative Border */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Decorative Inset Border</h4>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={borderEnabled}
                      onChange={(e) => setBorderEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Enable Border</span>
                  </label>
                </div>

                {borderEnabled && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Color</label>
                      <input
                        type="color"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="w-full h-8 p-0.5 rounded border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Width (pt)</label>
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={borderWidthPt}
                        onChange={(e) => setBorderWidthPt(parseFloat(e.target.value) || 1)}
                        className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Style</label>
                      <select
                        value={borderStyle}
                        onChange={(e) => setBorderStyle(e.target.value as any)}
                        className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1"
                      >
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="double">Double</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Inset ({unit})</label>
                      <input
                        type="number"
                        step={0.05}
                        value={displayVal(borderInset)}
                        onChange={(e) => setBorderInset(toInches(parseFloat(e.target.value) || 0, unit))}
                        className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500">
            {formatUnit(pageWidth, unit)} × {formatUnit(pageHeight, unit)} • {columnCount}-Column
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              id="apply-custom-page-btn"
              disabled={!validation.isValid}
              onClick={handleApply}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Custom Page</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
