import { ManuscriptBlock, BookTemplate, PagePreviewData, PageBlock } from '@/types/book';

export interface IPaginationEngine {
  paginate(
    blocks: ManuscriptBlock[],
    template: BookTemplate,
    options?: { bookTitle?: string }
  ): PagePreviewData[];
}

/**
 * Standard approximate pagination engine for trade books (6x9 in).
 * Flows blocks across pages based on line budgets, chapter breaks, and paragraph line wrapping.
 * Keeps clean boundaries, calculates running headers, and marks verso (left) / recto (right) spreads.
 */
export class StandardPaginationEngine implements IPaginationEngine {
  paginate(
    blocks: ManuscriptBlock[],
    template: BookTemplate,
    options?: { bookTitle?: string }
  ): PagePreviewData[] {
    if (!blocks || blocks.length === 0) {
      return [];
    }

    const pages: PagePreviewData[] = [];
    const maxLines = template.linesPerPage || 32;
    const charsPerLine = template.charsPerLine || 64;

    let currentPageBlocks: PageBlock[] = [];
    let currentLinesUsed = 0;
    let pageNumber = 1;
    let currentChapterTitle = '';

    const pushPage = (headerText?: string) => {
      const isLeft = pageNumber % 2 === 0;
      pages.push({
        pageNumber,
        isLeft,
        blocks: [...currentPageBlocks],
        headerText,
      });
      pageNumber++;
      currentPageBlocks = [];
      currentLinesUsed = 0;
    };

    for (let bIndex = 0; bIndex < blocks.length; bIndex++) {
      const block = blocks[bIndex];

      if (block.type === 'chapter-heading') {
        currentChapterTitle = block.text;

        // In traditional book design, chapters start on a fresh page
        if (currentPageBlocks.length > 0) {
          // Push current page (with header if it's not the first page of a chapter)
          const header = pageNumber % 2 === 0 ? options?.bookTitle : currentChapterTitle;
          pushPage(header);
        }

        // Chapter heading space: top drop + heading line(s) + bottom spacing
        const headingLinesCount = Math.max(1, Math.ceil(block.text.length / (charsPerLine * 0.75)));
        const headingTotalBudget = 4 + headingLinesCount + 2; // ~6-8 lines total budget

        currentPageBlocks.push({
          blockId: block.id,
          type: 'chapter-heading',
          text: block.text,
        });
        currentLinesUsed += headingTotalBudget;

        // Traditional publishing omits the header on the opening chapter page
        continue;
      }

      // Body paragraph
      const words = block.text.split(/\s+/).filter(Boolean);
      const totalWords = words.length;
      if (totalWords === 0) continue;

      // Estimate lines needed for this paragraph
      const estimatedLines = Math.max(1, Math.ceil(block.text.length / charsPerLine));
      const paragraphSpacingLines = 1; // Visual space between paragraphs
      const requiredLines = estimatedLines + paragraphSpacingLines;

      const remainingLines = maxLines - currentLinesUsed;

      if (remainingLines >= requiredLines) {
        // Fits entirely on current page
        currentPageBlocks.push({
          blockId: block.id,
          type: 'paragraph',
          text: block.text,
        });
        currentLinesUsed += requiredLines;
      } else if (remainingLines >= 3 && estimatedLines > 3) {
        // Partial fit: flow part of paragraph to current page, remainder to next page
        // Calculate how many words can fit in remaining lines
        const linesToFit = remainingLines - paragraphSpacingLines;
        const charsToFit = linesToFit * charsPerLine;

        let accumulatedChars = 0;
        let splitIndex = 0;
        for (let i = 0; i < words.length; i++) {
          if (accumulatedChars + words[i].length + 1 > charsToFit) {
            break;
          }
          accumulatedChars += words[i].length + 1;
          splitIndex = i + 1;
        }

        // Avoid tiny 1-line or 2-word widows
        if (splitIndex > 5 && splitIndex < totalWords - 5) {
          const firstPart = words.slice(0, splitIndex).join(' ');
          const secondPart = words.slice(splitIndex).join(' ');

          currentPageBlocks.push({
            blockId: block.id,
            type: 'paragraph',
            text: firstPart,
          });

          // End current page
          const isLeft = pageNumber % 2 === 0;
          const header = isLeft ? options?.bookTitle : currentChapterTitle;
          pushPage(header);

          // Continuation on next page
          currentPageBlocks.push({
            blockId: block.id,
            type: 'paragraph',
            text: secondPart,
            isContinuation: true,
          });
          const continuationLines = Math.max(1, Math.ceil(secondPart.length / charsPerLine)) + paragraphSpacingLines;
          currentLinesUsed = continuationLines;
        } else {
          // Push entire paragraph to next page
          const isLeft = pageNumber % 2 === 0;
          const header = isLeft ? options?.bookTitle : currentChapterTitle;
          pushPage(header);

          currentPageBlocks.push({
            blockId: block.id,
            type: 'paragraph',
            text: block.text,
          });
          currentLinesUsed = requiredLines;
        }
      } else {
        // Not enough room on current page, move paragraph to next page
        const isLeft = pageNumber % 2 === 0;
        const header = isLeft ? options?.bookTitle : currentChapterTitle;
        pushPage(header);

        currentPageBlocks.push({
          blockId: block.id,
          type: 'paragraph',
          text: block.text,
        });
        currentLinesUsed = requiredLines;
      }
    }

    // Flush any remaining blocks
    if (currentPageBlocks.length > 0) {
      const isLeft = pageNumber % 2 === 0;
      const header = isLeft ? options?.bookTitle : currentChapterTitle;
      pushPage(header);
    }

    return pages;
  }
}

// Default singleton instance for easy pluggability
export const defaultPaginationEngine = new StandardPaginationEngine();
