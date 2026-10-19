import { BookTemplate, PageDesignSettings, TypographySettings } from '@/types/book';

export const DEFAULT_PAGE_DESIGN: PageDesignSettings = {
  backgroundColor: '#ffffff',
  backgroundImageUrl: undefined,
  backgroundImageSize: 'cover',
  borderEnabled: false,
  borderColor: '#cbd5e1',
  borderWidthPt: 1,
  borderStyle: 'solid',
  borderRadiusPt: 0,
  borderInsetInches: 0.35,
  textColor: '#0f172a',
  headingColor: '#1e293b',
  headerFooterColor: '#64748b',
};

export const CLASSIC_NOVEL_6X9: BookTemplate = {
  id: 'classic-novel-6x9',
  name: 'Classic Novel, 6 × 9 inches',
  category: 'fiction',
  description: 'Traditional standard trade paperback format (6 × 9 in) with elegant serif typography, generous margins, and mirrored spreads.',
  suitability: 'Novels, Memoirs, Literary Fiction',
  pageWidthInches: 6.0,
  pageHeightInches: 9.0,
  bleedInches: 0.125,
  safeAreaInches: 0.25,
  margins: {
    top: '0.85in',
    bottom: '0.85in',
    inside: '0.85in',
    outside: '0.65in',
    gutter: '0.125in',
    topInches: 0.85,
    bottomInches: 0.85,
    insideInches: 0.85,
    outsideInches: 0.65,
    gutterInches: 0.125,
  },
  columns: {
    count: 1,
    gap: '0in',
    gapInches: 0,
  },
  typography: {
    fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
    bodyFontSizePt: 10.5,
    bodyLineHeight: 1.45,
    chapterHeadingFontSizePt: 19,
    chapterHeadingLineHeight: 1.25,
    paragraphIndentInches: 0.25,
    paragraphSpacingPt: 0,
    textAlign: 'justify',
    headingStyle: {
      fontFamily: 'Georgia, Cambria, serif',
      fontSizePt: 19,
      alignment: 'center',
      textTransform: 'none',
      spaceBeforePt: 24,
      spaceAfterPt: 14,
    },
  },
  headersFooters: {
    showRunningHeaders: true,
    showPageNumbers: true,
    pageNumberPosition: 'bottom-center',
    runningHeaderFormat: 'title-chapter',
  },
  imageConstraints: {
    maxInlineWidthPercent: 100,
    maxFloatWidthPercent: 50,
    minDpi: 300,
  },
  linesPerPage: 32,
  charsPerLine: 64,
};

export const DIGEST_NOVEL_5_5X8_5: BookTemplate = {
  id: 'digest-novel-5.5x8.5',
  name: 'Digest Novel, 5.5 × 8.5 inches',
  category: 'fiction',
  description: 'Compact commercial fiction format (5.5 × 8.5 in) ideal for novellas, literary fiction, and pocket editions.',
  suitability: 'Novellas, Short Stories, Poetry',
  pageWidthInches: 5.5,
  pageHeightInches: 8.5,
  bleedInches: 0.125,
  safeAreaInches: 0.25,
  margins: {
    top: '0.75in',
    bottom: '0.75in',
    inside: '0.8in',
    outside: '0.6in',
    gutter: '0.1in',
    topInches: 0.75,
    bottomInches: 0.75,
    insideInches: 0.8,
    outsideInches: 0.6,
    gutterInches: 0.1,
  },
  columns: {
    count: 1,
    gap: '0in',
    gapInches: 0,
  },
  typography: {
    fontFamily: 'Garamond, "EB Garamond", Georgia, serif',
    bodyFontSizePt: 10.0,
    bodyLineHeight: 1.4,
    chapterHeadingFontSizePt: 17,
    chapterHeadingLineHeight: 1.2,
    paragraphIndentInches: 0.22,
    paragraphSpacingPt: 0,
    textAlign: 'justify',
    headingStyle: {
      fontFamily: 'Garamond, Georgia, serif',
      fontSizePt: 17,
      alignment: 'center',
      textTransform: 'uppercase',
      spaceBeforePt: 20,
      spaceAfterPt: 12,
    },
  },
  headersFooters: {
    showRunningHeaders: true,
    showPageNumbers: true,
    pageNumberPosition: 'bottom-outside',
    runningHeaderFormat: 'author-title',
  },
  imageConstraints: {
    maxInlineWidthPercent: 100,
    maxFloatWidthPercent: 45,
    minDpi: 300,
  },
  linesPerPage: 30,
  charsPerLine: 58,
};

