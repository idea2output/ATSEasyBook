import {
  ManuscriptBlock,
  BookTemplate,
  PagePreviewData,
  PageBlock,
  BookImage,
  ImagePlacement,
} from '@/types/book';

export interface IPaginationOptions {
  bookTitle?: string;
  images?: BookImage[];
  placements?: ImagePlacement[];
}

export interface IPaginationEngine {
  paginate(
    blocks: ManuscriptBlock[],
    template: BookTemplate,
    options?: IPaginationOptions
  ): PagePreviewData[];
}

/**
 * Calculates estimated vertical line budget for an image placement on a 6x9 page.
 */
export function calculateImageLinesBudget(
  placement: ImagePlacement,
  image: BookImage,
  template: BookTemplate
): number {
  const maxLines = template.linesPerPage || 32;
  const crop = placement.crop || { x: 0, y: 0, width: 1, height: 1 };
  const effectiveWidth = Math.max(1, image.width * (crop.width || 1));
  const effectiveHeight = Math.max(1, image.height * (crop.height || 1));
  const aspectRatio = effectiveWidth / effectiveHeight; // width / height

  // Relative width fraction (e.g. 100% -> 1.0, 45% -> 0.45)
  const widthFraction = Math.max(0.1, Math.min(1.0, (placement.widthPercent || 100) / 100));

  // In standard 6x9 trade novel formatting, usable text area is ~4.5" W x 7.3" H.
  // A square image (1.0 aspect) at 100% width occupies ~60% page height (~19 lines).
  const heightFraction = (widthFraction / Math.max(0.2, aspectRatio)) * 0.62;
  let estimatedLines = Math.round(maxLines * heightFraction);

  // Additional budget for caption text
  if (placement.caption && placement.caption.trim()) {
    estimatedLines += 2;
  }

  // Margin buffer
  estimatedLines += 1;

  // Clamp budget so an image takes between 3 and 85% of page lines
  return Math.max(3, Math.min(Math.floor(maxLines * 0.85), estimatedLines));
}

/**
 * Image-aware approximate pagination engine for trade books (6x9 in).
 * Flows blocks and anchored images across pages based on line budgets, chapter breaks,
 * paragraph wrapping, and float-right text reflow.
 */
export class StandardPaginationEngine implements IPaginationEngine {
  paginate(
    blocks: ManuscriptBlock[],
    template: BookTemplate,
    options?: IPaginationOptions
  ): PagePreviewData[] {
    if (!blocks || blocks.length === 0) {
      return [];
    }

    const pages: PagePreviewData[] = [];
    const maxLines = template.linesPerPage || 32;
    const baseCharsPerLine = template.charsPerLine || 64;

    const images = options?.images || [];
    const placements = options?.placements || [];

    // Map placements by anchored block ID
    const placementsByBlock = new Map<string, ImagePlacement[]>();
    for (const p of placements) {
      const list = placementsByBlock.get(p.blockId) || [];
      list.push(p);
      placementsByBlock.set(p.blockId, list);
    }

    let currentPageBlocks: PageBlock[] = [];
    let currentLinesUsed = 0;
    let pageNumber = 1;
    let currentChapterTitle = '';

    // Track layout state including float-right image wrapping on current page
    interface FloatState {
      linesRemaining: number;
      widthPercent: number;
    }
    const layoutContext: { activeFloat: FloatState | null } = {
      activeFloat: null,
    };

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
      layoutContext.activeFloat = null; // Float does not cross page boundary in this phase
    };

    const processPlacementsForBlock = (blockId: string) => {
      const blockPlacements = placementsByBlock.get(blockId);
      if (!blockPlacements || blockPlacements.length === 0) return;

      for (const placement of blockPlacements) {
        const image = images.find((img) => img.id === placement.imageId);
        if (!image) continue;

        const imageLines = calculateImageLinesBudget(placement, image, template);

        if (placement.mode === 'float-right') {
          // If page has fewer than 4 lines remaining, push float-right to new page
          const remainingLines = maxLines - currentLinesUsed;
          if (remainingLines < 4) {
            const isLeft = pageNumber % 2 === 0;
            const header = isLeft ? options?.bookTitle : currentChapterTitle;
            pushPage(header);
          }

          currentPageBlocks.push({
            blockId,
            type: 'image',
            placement,
            image,
          });

          // Set active float-right wrapping for subsequent paragraph lines
          layoutContext.activeFloat = {
            linesRemaining: imageLines,
            widthPercent: placement.widthPercent || 45,
          };
          currentLinesUsed += 1;
        } else {
          // Inline or Full-width image: takes full text-column vertically
          // End any active float-right before an inline/full-width block
          layoutContext.activeFloat = null;

          const remainingLines = maxLines - currentLinesUsed;
          if (remainingLines < imageLines) {
            // Push current page, start image at top of next page
            const isLeft = pageNumber % 2 === 0;
            const header = isLeft ? options?.bookTitle : currentChapterTitle;
            pushPage(header);
          }

          currentPageBlocks.push({
            blockId,
            type: 'image',
            placement,
            image,
          });
          currentLinesUsed += imageLines;
        }
      }
    };

