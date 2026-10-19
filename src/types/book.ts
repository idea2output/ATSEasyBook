export type BlockType = 'chapter-heading' | 'paragraph' | 'quote' | 'caption' | 'page-break' | 'image';

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
  direction?: 'ltr' | 'rtl' | 'auto';
  language?: string; // e.g. 'en', 'ar', 'ur', 'hi'
  isManualOverride?: boolean;
}

export interface PageBlock {
  blockId: string;
  type: BlockType;
  text?: string;
  isContinuation?: boolean;
  direction?: 'ltr' | 'rtl' | 'auto';
  language?: string;
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

export type TemplateUnit = 'in' | 'mm' | 'pt';

export type TemplateLayerType =
  | 'solid'
  | 'image'
  | 'rectangle'
  | 'line'
  | 'shape'
  | 'border'
  | 'text'
  | 'page-number'
  | 'guide';

export interface TemplateLayer {
  id: string;
  name: string;
  type: TemplateLayerType;
  xInches: number;
  yInches: number;
  widthInches: number;
  heightInches: number;
  rotationDeg?: number;
  opacity?: number; // 0 to 1
  zIndex: number;
  locked: boolean;
  visible: boolean;
  printOnly?: boolean; // Does not export to reflowable EPUB
  nonPrintingGuide?: boolean; // Guide lines, never printed in PDF
  // Style properties
  fillColor?: string; // hex e.g. '#e2e8f0'
  strokeColor?: string; // hex
  strokeWidthPt?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
  borderRadiusPt?: number;
  // Image properties
  imageDataUrl?: string;
  imageFit?: 'cover' | 'contain' | 'tile';
  // Text properties
  text?: string;
  fontFamily?: string;
  fontSizePt?: number;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  // Mirroring on verso (left/even) pages
  mirrorOnVerso?: boolean;
}

export type ContentZoneType =
  | 'flowing-text'
  | 'chapter-heading'
  | 'image'
  | 'caption'
  | 'header'
  | 'footer'
  | 'page-number';

export interface ContentZone {
  id: string;
  name: string;
  type: ContentZoneType;
  xInches: number;
  yInches: number;
  widthInches: number;
  heightInches: number;
  columns?: 1 | 2;
  columnGapInches?: number;
  mirrorOnVerso?: boolean;
}

export type TemplateStatus = 'draft' | 'published' | 'archived';
export type TemplateVisibility = 'private' | 'organization' | 'team' | 'admin-only';

export interface TemplateGovernance {
  status: TemplateStatus;
  visibility: TemplateVisibility;
  version: number;
  ownerId?: string;
  organizationId?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
  allowedTeamIds?: string[];
}

export interface BookTemplate {
  id: string;
  name: string;
  category: 'fiction' | 'nonfiction' | 'illustrated' | 'magazine';
  description: string;
  suitability?: string | string[]; // e.g. "Novels, Memoirs, Fiction" or ["Novels", "Memoirs"]
  isCustom?: boolean; // true if created by user
  isArchived?: boolean; // true if archived
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
  // Phase 8 Admin / Custom Template extensions
  layers?: TemplateLayer[];
  contentZones?: ContentZone[];
  governance?: TemplateGovernance;
  unit?: TemplateUnit;
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

export type StandardCmykProfileId = 'fogra39' | 'fogra51' | 'gracol' | 'custom';

export interface CmykOutputProfileMetadata {
  id: StandardCmykProfileId | string;
  name: string;
  conditionIdentifier: string; // e.g. "FOGRA39", "FOGRA51", "CGATS TR 006"
  registryName: string; // e.g. "http://www.color.org"
  standard: string; // e.g. "ISO 12647-2:2004", "ISO 12647-2:2013"
  description: string;
  maxTacPercent: number; // e.g. 300, 320
  iccDataUrl?: string; // base64 Data URL for custom or embedded profile
  isCustom?: boolean;
}

export type BlackHandlingMode = 'standard-text' | 'rich-black-preset';

export interface PrintColorSettings {
  outputProfileId: StandardCmykProfileId | string;
  customProfile?: CmykOutputProfileMetadata;
  blackHandling: BlackHandlingMode; // 'standard-text' (C0 M0 Y0 K100) | 'rich-black-preset'
  overprintBlackText: boolean; // default true
  overprintBlackRules: boolean; // default true
  maxTacPercent?: number; // configured total ink limit
}

export type DocumentLanguage = 'en' | 'ar' | 'ur' | 'hi' | 'mixed';
export type WritingDirection = 'ltr' | 'rtl';
export type NumeralSystem = 'western' | 'arabic-indic' | 'urdu-eastern';

export interface LanguageSettings {
  language: DocumentLanguage;
  direction: WritingDirection;
  numeralSystem?: NumeralSystem;
  mixedDirectionMode?: 'auto' | 'strict';
}

export type HindiFontLayoutOption = 'krutidev' | 'chanakya' | 'unicode-inscript' | 'unicode-phonetic';
export type HindiEncodingType = 'unicode' | 'legacy';
export type HindiInputMode = 'direct' | 'phonetic' | 'keyboard-mapped';

export interface HindiDocumentSettings {
  selectedFontId?: string;
  layoutOption: HindiFontLayoutOption;
  encodingType: HindiEncodingType;
  inputMode: HindiInputMode;
  enableDerivedUnicode: boolean; // maintains derived Unicode alongside legacy text
}

export interface ManagedFont {
  id: string;
  displayName: string;
  familyName: string;
  encodingType: 'unicode' | 'legacy';
  supportedScript: 'devanagari' | 'arabic' | 'urdu' | 'latin' | 'other';
  associatedKeyboardLayout?: 'remington-kruti' | 'chanakya' | 'inscript' | 'phonetic' | 'none';
  format: CustomFontFormat;
  fileName: string;
  fileSizeBytes: number;
  dataUrl: string; // base64 or bundled
  createdAt: string;
  canEmbedInPdf: boolean;
  license?: string;
  isSystemPreset?: boolean;
}

export interface EpubExportOptions {
  title: string;
  author: string;
  language: string; // 'en' | 'ar' | 'ur' | 'hi'
  direction: 'ltr' | 'rtl';
  coverImageId?: string;
  includeFonts?: boolean;
  publisher?: string;
  isbn?: string;
  description?: string;
}

export type PreflightSeverity = 'error' | 'warning';

export interface PreflightIssue {
  id: string;
  severity: PreflightSeverity;
  category:
    | 'manuscript'
    | 'image'
    | 'geometry'
    | 'typography'
    | 'storage'
    | 'design'
    | 'font'
    | 'color'
    | 'language'
    | 'epub'
    | 'hindi'
    | 'template';
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
    | 'open-fonts'
    | 'open-color'
    | 'open-language'
    | 'open-hindi'
    | 'open-epub'
    | 'open-template';
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
  colorManagement?: PrintColorSettings;
}

export interface BookProject {
  id: string;
  title: string;
  author?: string;
  rawManuscript: string;
  templateId: string;
  editorMode?: EditorMode; // 'beginner' (default) | 'expert'
  languageSettings?: LanguageSettings; // document language and RTL settings
  hindiSettings?: HindiDocumentSettings; // dedicated Hindi module settings
  design?: Partial<PageDesignSettings>; // visual design settings
  customFonts?: CustomFont[]; // uploaded custom fonts
  managedFonts?: ManagedFont[]; // managed fonts catalog
  colorSettings?: Partial<PrintColorSettings>; // CMYK prepress and color settings
  epubOptions?: Partial<EpubExportOptions>; // EPUB 3 export options
  formattedBlocks: ManuscriptBlock[];
  images: BookImage[];
  placements: ImagePlacement[];
  typography?: Partial<TypographySettings>;
  exportOptions?: Partial<PdfExportOptions>;
  isSample?: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  // Phase 6 Cloud & Collaboration
  ownerId?: string;
  organizationId?: string;
  revision?: number; // optimistic concurrency control token
  storageBackend?: 'local' | 'cloud';
  lastEditedBy?: {
    userId: string;
    displayName: string;
    email: string;
  };
  currentUserRole?: 'owner' | 'editor' | 'reviewer' | 'viewer' | 'administrator';
}

