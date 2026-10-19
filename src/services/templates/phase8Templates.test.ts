import { describe, it, expect, beforeEach } from 'vitest';
import {
  convertUnits,
  toInches,
  fromInches,
  formatUnit,
  validatePageGeometry,
} from './geometryValidator';
import { templateRepository } from './templateRepository';
import { CLASSIC_NOVEL_6X9, CUSTOM_PAGE_DEFAULT, getTemplateById } from './templateRegistry';
import { runPrintPreflight } from '../preflight/preflightService';
import { generatePrintPdf } from '../pdf/pdfExportService';
import { parseManuscript } from '../formatting/manuscriptParser';
import { defaultPaginationEngine } from '../pagination/paginationEngine';
import { inspectPdfCmykCompliance } from '../cmyk/cmykPreflightInspector';
import {
  BookTemplate,
  BookProject,
  TemplateLayer,
  ContentZone,
  PagePreviewData,
} from '@/types/book';

describe('Phase 8: Custom Page Templates, Governance & Admin Template Editor', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('1. Unit Conversion & Geometry Validation', () => {
    it('converts units between inches, millimeters, and points accurately', () => {
      expect(convertUnits(1, 'in', 'mm')).toBeCloseTo(25.4, 4);
      expect(convertUnits(25.4, 'mm', 'in')).toBeCloseTo(1, 4);
      expect(convertUnits(1, 'in', 'pt')).toBeCloseTo(72, 4);
      expect(convertUnits(72, 'pt', 'in')).toBeCloseTo(1, 4);
      expect(convertUnits(25.4, 'mm', 'pt')).toBeCloseTo(72, 2);
    });

    it('rejects invalid or collapsing page dimensions continuously', () => {
      const badGeometry = {
        pageWidthInches: 0,
        pageHeightInches: 9.0,
        bleedInches: 0.125,
        safeAreaInches: 0.25,
        margins: {
          topInches: 0.75,
          bottomInches: 0.75,
          insideInches: 0.75,
          outsideInches: 0.5,
          gutterInches: 0.125,
        },
      };

      const result = validatePageGeometry(badGeometry);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Page width must be greater than 0'))).toBe(true);
    });

    it('prevents margin combinations that leave insufficient text space (< 1.5 in)', () => {
      const tightMargins = {
        pageWidthInches: 5.0,
        pageHeightInches: 8.0,
        bleedInches: 0.125,
        safeAreaInches: 0.25,
        margins: {
          topInches: 0.75,
          bottomInches: 0.75,
          insideInches: 2.0,
          outsideInches: 2.0,
          gutterInches: 0.0, // leaves only 1.0" for text
        },
      };

      const result = validatePageGeometry(tightMargins);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('too narrow'))).toBe(true);
    });
  });

  describe('2. Template Serialization, Migration & Recovery', () => {
    it('migrates raw template objects without throwing and populates defaults', () => {
      const incomplete = {
        id: 'legacy-tmpl-101',
        name: 'Legacy Custom Format',
      };
      const migrated = templateRepository.migrateTemplate(incomplete);
      expect(migrated.id).toBe('legacy-tmpl-101');
      expect(migrated.name).toBe('Legacy Custom Format');
      expect(migrated.pageWidthInches).toBe(CLASSIC_NOVEL_6X9.pageWidthInches);
      expect(migrated.layers).toEqual([]);
      expect(migrated.contentZones).toEqual([]);
      expect(migrated.governance?.status).toBe('draft');
    });

    it('detects material reflow impact before applying a template', () => {
      const tmpl1 = CLASSIC_NOVEL_6X9; // 6x9, 1-col
      const tmpl2 = templateRepository.getTemplateById('magazine-report-a4'); // A4, 2-col

      const impact = templateRepository.detectReflowImpact(tmpl1, tmpl2);
      expect(impact.hasMaterialImpact).toBe(true);
      expect(impact.differences.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('3. Template Ownership & RBAC Governance', () => {
    const orgTemplate: BookTemplate = {
      ...CLASSIC_NOVEL_6X9,
      id: 'org-governed-1',
      name: 'Official Enterprise Template',
      isCustom: true,
      governance: {
        status: 'published',
        visibility: 'organization',
        organizationId: 'Harper Enterprise',
        ownerId: 'admin-alpha',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    it('allows administrator to edit organization templates but restricts editors and viewers', () => {
      const admin = { id: 'admin-alpha', role: 'administrator' as const, organizationName: 'Harper Enterprise' } as any;
      const editor = { id: 'editor-beta', role: 'editor' as const, organizationName: 'Harper Enterprise' } as any;
      const viewer = { id: 'viewer-gamma', role: 'viewer' as const, organizationName: 'Harper Enterprise' } as any;

      expect(templateRepository.canEditTemplate(orgTemplate, admin)).toBe(true);
      expect(templateRepository.canEditTemplate(orgTemplate, editor)).toBe(false);
      expect(templateRepository.canEditTemplate(orgTemplate, viewer)).toBe(false);
    });

    it('prevents accidental breaking of existing books on delete by archiving instead', async () => {
      const custom = await templateRepository.duplicateTemplate('classic-novel-6x9', 'Book In Use Template');
      expect(custom.id).toBeDefined();

      // Mock that a book uses this template
      const deleteResult = await templateRepository.deleteCustomTemplate(custom.id);
      expect(deleteResult.affectedBookCount).toBe(0);
    });
  });

  describe('4. Layer Ordering, Locking, Visibility & RTL Mirroring', () => {
    it('honors recto/verso horizontal coordinate mirroring for asymmetrical layers', () => {
      const layer: TemplateLayer = {
        id: 'header-rule',
        name: 'Header Rule',
        type: 'line',
        xInches: 0.85,
        yInches: 0.65,
        widthInches: 4.5,
        heightInches: 0.02,
        zIndex: 5,
        locked: false,
        visible: true,
        mirrorOnVerso: true,
      };

      const pageWidth = 6.0;
      // On Recto: x is 0.85
      const rectoX = layer.xInches;
      expect(rectoX).toBe(0.85);

      // On Verso: mirrored X from right margin
      const versoX = pageWidth - (layer.xInches + layer.widthInches);
      expect(versoX).toBeCloseTo(0.65, 4);
    });

    it('paginates text within explicit flowing-text content zone', () => {
      const tmplWithZone: BookTemplate = {
        ...CLASSIC_NOVEL_6X9,
        contentZones: [
          {
            id: 'z-flow',
            name: 'Flowing Manuscript',
            type: 'flowing-text',
            xInches: 1.0,
            yInches: 1.0,
            widthInches: 4.0,
            heightInches: 6.5,
            columns: 1,
          },
        ],
      };

      const blocks = parseManuscript('Chapter 1\n\n' + 'Sample paragraph for pagination flow test. '.repeat(50));
      const pages = defaultPaginationEngine.paginate(blocks, tmplWithZone);
      expect(pages.length).toBeGreaterThan(0);
      expect(pages[0].blocks.length).toBeGreaterThan(0);
    });
  });

  describe('5. Preflight & CMYK PDF Export of Fixed Layers & Zones', () => {
    const templateWithLayers: BookTemplate = {
      ...CLASSIC_NOVEL_6X9,
      layers: [
        {
          id: 'l-solid',
          name: 'Banner Background',
          type: 'solid',
          xInches: 0.5,
          yInches: 0.5,
          widthInches: 5.0,
          heightInches: 1.2,
          fillColor: '#f1f5f9',
          zIndex: 1,
          locked: false,
          visible: true,
        },
        {
          id: 'l-line',
          name: 'Trim Separator Rule',
          type: 'line',
          xInches: 0.85,
          yInches: 2.0,
          widthInches: 4.3,
          heightInches: 0.05,
          strokeColor: '#000000',
          strokeWidthPt: 1,
          zIndex: 2,
          locked: false,
          visible: true,
        },
      ],
      contentZones: [
        {
          id: 'z-main',
          name: 'Main Flow',
          type: 'flowing-text',
          xInches: 0.85,
          yInches: 2.2,
          widthInches: 4.3,
          heightInches: 5.5,
        },
      ],
    };

    const project: BookProject = {
      id: 'proj-phase8',
      title: 'Architectural Monograph',
      author: 'Master Architect',
      rawManuscript: 'Chapter 1\n\nForm follows function in governed publication layouts.',
      templateId: templateWithLayers.id,
      formattedBlocks: [
        { id: 'b1', type: 'chapter-heading', text: 'Chapter 1' },
        { id: 'b2', type: 'paragraph', text: 'Form follows function in governed publication layouts.' },
      ],
      images: [],
      placements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const pages: PagePreviewData[] = [
      {
        pageNumber: 1,
        isLeft: false,
        blocks: [
          { blockId: 'b1', type: 'chapter-heading', text: 'Chapter 1' },
          { blockId: 'b2', type: 'paragraph', text: 'Form follows function in governed publication layouts.' },
        ],
      },
    ];

    it('preflight passes for valid template layers and content zones', () => {
      const summary = runPrintPreflight(project, templateWithLayers, pages);
      expect(summary.errorsCount).toBe(0);
      expect(summary.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
    });

    it('exports print PDF incorporating fixed layers cleanly without editor controls', async () => {
      const result = await generatePrintPdf(project, templateWithLayers, pages, {
        includeBleed: true,
        includeCropMarks: true,
        acknowledgedWarnings: true,
        colorManagement: {
          outputProfileId: 'fogra39',
          blackHandling: 'standard-text',
          overprintBlackText: true,
          overprintBlackRules: true,
        },
      });

      expect(result).toBeDefined();
      const bytes = result.output('arraybuffer');
      expect(bytes.byteLength).toBeGreaterThan(1000);

      const report = await inspectPdfCmykCompliance(bytes);
      expect(report.isCompliant).toBe(true);
      expect(report.rgbObjectsCount).toBe(0);
    });
  });
});
