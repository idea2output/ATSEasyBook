import {
  ManuscriptBlock,
  BookTemplate,
  PagePreviewData,
  PageBlock,
  BookImage,
  ImagePlacement,
  TypographySettings,
} from '@/types/book';
import { getEffectiveTypography } from '@/services/templates/templateRegistry';

export interface IPaginationOptions {
  bookTitle?: string;
  authorName?: string;
  images?: BookImage[];
  placements?: ImagePlacement[];
  typography?: Partial<TypographySettings>;
}

export interface IPaginationEngine {
  paginate(
    blocks: ManuscriptBlock[],
    template: BookTemplate,
    options?: IPaginationOptions
  ): PagePreviewData[];
}

/**
 * Calculates estimated vertical line budget for an image placement based on template geometry.
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

  // Height fraction calculation based on aspect ratio
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
 * Phase 3 Pagination Engine:
 * - Supports 1-column and 2-column page templates (e.g. A4 Magazine/Report).
 * - Implements widow and orphan prevention (no isolated headings at column/page bottom, minimum 2 lines when splitting paragraphs).
 * - Supports chapter opening rules: always new page vs. recto-only (with intentional blank verso pages).
 * - Supports running header suppressions on opening pages, and customizable running header content.
 * - Handles image reflow for inline, full-width, and float-right modes.
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

    const effectiveTypo = getEffectiveTypography(template, options?.typography, options?.authorName);

    // Compute effective lines and characters based on typography overrides
    const sizeScale = effectiveTypo.bodyFontSizePt / (template.typography.bodyFontSizePt || 10.5);
    const lineScale = effectiveTypo.bodyLineHeight / (template.typography.bodyLineHeight || 1.45);
    const maxLines = Math.max(15, Math.floor(template.linesPerPage / Math.max(0.7, sizeScale * lineScale)));
    const baseCharsPerLine = Math.max(25, Math.floor(template.charsPerLine / Math.max(0.7, sizeScale)));

    const isTwoColumn = template.columns.count === 2;
    const images = options?.images || [];
    const placements = options?.placements || [];

    // Map placements by anchored block ID
    const placementsByBlock = new Map<string, ImagePlacement[]>();
    for (const p of placements) {
      const list = placementsByBlock.get(p.blockId) || [];
      list.push(p);
      placementsByBlock.set(p.blockId, list);
    }

    const pages: PagePreviewData[] = [];
    let pageNumber = 1;
    let currentChapterTitle = '';

    // Active page column states
    let col1Blocks: PageBlock[] = [];
    let col2Blocks: PageBlock[] = [];
    let currentColIndex: 0 | 1 = 0; // 0 = left column, 1 = right column
    let col1LinesUsed = 0;
    let col2LinesUsed = 0;

    // Track active float-right state
    interface FloatState {
      linesRemaining: number;
      widthPercent: number;
    }
    const layoutContext: { activeFloat: FloatState | null } = {
      activeFloat: null,
    };

    const getActiveColBlocks = (): PageBlock[] => {
      return currentColIndex === 0 ? col1Blocks : col2Blocks;
    };

    const getActiveColLinesUsed = (): number => {
      return currentColIndex === 0 ? col1LinesUsed : col2LinesUsed;
    };

    const addLinesToActiveCol = (lines: number) => {
      if (currentColIndex === 0) {
        col1LinesUsed += lines;
      } else {
        col2LinesUsed += lines;
      }
    };

    const computeHeaderText = (isLeft: boolean, isChapterOpening: boolean): string | undefined => {
      if (isChapterOpening && effectiveTypo.suppressChapterHeader) {
        return undefined;
      }
      if (effectiveTypo.runningHeaderContent === 'none') {
        return undefined;
      }

      if (isLeft) {
        // Verso (even page)
        if (effectiveTypo.runningHeaderContent === 'author-title') {
          return effectiveTypo.authorName || options?.bookTitle || '';
        }
        return options?.bookTitle || '';
      } else {
        // Recto (odd page)
        if (effectiveTypo.runningHeaderContent === 'author-title') {
          return options?.bookTitle || '';
        }
        return currentChapterTitle || options?.bookTitle || '';
      }
    };

    const pushPage = (isChapterOpening?: boolean) => {
      const isLeft = pageNumber % 2 === 0;
      const allBlocksOnPage = [...col1Blocks, ...col2Blocks];

      if (allBlocksOnPage.length > 0) {
        const hasChapterHeading =
          isChapterOpening === true || allBlocksOnPage.some((b) => b.type === 'chapter-heading');
        const header = computeHeaderText(isLeft, hasChapterHeading);
        pages.push({
          pageNumber,
          isLeft,
          blocks: allBlocksOnPage,
          columns: isTwoColumn ? [[...col1Blocks], [...col2Blocks]] : [[...col1Blocks]],
          headerText: header,
        });
        pageNumber++;
      }

      col1Blocks = [];
      col2Blocks = [];
      col1LinesUsed = 0;
      col2LinesUsed = 0;
      currentColIndex = 0;
      layoutContext.activeFloat = null;
    };

    const advanceColumnOrPage = (isChapterOpening: boolean = false) => {
      if (isTwoColumn && currentColIndex === 0) {
        // In two-column layout, advance from column 1 to column 2 on the same page
        currentColIndex = 1;
        layoutContext.activeFloat = null;
      } else {
        // Advance to next page
        pushPage(isChapterOpening);
      }
    };

    const processPlacementsForBlock = (blockId: string) => {
      const blockPlacements = placementsByBlock.get(blockId);
      if (!blockPlacements || blockPlacements.length === 0) return;

      for (const placement of blockPlacements) {
        const image = images.find((img) => img.id === placement.imageId);
        if (!image) continue;

        const imageLines = calculateImageLinesBudget(placement, image, template);

        if (placement.mode === 'float-right') {
          const remainingLines = maxLines - getActiveColLinesUsed();
          if (remainingLines < 4) {
            advanceColumnOrPage();
          }

          getActiveColBlocks().push({
            blockId,
            type: 'image',
            placement,
            image,
          });

          layoutContext.activeFloat = {
            linesRemaining: imageLines,
            widthPercent: placement.widthPercent || 45,
          };
          addLinesToActiveCol(1);
        } else {
          // Inline or full-width
          layoutContext.activeFloat = null;
          const remainingLines = maxLines - getActiveColLinesUsed();

          if (remainingLines < imageLines) {
            advanceColumnOrPage();
          }

          getActiveColBlocks().push({
            blockId,
            type: 'image',
            placement,
            image,
          });
          addLinesToActiveCol(imageLines);
        }
      }
    };

    for (let bIndex = 0; bIndex < blocks.length; bIndex++) {
      const block = blocks[bIndex];

      if (block.type === 'chapter-heading') {
        currentChapterTitle = block.text;

        // Chapter opening: flush current page if not already clean
        if (col1Blocks.length > 0 || col2Blocks.length > 0) {
          pushPage(false);
        }

        // Recto-only rule: if chapter must open on recto (odd) and current page is even (verso),
        // insert an intentional blank verso leaf
        if (effectiveTypo.chapterOpening === 'recto-only') {
          const isEvenPage = pageNumber % 2 === 0;
          if (isEvenPage) {
            pages.push({
              pageNumber,
              isLeft: true,
              blocks: [],
              columns: isTwoColumn ? [[], []] : [[]],
              isBlankPage: true,
              headerText: undefined,
            });
            pageNumber++;
          }
        }

        // Heading size budget
        const headingLinesCount = Math.max(1, Math.ceil(block.text.length / (baseCharsPerLine * 0.75)));
        const headingTotalBudget = 4 + headingLinesCount + 2;

        col1Blocks.push({
          blockId: block.id,
          type: 'chapter-heading',
          text: block.text,
          direction: block.direction,
          language: block.language,
        });
        col1LinesUsed += headingTotalBudget;

        processPlacementsForBlock(block.id);
        continue;
      }

      if (block.type === 'page-break') {
        if (col1Blocks.length > 0 || col2Blocks.length > 0) {
          pushPage(false);
        }
        continue;
      }

      const isQuote = block.type === 'quote';
      const isCaption = block.type === 'caption';

      // Paragraph block
      const words = block.text.split(/\s+/).filter(Boolean);
      const totalWords = words.length;
      if (totalWords === 0) continue;

      let remainingWords = [...words];

      while (remainingWords.length > 0) {
        const remainingLines = maxLines - getActiveColLinesUsed();

        // Check for column/page break
        if (remainingLines <= 0) {
          advanceColumnOrPage();
          continue;
        }

        // Determine effective characters per line based on active float
        let effectiveChars = baseCharsPerLine;
        if (layoutContext.activeFloat && layoutContext.activeFloat.linesRemaining > 0) {
          const widthFraction = layoutContext.activeFloat.widthPercent / 100;
          effectiveChars = Math.max(18, Math.floor(baseCharsPerLine * (1 - widthFraction)));
        }

        const paragraphText = remainingWords.join(' ');
        const estimatedLines = Math.max(1, Math.ceil(paragraphText.length / effectiveChars));
        const paragraphSpacingLines = effectiveTypo.paragraphSpacingPt > 0 ? 1 : 0;
        const requiredLines = estimatedLines + paragraphSpacingLines;

        if (remainingLines >= requiredLines) {
          // Fits entirely in current column/page
          getActiveColBlocks().push({
            blockId: block.id,
            type: block.type,
            text: paragraphText,
            isContinuation: remainingWords.length < totalWords,
            direction: block.direction,
            language: block.language,
          });
          addLinesToActiveCol(requiredLines);

          if (layoutContext.activeFloat) {
            layoutContext.activeFloat.linesRemaining = Math.max(
              0,
              layoutContext.activeFloat.linesRemaining - estimatedLines
            );
            if (layoutContext.activeFloat.linesRemaining === 0) {
              layoutContext.activeFloat = null;
            }
          }
          remainingWords = [];
        } else if (remainingLines >= 3 && estimatedLines >= 4) {
          // Partial fit across boundary with WIDOW/ORPHAN prevention:
          // Minimum 2 lines on current page AND minimum 2 lines on continuation page
          const linesToFit = Math.max(2, remainingLines - paragraphSpacingLines);
          const charsToFit = linesToFit * effectiveChars;

          let accumulatedChars = 0;
          let splitIndex = 0;
          for (let i = 0; i < remainingWords.length; i++) {
            if (accumulatedChars + remainingWords[i].length + 1 > charsToFit) {
              break;
            }
            accumulatedChars += remainingWords[i].length + 1;
            splitIndex = i + 1;
          }

          const remainingWordsCount = remainingWords.length - splitIndex;
          const estimatedContinuationLines = Math.ceil(
            remainingWords.slice(splitIndex).join(' ').length / effectiveChars
          );

          // Only split if BOTH sides have at least 2 lines (publishing standard)
          if (splitIndex >= 4 && remainingWordsCount >= 4 && estimatedContinuationLines >= 2) {
            const firstPart = remainingWords.slice(0, splitIndex).join(' ');
            remainingWords = remainingWords.slice(splitIndex);

            getActiveColBlocks().push({
              blockId: block.id,
              type: block.type,
              text: firstPart,
              isContinuation: remainingWords.length + splitIndex < totalWords,
              direction: block.direction,
              language: block.language,
            });

            advanceColumnOrPage();
          } else {
            // Cannot satisfy 2-line widow/orphan rule: move full remaining paragraph to next column/page
            advanceColumnOrPage();
          }
        } else {
          // Less than 3 lines remaining: move to next column/page
          advanceColumnOrPage();
        }
      }

      processPlacementsForBlock(block.id);
    }

    // Flush any pending content on final page
    if (col1Blocks.length > 0 || col2Blocks.length > 0) {
      pushPage(false);
    }

    return pages;
  }
}

export const defaultPaginationEngine = new StandardPaginationEngine();
