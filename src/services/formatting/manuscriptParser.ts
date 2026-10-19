import { ManuscriptBlock, BlockType } from '@/types/book';
import { detectTextDirection } from '@/services/rtl/bidiService';

/**
 * Checks whether a single line qualifies as a chapter heading based on rules:
 * 1. Begins with "Chapter" followed by a number (e.g., "Chapter 1", "Chapter 2: The Journey", "CHAPTER 10")
 * 2. Arabic & Urdu chapter titles (e.g. "الفصل 1", "الباب الأول", "باب 1")
 * 3. Written entirely in uppercase Latin letters, contains at least one letter, and is shorter than 80 characters
 *    (Arabic, Urdu, and Devanagari have no uppercase case system, so they are not falsely matched).
 */
export function isChapterHeading(line: string): { isHeading: boolean; chapterNumber?: number } {
  const trimmed = line.trim();
  if (!trimmed) {
    return { isHeading: false };
  }

  // Rule 1: English "Chapter" followed by a number
  const chapterNumberMatch = trimmed.match(/^chapter\s+(\d+)/i);
  if (chapterNumberMatch) {
    return {
      isHeading: true,
      chapterNumber: parseInt(chapterNumberMatch[1], 10),
    };
  }

  // Rule 2: Arabic Chapter Prefixes (الفصل, الباب)
  const arabicMatch = trimmed.match(
    /^(?:الفصل|الباب)\s+(?:(\d+|[٠-٩]+)|الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر)/i
  );
  if (arabicMatch) {
    const numStr = arabicMatch[1];
    let num: number | undefined = undefined;
    if (numStr) {
      // Convert Arabic-Indic numerals if needed
      const latinNum = numStr.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
      num = parseInt(latinNum, 10);
    }
    return { isHeading: true, chapterNumber: num };
  }

  // Rule 3: Urdu Chapter Prefixes (باب 1, پہلا باب, etc.)
  const urduMatch = trimmed.match(/^(?:باب\s+(\d+|[۰-۹]+)|(?:پہلا|دوسرا|تیسرا|چوتھا|پانچواں)\s+باب)/i);
  if (urduMatch) {
    const numStr = urduMatch[1];
    let num: number | undefined = undefined;
    if (numStr) {
      const latinNum = numStr.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
      num = parseInt(latinNum, 10);
    }
    return { isHeading: true, chapterNumber: num };
  }

  // Rule 4: Written entirely in uppercase Latin and shorter than 80 characters
  if (trimmed.length < 80) {
    const hasLatinLetters = /[A-Z]/.test(trimmed);
    const hasNoLatinLowerCase = !/[a-z]/.test(trimmed);
    const hasArabicOrDevanagari = /[\u0600-\u06FF\u0900-\u097F]/.test(trimmed);

    // Only apply uppercase rule if string actually has Latin letters and NO Arabic/Devanagari
    if (hasLatinLetters && hasNoLatinLowerCase && !hasArabicOrDevanagari) {
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
 * - Automatically detects block script direction (LTR, RTL, mixed).
 * - Preserves content and creates unique deterministic block IDs.
 */
export function parseManuscript(
  rawText: string,
  existingBlocks: ManuscriptBlock[] = []
): ManuscriptBlock[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  // Retain manual overrides by text match if available
  const overrideMap = new Map<string, Partial<ManuscriptBlock>>();
  for (const eb of existingBlocks) {
    if (eb.isManualOverride) {
      overrideMap.set(eb.text.trim(), {
        type: eb.type,
        direction: eb.direction,
        language: eb.language,
        isManualOverride: true,
      });
    }
  }

  // Split text into paragraph chunks at blank lines
  const rawParagraphs = rawText.split(/\r?\n\s*\r?\n/);
  const blocks: ManuscriptBlock[] = [];
  let blockIndex = 0;

  for (const rawParagraph of rawParagraphs) {
    const trimmedChunk = rawParagraph.trim();
    if (!trimmedChunk) {
      continue;
    }

    const lines = trimmedChunk.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    if (lines.length === 1) {
      const singleLine = lines[0];
      const override = overrideMap.get(singleLine);

      if (override) {
        blocks.push({
          id: `block-${blockIndex++}`,
          type: override.type || 'paragraph',
          text: singleLine,
          direction: override.direction || (detectTextDirection(singleLine) as 'ltr' | 'rtl' | 'auto'),
          language: override.language,
          isManualOverride: true,
        });
        continue;
      }

      const headingCheck = isChapterHeading(singleLine);
      if (headingCheck.isHeading) {
        blocks.push({
          id: `block-${blockIndex++}`,
          type: 'chapter-heading',
          text: singleLine,
          chapterNumber: headingCheck.chapterNumber,
          direction: detectTextDirection(singleLine) as 'ltr' | 'rtl' | 'auto',
        });
        continue;
      }
    }

    let currentParagraphLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingCheck = isChapterHeading(line);

      if (headingCheck.isHeading) {
        if (currentParagraphLines.length > 0) {
          const paraText = currentParagraphLines.join(' ');
          const override = overrideMap.get(paraText);
          blocks.push({
            id: `block-${blockIndex++}`,
            type: override?.type || 'paragraph',
            text: paraText,
            direction: override?.direction || (detectTextDirection(paraText) as 'ltr' | 'rtl' | 'auto'),
            language: override?.language,
            isManualOverride: override?.isManualOverride,
          });
          currentParagraphLines = [];
        }

        blocks.push({
          id: `block-${blockIndex++}`,
          type: 'chapter-heading',
          text: line,
          chapterNumber: headingCheck.chapterNumber,
          direction: detectTextDirection(line) as 'ltr' | 'rtl' | 'auto',
        });
      } else {
        currentParagraphLines.push(line);
      }
    }

    if (currentParagraphLines.length > 0) {
      const paraText = currentParagraphLines.join(' ');
      const override = overrideMap.get(paraText);
      blocks.push({
        id: `block-${blockIndex++}`,
        type: override?.type || 'paragraph',
        text: paraText,
        direction: override?.direction || (detectTextDirection(paraText) as 'ltr' | 'rtl' | 'auto'),
        language: override?.language,
        isManualOverride: override?.isManualOverride,
      });
    }
  }

  return blocks;
}
