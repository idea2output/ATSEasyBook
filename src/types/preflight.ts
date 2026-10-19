/**
 * Types for ATS Tech Phase 9: PDF Preflight, Repair & Production Readiness Module
 */

export type PreflightSeverity = 'error' | 'warning' | 'info' | 'pass';
export type PreflightIssueSeverity = PreflightSeverity;

export type PreflightIssueCategory =
  | 'page-boxes'
  | 'bleed'
  | 'color-space'
  | 'output-intent'
  | 'fonts'
  | 'images'
  | 'ink-coverage'
  | 'black-overprint'
  | 'transparency'
  | 'vector-rules'
  | 'interactive-security'
  | 'blank-pages'
  | 'metadata-structure';

export type IssueResolutionStatus =
  | 'unresolved'
  | 'acknowledged'
  | 'resolved'
  | 'requires-source-correction';

export type PreflightRepairActionType =
  | 'normalize-page-boxes'
  | 'strip-annotations-and-forms'
  | 'strip-javascript'
  | 'normalize-metadata'
  | 'inject-cmyk-output-intent'
  | 'convert-rgb-to-cmyk'
  | 'enforce-100k-black-overprint'
  | 'remove-extraneous-cropmarks';

export interface PreflightIssue {
  id: string;
  severity: PreflightSeverity;
  category: PreflightIssueCategory;
  pageNumbers: number[];
  pageNumber?: number;
  title: string;
  description: string;
  ruleId: string;
  suggestedResolution: string;
  recommendation?: string;
  isRepairable: boolean;
  autoFixable?: boolean;
  repairActionId?: PreflightRepairActionType;
  status: IssueResolutionStatus;
  resolutionNote?: string;
}

export interface PageBoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
  widthInches: number;
  heightInches: number;
  widthMm: number;
  heightMm: number;
}

export interface PageBoxesInfo {
  mediaBox: PageBoxRect;
  cropBox?: PageBoxRect;
  bleedBox?: PageBoxRect;
  trimBox?: PageBoxRect;
  artBox?: PageBoxRect;
  orientation: 'portrait' | 'landscape' | 'square';
  bleedAmountInches: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  hasStandardBleed: boolean;
}

export interface PreflightFontInfo {
  name: string;
  baseFont: string;
  subtype: string;
  isEmbedded: boolean;
  embedded?: boolean;
  isSubset: boolean;
  subset?: boolean;
  isStandard14: boolean;
  pagesUsed: number[];
}

export interface PreflightImageInfo {
  id: string;
  pageNumber: number;
  widthPx: number;
  heightPx: number;
  pixelWidth?: number;
  pixelHeight?: number;
  displayWidthPt: number;
  displayHeightPt: number;
  effectiveDpiX: number;
  effectiveDpiY: number;
  effectiveDpi?: number;
  colorSpace: string;
  bitsPerComponent: number;
  isLowRes: boolean;      // < 300 DPI for print
  isVeryLowRes: boolean;  // < 150 DPI
}

export interface PageInspectionDetail {
  pageNumber: number;
  pageBoxes: PageBoxesInfo;
  colorSpacesFound: string[];
  hasRgb: boolean;
  hasCmyk: boolean;
  hasSpotColors: boolean;
  spotColorNames: string[];
  hasTransparency: boolean;
  hasOverprint: boolean;
  has100KBlackText: boolean;
  hasRichBlackText: boolean;
  hasKnockoutRisk: boolean;
  hasHairlines: boolean;
  isBlank: boolean;
  images: PreflightImageInfo[];
  fonts: string[];
  issuesCount: {
    error: number;
    warning: number;
    info: number;
  };
  issues?: PreflightIssue[];
}

