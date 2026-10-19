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
import {
  measureTextWidthPt,
  wrapParagraphIntoLines,
  FontMetricsOptions,
} from './textLayoutMeasurer';

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
 * Calculates accurate vertical line budget for an image placement based on physical geometry.
 */
export function calculateImageLinesBudget(
  placement: ImagePlacement,
  image: BookImage,
  template: BookTemplate,
  bodyLineHeightPt: number = 14
): number {
  const crop = placement.crop || { x: 0, y: 0, width: 1, height: 1 };
  const effectiveWidth = Math.max(1, image.width * (crop.width || 1));
  const effectiveHeight = Math.max(1, image.height * (crop.height || 1));
  const aspectRatio = effectiveWidth / effectiveHeight;

  // Physical column width in points
  const insidePt = (template.margins.insideInches + template.margins.gutterInches) * 72;
  const outsidePt = template.margins.outsideInches * 72;
  const contentWidthPt = (template.pageWidthInches * 72) - (insidePt + outsidePt);
  const colWidthPt = template.columns.count === 2
    ? (contentWidthPt - (template.columns.gapInches * 72)) / 2
    : contentWidthPt;

  const widthFraction = Math.max(0.1, Math.min(1.0, (placement.widthPercent || 100) / 100));
  const renderWidthPt = colWidthPt * widthFraction;
  const renderHeightPt = renderWidthPt / Math.max(0.2, aspectRatio);

  let totalImageHeightPt = renderHeightPt + 8; // image margin
  if (placement.caption && placement.caption.trim()) {
    totalImageHeightPt += bodyLineHeightPt * 2; // caption + caption margin
  }

  const estimatedLines = Math.max(3, Math.ceil(totalImageHeightPt / Math.max(8, bodyLineHeightPt)));
  const pageLines = template.linesPerPage || 32;
  return Math.min(Math.floor(pageLines * 0.85), estimatedLines);
}

