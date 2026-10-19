import { describe, it, expect } from 'vitest';
import { runPrintPreflight, calculateEffectiveImageDpi } from './preflightService';
import { CLASSIC_NOVEL_6X9 } from '../templates/templateRegistry';
import { BookProject, BookImage, ImagePlacement, PagePreviewData } from '@/types/book';

describe('preflightService', () => {
  const mockImageHighRes: BookImage = {
    id: 'img-1',
    filename: 'hero-300dpi.png',
    mimeType: 'image/png',
    width: 2400, // 2400px / 4.5" = ~533 DPI (>= 300 DPI)
    height: 1800,
    fileSize: 1024 * 500,
    createdAt: new Date().toISOString(),
    dataUrl: 'data:image/png;base64,sample',
    altText: 'Hero illustration of the vessel',
  };

  const mockImageLowRes: BookImage = {
    id: 'img-2',
    filename: 'lowres-web.jpg',
    mimeType: 'image/jpeg',
    width: 300, // 300px / 4.5" = ~66 DPI (< 300 DPI)
    height: 200,
    fileSize: 1024 * 50,
    createdAt: new Date().toISOString(),
    dataUrl: 'data:image/jpeg;base64,sample',
    altText: '', // missing alt text
  };

  const mockPlacementHighRes: ImagePlacement = {
    id: 'p-1',
    imageId: 'img-1',
    blockId: 'b-1',
    mode: 'inline',
    widthPercent: 100,
    aspectRatioLocked: true,
    crop: { x: 0, y: 0, width: 1, height: 1 },
  };

  const mockPlacementLowRes: ImagePlacement = {
    id: 'p-2',
    imageId: 'img-2',
    blockId: 'b-2',
    mode: 'inline',
    widthPercent: 100,
    aspectRatioLocked: true,
    crop: { x: 0, y: 0, width: 1, height: 1 },
  };

  const baseProject: BookProject = {
    id: 'proj-1',
    title: 'The Great Exploration',
    author: 'Explorer Vance',
    rawManuscript: 'Chapter 1\n\nIt was a crisp morning.',
    templateId: 'classic-novel-6x9',
    formattedBlocks: [
      { id: 'b-1', type: 'chapter-heading', text: 'Chapter 1' },
      { id: 'b-2', type: 'paragraph', text: 'It was a crisp morning.' },
    ],
    images: [mockImageHighRes],
    placements: [mockPlacementHighRes],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockPages: PagePreviewData[] = [
    {
      pageNumber: 1,
      isLeft: false,
      blocks: [
        { blockId: 'b-1', type: 'chapter-heading', text: 'Chapter 1' },
        { blockId: 'b-1', type: 'image', placement: mockPlacementHighRes, image: mockImageHighRes },
        { blockId: 'b-2', type: 'paragraph', text: 'It was a crisp morning.' },
      ],
    },
  ];

  it('calculates effective image DPI based on cropped pixels and rendered width', () => {
    const dpiHigh = calculateEffectiveImageDpi(mockPlacementHighRes, mockImageHighRes, CLASSIC_NOVEL_6X9);
    expect(dpiHigh).toBeGreaterThanOrEqual(300);

    const dpiLow = calculateEffectiveImageDpi(mockPlacementLowRes, mockImageLowRes, CLASSIC_NOVEL_6X9);
    expect(dpiLow).toBeLessThan(300);
  });

  it('passes all checks when manuscript, images, and geometry are optimal', () => {
    const summary = runPrintPreflight(baseProject, CLASSIC_NOVEL_6X9, mockPages);
    expect(summary.errorsCount).toBe(0);
    expect(summary.warningsCount).toBe(0);
    expect(summary.passedCount).toBeGreaterThanOrEqual(5);
  });

  it('flags an error when manuscript is empty', () => {
    const emptyProj: BookProject = {
      ...baseProject,
      rawManuscript: '   ',
      formattedBlocks: [],
    };
    const summary = runPrintPreflight(emptyProj, CLASSIC_NOVEL_6X9, []);
    expect(summary.errorsCount).toBeGreaterThan(0);
    const err = summary.issues.find((i) => i.id === 'err-empty-manuscript');
    expect(err).toBeDefined();
    expect(err?.severity).toBe('error');
  });

  it('flags an error when an image placement refers to a missing image in the library', () => {
    const brokenProj: BookProject = {
      ...baseProject,
      placements: [
        {
          id: 'p-orphan',
          imageId: 'nonexistent-id',
          blockId: 'b-1',
          mode: 'inline',
          widthPercent: 100,
          aspectRatioLocked: true,
          crop: { x: 0, y: 0, width: 1, height: 1 },
        },
      ],
    };
    const summary = runPrintPreflight(brokenProj, CLASSIC_NOVEL_6X9, mockPages);
    expect(summary.errorsCount).toBeGreaterThan(0);
    const err = summary.issues.find((i) => i.id.startsWith('err-missing-source'));
    expect(err).toBeDefined();
  });

  it('flags an error when an image has an unsupported MIME type', () => {
    const invalidImage: BookImage = {
      ...mockImageHighRes,
      id: 'img-svg',
      mimeType: 'image/svg+xml',
    };
    const invalidProj: BookProject = {
      ...baseProject,
      images: [invalidImage],
    };
    const summary = runPrintPreflight(invalidProj, CLASSIC_NOVEL_6X9, mockPages);
    expect(summary.errorsCount).toBeGreaterThan(0);
    const err = summary.issues.find((i) => i.id.startsWith('err-unsupported-mime'));
    expect(err).toBeDefined();
  });

  it('flags a warning when an image is below 300 DPI', () => {
    const lowDpiProj: BookProject = {
      ...baseProject,
      images: [mockImageLowRes],
      placements: [mockPlacementLowRes],
    };
    const summary = runPrintPreflight(lowDpiProj, CLASSIC_NOVEL_6X9, mockPages);
    expect(summary.errorsCount).toBe(0);
    const warn = summary.issues.find((i) => i.id.startsWith('warn-low-dpi'));
    expect(warn).toBeDefined();
    expect(warn?.severity).toBe('warning');
  });

  it('flags a warning when image is missing accessibility alt text', () => {
    const noAltProj: BookProject = {
      ...baseProject,
      images: [mockImageLowRes],
    };
    const summary = runPrintPreflight(noAltProj, CLASSIC_NOVEL_6X9, mockPages);
    const warn = summary.issues.find((i) => i.id.startsWith('warn-missing-alt'));
    expect(warn).toBeDefined();
    expect(warn?.severity).toBe('warning');
  });

  it('flags a warning for intentional blank pages', () => {
    const pagesWithBlank: PagePreviewData[] = [
      mockPages[0],
      {
        pageNumber: 2,
        isLeft: true,
        blocks: [],
        isBlankPage: true,
      },
    ];
    const summary = runPrintPreflight(baseProject, CLASSIC_NOVEL_6X9, pagesWithBlank);
    const warn = summary.issues.find((i) => i.id.startsWith('warn-blank-page'));
    expect(warn).toBeDefined();
  });

  it('flags a warning when text color has low contrast against background color (< 4.5:1)', () => {
    const lowContrastProject: BookProject = {
      ...baseProject,
      design: {
        backgroundColor: '#ffffff',
        textColor: '#e2e8f0', // Very light grey on white (contrast ~1.2:1)
      },
    };
    const summary = runPrintPreflight(lowContrastProject, CLASSIC_NOVEL_6X9, mockPages);
    const contrastIssue = summary.issues.find((i) => i.id === 'warn-low-contrast');
    expect(contrastIssue).toBeDefined();
    expect(contrastIssue?.severity).toBe('warning');
    expect(contrastIssue?.category).toBe('design');
  });

  it('flags a warning when decorative border is positioned too close to trim edge (< 0.125")', () => {
    const borderNearTrimProject: BookProject = {
      ...baseProject,
      design: {
        borderEnabled: true,
        borderInsetInches: 0.05, // < 0.125" minimum safety margin
      },
    };
    const summary = runPrintPreflight(borderNearTrimProject, CLASSIC_NOVEL_6X9, mockPages);
    const borderIssue = summary.issues.find((i) => i.id === 'warn-border-near-trim');
    expect(borderIssue).toBeDefined();
    expect(borderIssue?.severity).toBe('warning');
    expect(borderIssue?.category).toBe('design');
  });

  it('flags a warning when custom font cannot be embedded into PDF (WOFF/WOFF2)', () => {
    const woffProject: BookProject = {
      ...baseProject,
      typography: {
        bodyFontFamily: 'OpenSansWeb, sans-serif',
      },
      customFonts: [
        {
          id: 'cf-1',
          familyName: 'OpenSansWeb',
          format: 'woff2',
          fileName: 'opensans.woff2',
          fileSizeBytes: 45000,
          dataUrl: 'data:font/woff2;base64,mock',
          createdAt: new Date().toISOString(),
          canEmbedInPdf: false,
        },
      ],
    };
    const summary = runPrintPreflight(woffProject, CLASSIC_NOVEL_6X9, mockPages);
    const fontIssue = summary.issues.find((i) => i.id === 'warn-font-not-embeddable-cf-1');
    expect(fontIssue).toBeDefined();
    expect(fontIssue?.severity).toBe('warning');
    expect(fontIssue?.category).toBe('font');
  });

  describe('Phase 8 Template Preflight Verification', () => {
    it('detects invalid template dimensions and margin overflows', () => {
      const invalidTmpl = {
        ...CLASSIC_NOVEL_6X9,
        pageWidthInches: 0,
      };
      const summary = runPrintPreflight(baseProject, invalidTmpl, mockPages);
      expect(summary.issues.some((i) => i.id === 'err-template-invalid-dimensions')).toBe(true);
    });

    it('warns when full-color background is configured without bleed', () => {
      const zeroBleedTmpl = {
        ...CLASSIC_NOVEL_6X9,
        bleedInches: 0,
      };
      const coloredBgProject = {
        ...baseProject,
        design: {
          backgroundColor: '#fef08a',
        },
      };
      const summary = runPrintPreflight(coloredBgProject, zeroBleedTmpl, mockPages);
      expect(summary.issues.some((i) => i.id === 'warn-template-insufficient-bleed')).toBe(true);
    });

    it('flags error for missing image source in template fixed layer', () => {
      const tmplWithBrokenImageLayer = {
        ...CLASSIC_NOVEL_6X9,
        layers: [
          {
            id: 'l-logo',
            name: 'Publisher Logo',
            type: 'image' as const,
            xInches: 0.5,
            yInches: 0.5,
            widthInches: 1.5,
            heightInches: 1.0,
            zIndex: 2,
            locked: true,
            visible: true,
            imageDataUrl: '', // missing
          },
        ],
      };
      const summary = runPrintPreflight(baseProject, tmplWithBrokenImageLayer, mockPages);
      expect(summary.issues.some((i) => i.id === 'err-layer-missing-image-l-logo')).toBe(true);
    });

    it('warns when a content zone penetrates the safe area boundary', () => {
      const tmplWithUnsafeZone = {
        ...CLASSIC_NOVEL_6X9,
        safeAreaInches: 0.25,
        contentZones: [
          {
            id: 'z-head',
            name: 'Unsafe Heading Zone',
            type: 'chapter-heading' as const,
            xInches: 0.1, // < safeAreaInches 0.25
            yInches: 0.1,
            widthInches: 5.8,
            heightInches: 1.0,
          },
        ],
      };
      const summary = runPrintPreflight(baseProject, tmplWithUnsafeZone, mockPages);
      expect(summary.issues.some((i) => i.id === 'warn-zone-safe-area-z-head')).toBe(true);
    });
  });
});