export interface PreflightProfileRules {
  minPdfVersion: number;              // e.g. 1.4, 1.6
  targetPdfxLevel?: 'PDF/X-1a' | 'PDF/X-3' | 'PDF/X-4' | 'none';
  requireOutputIntent: boolean;
  defaultOutputIntentId: string;      // e.g. 'fogra39'
  acceptedColorSpaces: Array<'DeviceCMYK' | 'DeviceGray' | 'DeviceRGB' | 'Separation' | 'Lab'>;
  strictCmykOnly: boolean;            // blocks any DeviceRGB
  maxTotalInkCoveragePercent: number; // e.g. 300, 320, 340
  minBleedInches: number;             // e.g. 0.125
  trimToleranceInches: number;        // e.g. 0.05
  minImageDpiPrint: number;           // e.g. 300
  minImageDpiWarning: number;         // e.g. 150
  requireAllFontsEmbedded: boolean;
  allowSubsetFonts: boolean;
  enforcePure100KTextBlack: boolean;
  enforceBlackTextOverprint: boolean;
  preventWhiteOverprint: boolean;
  allowTransparency: boolean;
  disallowJavaScript: boolean;
  disallowInteractiveForms: boolean;
  disallowAnnotations: boolean;
  flagHairlines: boolean;              // < 0.25 pt
  minRuleWidthPt: number;             // 0.25 pt
  allowedOrientations: Array<'portrait' | 'landscape' | 'any'>;
  minPageCount?: number;
  maxPageCount?: number;
}

export interface PreflightProfile {
  id: string;
  name: string;
  description: string;
  suitability: string;
  isCustom?: boolean;
  organizationId?: string;
  targetIntent?: string;
  disclaimer: string;
  rules: PreflightProfileRules;
}

export interface PreflightReport {
  id: string;
  jobId: string;
  inspectedAt: string;
  profileId: string;
  profileName: string;
  isCompliant: boolean;
  complianceScore: number; // 0 to 100
  score: number;           // convenience alias for complianceScore
  totalPageCount: number;
  pdfVersion: string;
  outputIntent?: {
    conditionId: string;
    registryName?: string;
    isPdfx: boolean;
    hasIccEmbedded: boolean;
  };
  summary: {
    errorsCount: number;
    warningsCount: number;
    infoCount: number;
    passedCount: number;
    errors: number;
    warnings: number;
    info: number;
    passed: number;
  };
  colorSummary: {
    colorSpaces: string[];
    cmykCompliant: boolean;
    hasRgb: boolean;
    rgbObjectsCount: number;
    spotColors: string[];
    pure100kBlackEnforced?: boolean;
    overprintActive?: boolean;
  };
  fontSummary: {
    totalFonts: number;
    embeddedCount: number;
    unembeddedCount: number;
    allEmbedded: boolean;
  };
  imageSummary: {
    totalImages: number;
    lowDpiCount: number;
    minDpiFound: number;
  };
  securitySummary: {
    hasEncryption: boolean;
    hasJavaScript: boolean;
    hasForms: boolean;
    hasAnnotations: boolean;
  };
  issues: PreflightIssue[];
  pages: PageInspectionDetail[];
  fonts: PreflightFontInfo[];
  images: PreflightImageInfo[];
}

export interface RepairPlanActionItem {
  id: PreflightRepairActionType;
  type: PreflightRepairActionType;
  name: string;
  title: string;
  description: string;
  affectsIssues: string[];
  selected: boolean;
  riskLevel: 'safe' | 'caution';
  warningNotice?: string;
  riskWarning?: string;
}

export interface PreflightRepairPlan {
  jobId: string;
  generatedAt: string;
  actions: RepairPlanActionItem[];
  unrepairableIssues: PreflightIssue[];
}

export interface PreflightComment {
  id: string;
  pageNumber?: number;
  issueId?: string;
  author: {
    userId: string;
    displayName: string;
    role: string;
  };
  authorName?: string;
  content: string;
  createdAt: string;
}

export interface ImpositionJobMetadata {
  jobId: string;
  trimWidthInches: number;
  trimHeightInches: number;
  bleedInches: number;
  pageCount: number;
  colorSpace: 'cmyk' | 'gray';
  outputProfile: string;
  bindingType: 'saddle-stitch' | 'perfect-bound';
  status: 'ready-for-imposition';
}

export interface PreflightJob {
  id: string;
  title: string;
  originalFilename: string;
  fileSizeBytes: number;
  pageCount: number;
  status: 'uploading' | 'inspecting' | 'completed' | 'repairing' | 'failed';
  uploadedBy: {
    userId: string;
    displayName: string;
    email: string;
  };
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  profileId: string;
  originalAssetKey: string;
  repairedAssetKey?: string;
  latestReport?: PreflightReport;
  repairedReport?: PreflightReport;
  repairHistory: Array<{
    timestamp: string;
    appliedActions: PreflightRepairActionType[];
    user: string;
    reportId: string;
  }>;
  comments: PreflightComment[];
  sourceEasyBookExportJobId?: string;
  impositionReadyMetadata?: ImpositionJobMetadata;
  errorMessage?: string;
}