export const STANDARD_PAPERBACK_6X9: BookTemplate = {
  id: 'standard-paperback-6x9',
  name: 'Standard Paperback, 6 × 9 inches',
  category: 'fiction',
  description: 'Clean modern trade paperback format (6 × 9 in) with balanced proportions suitable for wide commercial distribution.',
  suitability: 'Commercial Fiction, Thrillers, Sci-Fi',
  pageWidthInches: 6.0,
  pageHeightInches: 9.0,
  bleedInches: 0.125,
  safeAreaInches: 0.25,
  margins: {
    top: '0.8in',
    bottom: '0.8in',
    inside: '0.8in',
    outside: '0.6in',
    gutter: '0.1in',
    topInches: 0.8,
    bottomInches: 0.8,
    insideInches: 0.8,
    outsideInches: 0.6,
    gutterInches: 0.1,
  },
  columns: {
    count: 1,
    gap: '0in',
    gapInches: 0,
  },
  typography: {
    fontFamily: '"Times New Roman", Times, Georgia, serif',
    bodyFontSizePt: 11.0,
    bodyLineHeight: 1.42,
    chapterHeadingFontSizePt: 18,
    chapterHeadingLineHeight: 1.25,
    paragraphIndentInches: 0.25,
    paragraphSpacingPt: 0,
    textAlign: 'justify',
    headingStyle: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSizePt: 18,
      alignment: 'left',
      textTransform: 'none',
      spaceBeforePt: 22,
      spaceAfterPt: 14,
    },
  },
  headersFooters: {
    showRunningHeaders: true,
    showPageNumbers: true,
    pageNumberPosition: 'bottom-center',
    runningHeaderFormat: 'title-chapter',
  },
  imageConstraints: {
    maxInlineWidthPercent: 100,
    maxFloatWidthPercent: 50,
    minDpi: 300,
  },
  linesPerPage: 33,
  charsPerLine: 65,
};

export const NONFICTION_6X9: BookTemplate = {
  id: 'nonfiction-6x9',
  name: 'Nonfiction, 6 × 9 inches',
  category: 'nonfiction',
  description: 'Authoritative nonfiction layout with clean sans-serif display headings, paragraph block spacing, and prominent chapter dividers.',
  suitability: 'Nonfiction, Memoirs, Business, Academic',
  pageWidthInches: 6.0,
  pageHeightInches: 9.0,
  bleedInches: 0.125,
  safeAreaInches: 0.25,
  margins: {
    top: '0.8in',
    bottom: '0.8in',
    inside: '0.85in',
    outside: '0.65in',
    gutter: '0.125in',
    topInches: 0.8,
    bottomInches: 0.8,
    insideInches: 0.85,
    outsideInches: 0.65,
    gutterInches: 0.125,
  },
  columns: {
    count: 1,
    gap: '0in',
    gapInches: 0,
  },
  typography: {
    fontFamily: 'Merriweather, Georgia, serif',
    bodyFontSizePt: 10.0,
    bodyLineHeight: 1.5,
    chapterHeadingFontSizePt: 20,
    chapterHeadingLineHeight: 1.2,
    paragraphIndentInches: 0,
    paragraphSpacingPt: 6,
    textAlign: 'left',
    headingStyle: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSizePt: 20,
      alignment: 'left',
      textTransform: 'none',
      spaceBeforePt: 26,
      spaceAfterPt: 16,
    },
  },
  headersFooters: {
    showRunningHeaders: true,
    showPageNumbers: true,
    pageNumberPosition: 'top-outside',
    runningHeaderFormat: 'title-chapter',
  },
  imageConstraints: {
    maxInlineWidthPercent: 100,
    maxFloatWidthPercent: 55,
    minDpi: 300,
  },
  linesPerPage: 31,
  charsPerLine: 62,
};

