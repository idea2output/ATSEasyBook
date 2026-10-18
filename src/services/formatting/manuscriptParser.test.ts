import { describe, it, expect } from 'vitest';
import { parseManuscript, isChapterHeading } from './manuscriptParser';

describe('manuscriptParser', () => {
  describe('isChapterHeading', () => {
    it('detects Chapter followed by a number', () => {
      expect(isChapterHeading('Chapter 1').isHeading).toBe(true);
      expect(isChapterHeading('Chapter 1').chapterNumber).toBe(1);
      expect(isChapterHeading('Chapter 42: The Unknown Sea').isHeading).toBe(true);
      expect(isChapterHeading('Chapter 42: The Unknown Sea').chapterNumber).toBe(42);
      expect(isChapterHeading('CHAPTER 3').isHeading).toBe(true);
      expect(isChapterHeading('CHAPTER 3').chapterNumber).toBe(3);
    });

    it('detects short uppercase titles (< 80 chars)', () => {
      expect(isChapterHeading('PROLOGUE').isHeading).toBe(true);
      expect(isChapterHeading('PART ONE').isHeading).toBe(true);
      expect(isChapterHeading('THE DEPARTURE').isHeading).toBe(true);
    });

    it('does not treat long uppercase lines (>= 80 chars) as chapter headings', () => {
      const longUppercase = 'A'.repeat(85);
      expect(isChapterHeading(longUppercase).isHeading).toBe(false);
    });

    it('does not treat regular lowercase or sentence-case paragraphs as headings', () => {
      expect(isChapterHeading('It was the best of times, it was the worst of times.').isHeading).toBe(false);
      expect(isChapterHeading('chapter without number').isHeading).toBe(false);
    });

    it('handles empty or whitespace lines safely', () => {
      expect(isChapterHeading('').isHeading).toBe(false);
      expect(isChapterHeading('   ').isHeading).toBe(false);
    });
  });

  describe('parseManuscript', () => {
    it('returns an empty array for empty or whitespace text', () => {
      expect(parseManuscript('')).toEqual([]);
      expect(parseManuscript('   \n\n  ')).toEqual([]);
    });

    it('splits text into paragraphs at blank lines and preserves text content', () => {
      const text = `First paragraph text here.
Still first paragraph.

Second paragraph here.`;

      const blocks = parseManuscript(text);
      expect(blocks.length).toBe(2);
      expect(blocks[0].type).toBe('paragraph');
      expect(blocks[0].text).toContain('First paragraph text here.');
      expect(blocks[0].text).toContain('Still first paragraph.');
      expect(blocks[1].type).toBe('paragraph');
      expect(blocks[1].text).toBe('Second paragraph here.');
    });

    it('identifies chapter headings and separates them from body paragraphs', () => {
      const text = `Chapter 1: The Voyage Begins

The morning light broke through the fog. Captain Vance adjusted his coat.

CHAPTER 2: INTO THE STORM

The wind howled across the deck as the waves crested high.`;

      const blocks = parseManuscript(text);
      expect(blocks.length).toBe(4);

      expect(blocks[0].type).toBe('chapter-heading');
      expect(blocks[0].text).toBe('Chapter 1: The Voyage Begins');
      expect(blocks[0].chapterNumber).toBe(1);

      expect(blocks[1].type).toBe('paragraph');
      expect(blocks[1].text).toContain('The morning light broke through');

      expect(blocks[2].type).toBe('chapter-heading');
      expect(blocks[2].text).toBe('CHAPTER 2: INTO THE STORM');

      expect(blocks[3].type).toBe('paragraph');
      expect(blocks[3].text).toContain('The wind howled across the deck');
    });

    it('handles headings written on the line right before paragraph text', () => {
      const text = `PROLOGUE
Before the world was shaped, there were only stars and deep waters.`;

      const blocks = parseManuscript(text);
      expect(blocks.length).toBe(2);
      expect(blocks[0].type).toBe('chapter-heading');
      expect(blocks[0].text).toBe('PROLOGUE');
      expect(blocks[1].type).toBe('paragraph');
      expect(blocks[1].text).toContain('Before the world was shaped');
    });
  });
});