/**
 * Phase 7 Accurate Text-Flow Pagination Engine:
 * - Computes true usable vertical space using physical point dimensions, margins, running headers, and footers.
 * - Fills all usable vertical column and page space before advancing, eliminating premature blank gaps.
 * - Performs accurate typography wrapping via textLayoutMeasurer.
 * - Enforces publishing standard 2-line widow and orphan prevention.
 * - Supports 1-column and 2-column templates with correct LTR (left->right) and RTL (right->left) reading order.
 * - Preserves recto-only chapter opening rules with intentional blank pages.
 * - Accurately integrates inline, full-width, and float-right image reflow.
 * - Guarantees 100% text conservation: no lost, duplicated, or overlapping blocks.
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

    // ------------------------------------------------------------------
    // Physical Page Geometry in Points (72 pt = 1 inch)
    // ------------------------------------------------------------------
    const pageWidthPt = template.pageWidthInches * 72;
    const pageHeightPt = template.pageHeightInches * 72;
    const topPt = template.margins.topInches * 72;
    const bottomPt = template.margins.bottomInches * 72;
    const insidePt = (template.margins.insideInches + template.margins.gutterInches) * 72;
    const outsidePt = template.margins.outsideInches * 72;

    // Check if template defines an explicit flowing-text content zone
    const textZone = template.contentZones?.find((z) => z.type === 'flowing-text');
    const isTwoColumn = textZone?.columns === 2 || template.columns.count === 2;
    const colGapPt = isTwoColumn ? ((textZone?.columnGapInches ?? template.columns.gapInches) * 72) : 0;

    let contentWidthPt: number;
    let standardUsableHeightPt: number;

    // Reserved header and footer allowances in points
    const headerAllowancePt = template.headersFooters.showRunningHeaders ? 34 : 0;
    const footerAllowancePt = (template.headersFooters.showPageNumbers && effectiveTypo.pageNumberPosition !== 'top-outside') ? 26 : 0;

    if (textZone && textZone.widthInches > 0 && textZone.heightInches > 0) {
      contentWidthPt = textZone.widthInches * 72;
      standardUsableHeightPt = textZone.heightInches * 72;
    } else {
      contentWidthPt = Math.max(100, pageWidthPt - (insidePt + outsidePt));
      standardUsableHeightPt = Math.max(200, pageHeightPt - (topPt + bottomPt) - headerAllowancePt - footerAllowancePt);
    }

    const colWidthPt = isTwoColumn ? (contentWidthPt - colGapPt) / 2 : contentWidthPt;

    // Body font metrics
    const bodyFontOptions: FontMetricsOptions = {
      fontFamily: effectiveTypo.bodyFontFamily,
      fontSizePt: effectiveTypo.bodyFontSizePt,
      lineHeight: effectiveTypo.bodyLineHeight,
    };
    const bodyLineHeightPt = Math.max(10, effectiveTypo.bodyFontSizePt * effectiveTypo.bodyLineHeight);

    // Usable body height
    const openingUsableHeightPt = effectiveTypo.suppressChapterHeader && !textZone
      ? Math.max(200, pageHeightPt - (topPt + bottomPt) - footerAllowancePt)
      : standardUsableHeightPt;

    // True maximum lines per column
    const standardMaxLines = Math.max(18, Math.floor(standardUsableHeightPt / bodyLineHeightPt));
    const openingMaxLines = Math.max(18, Math.floor(openingUsableHeightPt / bodyLineHeightPt));

    // Images and placements map
    const images = options?.images || [];
    const placements = options?.placements || [];
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
    let currentColIndex: 0 | 1 = 0; // 0 = left column (LTR) or right column (RTL), 1 = opposite column
    let col1LinesUsed = 0;
    let col2LinesUsed = 0;
    let pageIsChapterOpening = false;

    // Active float state: lines remaining and width percent
    const layoutContext: { activeFloat: { linesRemaining: number; widthPercent: number } | null } = {
      activeFloat: null,
    };

    const getActiveMaxLines = (): number => {
      return (pageIsChapterOpening && currentColIndex === 0) ? openingMaxLines : standardMaxLines;
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

    const pushPage = (isOpening: boolean = false) => {
      const isLeft = pageNumber % 2 === 0;
      const allBlocksOnPage = [...col1Blocks, ...col2Blocks];

      if (allBlocksOnPage.length > 0) {
        const hasChapterHeading =
          isOpening === true ||
          pageIsChapterOpening ||
          allBlocksOnPage.some((b) => b.type === 'chapter-heading');

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
      pageIsChapterOpening = false;
      layoutContext.activeFloat = null;
    };

    const advanceColumnOrPage = (isOpening: boolean = false) => {
      if (isTwoColumn && currentColIndex === 0) {
        // In two-column layout, advance from column 1 to column 2 on the same page
        currentColIndex = 1;
        layoutContext.activeFloat = null;
      } else {
        // Advance to next page
        pushPage(isOpening);
      }
    };

    const processPlacementsForBlock = (blockId: string) => {
      const blockPlacements = placementsByBlock.get(blockId);
      if (!blockPlacements || blockPlacements.length === 0) return;

      for (const placement of blockPlacements) {
        const image = images.find((img) => img.id === placement.imageId);
        if (!image) continue;

        const imageLines = calculateImageLinesBudget(placement, image, template, bodyLineHeightPt);
        const maxLines = getActiveMaxLines();

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

      // -------------------------------------------------------------
      // CHAPTER HEADING
      // -------------------------------------------------------------
      if (block.type === 'chapter-heading') {
        currentChapterTitle = block.text;

        // Flush active page content if not already clean
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

        pageIsChapterOpening = true;

        // Heading typographic lines calculation
        const headingFontOptions: FontMetricsOptions = {
          fontFamily: effectiveTypo.headingFontFamily,
          fontSizePt: effectiveTypo.headingFontSizePt,
          lineHeight: template.typography.chapterHeadingLineHeight || 1.25,
          isBold: true,
        };
        const wrappedHeadingLines = wrapParagraphIntoLines(block.text, colWidthPt, headingFontOptions, 0);
        const headingLineCount = Math.max(1, wrappedHeadingLines.length);

        const headingTotalHeightPt =
          headingLineCount * (effectiveTypo.headingFontSizePt * (template.typography.chapterHeadingLineHeight || 1.25)) +
          (template.typography.headingStyle.spaceBeforePt || 20) +
          (template.typography.headingStyle.spaceAfterPt || 12);

        const headingEquivalentBodyLines = Math.max(3, Math.ceil(headingTotalHeightPt / bodyLineHeightPt));

        col1Blocks.push({
          blockId: block.id,
          type: 'chapter-heading',
          text: block.text,
          direction: block.direction,
          language: block.language,
        });
        col1LinesUsed += headingEquivalentBodyLines;

        processPlacementsForBlock(block.id);
        continue;
      }

      // -------------------------------------------------------------
      // PAGE BREAK
      // -------------------------------------------------------------
      if (block.type === 'page-break') {
        if (col1Blocks.length > 0 || col2Blocks.length > 0) {
          pushPage(false);
        }
        continue;
      }

      // -------------------------------------------------------------
      // PARAGRAPH, QUOTE, OR CAPTION
      // -------------------------------------------------------------
      const trimmedText = (block.text || '').trim();
      if (!trimmedText) continue;

      const isQuote = block.type === 'quote';
      const isCaption = block.type === 'caption';

      // Check first-line indent eligibility (no indent for quotes, captions, or immediately following headings)
      const prevBlock = bIndex > 0 ? blocks[bIndex - 1] : null;
      const isAfterHeading = prevBlock && prevBlock.type === 'chapter-heading';
      const firstLineIndentPt = (!isAfterHeading && !isQuote && !isCaption && effectiveTypo.paragraphIndentInches > 0)
        ? effectiveTypo.paragraphIndentInches * 72
        : 0;

      // Font options for paragraph / quote
      const currentFontOptions: FontMetricsOptions = isQuote
        ? { ...bodyFontOptions, isItalic: true }
        : bodyFontOptions;

      // Wrap paragraph into exact lines based on column width and active float
      let wrappedLines = wrapParagraphIntoLines(
        trimmedText,
        colWidthPt,
        currentFontOptions,
        firstLineIndentPt,
        layoutContext.activeFloat
          ? {
              linesRemaining: layoutContext.activeFloat.linesRemaining,
              floatWidthPercent: layoutContext.activeFloat.widthPercent,
              marginPt: 12,
            }
          : undefined
      );

      const totalLinesNeeded = wrappedLines.length;
      if (totalLinesNeeded === 0) continue;

      const paragraphSpacingLines = effectiveTypo.paragraphSpacingPt > 0
        ? Math.max(1, Math.ceil(effectiveTypo.paragraphSpacingPt / bodyLineHeightPt))
        : 0;

      let lineCursor = 0;
      let isFirstFragment = true;

      while (lineCursor < totalLinesNeeded) {
        const maxLines = getActiveMaxLines();
        const linesUsed = getActiveColLinesUsed();
        const remainingLines = maxLines - linesUsed;

        // If column is completely filled, advance column or page
        if (remainingLines <= 0) {
          advanceColumnOrPage();
          continue;
        }

        const linesLeftInParagraph = totalLinesNeeded - lineCursor;

        // CASE 1: Remaining lines in this paragraph fit entirely in current column
        if (linesLeftInParagraph <= remainingLines) {
          const linesToTake = wrappedLines.slice(lineCursor, totalLinesNeeded);
          const fragmentText = linesToTake.map((l) => l.text).join(' ');

          getActiveColBlocks().push({
            blockId: block.id,
            type: block.type,
            text: fragmentText,
            isContinuation: !isFirstFragment,
            direction: block.direction,
            language: block.language,
          });

          addLinesToActiveCol(linesLeftInParagraph + paragraphSpacingLines);

          if (layoutContext.activeFloat) {
            layoutContext.activeFloat.linesRemaining = Math.max(
              0,
              layoutContext.activeFloat.linesRemaining - linesLeftInParagraph
            );
            if (layoutContext.activeFloat.linesRemaining === 0) {
              layoutContext.activeFloat = null;
            }
          }

          lineCursor = totalLinesNeeded; // Finished
        } else {
          // CASE 2: Paragraph is larger than remaining lines in this column
          // We must split with strict WIDOW and ORPHAN prevention:
          // - Orphan rule: minimum 2 lines at the bottom of the current column
          // - Widow rule: minimum 2 lines at the top of the next column

          if (remainingLines < 2) {
            // Cannot satisfy 2-line orphan rule: advance to next column/page
            advanceColumnOrPage();
            continue;
          }

          // Compute lines to take while protecting against a 1-line widow on next column
          let takeCount = remainingLines;
          const continuationLines = linesLeftInParagraph - takeCount;

          if (continuationLines === 1) {
            // Leaving 1 line on next column would create a widow: hold back 1 line if possible
            if (takeCount - 1 >= 2) {
              takeCount = takeCount - 1; // Take remainingLines - 1, leaves 2 lines on next column
            } else {
              // Cannot satisfy both 2-line orphan and 2-line widow rules:
              // Move entire remaining paragraph to next column/page!
              advanceColumnOrPage();
              continue;
            }
          }

          const linesToTake = wrappedLines.slice(lineCursor, lineCursor + takeCount);
          const fragmentText = linesToTake.map((l) => l.text).join(' ');

          getActiveColBlocks().push({
            blockId: block.id,
            type: block.type,
            text: fragmentText,
            isContinuation: !isFirstFragment,
            direction: block.direction,
            language: block.language,
          });

          addLinesToActiveCol(takeCount);
          lineCursor += takeCount;
          isFirstFragment = false;

          if (layoutContext.activeFloat) {
            layoutContext.activeFloat.linesRemaining = Math.max(
              0,
              layoutContext.activeFloat.linesRemaining - takeCount
            );
            if (layoutContext.activeFloat.linesRemaining === 0) {
              layoutContext.activeFloat = null;
            }
          }

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