export const ILLUSTRATED_BOOK_8X10: BookTemplate = {
  id: 'illustrated-book-8x10',
  name: 'Illustrated Book, 8 × 10 inches',
  category: 'illustrated',
  description: 'Expansive format (8 × 10 in) designed for art books, photography memoirs, children\'s books, and image-heavy narratives.',
  suitability: 'Art Collections, Photography, Cookbooks',
  pageWidthInches: 8.0,
  pageHeightInches: 10.0,
  bleedInches: 0.125,
  safeAreaInches: 0.3,
  margins: {
    top: '0.9in',
    bottom: '0.9in',
    inside: '0.9in',
    outside: '0.7in',
    gutter: '0.15in',
    topInches: 0.9,
    bottomInches: 0.9,
    insideInches: 0.9,
    outsideInches: 0.7,
    gutterInches: 0.15,
  },
  columns: {
    count: 1,
    gap: '0in',
    gapInches: 0,
  },
  typography: {
    fontFamily: 'Palatino, "Palatino Linotype", Georgia, serif',
    bodyFontSizePt: 11.5,
    bodyLineHeight: 1.55,
    chapterHeadingFontSizePt: 22,
    chapterHeadingLineHeight: 1.25,
    paragraphIndentInches: 0.28,
    paragraphSpacingPt: 4,
    textAlign: 'justify',
    headingStyle: {
      fontFamily: 'Palatino, Georgia, serif',
      fontSizePt: 22,
      alignment: 'center',
      textTransform: 'none',
      spaceBeforePt: 28,
      spaceAfterPt: 18,
    },
  },
  headersFooters: {
    showRunningHeaders: true,
    showPageNumbers: true,
    pageNumberPosition: 'bottom-center',
    runningHeaderFormat: 'title-chapter',
  },
  imageConstraints: {
    maxInlineWidthPercent: 100,
    maxFloatWidthPercent: 60,
    minDpi: 300,
  },
  linesPerPage: 32,
  charsPerLine: 70,
};

export const MAGAZINE_REPORT_A4: BookTemplate = {
  id: 'magazine-report-a4',
  name: 'Magazine/Report, A4',
  category: 'magazine',
  description: 'International A4 format (8.27 × 11.69 in / 210 × 297 mm) with a dynamic two-column grid, ideal for periodicals, annual reports, and whitepapers.',
  suitability: 'Annual Reports, Periodicals, Manuals',
  pageWidthInches: 8.27,
  pageHeightInches: 11.69,
  bleedInches: 0.125,
  safeAreaInches: 0.25,
  margins: {
    top: '0.85in',
    bottom: '0.85in',
    inside: '0.75in',
    outside: '0.75in',
    gutter: '0.0in',
    topInches: 0.85,
    bottomInches: 0.85,
    insideInches: 0.75,
    outsideInches: 0.75,
    gutterInches: 0.0,
  },
  columns: {
    count: 2,
    gap: '0.25in',
    gapInches: 0.25,
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    bodyFontSizePt: 9.5,
    bodyLineHeight: 1.45,
    chapterHeadingFontSizePt: 22,
    chapterHeadingLineHeight: 1.2,
    paragraphIndentInches: 0,
    paragraphSpacingPt: 6,
    textAlign: 'left',
    headingStyle: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSizePt: 22,
      alignment: 'left',
      textTransform: 'none',
      spaceBeforePt: 24,
      spaceAfterPt: 14,
    },
  },
  headersFooters: {
    showRunningHeaders: true,
    showPageNumbers: true,
    pageNumberPosition: 'bottom-outside',
    runningHeaderFormat: 'author-title',
  },
  imageConstraints: {
    maxInlineWidthPercent: 100,
    maxFloatWidthPercent: 75,
    minDpi: 300,
  },
  linesPerPage: 44,
  charsPerLine: 45, // Characters per column in 2-column layout
};

