'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  BookTemplate,
  TemplateLayer,
  TemplateLayerType,
  ContentZone,
  ContentZoneType,
  TemplateStatus,
  TemplateVisibility,
  TemplateUnit,
} from '@/types/book';
import { UserProfile } from '@/types/auth';
import { templateRepository } from '@/services/templates/templateRepository';
import { authService } from '@/services/cloud/authService';
import { formatUnit, toInches, fromInches } from '@/services/templates/geometryValidator';
import {
  ShieldCheck,
  Layers,
  Square,
  Minus,
  Circle,
  Type,
  Image as ImageIcon,
  Hash,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Plus,
  Save,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Grid,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Columns,
  RotateCw,
  FolderLock,
  Sparkles,
  Info,
} from 'lucide-react';

interface AdminTemplateEditorProps {
  initialTemplate?: BookTemplate;
  onBack?: () => void;
  onSaved?: (savedTemplate: BookTemplate) => void;
}

export const AdminTemplateEditor: React.FC<AdminTemplateEditorProps> = ({
  initialTemplate,
  onBack,
  onSaved,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Template State
  const [template, setTemplate] = useState<BookTemplate>(() => {
    if (initialTemplate) {
      return templateRepository.migrateTemplate(initialTemplate);
    }
    const base = templateRepository.getTemplateById('classic-novel-6x9');
    return {
      ...base,
      id: `org-tmpl-${Date.now()}`,
      name: 'New Organization Master Template',
      description: 'Standardized layout governed by organization administration.',
      isCustom: true,
      governance: {
        status: 'draft',
        visibility: 'organization',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      layers: [],
      contentZones: [
        {
          id: 'primary-flowing-text-zone',
          name: 'Primary Text Flow',
          type: 'flowing-text',
          xInches: 0.85,
          yInches: 0.85,
          widthInches: 4.5,
          heightInches: 7.3,
          columns: 1,
          mirrorOnVerso: true,
        },
      ],
    };
  });

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<'recto' | 'verso'>('recto');
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<'select' | 'zone' | 'layer'>('select');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUserSync();
    setCurrentUser(user);
    if (user && template.governance) {
      setTemplate((prev) => ({
        ...prev,
        governance: {
          ...prev.governance!,
          organizationId: user.organizationName,
          ownerId: user.id,
          authorName: user.displayName,
        },
      }));
    }
  }, []);

  const isAdmin = currentUser?.role === 'administrator' || currentUser?.role === 'owner';
  const isVerso = activeSide === 'verso';

  const layers = template.layers || [];
  const contentZones = template.contentZones || [];

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  const selectedZone = contentZones.find((z) => z.id === selectedZoneId);

  // Canvas Dimensions in CSS Pixels (1 inch = 96 CSS px for editing canvas)
  const DPI = 96;
  const canvasWidthPx = template.pageWidthInches * DPI;
  const canvasHeightPx = template.pageHeightInches * DPI;
  const bleedPx = (template.bleedInches || 0.125) * DPI;
  const safePx = (template.safeAreaInches || 0.25) * DPI;

  // Add Layer Helper
  const handleAddLayer = (type: TemplateLayerType) => {
    const newId = `layer-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    let newLayer: TemplateLayer = {
      id: newId,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Layer`,
      type,
      xInches: 1.0,
      yInches: 1.0,
      widthInches: type === 'line' ? 4.0 : 2.5,
      heightInches: type === 'line' ? 0.05 : 1.5,
      zIndex: layers.length + 1,
      locked: false,
      visible: true,
      mirrorOnVerso: true,
      fillColor: type === 'solid' ? '#e2e8f0' : type === 'shape' ? '#f1f5f9' : undefined,
      strokeColor: '#94a3b8',
      strokeWidthPt: type === 'line' ? 1.5 : 1,
      strokeStyle: 'solid',
      opacity: 1,
    };

    if (type === 'text') {
      newLayer = {
        ...newLayer,
        text: 'EDITORIAL HEADER / LABEL',
        fontFamily: 'system-ui, sans-serif',
        fontSizePt: 9,
        textColor: '#64748b',
        heightInches: 0.4,
        textAlign: 'left',
      };
    } else if (type === 'page-number') {
      newLayer = {
        ...newLayer,
        name: 'Fixed Page Number',
        widthInches: 1.0,
        heightInches: 0.35,
        yInches: template.pageHeightInches - 0.7,
        xInches: (template.pageWidthInches - 1.0) / 2,
        textColor: '#64748b',
        fontSizePt: 9,
      };
    } else if (type === 'image') {
      newLayer = {
        ...newLayer,
        name: 'Brand Logo / Asset',
        widthInches: 1.8,
        heightInches: 1.2,
        imageFit: 'contain',
      };
    } else if (type === 'shape') {
      newLayer = {
        ...newLayer,
        borderRadiusPt: 9999, // circle/pill
      };
    }

    setTemplate((prev) => ({
      ...prev,
      layers: [...(prev.layers || []), newLayer],
    }));
    setSelectedLayerId(newId);
    setSelectedZoneId(null);
  };

  // Add Content Zone Helper
  const handleAddZone = (type: ContentZoneType) => {
    const newId = `zone-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newZone: ContentZone = {
      id: newId,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Zone`,
      type,
      xInches: 0.85,
      yInches: type === 'header' ? 0.4 : type === 'footer' ? template.pageHeightInches - 0.6 : 1.5,
      widthInches: template.pageWidthInches - 1.7,
      heightInches: type === 'header' || type === 'footer' ? 0.35 : 4.0,
      columns: 1,
      mirrorOnVerso: true,
    };

    setTemplate((prev) => ({
      ...prev,
      contentZones: [...(prev.contentZones || []), newZone],
    }));
    setSelectedZoneId(newId);
    setSelectedLayerId(null);
  };

  const handleUpdateLayer = (layerId: string, updates: Partial<TemplateLayer>) => {
    setTemplate((prev) => ({
      ...prev,
      layers: (prev.layers || []).map((l) => (l.id === layerId ? { ...l, ...updates } : l)),
    }));
  };

  const handleUpdateZone = (zoneId: string, updates: Partial<ContentZone>) => {
    setTemplate((prev) => ({
      ...prev,
      contentZones: (prev.contentZones || []).map((z) => (z.id === zoneId ? { ...z, ...updates } : z)),
    }));
  };

  const handleDeleteLayer = (layerId: string) => {
    setTemplate((prev) => ({
      ...prev,
      layers: (prev.layers || []).filter((l) => l.id !== layerId),
    }));
    if (selectedLayerId === layerId) setSelectedLayerId(null);
  };

  const handleDeleteZone = (zoneId: string) => {
    setTemplate((prev) => ({
      ...prev,
      contentZones: (prev.contentZones || []).filter((z) => z.id !== zoneId),
    }));
    if (selectedZoneId === zoneId) setSelectedZoneId(null);
  };

  const handleDuplicateLayer = (layerId: string) => {
    const target = layers.find((l) => l.id === layerId);
    if (!target) return;
    const cloned: TemplateLayer = {
      ...JSON.parse(JSON.stringify(target)),
      id: `layer-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: `${target.name} (Copy)`,
      xInches: target.xInches + 0.25,
      yInches: target.yInches + 0.25,
      zIndex: layers.length + 1,
    };
    setTemplate((prev) => ({
      ...prev,
      layers: [...(prev.layers || []), cloned],
    }));
    setSelectedLayerId(cloned.id);
  };

  const handleSave = async (publishStatus?: TemplateStatus) => {
    try {
      setIsSaving(true);
      const targetGov: any = {
        ...(template.governance || {}),
        status: publishStatus || template.governance?.status || 'draft',
        updatedAt: new Date().toISOString(),
      };

      const updatedTemplate: BookTemplate = {
        ...template,
        governance: targetGov,
      };

      const saved = await templateRepository.saveCustomTemplate(updatedTemplate, currentUser);
      setTemplate(saved);
      setFeedback(`Template "${saved.name}" successfully ${publishStatus === 'published' ? 'published' : 'saved'}.`);
      if (onSaved) onSaved(saved);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      console.error(err);
      setFeedback(err.message || 'Failed to save template.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 z-20 shrink-0">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Return"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  className="bg-transparent font-bold text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-1.5 py-0.5"
                />
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    template.governance?.status === 'published'
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                      : 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                  }`}
                >
                  {template.governance?.status || 'draft'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">v{template.governance?.version || 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Canvas Tools */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
          {/* Recto / Verso Spread Toggle */}
          <div className="flex items-center space-x-1 border-r border-slate-800 pr-2">
            <button
              type="button"
              onClick={() => setActiveSide('verso')}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                activeSide === 'verso' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Verso (Left)
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('recto')}
              className={`px-2 py-1 text-xs font-semibold rounded ${
                activeSide === 'recto' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Recto (Right)
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center space-x-1 pl-1">
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-slate-400 w-10 text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.min(2.0, Number((z + 0.1).toFixed(1))))}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid Snap & Guides Toggle */}
          <div className="flex items-center space-x-1 border-l border-slate-800 pl-2">
            <button
              type="button"
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-1.5 rounded transition-colors ${
                snapToGrid ? 'bg-slate-800 text-purple-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Snap to Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowGuides(!showGuides)}
              className={`p-1.5 rounded transition-colors ${
                showGuides ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Show Guides (Bleed, Trim, Safe Area)"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Actions: Save & Publish */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            id="admin-save-draft-btn"
            disabled={isSaving}
            onClick={() => handleSave('draft')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            id="admin-publish-template-btn"
            disabled={isSaving}
            onClick={() => handleSave('published')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Publish Template</span>
          </button>
        </div>
      </header>

      {/* Feedback Banner */}
      {feedback && (
        <div className="bg-purple-950/80 border-b border-purple-800 text-purple-200 text-xs px-4 py-2 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-purple-400 hover:text-white font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace: Left Tool Shelf, Center Canvas, Right Properties */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar Shelf */}
        <aside className="w-16 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 space-y-4 shrink-0">
          <div className="space-y-1 flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Layers</span>
            <button
              type="button"
              id="admin-add-solid-btn"
              onClick={() => handleAddLayer('solid')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-purple-600/30 hover:text-purple-300 text-slate-300 border border-slate-800 transition-colors"
              title="Add Solid Box Layer"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="admin-add-shape-btn"
              onClick={() => handleAddLayer('shape')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-purple-600/30 hover:text-purple-300 text-slate-300 border border-slate-800 transition-colors"
              title="Add Geometric Shape"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="admin-add-line-btn"
              onClick={() => handleAddLayer('line')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-purple-600/30 hover:text-purple-300 text-slate-300 border border-slate-800 transition-colors"
              title="Add Decorative Rule/Line"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="admin-add-text-btn"
              onClick={() => handleAddLayer('text')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-purple-600/30 hover:text-purple-300 text-slate-300 border border-slate-800 transition-colors"
              title="Add Decorative Text Label"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="admin-add-image-btn"
              onClick={() => handleAddLayer('image')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-purple-600/30 hover:text-purple-300 text-slate-300 border border-slate-800 transition-colors"
              title="Add Image / Logo Layer"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="admin-add-page-number-btn"
              onClick={() => handleAddLayer('page-number')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-purple-600/30 hover:text-purple-300 text-slate-300 border border-slate-800 transition-colors"
              title="Add Fixed Page Number Placeholder"
            >
              <Hash className="w-4 h-4" />
            </button>
          </div>

          <div className="w-8 border-t border-slate-800" />

          <div className="space-y-1 flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Zones</span>
            <button
              type="button"
              id="admin-add-text-zone-btn"
              onClick={() => handleAddZone('flowing-text')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-300 border border-slate-800 transition-colors"
              title="Add Flowing Manuscript Text Zone"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="admin-add-heading-zone-btn"
              onClick={() => handleAddZone('chapter-heading')}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-300 border border-slate-800 transition-colors"
              title="Add Chapter Heading Zone"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Center Visual Canvas Area */}
        <main
          className="flex-1 bg-slate-900 overflow-auto flex items-center justify-center p-8 relative select-none"
          onClick={() => {
            setSelectedLayerId(null);
            setSelectedZoneId(null);
          }}
        >
          {/* Page Canvas Container with Scale */}
          <div
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bleed Guide (Outside Trim) */}
            {showGuides && (
              <div
                className="absolute border border-dashed border-rose-500/50 pointer-events-none"
                style={{
                  top: `-${bleedPx}px`,
                  left: `-${bleedPx}px`,
                  width: `${canvasWidthPx + bleedPx * 2}px`,
                  height: `${canvasHeightPx + bleedPx * 2}px`,
                }}
              >
                <span className="absolute -top-4 left-1 text-[9px] font-mono text-rose-400">
                  Bleed ({template.bleedInches}&quot;)
                </span>
              </div>
            )}

            {/* Actual Print Trim Page Canvas */}
            <div
              id="admin-template-page-canvas"
              data-testid="admin-template-page-canvas"
              className="relative bg-white shadow-2xl overflow-hidden border border-slate-300"
              style={{
                width: `${canvasWidthPx}px`,
                height: `${canvasHeightPx}px`,
                backgroundColor: template.design?.backgroundColor || '#ffffff',
              }}
            >
              {/* Safe Area Guide (Cyan Dashed) */}
              {showGuides && (
                <div
                  className="absolute border border-dashed border-cyan-400/50 pointer-events-none"
                  style={{
                    top: `${safePx}px`,
                    left: `${safePx}px`,
                    right: `${safePx}px`,
                    bottom: `${safePx}px`,
                  }}
                >
                  <span className="absolute top-1 left-1 text-[9px] font-mono text-cyan-500">
                    Safe Margin ({template.safeAreaInches}&quot;)
                  </span>
                </div>
              )}

              {/* Inset Border (if configured) */}
              {template.design?.borderEnabled && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: `${(template.design.borderInsetInches ?? 0.35) * DPI}px`,
                    bottom: `${(template.design.borderInsetInches ?? 0.35) * DPI}px`,
                    left: `${(template.design.borderInsetInches ?? 0.35) * DPI}px`,
                    right: `${(template.design.borderInsetInches ?? 0.35) * DPI}px`,
                    borderColor: template.design.borderColor || '#cbd5e1',
                    borderWidth: `${template.design.borderWidthPt ?? 1}px`,
                    borderStyle: template.design.borderStyle || 'solid',
                    borderRadius: `${template.design.borderRadiusPt ?? 0}px`,
                  }}
                />
              )}

              {/* Render Content Zones */}
              {contentZones.map((zone) => {
                const isSelected = selectedZoneId === zone.id;
                const effectiveX = zone.mirrorOnVerso && isVerso
                  ? template.pageWidthInches - (zone.xInches + zone.widthInches)
                  : zone.xInches;

                return (
                  <div
                    key={zone.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZoneId(zone.id);
                      setSelectedLayerId(null);
                    }}
                    className={`absolute cursor-pointer border-2 transition-colors flex flex-col justify-between p-2 select-none ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-500/15 z-30'
                        : 'border-indigo-400/60 bg-indigo-500/5 hover:border-indigo-500 hover:bg-indigo-500/10 z-10'
                    }`}
                    style={{
                      left: `${effectiveX * DPI}px`,
                      top: `${zone.yInches * DPI}px`,
                      width: `${zone.widthInches * DPI}px`,
                      height: `${zone.heightInches * DPI}px`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-white/90 px-1.5 py-0.5 rounded shadow-2xs">
                        {zone.name}
                      </span>
                      <span className="text-[9px] font-mono text-indigo-600 bg-white/90 px-1 rounded">
                        {zone.type}
                      </span>
                    </div>

                    <div className="text-center text-[10px] text-indigo-400 italic font-serif">
                      Manuscript flows dynamically through this zone
                    </div>

                    <div className="text-[9px] text-right font-mono text-indigo-600">
                      {zone.widthInches}&quot; × {zone.heightInches}&quot;
                    </div>
                  </div>
                );
              })}

              {/* Render Fixed Design Layers */}
              {layers.map((layer) => {
                if (layer.visible === false) return null;
                const isSelected = selectedLayerId === layer.id;
                const effectiveX = layer.mirrorOnVerso && isVerso
                  ? template.pageWidthInches - (layer.xInches + layer.widthInches)
                  : layer.xInches;

                return (
                  <div
                    key={layer.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!layer.locked) {
                        setSelectedLayerId(layer.id);
                        setSelectedZoneId(null);
                      }
                    }}
                    className={`absolute select-none overflow-hidden transition-all ${
                      layer.locked ? 'cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      isSelected
                        ? 'ring-2 ring-purple-600 ring-offset-1 ring-offset-white z-40'
                        : 'hover:ring-1 hover:ring-purple-400/60'
                    }`}
                    style={{
                      left: `${effectiveX * DPI}px`,
                      top: `${layer.yInches * DPI}px`,
                      width: `${layer.widthInches * DPI}px`,
                      height: `${layer.heightInches * DPI}px`,
                      zIndex: isSelected ? 40 : layer.zIndex ?? 2,
                      opacity: layer.opacity ?? 1,
                      transform: layer.rotationDeg ? `rotate(${layer.rotationDeg}deg)` : undefined,
                      backgroundColor: layer.fillColor || (layer.type === 'solid' ? '#e2e8f0' : undefined),
                      borderColor: layer.strokeColor,
                      borderWidth: layer.strokeWidthPt ? `${layer.strokeWidthPt}px` : undefined,
                      borderStyle: layer.strokeStyle || 'solid',
                      borderRadius: layer.borderRadiusPt ? `${layer.borderRadiusPt}px` : (layer.type === 'shape' ? '9999px' : undefined),
                    }}
                  >
                    {layer.type === 'image' && (
                      layer.imageDataUrl ? (
                        <img
                          src={layer.imageDataUrl}
                          alt={layer.name}
                          className="w-full h-full"
                          style={{ objectFit: layer.imageFit === 'cover' ? 'cover' : 'contain' }}
                        />
                      ) : (
                        <div className="w-full h-full border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
                          Logo / Image Asset
                        </div>
                      )
                    )}

                    {layer.type === 'text' && (
                      <div
                        className="w-full h-full flex items-center px-1 font-semibold"
                        style={{
                          fontFamily: layer.fontFamily || 'inherit',
                          fontSize: `${layer.fontSizePt || 10}pt`,
                          color: layer.textColor || '#0f172a',
                          justifyContent: layer.textAlign === 'center' ? 'center' : layer.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {layer.text || 'Text'}
                      </div>
                    )}

                    {layer.type === 'page-number' && (
                      <div
                        className="w-full h-full flex items-center justify-center font-mono text-xs font-semibold"
                        style={{ color: layer.textColor || '#64748b' }}
                      >
                        [PAGE #]
                      </div>
                    )}

                    {layer.type === 'line' && (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: layer.strokeColor || '#94a3b8',
                          height: `${layer.strokeWidthPt || 1}px`,
                        }}
                      />
                    )}

                    {/* Selection Handles (Editor-only, never in PDF) */}
                    {isSelected && (
                      <>
                        <div className="absolute top-0 left-0 w-2 h-2 bg-purple-600 border border-white" />
                        <div className="absolute top-0 right-0 w-2 h-2 bg-purple-600 border border-white" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 bg-purple-600 border border-white" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-purple-600 border border-white" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Right Inspector & Layer Panel */}
        <aside className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto">
          {/* Panels Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              {selectedLayer ? 'Layer Properties' : selectedZone ? 'Content Zone' : 'Template Inspector'}
            </h3>
            {isAdmin && (
              <span className="text-[10px] font-semibold text-purple-400 flex items-center space-x-1">
                <FolderLock className="w-3 h-3" />
                <span>Admin Governance</span>
              </span>
            )}
          </div>

          <div className="p-4 space-y-6 flex-1">
            {/* 1. If Layer is Selected */}
            {selectedLayer ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{selectedLayer.name}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleUpdateLayer(selectedLayer.id, { locked: !selectedLayer.locked })}
                      className="p-1 text-slate-400 hover:text-white rounded"
                      title={selectedLayer.locked ? 'Unlock Layer' : 'Lock Layer'}
                    >
                      {selectedLayer.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateLayer(selectedLayer.id)}
                      className="p-1 text-slate-400 hover:text-white rounded"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteLayer(selectedLayer.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Layer Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Layer Label</label>
                  <input
                    type="text"
                    value={selectedLayer.name}
                    onChange={(e) => handleUpdateLayer(selectedLayer.id, { name: e.target.value })}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                {/* Coordinates (X, Y, W, H) in Inches */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">X Position (in)</label>
                    <input
                      type="number"
                      step={0.05}
                      value={selectedLayer.xInches}
                      onChange={(e) => handleUpdateLayer(selectedLayer.id, { xInches: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Y Position (in)</label>
                    <input
                      type="number"
                      step={0.05}
                      value={selectedLayer.yInches}
                      onChange={(e) => handleUpdateLayer(selectedLayer.id, { yInches: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Width (in)</label>
                    <input
                      type="number"
                      step={0.05}
                      min={0.1}
                      value={selectedLayer.widthInches}
                      onChange={(e) => handleUpdateLayer(selectedLayer.id, { widthInches: parseFloat(e.target.value) || 0.1 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Height (in)</label>
                    <input
                      type="number"
                      step={0.05}
                      min={0.01}
                      value={selectedLayer.heightInches}
                      onChange={(e) => handleUpdateLayer(selectedLayer.id, { heightInches: parseFloat(e.target.value) || 0.05 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                </div>

                {/* Verso Mirroring */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedLayer.mirrorOnVerso ?? true}
                      onChange={(e) => handleUpdateLayer(selectedLayer.id, { mirrorOnVerso: e.target.checked })}
                      className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Mirror on Verso (Left) Spreads</span>
                  </label>
                </div>

                {/* Fill & Stroke */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Fill Color</span>
                    <input
                      type="color"
                      value={selectedLayer.fillColor || '#e2e8f0'}
                      onChange={(e) => handleUpdateLayer(selectedLayer.id, { fillColor: e.target.value })}
                      className="w-7 h-7 p-0.5 bg-slate-900 border border-slate-700 rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Stroke Color</span>
                    <input
                      type="color"
                      value={selectedLayer.strokeColor || '#94a3b8'}
                      onChange={(e) => handleUpdateLayer(selectedLayer.id, { strokeColor: e.target.value })}
                      className="w-7 h-7 p-0.5 bg-slate-900 border border-slate-700 rounded"
                    />
                  </div>
                </div>

                {/* Specific Text controls */}
                {selectedLayer.type === 'text' && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-400">Text Content</label>
                    <input
                      type="text"
                      value={selectedLayer.text || ''}
                      onChange={(e) => handleUpdateLayer(selectedLayer.id, { text: e.target.value })}
                      className="w-full text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400">Font Size (pt)</span>
                      <input
                        type="number"
                        min={6}
                        max={48}
                        value={selectedLayer.fontSizePt || 10}
                        onChange={(e) => handleUpdateLayer(selectedLayer.id, { fontSizePt: parseFloat(e.target.value) || 10 })}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-right"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : selectedZone ? (
              /* 2. If Content Zone is Selected */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{selectedZone.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteZone(selectedZone.id)}
                    className="p-1 text-rose-400 hover:text-rose-300 rounded"
                    title="Delete Zone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Zone Type</label>
                  <select
                    value={selectedZone.type}
                    onChange={(e) => handleUpdateZone(selectedZone.id, { type: e.target.value as any })}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="flowing-text">Flowing Manuscript Text</option>
                    <option value="chapter-heading">Chapter Heading Zone</option>
                    <option value="image">Image Drop Zone</option>
                    <option value="header">Running Header Zone</option>
                    <option value="footer">Running Footer Zone</option>
                    <option value="page-number">Page Number Zone</option>
                  </select>
                </div>

                {/* Zone Coordinates */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">X Position (in)</label>
                    <input
                      type="number"
                      step={0.05}
                      value={selectedZone.xInches}
                      onChange={(e) => handleUpdateZone(selectedZone.id, { xInches: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Y Position (in)</label>
                    <input
                      type="number"
                      step={0.05}
                      value={selectedZone.yInches}
                      onChange={(e) => handleUpdateZone(selectedZone.id, { yInches: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Width (in)</label>
                    <input
                      type="number"
                      step={0.05}
                      min={0.5}
                      value={selectedZone.widthInches}
                      onChange={(e) => handleUpdateZone(selectedZone.id, { widthInches: parseFloat(e.target.value) || 0.5 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Height (in)</label>
                    <input
                      type="number"
                      step={0.05}
                      min={0.2}
                      value={selectedZone.heightInches}
                      onChange={(e) => handleUpdateZone(selectedZone.id, { heightInches: parseFloat(e.target.value) || 0.2 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                </div>

                {selectedZone.type === 'flowing-text' && (
                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Columns</label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateZone(selectedZone.id, { columns: 1 })}
                        className={`flex-1 py-1 text-xs font-semibold rounded border ${
                          selectedZone.columns !== 2 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        1 Col
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateZone(selectedZone.id, { columns: 2 })}
                        className={`flex-1 py-1 text-xs font-semibold rounded border ${
                          selectedZone.columns === 2 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        2 Cols
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 3. Global Template & Governance Inspector */
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Template Governance
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Publishing Status</label>
                      <select
                        value={template.governance?.status || 'draft'}
                        onChange={(e) =>
                          setTemplate({
                            ...template,
                            governance: {
                              ...(template.governance || ({} as any)),
                              status: e.target.value as any,
                            },
                          })
                        }
                        className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="draft">Draft (Private)</option>
                        <option value="published">Published (Active)</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Organization Visibility</label>
                      <select
                        value={template.governance?.visibility || 'organization'}
                        onChange={(e) =>
                          setTemplate({
                            ...template,
                            governance: {
                              ...(template.governance || ({} as any)),
                              visibility: e.target.value as any,
                            },
                          })
                        }
                        className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      >
                        <option value="organization">All Organization Members</option>
                        <option value="admin-only">Administrators Only</option>
                        <option value="private">Private (Author Only)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Layer Hierarchy Panel */}
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Layers ({layers.length})</span>
                    </h4>
                  </div>

                  <div className="space-y-1">
                    {layers.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => {
                          setSelectedLayerId(l.id);
                          setSelectedZoneId(null);
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          selectedLayerId === l.id
                            ? 'bg-purple-900/50 border border-purple-700 text-white'
                            : 'bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="truncate flex-1">{l.name}</span>
                        <div className="flex items-center space-x-1 pl-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateLayer(l.id, { visible: !l.visible });
                            }}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            {l.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateLayer(l.id, { locked: !l.locked });
                            }}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            {l.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content Zones Panel */}
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Content Zones ({contentZones.length})
                  </h4>
                  <div className="space-y-1">
                    {contentZones.map((z) => (
                      <div
                        key={z.id}
                        onClick={() => {
                          setSelectedZoneId(z.id);
                          setSelectedLayerId(null);
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          selectedZoneId === z.id
                            ? 'bg-indigo-900/50 border border-indigo-700 text-white'
                            : 'bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="truncate flex-1 font-medium">{z.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{z.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