    for (let bIndex = 0; bIndex < blocks.length; bIndex++) {
      const block = blocks[bIndex];

      if (block.type === 'chapter-heading') {
        currentChapterTitle = block.text;

        // In traditional book design, chapters start on a fresh page
        if (currentPageBlocks.length > 0) {
          const header = pageNumber % 2 === 0 ? options?.bookTitle : currentChapterTitle;
          pushPage(header);
        }

        const headingLinesCount = Math.max(1, Math.ceil(block.text.length / (baseCharsPerLine * 0.75)));
        const headingTotalBudget = 4 + headingLinesCount + 2;

        currentPageBlocks.push({
          blockId: block.id,
          type: 'chapter-heading',
          text: block.text,
        });
        currentLinesUsed += headingTotalBudget;

        // Check for images placed after chapter heading
        processPlacementsForBlock(block.id);
        continue;
      }

      // Paragraph flow
      const words = block.text.split(/\s+/).filter(Boolean);
      const totalWords = words.length;
      if (totalWords === 0) continue;

      let remainingWords = [...words];

      while (remainingWords.length > 0) {
        const remainingLines = maxLines - currentLinesUsed;

        if (remainingLines <= 0) {
          const isLeft = pageNumber % 2 === 0;
          const header = isLeft ? options?.bookTitle : currentChapterTitle;
          pushPage(header);
          continue;
        }

        // Determine effective characters per line based on active float-right
        let effectiveCharsPerLine = baseCharsPerLine;
        if (layoutContext.activeFloat && layoutContext.activeFloat.linesRemaining > 0) {
          const widthFraction = layoutContext.activeFloat.widthPercent / 100;
          effectiveCharsPerLine = Math.max(20, Math.floor(baseCharsPerLine * (1 - widthFraction)));
        }

        const paragraphText = remainingWords.join(' ');
        const estimatedLines = Math.max(1, Math.ceil(paragraphText.length / effectiveCharsPerLine));
        const paragraphSpacingLines = 1;
        const requiredLines = estimatedLines + paragraphSpacingLines;

        if (remainingLines >= requiredLines) {
          // Fits entirely on current page
          currentPageBlocks.push({
            blockId: block.id,
            type: 'paragraph',
            text: paragraphText,
            isContinuation: remainingWords.length < totalWords,
          });
          currentLinesUsed += requiredLines;

          if (layoutContext.activeFloat) {
            layoutContext.activeFloat.linesRemaining = Math.max(0, layoutContext.activeFloat.linesRemaining - estimatedLines);
            if (layoutContext.activeFloat.linesRemaining === 0) {
              layoutContext.activeFloat = null;
            }
          }
          remainingWords = [];
        } else if (remainingLines >= 3 && estimatedLines > 3) {
          // Partial fit: split cleanly across page boundary
          const linesToFit = remainingLines - paragraphSpacingLines;
          const charsToFit = linesToFit * effectiveCharsPerLine;

          let accumulatedChars = 0;
          let splitIndex = 0;
          for (let i = 0; i < remainingWords.length; i++) {
            if (accumulatedChars + remainingWords[i].length + 1 > charsToFit) {
              break;
            }
            accumulatedChars += remainingWords[i].length + 1;
            splitIndex = i + 1;
          }

          if (splitIndex > 3 && splitIndex < remainingWords.length - 3) {
            const firstPart = remainingWords.slice(0, splitIndex).join(' ');
            remainingWords = remainingWords.slice(splitIndex);

            currentPageBlocks.push({
              blockId: block.id,
              type: 'paragraph',
              text: firstPart,
              isContinuation: remainingWords.length + splitIndex < totalWords,
            });

            // End current page
            const isLeft = pageNumber % 2 === 0;
            const header = isLeft ? options?.bookTitle : currentChapterTitle;
            pushPage(header);
          } else {
            // Push remaining paragraph to next page
            const isLeft = pageNumber % 2 === 0;
            const header = isLeft ? options?.bookTitle : currentChapterTitle;
            pushPage(header);
          }
        } else {
          // Move remaining paragraph to next page
          const isLeft = pageNumber % 2 === 0;
          const header = isLeft ? options?.bookTitle : currentChapterTitle;
          pushPage(header);
        }
      }

      // Check for images placed after this paragraph block
      processPlacementsForBlock(block.id);
    }

    if (currentPageBlocks.length > 0) {
      const isLeft = pageNumber % 2 === 0;
      const header = isLeft ? options?.bookTitle : currentChapterTitle;
      pushPage(header);
    }

    return pages;
  }
}

export const defaultPaginationEngine = new StandardPaginationEngine();
