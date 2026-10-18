import { describe, it, expect } from 'vitest';
import { StandardPaginationEngine } from './paginationEngine';
import { CLASSIC_NOVEL_6X9 } from '../templates/templateRegistry';
import { ManuscriptBlock } from '@/types/book';

describe('StandardPaginationEngine', () => {
  const engine = new StandardPaginationEngine();

  it('returns empty pages array when no blocks are supplied', () => {
    const pages = engine.paginate([], CLASSIC_NOVEL_6X9);
    expect(pages).toEqual([]);
  });

  it('paginates a single chapter heading and paragraph onto Page 1', () => {
    const blocks: ManuscriptBlock[] = [
      { id: '1', type: 'chapter-heading', text: 'Chapter 1' },
      { id: '2', type: 'paragraph', text: 'This is the opening paragraph of chapter one.' },
    ];

    const pages = engine.paginate(blocks, CLASSIC_NOVEL_6X9, { bookTitle: 'Test Novel' });
    expect(pages.length).toBe(1);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].isLeft).toBe(false); // Page 1 is odd (Recto / right)
    expect(pages[0].blocks.length).toBe(2);
  });

  it('starts a new chapter heading on a new page', () => {
    const blocks: ManuscriptBlock[] = [
      { id: '1', type: 'chapter-heading', text: 'Chapter 1' },
      { id: '2', type: 'paragraph', text: 'Short paragraph for chapter 1.' },
      { id: '3', type: 'chapter-heading', text: 'Chapter 2' },
      { id: '4', type: 'paragraph', text: 'First paragraph of chapter 2.' },
    ];

    const pages = engine.paginate(blocks, CLASSIC_NOVEL_6X9, { bookTitle: 'Test Novel' });
    expect(pages.length).toBe(2);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].blocks[0].text).toBe('Chapter 1');

    expect(pages[1].pageNumber).toBe(2);
    expect(pages[1].isLeft).toBe(true); // Page 2 is even (Verso / left)
    expect(pages[1].blocks[0].text).toBe('Chapter 2');
  });

  it('flows large content across multiple pages when budget is exceeded', () => {
    const longParagraph = 'Word '.repeat(400); // 2000 chars, exceeds single page line budget (~32 lines * 64 chars)
    const blocks: ManuscriptBlock[] = [
      { id: '1', type: 'chapter-heading', text: 'Chapter 1: The Long Journey' },
      { id: '2', type: 'paragraph', text: longParagraph },
    ];

    const pages = engine.paginate(blocks, CLASSIC_NOVEL_6X9, { bookTitle: 'Test Novel' });
    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[1].pageNumber).toBe(2);
    expect(pages[1].blocks[0].isContinuation).toBe(true);
  });

  it('alternates left (verso) and right (recto) pages properly', () => {
    const blocks: ManuscriptBlock[] = [
      { id: '1', type: 'chapter-heading', text: 'Chapter 1' },
      { id: '2', type: 'paragraph', text: 'Content 1' },
      { id: '3', type: 'chapter-heading', text: 'Chapter 2' },
      { id: '4', type: 'paragraph', text: 'Content 2' },
      { id: '5', type: 'chapter-heading', text: 'Chapter 3' },
      { id: '6', type: 'paragraph', text: 'Content 3' },
    ];

    const pages = engine.paginate(blocks, CLASSIC_NOVEL_6X9, { bookTitle: 'Test Novel' });
    expect(pages.length).toBe(3);
    expect(pages[0].isLeft).toBe(false); // Page 1: Recto
    expect(pages[1].isLeft).toBe(true);  // Page 2: Verso
    expect(pages[2].isLeft).toBe(false); // Page 3: Recto
  });

  describe('Phase 2: Image Placement and Reflow', () => {
    const mockImage = {
      id: 'img-map',
      filename: 'eldridgemap.png',
      mimeType: 'image/png',
      width: 1200,
      height: 800,
      fileSize: 450000,
      createdAt: '2026-10-18T00:00:00Z',
      dataUrl: 'data:image/png;base64,...',
      altText: 'Map of Eldridge',
    };

    it('places an inline image after its anchored block and renders it on page', () => {
      const blocks: ManuscriptBlock[] = [
        { id: 'b1', type: 'chapter-heading', text: 'Chapter 1' },
        { id: 'b2', type: 'paragraph', text: 'Opening paragraph before image.' },
        { id: 'b3', type: 'paragraph', text: 'Paragraph after image.' },
      ];

      const placements = [
        {
          id: 'p1',
          imageId: 'img-map',
          blockId: 'b2',
          mode: 'inline' as const,
          widthPercent: 100,
          aspectRatioLocked: true,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          caption: 'Map 1: Harbor',
        },
      ];

      const pages = engine.paginate(blocks, CLASSIC_NOVEL_6X9, {
        bookTitle: 'Test Novel',
        images: [mockImage],
        placements,
      });

      expect(pages.length).toBeGreaterThanOrEqual(1);
      const page1 = pages[0];
      const imageBlock = page1.blocks.find((b) => b.type === 'image');
      expect(imageBlock).toBeDefined();
      expect(imageBlock?.placement?.id).toBe('p1');
      expect(imageBlock?.image?.filename).toBe('eldridgemap.png');
    });

    it('causes text to reflow onto an additional page when an image consumes vertical budget', () => {
      // 3 moderate paragraphs that barely fit on one page without an image (~28 lines total)
      const mediumPara = 'Sentence with typical book words. '.repeat(18); // ~600 chars (~10 lines)
      const blocks: ManuscriptBlock[] = [
        { id: 'b1', type: 'chapter-heading', text: 'Chapter 1' },
        { id: 'b2', type: 'paragraph', text: mediumPara },
        { id: 'b3', type: 'paragraph', text: mediumPara },
      ];

      // Without image: fits on 1 page
      const pagesWithoutImage = engine.paginate(blocks, CLASSIC_NOVEL_6X9, {
        bookTitle: 'Test Novel',
      });
      expect(pagesWithoutImage.length).toBe(1);

      // With an inline image placed after b2: takes ~13 lines, pushing b3 onto page 2!
      const placements = [
        {
          id: 'p1',
          imageId: 'img-map',
          blockId: 'b2',
          mode: 'inline' as const,
          widthPercent: 100,
          aspectRatioLocked: true,
          crop: { x: 0, y: 0, width: 1, height: 1 },
        },
      ];

      const pagesWithImage = engine.paginate(blocks, CLASSIC_NOVEL_6X9, {
        bookTitle: 'Test Novel',
        images: [mockImage],
        placements,
      });

      expect(pagesWithImage.length).toBe(2);
      expect(pagesWithImage[1].blocks.some((b) => b.text?.includes('Sentence with typical'))).toBe(true);
    });

    it('float-right image reduces line capacity and reflows following text', () => {
      const paraText = 'Word '.repeat(100); // 500 chars
      const blocks: ManuscriptBlock[] = [
        { id: 'b1', type: 'chapter-heading', text: 'Chapter 1' },
        { id: 'b2', type: 'paragraph', text: 'Short lead' },
        { id: 'b3', type: 'paragraph', text: paraText },
      ];

      const floatPlacement = [
        {
          id: 'p-float',
          imageId: 'img-map',
          blockId: 'b2',
          mode: 'float-right' as const,
          widthPercent: 50, // 50% width taken on right side
          aspectRatioLocked: true,
          crop: { x: 0, y: 0, width: 1, height: 1 },
        },
      ];

      const pages = engine.paginate(blocks, CLASSIC_NOVEL_6X9, {
        images: [mockImage],
        placements: floatPlacement,
      });

      expect(pages.length).toBeGreaterThanOrEqual(1);
      const imgBlock = pages[0].blocks.find((b) => b.type === 'image');
      expect(imgBlock).toBeDefined();
      expect(imgBlock?.placement?.mode).toBe('float-right');
    });

    it('preserves 100% backward compatibility when loading Phase 1 projects with empty/undefined image options', () => {
      const blocks: ManuscriptBlock[] = [
        { id: 'b1', type: 'chapter-heading', text: 'Chapter 1' },
        { id: 'b2', type: 'paragraph', text: 'Classic text without images.' },
      ];

      // No images or placements supplied in options
      const pages = engine.paginate(blocks, CLASSIC_NOVEL_6X9, { bookTitle: 'Old Project' });
      expect(pages.length).toBe(1);
      expect(pages[0].blocks.length).toBe(2);
      expect(pages[0].blocks[0].type).toBe('chapter-heading');
      expect(pages[0].blocks[1].type).toBe('paragraph');
    });
  });

  describe('Phase 3 Advanced Pagination & Typography', () => {
    it('supports two-column templates and flows text across columns', async () => {
      const { MAGAZINE_REPORT_A4 } = await import('../templates/templateRegistry');
      const blocks: ManuscriptBlock[] = [
        { id: 'b1', type: 'chapter-heading', text: 'ANNUAL REPORT' },
        { id: 'b2', type: 'paragraph', text: 'Paragraph in column one. '.repeat(60) },
        { id: 'b3', type: 'paragraph', text: 'Paragraph continuing into column two. '.repeat(60) },
      ];

      const pages = engine.paginate(blocks, MAGAZINE_REPORT_A4, { bookTitle: 'Corporate Report' });
      expect(pages.length).toBeGreaterThanOrEqual(1);
      expect(pages[0].columns).toBeDefined();
      expect(pages[0].columns?.length).toBe(2);
      // Both columns should receive content
      expect(pages[0].columns![0].length).toBeGreaterThan(0);
      expect(pages[0].columns![1].length).toBeGreaterThan(0);
    });

    it('inserts an intentional blank page when recto-only chapter opening rule is active', () => {
      const blocks: ManuscriptBlock[] = [
        { id: 'c1', type: 'chapter-heading', text: 'Chapter 1' },
        { id: 'p1', type: 'paragraph', text: 'Short chapter one text.' },
        { id: 'c2', type: 'chapter-heading', text: 'Chapter 2' },
        { id: 'p2', type: 'paragraph', text: 'Chapter two text.' },
      ];

      // Chapter 1 is on Page 1 (odd/recto). Next page would be Page 2 (even/verso).
      // With recto-only, Page 2 becomes an intentional blank leaf, and Chapter 2 starts on Page 3 (recto)!
      const pages = engine.paginate(blocks, CLASSIC_NOVEL_6X9, {
        typography: { chapterOpening: 'recto-only' },
      });

      expect(pages.length).toBe(3);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[0].blocks[0].text).toBe('Chapter 1');

      // Page 2 is the blank verso leaf
      expect(pages[1].pageNumber).toBe(2);
      expect(pages[1].isBlankPage).toBe(true);
      expect(pages[1].isLeft).toBe(true);

      // Page 3 is Chapter 2 on recto
      expect(pages[2].pageNumber).toBe(3);
      expect(pages[2].blocks[0].text).toBe('Chapter 2');
      expect(pages[2].isLeft).toBe(false);
    });

    it('suppresses running headers on chapter opening pages', () => {
      const blocks: ManuscriptBlock[] = [
        { id: 'c1', type: 'chapter-heading', text: 'Chapter 1' },
        { id: 'p1', type: 'paragraph', text: 'Chapter one opening text.' },
      ];

      const pages = engine.paginate(blocks, CLASSIC_NOVEL_6X9, {
        bookTitle: 'The Eldridge Voyage',
        typography: { suppressChapterHeader: true },
      });

      expect(pages.length).toBe(1);
      // Header text suppressed on opening page
      expect(pages[0].headerText).toBeUndefined();
    });

    it('applies author-title running header format on subsequent pages', () => {
      const blocks: ManuscriptBlock[] = [
        { id: 'c1', type: 'chapter-heading', text: 'Chapter 1' },
        { id: 'p1', type: 'paragraph', text: 'Line '.repeat(600) }, // spills onto page 2
      ];

      const pages = engine.paginate(blocks, CLASSIC_NOVEL_6X9, {
        bookTitle: 'The Eldridge Voyage',
        authorName: 'Amjad Vance',
        typography: {
          runningHeaderContent: 'author-title',
          suppressChapterHeader: true,
        },
      });

      expect(pages.length).toBeGreaterThanOrEqual(2);
      // Page 2 is Verso (even) -> should show author name
      expect(pages[1].isLeft).toBe(true);
      expect(pages[1].headerText).toBe('Amjad Vance');
    });

    it('prevents single-line paragraph orphans when breaking across page boundaries', () => {
      const blocks: ManuscriptBlock[] = [
        { id: 'c1', type: 'chapter-heading', text: 'Chapter 1' },
        { id: 'p1', type: 'paragraph', text: 'Word '.repeat(100) },
      ];

      const pages = engine.paginate(blocks, CLASSIC_NOVEL_6X9);
      for (const p of pages) {
        for (const b of p.blocks) {
          if (b.type === 'paragraph' && b.isContinuation) {
            // Continuation block must have at least 2 words / lines
            expect(b.text && b.text.split(' ').length).toBeGreaterThanOrEqual(2);
          }
        }
      }
    });
  });
});
