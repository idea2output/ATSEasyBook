/**
 * ATS Prepress-to-Imposition Job Handoff Specification (Version 1.0)
 * Standard schema for passing certified print metadata from ATS EasyBook / Preflight
 * to ATS Imposition without modifying MyDraw source code.
 */

export interface ImpositionHandoffDocument {
  title: string;
  pdfFileName: string;
  pdfChecksumSha256: string;
  secureAssetUrl?: string;
  totalPageCount: number;
  trimWidthInches: number;
  trimHeightInches: number;
  trimWidthPt: number;
  trimHeightPt: number;
  bleedInches: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  orientation: 'portrait' | 'landscape' | 'square';
  bindingGutterInches?: number;
}

export interface ImpositionHandoffPrepress {
  colorSpace: 'CMYK' | 'Monochrome' | 'Spot';
  outputIntentProfile: string; // e.g. "FOGRA39", "FOGRA51"
  preflightStatus: 'passed' | 'repaired' | 'warning';
  preflightComplianceScore: number; // 0-100
  hasSpotColors: boolean;
  spotColorNames?: string[];
  isPure100KBlackText: boolean;
}

export interface ImpositionHandoffIntent {
  bindingType: 'saddle-stitch' | 'perfect-bound' | 'flat-sheet' | 'spiral';
  pagesPerSignature: number; // e.g. 4, 8, 16, 32
  targetSheetSize: string; // e.g. 'A1', 'A2', 'B1', 'Super-B/A3'
  targetSheetWidthInches: number;
  targetSheetHeightInches: number;
  creepCompensationNeeded: boolean;
  estimatedSignaturesCount: number;
  blankPagesBalanceNeeded: number; // 0 to (pagesPerSignature - 1)
}

export interface ImpositionHandoffContext {
  organizationId?: string;
  organizationName?: string;
  operatorEmail?: string;
  pressProfile?: string;
}

export interface ImpositionHandoffPayload {
  schemaVersion: '1.0';
  handoffId: string;
  sourceApp: 'ATS EasyBook' | 'ATS Preflight';
  timestamp: string;
  sourceProjectId?: string;
  preflightJobId?: string;
  document: ImpositionHandoffDocument;
  prepress: ImpositionHandoffPrepress;
  impositionIntent: ImpositionHandoffIntent;
  context: ImpositionHandoffContext;
}
