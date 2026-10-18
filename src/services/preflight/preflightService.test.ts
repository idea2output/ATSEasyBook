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
});
