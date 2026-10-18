import { describe, it, expect } from 'vitest';
import { generatePrintPdf, sanitizePdfFilename } from './pdfExportService';
import { CLASSIC_NOVEL_6X9, MAGAZINE_REPORT_A4 } from '../templates/templateRegistry';
import { BookProject, PagePreviewData } from '@/types/book';
import { PDFDocument } from 'pdf-lib';

describe('pdfExportService', () => {
  it('sanitizes download filenames reliably', () => {
    expect(sanitizePdfFilename('The Eldridge Voyage')).toBe('the-eldridge-voyage-print.pdf');
    expect(sanitizePdfFilename('   Spaces & Special #@! Characters   ')).toBe('spaces-special-characters-print.pdf');
    expect(sanitizePdfFilename('')).toBe('book-print.pdf');
  });

  it('generates a valid print-ready PDF with expected page count and trim dimensions', async () => {
    const mockProject: BookProject = {
      id: 'proj-pdf',
      title: 'Voyage to the North',
      author: 'Captain Vance',
      rawManuscript: 'Chapter 1: The Port\n\nThe harbor was quiet.',
      templateId: 'classic-novel-6x9',
      formattedBlocks: [
        { id: 'b1', type: 'chapter-heading', text: 'Chapter 1: The Port' },
        { id: 'b2', type: 'paragraph', text: 'The harbor was quiet.' },
      ],
      images: [],
      placements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockPages: PagePreviewData[] = [
      {
        pageNumber: 1,
        isLeft: false,
        blocks: [
          { blockId: 'b1', type: 'chapter-heading', text: 'Chapter 1: The Port' },
          { blockId: 'b2', type: 'paragraph', text: 'The harbor was quiet.' },
        ],
        headerText: undefined,
      },
      {
        pageNumber: 2,
        isLeft: true,
        blocks: [
          { blockId: 'b3', type: 'paragraph', text: 'The gulls wheeled overhead.' },
        ],
        headerText: 'Voyage to the North',
      },
    ];

    const pdfDoc = await generatePrintPdf(mockProject, CLASSIC_NOVEL_6X9, mockPages, {
      includeBleed: false,
      includeCropMarks: false,
      acknowledgedWarnings: true,
    });

    // Inspect arraybuffer via pdf-lib
    const pdfBytes = pdfDoc.output('arraybuffer');
    expect(pdfBytes.byteLength).toBeGreaterThan(500);

    const loadedPdf = await PDFDocument.load(pdfBytes);
    expect(loadedPdf.getPageCount()).toBe(2);

    const firstPage = loadedPdf.getPage(0);
    const { width, height } = firstPage.getSize();

    // 6in * 72pt = 432pt; 9in * 72pt = 648pt
    expect(Math.round(width)).toBe(432);
    expect(Math.round(height)).toBe(648);
  });

  it('includes bleed and sheet margin when bleed and crop marks are enabled', async () => {
    const mockProject: BookProject = {
      id: 'proj-bleed',
      title: 'A4 Magazine',
      author: 'Editor',
      rawManuscript: 'ANNUAL REPORT',
      templateId: 'magazine-report-a4',
      formattedBlocks: [{ id: 'b1', type: 'chapter-heading', text: 'ANNUAL REPORT' }],
      images: [],
      placements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockPages: PagePreviewData[] = [
      {
        pageNumber: 1,
        isLeft: false,
        blocks: [{ blockId: 'b1', type: 'chapter-heading', text: 'ANNUAL REPORT' }],
      },
    ];

    const pdfDoc = await generatePrintPdf(mockProject, MAGAZINE_REPORT_A4, mockPages, {
      includeBleed: true,
      includeCropMarks: true,
      acknowledgedWarnings: true,
    });

    const pdfBytes = pdfDoc.output('arraybuffer');
    const loadedPdf = await PDFDocument.load(pdfBytes);
    expect(loadedPdf.getPageCount()).toBe(1);

    const page = loadedPdf.getPage(0);
    const { width, height } = page.getSize();

    // Total sheet size must be larger than pure trim size due to bleed + crop mark margins
    const trimWpt = MAGAZINE_REPORT_A4.pageWidthInches * 72;
    const trimHpt = MAGAZINE_REPORT_A4.pageHeightInches * 72;
    expect(width).toBeGreaterThan(trimWpt);
    expect(height).toBeGreaterThan(trimHpt);
  });
});
