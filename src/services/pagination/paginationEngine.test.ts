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
});
