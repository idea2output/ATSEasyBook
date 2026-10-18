import { describe, it, expect } from 'vitest';
import {
  getCmykProfile,
  validateCustomIccProfile,
  buildSyntheticIccProfile,
  STANDARD_CMYK_PROFILES,
} from './cmykProfiles';
import {
  rgbToCmyk,
  hexToCmyk,
  convertRgbaToCmykBytes,
} from './colorConversion';
import { inspectPdfCmykCompliance } from './cmykPreflightInspector';
import { runPrintPreflight } from '../preflight/preflightService';
import { CLASSIC_NOVEL_6X9 } from '../templates/templateRegistry';
import { BookProject, PagePreviewData } from '@/types/book';
import { PDFDocument } from 'pdf-lib';

describe('CMYK Prepress Service Suite', () => {
  describe('CMYK Profiles & ICC Validation', () => {
    it('returns default FOGRA39 profile when unspecified', () => {
      const profile = getCmykProfile();
      expect(profile.id).toBe('fogra39');
      expect(profile.conditionIdentifier).toBe('FOGRA39');
      expect(profile.maxTacPercent).toBe(300);
    });

    it('resolves FOGRA51 and GRACoL standard profiles', () => {
      const f51 = getCmykProfile('fogra51');
      expect(f51.conditionIdentifier).toBe('FOGRA51');
      expect(f51.maxTacPercent).toBe(300);

      const gracol = getCmykProfile('gracol');
      expect(gracol.conditionIdentifier).toBe('CGATS TR 006');
      expect(gracol.maxTacPercent).toBe(320);
    });

    it('generates a valid, spec-compliant binary ICC profile', () => {
      const iccBytes = buildSyntheticIccProfile('FOGRA39 (ISO Coated v2)', 'FOGRA39', 300);
      expect(iccBytes.length).toBeGreaterThan(128);

      const view = new DataView(iccBytes.buffer);
      // Check total size matches byte 0..3
      expect(view.getUint32(0, false)).toBe(iccBytes.length);

      // Check 'prtr', 'CMYK', 'acsp'
      const readAscii = (start: number, len: number) => {
        let s = '';
        for (let i = 0; i < len; i++) s += String.fromCharCode(iccBytes[start + i]);
        return s;
      };
      expect(readAscii(12, 4)).toBe('prtr');
      expect(readAscii(16, 4)).toBe('CMYK');
      expect(readAscii(36, 4)).toBe('acsp');
    });

    it('validates authentic custom ICC profiles and rejects non-CMYK profiles', () => {
      // Create valid custom CMYK ICC bytes
      const validCmyk = buildSyntheticIccProfile('Acme Press Coated CMYK', 'ACME_01', 310);
      const res = validateCustomIccProfile(validCmyk, 'acme-press.icc');
      expect(res.valid).toBe(true);
      expect(res.metadata?.conditionIdentifier).toBeDefined();

      // Create invalid small buffer
      const invalidSmall = new Uint8Array([1, 2, 3]);
      const resSmall = validateCustomIccProfile(invalidSmall, 'bad.icc');
      expect(resSmall.valid).toBe(false);
      expect(resSmall.error).toContain('too small');

      // Create invalid non-CMYK (RGB) profile
      const rgbProfile = new Uint8Array(validCmyk);
      rgbProfile[16] = 82; rgbProfile[17] = 71; rgbProfile[18] = 66; rgbProfile[19] = 32; // 'RGB '
      const resRgb = validateCustomIccProfile(rgbProfile, 'sRGB.icc');
      expect(resRgb.valid).toBe(false);
      expect(resRgb.error).toContain('Prepress PDF output requires a CMYK output profile');
    });
  });

  describe('Color Conversion & Black Separation', () => {
    it('strictly outputs pure 100K black (C0 M0 Y0 K100) for body text', () => {
      const black = rgbToCmyk(0, 0, 0, { isBodyText: true });
      expect(black.c).toBe(0);
      expect(black.m).toBe(0);
      expect(black.y).toBe(0);
      expect(black.k).toBe(1);
      expect(black.tac).toBe(100);

      // Dark off-black (#1e1e1e) in body text must also be mapped to 100K
      const offBlack = rgbToCmyk(30, 30, 30, { isBodyText: true });
      expect(offBlack.c).toBe(0);
      expect(offBlack.m).toBe(0);
      expect(offBlack.y).toBe(0);
      expect(offBlack.k).toBe(1);
      expect(offBlack.tac).toBe(100);
    });

    it('outputs Rich Black preset (C60 M40 Y40 K100, TAC 240%) for large backgrounds only', () => {
      const richBg = rgbToCmyk(0, 0, 0, {
        isBackground: true,
        blackHandling: 'rich-black-preset',
      });
      expect(richBg.c).toBe(0.6);
      expect(richBg.m).toBe(0.4);
      expect(richBg.y).toBe(0.4);
      expect(richBg.k).toBe(1.0);
      expect(richBg.tac).toBe(240); // strictly <= 300% TAC limit
    });

    it('enforces total ink coverage (TAC) clamping on saturated colors', () => {
      // Saturated deep color
      const deepColor = rgbToCmyk(10, 10, 20, { maxTac: 280 });
      expect(deepColor.tac).toBeLessThanOrEqual(280);
    });

    it('converts raw RGBA byte buffer to CMYK byte buffer with GCR', () => {
      // 2 pixels: pixel 1 = pure black, pixel 2 = pure white
      const rgba = new Uint8Array([0, 0, 0, 255, 255, 255, 255, 255]);
      const cmyk = convertRgbaToCmykBytes(rgba, 2, 300);

      expect(cmyk.length).toBe(8);
      // Pixel 1: C0 M0 Y0 K255
      expect(cmyk[0]).toBe(0);
      expect(cmyk[1]).toBe(0);
      expect(cmyk[2]).toBe(0);
      expect(cmyk[3]).toBe(255);

      // Pixel 2: C0 M0 Y0 K0
      expect(cmyk[4]).toBe(0);
      expect(cmyk[5]).toBe(0);
      expect(cmyk[6]).toBe(0);
      expect(cmyk[7]).toBe(0);
    });
  });

  describe('Preflight Print Checks for CMYK & Overprint', () => {
    const mockPages: PagePreviewData[] = [
      {
        pageNumber: 1,
        isLeft: false,
        blocks: [{ blockId: 'b1', type: 'paragraph', text: 'Sample text.' }],
      },
    ];

    it('warns when body text color is tinted rather than pure 100K black', () => {
      const project: BookProject = {
        id: 'p1',
        title: 'Color Test',
        rawManuscript: 'Sample text.',
        templateId: 'classic-novel-6x9',
        formattedBlocks: [{ id: 'b1', type: 'paragraph', text: 'Sample text.' }],
        images: [],
        placements: [],
        design: {
          textColor: '#2563eb', // Blue body text
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const summary = runPrintPreflight(project, CLASSIC_NOVEL_6X9, mockPages);
      const textBlackIssue = summary.issues.find(
        (i) => i.id === 'warn-text-black-not-pure-100k'
      );
      expect(textBlackIssue).toBeDefined();
      expect(textBlackIssue?.severity).toBe('warning');
    });

    it('warns when black overprint is explicitly disabled', () => {
      const project: BookProject = {
        id: 'p2',
        title: 'Overprint Test',
        rawManuscript: 'Sample text.',
        templateId: 'classic-novel-6x9',
        formattedBlocks: [{ id: 'b1', type: 'paragraph', text: 'Sample text.' }],
        images: [],
        placements: [],
        colorSettings: {
          overprintBlackText: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const summary = runPrintPreflight(project, CLASSIC_NOVEL_6X9, mockPages);
      const opIssue = summary.issues.find((i) => i.id === 'warn-black-overprint-disabled');
      expect(opIssue).toBeDefined();
    });

    it('warns when rich black is selected with a thin decorative border (< 2 pt)', () => {
      const project: BookProject = {
        id: 'p3',
        title: 'Rich Black Test',
        rawManuscript: 'Sample text.',
        templateId: 'classic-novel-6x9',
        formattedBlocks: [{ id: 'b1', type: 'paragraph', text: 'Sample text.' }],
        images: [],
        placements: [],
        colorSettings: {
          blackHandling: 'rich-black-preset',
        },
        design: {
          borderEnabled: true,
          borderWidthPt: 1, // thin rule
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const summary = runPrintPreflight(project, CLASSIC_NOVEL_6X9, mockPages);
      const ruleIssue = summary.issues.find(
        (i) => i.id === 'warn-rich-black-on-fine-rules'
      );
      expect(ruleIssue).toBeDefined();
    });

    it('blocks export when custom CMYK profile is selected without profile file data', () => {
      const project: BookProject = {
        id: 'p4',
        title: 'Missing Custom Profile',
        rawManuscript: 'Sample text.',
        templateId: 'classic-novel-6x9',
        formattedBlocks: [{ id: 'b1', type: 'paragraph', text: 'Sample text.' }],
        images: [],
        placements: [],
        colorSettings: {
          outputProfileId: 'custom',
          // customProfile missing iccDataUrl
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const summary = runPrintPreflight(project, CLASSIC_NOVEL_6X9, mockPages);
      const missingIccIssue = summary.issues.find(
        (i) => i.id === 'err-missing-custom-cmyk-profile'
      );
      expect(missingIccIssue).toBeDefined();
      expect(missingIccIssue?.severity).toBe('error');
    });
  });
});