export const CUSTOM_PAGE_DEFAULT: BookTemplate = {
  id: 'custom-page-template',
  name: 'Custom Page',
  category: 'fiction',
  description: 'Fully customizable page geometry, margins, columns, typography, and visual styling.',
  suitability: 'Any Book Format, Custom Sizes',
  isCustom: true,
  pageWidthInches: 6.0,
  pageHeightInches: 9.0,
  bleedInches: 0.125,
  safeAreaInches: 0.25,
  margins: {
    top: '0.75in',
    bottom: '0.75in',
    inside: '0.75in',
    outside: '0.625in',
    gutter: '0.125in',
    topInches: 0.75,
    bottomInches: 0.75,
    insideInches: 0.75,
    outsideInches: 0.625,
    gutterInches: 0.125,
  },
  columns: {
    count: 1,
    gap: '0in',
    gapInches: 0,
  },
  typography: {
    fontFamily: 'Georgia, Cambria, "Times New Roman", serif',
    bodyFontSizePt: 10.5,
    bodyLineHeight: 1.45,
    chapterHeadingFontSizePt: 19,
    chapterHeadingLineHeight: 1.25,
    paragraphIndentInches: 0.25,
    paragraphSpacingPt: 0,
    textAlign: 'justify',
    headingStyle: {
      fontFamily: 'Georgia, Cambria, serif',
      fontSizePt: 19,
      alignment: 'center',
      textTransform: 'none',
      spaceBeforePt: 24,
      spaceAfterPt: 14,
    },
  },
  headersFooters: {
    showRunningHeaders: true,
    showPageNumbers: true,
    pageNumberPosition: 'bottom-center',
    runningHeaderFormat: 'title-chapter',
  },
  imageConstraints: {
    maxInlineWidthPercent: 100,
    maxFloatWidthPercent: 50,
    minDpi: 300,
  },
  linesPerPage: 32,
  charsPerLine: 64,
  design: {
    backgroundColor: '#ffffff',
    borderEnabled: false,
    borderColor: '#cbd5e1',
    borderWidthPt: 1,
    borderStyle: 'solid',
    borderRadiusPt: 0,
    borderInsetInches: 0.35,
    textColor: '#0f172a',
    headingColor: '#1e293b',
    headerFooterColor: '#64748b',
  },
};

export const AVAILABLE_TEMPLATES: BookTemplate[] = [
  CLASSIC_NOVEL_6X9,
  DIGEST_NOVEL_5_5X8_5,
  STANDARD_PAPERBACK_6X9,
  NONFICTION_6X9,
  ILLUSTRATED_BOOK_8X10,
  MAGAZINE_REPORT_A4,
];

export function getTemplateById(id: string): BookTemplate {
  if (id === 'custom-page-template') {
    return CUSTOM_PAGE_DEFAULT;
  }
  const template = AVAILABLE_TEMPLATES.find((t) => t.id === id);
  if (template) return template;

  // Check localStorage for saved custom templates if in browser environment
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('ats_easybook_custom_templates_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const match = parsed.find((t: any) => t.id === id);
          if (match) return match;
        }
      }
    } catch {
      // fallback
    }
  }

  return CLASSIC_NOVEL_6X9;
}

/**
 * Combines template defaults with user-configured project typography overrides.
 */
export function getEffectiveTypography(
  template: BookTemplate,
  overrides?: Partial<TypographySettings>,
  authorName: string = ''
): TypographySettings {
  return {
    bodyFontFamily:
      overrides?.bodyFontFamily ||
      (template.typography as any).bodyFontFamily ||
      template.typography.fontFamily ||
      'Georgia, serif',
    bodyFontSizePt: overrides?.bodyFontSizePt || template.typography.bodyFontSizePt,
    bodyLineHeight: overrides?.bodyLineHeight || template.typography.bodyLineHeight,
    paragraphIndentInches:
      overrides?.paragraphIndentInches !== undefined
        ? overrides.paragraphIndentInches
        : template.typography.paragraphIndentInches,
    paragraphSpacingPt:
      overrides?.paragraphSpacingPt !== undefined
        ? overrides.paragraphSpacingPt
        : template.typography.paragraphSpacingPt,
    textAlign: overrides?.textAlign || template.typography.textAlign,
    headingFontFamily:
      overrides?.headingFontFamily || template.typography.headingStyle.fontFamily,
    headingFontSizePt:
      overrides?.headingFontSizePt || template.typography.chapterHeadingFontSizePt,
    chapterOpening: overrides?.chapterOpening || 'always-new-page',
    suppressChapterHeader:
      overrides?.suppressChapterHeader !== undefined ? overrides.suppressChapterHeader : true,
    authorName: overrides?.authorName || authorName || '',
    pageNumberPosition:
      overrides?.pageNumberPosition || template.headersFooters?.pageNumberPosition || 'bottom-center',
    runningHeaderContent:
      overrides?.runningHeaderContent || template.headersFooters?.runningHeaderFormat || 'title-chapter',
  };
}
