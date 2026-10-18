export type BlockType = 'chapter-heading' | 'paragraph' | 'image';

export type PlacementMode = 'inline' | 'full-width' | 'float-right';

export interface NormalizedCrop {
  x: number; // 0 to 1 (left offset fraction)
  y: number; // 0 to 1 (top offset fraction)
  width: number; // 0 to 1 (width fraction)
  height: number; // 0 to 1 (height fraction)
}

export interface BookImage {
  id: string;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number; // bytes
  createdAt: string; // ISO 8601
  dataUrl: string; // base64 preview/source
  altText: string;
  caption?: string;
}

export interface ImagePlacement {
  id: string;
  imageId: string;
  blockId: string; // Anchored after this manuscript block ID
  mode: PlacementMode; // 'inline' | 'full-width' | 'float-right'
  widthPercent: number; // Relative to usable text content area width (e.g. 100% or 45%)
  heightPercent?: number; // Optional height override
  aspectRatioLocked: boolean;
  crop: NormalizedCrop;
  caption?: string;
  altText?: string;
}

export interface ManuscriptBlock {
  id: string;
  type: BlockType;
  text: string;
  chapterNumber?: number;
}

export interface PageBlock {
  blockId: string;
  type: BlockType;
  text?: string;
  isContinuation?: boolean;
  placement?: ImagePlacement;
  image?: BookImage;
}

export interface PagePreviewData {
  pageNumber: number;
  isLeft: boolean; // Even pages are left (verso), odd pages are right (recto)
  blocks: PageBlock[];
  columns?: PageBlock[][]; // For multi-column layouts (e.g. 2 columns per page)
  headerText?: string;
  isBlankPage?: boolean; // For intentional blank pages (e.g. before recto chapter start)
}

export interface TemplateMargins {
  top: string;
  bottom: string;
  inside: string; // binding edge (left on recto, right on verso)
  outside: string; // outer edge
  gutter: string; // binding allowance
  topInches: number;
  bottomInches: number;
  insideInches: number;
  outsideInches: number;
  gutterInches: number;
}

export interface TemplateColumns {
  count: 1 | 2;
  gap: string;
  gapInches: number;
}

export interface TemplateTypography {
  fontFamily: string;
  bodyFontSizePt: number;
  bodyLineHeight: number;
  chapterHeadingFontSizePt: number;
  chapterHeadingLineHeight: number;
  paragraphIndentInches: number;
  paragraphSpacingPt: number;
  textAlign: 'left' | 'justify';
  headingStyle: {
    fontFamily: string;
    fontSizePt: number;
    alignment: 'left' | 'center';
    textTransform?: 'uppercase' | 'none';
    spaceBeforePt: number;
    spaceAfterPt: number;
  };
}

export interface TemplateHeadersFooters {
  showRunningHeaders: boolean;
  showPageNumbers: boolean;
  pageNumberPosition: 'bottom-center' | 'bottom-outside' | 'top-outside';
  runningHeaderFormat: 'title-chapter' | 'author-title' | 'none';
}

export interface TemplateImageConstraints {
  maxInlineWidthPercent: number;
  maxFloatWidthPercent: number;
  minDpi: number;
}

export interface BookTemplate {
  id: string;
  name: string;
  category: 'fiction' | 'nonfiction' | 'illustrated' | 'magazine';
  description: string;
  suitability?: string | string[]; // e.g. "Novels, Memoirs, Fiction" or ["Novels", "Memoirs"]
  isCustom?: boolean; // true if created by user
  design?: Partial<PageDesignSettings>; // default design settings for this template
  pageWidthInches: number;
  pageHeightInches: number;
  bleedInches: number;
  safeAreaInches: number;
  margins: TemplateMargins;
  columns: TemplateColumns;
  typography: TemplateTypography;
  headersFooters: TemplateHeadersFooters;
  imageConstraints: TemplateImageConstraints;
  // Budget parameters for pagination estimation
  linesPerPage: number;
  charsPerLine: number;
}

export type EditorMode = 'beginner' | 'expert';

export type BackgroundImageSize = 'cover' | 'contain' | 'tile';
export type BorderStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'none';

export interface PageDesignSettings {
  // Page Background
  backgroundColor: string; // e.g. '#ffffff', '#fdfbf7'
  backgroundImage?: string; // Data URL or asset path
  backgroundImageUrl?: string; // Data URL or asset path
  backgroundImageSize?: BackgroundImageSize;

  // Page Border
  borderEnabled: boolean;
  borderColor: string;
  borderWidthPt: number;
  borderStyle: BorderStyle;
  borderRadiusPt: number;
  borderInsetInches: number; // distance from page edge inward

  // Element Colors
  textColor: string; // Body text color (e.g. '#0f172a')
  headingColor: string; // Chapter heading text color (e.g. '#1e293b')
  headerFooterColor: string; // Running header and page number color (e.g. '#64748b')
}

export type CustomFontFormat = 'ttf' | 'otf' | 'woff' | 'woff2';

export interface CustomFont {
  id: string;
  familyName: string;
  format: CustomFontFormat;
  fileName: string;
  fileSizeBytes: number;
  dataUrl: string; // base64 Data URL
  createdAt: string; // ISO 8601
  canEmbedInPdf: boolean; // true for TTF/OTF
}

export interface TypographySettings {
  bodyFontFamily: string;
  bodyFontSizePt: number;
  bodyLineHeight: number;
  paragraphIndentInches: number;
  paragraphSpacingPt: number;
  textAlign: 'left' | 'justify';
  headingFontFamily: string;
  headingFontSizePt: number;
  chapterOpening: 'always-new-page' | 'recto-only';
  suppressChapterHeader: boolean;
  authorName: string;
  pageNumberPosition: 'bottom-center' | 'bottom-outside' | 'top-outside';
  runningHeaderContent: 'title-chapter' | 'author-title' | 'none';
}

export type PreflightSeverity = 'error' | 'warning';

export interface PreflightIssue {
  id: string;
  severity: PreflightSeverity;
  category: 'manuscript' | 'image' | 'geometry' | 'typography' | 'storage' | 'design' | 'font';
  title: string;
  description: string;
  pageNumber?: number;
  imageId?: string;
  placementId?: string;
  actionType?:
    | 'go-to-page'
    | 'select-image'
    | 'open-typography'
    | 'open-library'
    | 'open-blocks'
    | 'open-design'
    | 'open-fonts';
  actionLabel?: string;
}

export interface PreflightSummary {
  errorsCount: number;
  warningsCount: number;
  passedCount: number;
  totalPages: number;
  trimSize: string;
  estimatedPdfSizeMb: number;
  issues: PreflightIssue[];
}

export interface PdfExportOptions {
  includeBleed: boolean;
  includeCropMarks: boolean;
  acknowledgedWarnings: boolean;
}

export interface BookProject {
  id: string;
  title: string;
  author?: string;
  rawManuscript: string;
  templateId: string;
  editorMode?: EditorMode; // 'beginner' (default) | 'expert'
  design?: Partial<PageDesignSettings>; // visual design settings
  customFonts?: CustomFont[]; // uploaded custom fonts
  formattedBlocks: ManuscriptBlock[];
  images: BookImage[];
  placements: ImagePlacement[];
  typography?: Partial<TypographySettings>;
  exportOptions?: Partial<PdfExportOptions>;
  isSample?: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
