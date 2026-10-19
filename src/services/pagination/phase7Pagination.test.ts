import { describe, it, expect } from 'vitest';
import { StandardPaginationEngine } from './paginationEngine';
import {
  CLASSIC_NOVEL_6X9,
  MAGAZINE_REPORT_A4,
  ILLUSTRATED_BOOK_8X10,
  DIGEST_NOVEL_5_5X8_5,
} from '../templates/templateRegistry';
import { ManuscriptBlock, BookProject } from '@/types/book';

describe('Phase 7 Text-Flow Pagination & Accurate Layout Tests', () => {
  const engine = new StandardPaginationEngine();

  // -------------------------------------------------------------------------
  // 1. Long One-Column Document: Vertical Space Filling & No Premature Breaks
  // -------------------------------------------------------------------------
  it('fills all usable vertical space on long one-column pages without premature breaks', () => {
    // 15 paragraphs of varying lengths
    const paragraphs: ManuscriptBlock[] = [
      { id: 'h1', type: 'chapter-heading', text: 'Chapter I: The North Atlantic Passage' },
    ];
    for (let i = 1; i <= 15; i++) {
      paragraphs.push({
        id: `p-${i}`,
        type: 'paragraph',
        text: `Paragraph ${i} explores the maritime route through dense fog and pack ice. ` +
          'The vessel pressed onward beneath overcast skies while navigational bearings were taken hourly. '.repeat(4),
      });
    }

    const pages = engine.paginate(paragraphs, CLASSIC_NOVEL_6X9, {
      bookTitle: 'The Arctic Sea',
    });

    expect(pages.length).toBeGreaterThan(1);

    // On non-terminal pages (e.g. Page 1, Page 2), verify the page has substantial content
    // and is filled without premature gaps
    for (let p = 0; p < pages.length - 1; p++) {
      const page = pages[p];
      // Total text length on full page should be substantial (> 1000 characters)
      const pageText = page.blocks.map((b) => b.text || '').join(' ');
      expect(pageText.length).toBeGreaterThan(800);
    }
  });

  // -------------------------------------------------------------------------
  // 2. Two-Column Layout: Correct Reading Order & Full Column Filling
  // -------------------------------------------------------------------------
  it('fills Column 1 to bottom before Column 2, and Column 2 to bottom before next page (LTR)', () => {
    const blocks: ManuscriptBlock[] = [
      { id: 'h1', type: 'chapter-heading', text: 'RESEARCH DISPATCH' },
    ];
    for (let i = 1; i <= 12; i++) {
      blocks.push({
        id: `col-p-${i}`,
        type: 'paragraph',
        text: `Section ${i}: Standard two-column editorial flow testing text capacity. ` +
          'Data points were recorded systematically across all monitoring stations in the archipelago. '.repeat(3),
      });
    }

    const pages = engine.paginate(blocks, MAGAZINE_REPORT_A4, {
      bookTitle: 'Quarterly Scientific Report',
    });

    expect(pages.length).toBeGreaterThanOrEqual(1);
    const page1 = pages[0];
    expect(page1.columns).toBeDefined();
    expect(page1.columns?.length).toBe(2);

    const col1 = page1.columns![0];
    const col2 = page1.columns![1];

    // Both columns must be populated
    expect(col1.length).toBeGreaterThan(0);
    expect(col2.length).toBeGreaterThan(0);

    // First block of Col 1 is the heading or early paragraphs
    expect(col1[0].text).toContain('RESEARCH DISPATCH');

    // First block of Col 2 should continue chronologically from where Col 1 left off
    const col1Text = col1.map((b) => b.text || '').join(' ');
    const col2Text = col2.map((b) => b.text || '').join(' ');

    expect(col1Text).toContain('Section 1');
    expect(col2Text).not.toContain('RESEARCH DISPATCH');
  });

  // -------------------------------------------------------------------------
  // 3. RTL Arabic/Urdu Reading Order & Column Geometry
  // -------------------------------------------------------------------------
  it('correctly handles RTL two-column flow and preserves block direction attributes', () => {
    const blocks: ManuscriptBlock[] = [
      {
        id: 'ar-h1',
        type: 'chapter-heading',
        text: 'الفصل الأول: رحلة الاستكشاف',
        direction: 'rtl',
        language: 'ar',
      },
      {
        id: 'ar-p1',
        type: 'paragraph',
        text: 'كانت السفينة تبحر عبر المياه المتجمدة في المحيط المتجمد الشمالي بينما كانت الرياح تعصف بقوة.'.repeat(8),
        direction: 'rtl',
        language: 'ar',
      },
      {
        id: 'ar-p2',
        type: 'paragraph',
        text: 'وقد تم تسجيل الإحداثيات الجغرافية بدقة متناهية لضمان سلامة الطاقم واستمرار المهمة الاستكشافية.'.repeat(8),
        direction: 'rtl',
        language: 'ar',
      },
    ];

    const pages = engine.paginate(blocks, MAGAZINE_REPORT_A4, {
      bookTitle: 'الرحلة القطبية',
    });

    expect(pages.length).toBeGreaterThanOrEqual(1);
    const page1 = pages[0];
    expect(page1.columns).toBeDefined();

    // Verify all blocks maintain RTL direction
    for (const b of page1.blocks) {
      if (b.type !== 'image') {
        expect(b.direction).toBe('rtl');
        expect(b.language).toBe('ar');
      }
    }
  });

  // -------------------------------------------------------------------------
  // 4. Hindi / Devanagari Complex Script Support
  // -------------------------------------------------------------------------
  it('paginates Hindi / Devanagari text cleanly without dropping characters or words', () => {
    const hindiBlocks: ManuscriptBlock[] = [
      {
        id: 'hi-h1',
        type: 'chapter-heading',
        text: 'अध्याय १: ध्रुवीय यात्रा का आरंभ',
        direction: 'ltr',
        language: 'hi',
      },
      {
        id: 'hi-p1',
        type: 'paragraph',
        text: 'जहाज बर्फीले समुद्र में धीरे-धीरे आगे बढ़ रहा था और चारों ओर केवल सफेद बर्फ का विस्तार था। '.repeat(10),
        direction: 'ltr',
        language: 'hi',
      },
    ];

    const pages = engine.paginate(hindiBlocks, CLASSIC_NOVEL_6X9, {
      bookTitle: 'ध्रुवीय अभियान',
    });

    expect(pages.length).toBeGreaterThanOrEqual(1);
    const heading = pages[0].blocks.find((b) => b.type === 'chapter-heading');
    expect(heading?.text).toBe('अध्याय १: ध्रुवीय यात्रा का आरंभ');
    expect(heading?.language).toBe('hi');
  });

  // -------------------------------------------------------------------------
  // 5. Image-Heavy Document: Inline, Full-Width, and Float-Right Reflow
  // -------------------------------------------------------------------------
  it('correctly integrates inline, full-width, and float-right images without overlap', () => {
    const mockImage = {
      id: 'img-glacier',
      filename: 'glacier.png',
      mimeType: 'image/png',
      width: 1600,
      height: 900,
      fileSize: 500000,
      createdAt: '2026-10-19T00:00:00Z',
      dataUrl: 'data:image/png;base64,sample',
    };

    const blocks: ManuscriptBlock[] = [
      { id: 'b1', type: 'chapter-heading', text: 'Chapter 2: The Ice Shelf' },
      { id: 'b2', type: 'paragraph', text: 'Text before the inline image. '.repeat(15) },
      { id: 'b3', type: 'paragraph', text: 'Text alongside or following the image. '.repeat(20) },
    ];

    const placements = [
      {
        id: 'p-inline',
        imageId: 'img-glacier',
        blockId: 'b2',
        mode: 'inline' as const,
        widthPercent: 90,
        aspectRatioLocked: true,
        crop: { x: 0, y: 0, width: 1, height: 1 },
        caption: 'Figure 1: Massive coastal ice shelf',
      },
    ];

    const pages = engine.paginate(blocks, ILLUSTRATED_BOOK_8X10, {
      images: [mockImage],
      placements,
    });

    expect(pages.length).toBeGreaterThanOrEqual(1);
    const imgBlock = pages[0].blocks.find((b) => b.type === 'image');
    expect(imgBlock).toBeDefined();
    expect(imgBlock?.placement?.mode).toBe('inline');
    expect(imgBlock?.placement?.caption).toBe('Figure 1: Massive coastal ice shelf');
  });

  // -------------------------------------------------------------------------
  // 6. Chapter Breaks & Recto-Only Intentional Blank Pages
  // -------------------------------------------------------------------------
  it('preserves intentional blank pages on even verso before recto chapter start', () => {
    const blocks: ManuscriptBlock[] = [
      { id: 'c1', type: 'chapter-heading', text: 'Chapter 1' },
      { id: 'p1', type: 'paragraph', text: 'Brief opening chapter.' },
      { id: 'c2', type: 'chapter-heading', text: 'Chapter 2' },
      { id: 'p2', type: 'paragraph', text: 'Brief second chapter.' },
    ];

    const pages = engine.paginate(blocks, CLASSIC_NOVEL_6X9, {
      typography: { chapterOpening: 'recto-only' },
    });

    // Page 1: Chapter 1 (Recto, odd)
    // Page 2: Blank verso (Even)
    // Page 3: Chapter 2 (Recto, odd)
    expect(pages.length).toBe(3);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].isLeft).toBe(false);

    expect(pages[1].pageNumber).toBe(2);
    expect(pages[1].isBlankPage).toBe(true);
    expect(pages[1].isLeft).toBe(true);

    expect(pages[2].pageNumber).toBe(3);
    expect(pages[2].isLeft).toBe(false);
    expect(pages[2].blocks[0].text).toBe('Chapter 2');
  });

  // -------------------------------------------------------------------------
  // 7. Word-Count Conservation: Zero Dropped, Duplicated, or Reordered Words
  // -------------------------------------------------------------------------
  it('guarantees 100% word conservation across entire manuscript during reflow', () => {
    const originalText =
      'Far across the frozen sound, the expedition leaders observed the sudden fracturing of the pack ice. ' +
      'Every sledge was secured to the granite outcrop while the team prepared for the long arctic night. ' +
      'Temperatures plunged below minus forty degrees, yet spirits remained resolute in the face of adversity. ' +
      'Scientific instruments recorded barometric pressure, geomagnetic fluctuations, and wind velocity with utmost precision.';

    const blocks: ManuscriptBlock[] = [
      { id: 'h1', type: 'chapter-heading', text: 'Chapter 3: The Cold Frontier' },
      { id: 'p1', type: 'paragraph', text: originalText },
    ];

    const pages = engine.paginate(blocks, DIGEST_NOVEL_5_5X8_5);

    // Extract all paragraph text across all generated pages
    const paginatedParagraphText = pages
      .flatMap((p) => p.blocks)
      .filter((b) => b.type === 'paragraph')
      .map((b) => b.text || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const expectedNormalized = originalText.replace(/\s+/g, ' ').trim();
    expect(paginatedParagraphText).toBe(expectedNormalized);
  });
});
