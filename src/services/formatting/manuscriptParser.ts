import { ManuscriptBlock, BlockType } from '@/types/book';

/**
 * Checks whether a single line qualifies as a chapter heading based on rules:
 * 1. Begins with "Chapter" followed by a number (e.g., "Chapter 1", "Chapter 2: The Journey", "CHAPTER 10")
 * 2. Written entirely in uppercase, contains at least one letter, and is shorter than 80 characters
 */
export function isChapterHeading(line: string): { isHeading: boolean; chapterNumber?: number } {
  const trimmed = line.trim();
  if (!trimmed) {
    return { isHeading: false };
  }

  // Rule 1: Begins with "Chapter" followed by a number
  const chapterNumberMatch = trimmed.match(/^chapter\s+(\d+)/i);
  if (chapterNumberMatch) {
    return {
      isHeading: true,
      chapterNumber: parseInt(chapterNumberMatch[1], 10),
    };
  }

  // Rule 2: Written entirely in uppercase and shorter than 80 characters
  if (trimmed.length < 80) {
    const hasLetters = /[A-Z]/.test(trimmed);
    const hasNoLowerCase = !/[a-z]/.test(trimmed);
    if (hasLetters && hasNoLowerCase) {
      // Check if it mentions a number for chapterNumber
      const numMatch = trimmed.match(/\b(\d+)\b/);
      return {
        isHeading: true,
        chapterNumber: numMatch ? parseInt(numMatch[1], 10) : undefined,
      };
    }
  }

  return { isHeading: false };
}

/**
 * Formats manuscript text into structured blocks according to the rules:
 * - Splits text into paragraphs at blank lines.
 * - Identifies chapter headings according to criteria.
 * - Preserves content and creates unique deterministic block IDs.
 */
export function parseManuscript(rawText: string): ManuscriptBlock[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  // Split text into paragraph chunks at blank lines (one or more empty/whitespace lines)
  const rawParagraphs = rawText.split(/\r?\n\s*\r?\n/);
  const blocks: ManuscriptBlock[] = [];
  let blockIndex = 0;

  for (const rawParagraph of rawParagraphs) {
    const trimmedChunk = rawParagraph.trim();
    if (!trimmedChunk) {
      continue;
    }

    // A paragraph chunk may be a single line (like a heading) or multiple lines.
    // If the entire trimmed chunk is a single line that satisfies chapter heading:
    const lines = trimmedChunk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    if (lines.length === 1) {
      const headingCheck = isChapterHeading(lines[0]);
      if (headingCheck.isHeading) {
        blocks.push({
          id: `block-${blockIndex++}`,
          type: 'chapter-heading',
          text: lines[0],
          chapterNumber: headingCheck.chapterNumber,
        });
        continue;
      }
    }

    // In cases where a heading is immediately on the first line followed by paragraph text without blank lines:
    let currentParagraphLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingCheck = isChapterHeading(line);

      if (headingCheck.isHeading) {
        // If we had preceding paragraph lines accumulated, flush them
        if (currentParagraphLines.length > 0) {
          blocks.push({
            id: `block-${blockIndex++}`,
            type: 'paragraph',
            text: currentParagraphLines.join(' '),
          });
          currentParagraphLines = [];
        }

        // Add the chapter heading block
        blocks.push({
          id: `block-${blockIndex++}`,
          type: 'chapter-heading',
          text: line,
          chapterNumber: headingCheck.chapterNumber,
        });
      } else {
        currentParagraphLines.push(line);
      }
    }

    if (currentParagraphLines.length > 0) {
      blocks.push({
        id: `block-${blockIndex++}`,
        type: 'paragraph',
        text: currentParagraphLines.join(' '),
      });
    }
  }

  return blocks;
}
