import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  getImpositionConfig,
  setCustomImpositionUrl,
  DEFAULT_IMPOSITION_DEV_URL,
  STORAGE_CUSTOM_URL_KEY,
} from './impositionConfig';
import {
  createHandoffFromBookProject,
  createHandoffFromPreflightJob,
} from './impositionHandoffService';
import { BookProject, BookTemplate } from '@/types/book';
import { PreflightJob } from '@/types/preflight';

describe('Phase 10: ATS Imposition Git Submodule & Handoff Integration', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  describe('1. Git Submodule Configuration & Boundaries', () => {
    it('contains a valid .gitmodules file pointing to atsimpose repository', () => {
      const gitmodulesPath = path.join(rootDir, '.gitmodules');
      expect(fs.existsSync(gitmodulesPath)).toBe(true);

      const content = fs.readFileSync(gitmodulesPath, 'utf8');
      expect(content).toContain('[submodule "imposition"]');
      expect(content).toContain('path = imposition');
      expect(content).toContain('url = https://github.com/idea2output/atsimpose.git');
      expect(content).toContain('branch = imposition-only');
    });

    it('verifies imposition directory exists with its own independent package.json', () => {
      const impositionPackageJson = path.join(rootDir, 'imposition', 'package.json');
      expect(fs.existsSync(impositionPackageJson)).toBe(true);

      const parsed = JSON.parse(fs.readFileSync(impositionPackageJson, 'utf8'));
      expect(parsed.name).toBe('artcraft');
      expect(parsed.version).toBe('0.2.0');
      expect(parsed.scripts.dev).toBe('vite');
      expect(parsed.scripts.build).toBe('tsc && vite build');
      expect(parsed.scripts.test).toBe('vitest run');
    });

    it('confirms parent ATS EasyBook package.json remains independent', () => {
      const parentPackageJson = path.join(rootDir, 'package.json');
      const parsed = JSON.parse(fs.readFileSync(parentPackageJson, 'utf8'));
      expect(parsed.name).toBe('ats-easybook');
      expect(parsed.dependencies.next).toBeDefined();
    });

    it('ensures no MyDraw source files were copied into EasyBook src/ directories', () => {
      // MyDraw internal directories: imposition/engine, imposition/ui, shared/atsFormat.ts
      const forbiddenPath = path.join(rootDir, 'src', 'shared', 'atsFormat.ts');
      expect(fs.existsSync(forbiddenPath)).toBe(false);
    });
  });

  describe('2. Endpoint Configuration Resolver', () => {
    const originalEnv = process.env.NEXT_PUBLIC_IMPOSITION_URL;

    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_IMPOSITION_URL;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_CUSTOM_URL_KEY);
      }
    });

    afterEach(() => {
      process.env.NEXT_PUBLIC_IMPOSITION_URL = originalEnv;
    });

    it('resolves development fallback URL when unconfigured in dev mode', () => {
      const config = getImpositionConfig();
      expect(config.isConfigured).toBe(true);
      expect(config.url).toBe(DEFAULT_IMPOSITION_DEV_URL);
      expect(config.url).toBe('/Impose/');
      expect(config.environment).toBe('integrated');
    });

    it('respects environment variable NEXT_PUBLIC_IMPOSITION_URL', () => {
      process.env.NEXT_PUBLIC_IMPOSITION_URL = 'https://atstech.com/Impose/';
      const config = getImpositionConfig();
      expect(config.isConfigured).toBe(true);
      expect(config.url).toBe('https://atstech.com/Impose/');
      expect(config.environment).toBe('integrated');
      expect(config.source).toBe('env');
    });

    it('allows custom operator override in localStorage', () => {
      if (typeof window !== 'undefined') {
        setCustomImpositionUrl('http://localhost:5174');
        const config = getImpositionConfig();
        expect(config.url).toBe('http://localhost:5174');
        expect(config.environment).toBe('custom');
        expect(config.source).toBe('localStorage');
      }
    });
  });

  describe('3. Versioned Job Handoff Contract (Schema 1.0)', () => {
    const mockTemplate: BookTemplate = {
      id: 'classic-novel-6x9',
      name: 'Classic Novel (6x9)',
      description: 'Standard trade novel template',
      category: 'fiction',
      pageWidthInches: 6,
      pageHeightInches: 9,
      bleedInches: 0.125,
      safeAreaInches: 0.25,
      linesPerPage: 33,
      charsPerLine: 65,
      margins: {
        insideInches: 0.75,
        outsideInches: 0.5,
        topInches: 0.75,
        bottomInches: 0.75,
        gutterInches: 0.125,
      },
      columns: { count: 1, gapInches: 0 },
      typography: {
        fontFamily: 'Georgia',
        fontSizePt: 10.5,
        lineHeightPt: 14.5,
        paragraphSpacingPt: 0,
        alignment: 'justify',
      },
      headersFooters: {
        showRunningHeaders: true,
        showPageNumbers: true,
        pageNumberFormat: 'arabic',
        runningHeaderContent: 'chapter-title',
      },
      imageConstraints: {
        maxImageWidthPercent: 100,
        defaultAlignment: 'center',
        allowFullBleed: false,
      },
    };

    const mockBook: BookProject = {
      id: 'test-book-123',
      title: 'Principles of Modern Typography',
      author: 'ATS Editorial Studio',
      templateId: 'classic-novel-6x9',
      editorMode: 'expert',
      rawManuscript: 'Sample manuscript content...',
      formattedBlocks: [],
      images: [],
      placements: [],
      typography: {
        bodyFont: 'Georgia',
        bodyFontSizePt: 10.5,
        bodyLineHeightPt: 14.5,
        bodyTrackingEm: 0,
        bodyColor: '#000000',
        headingFont: 'Garamond',
        headingFontSizePt: 18,
        headingLineHeightPt: 22,
        headingTrackingEm: 0,
        headingColor: '#000000',
        paragraphIndentInches: 0.25,
        paragraphSpacingInches: 0,
        dropCapsEnabled: false,
        dropCapLines: 2,
      },
      exportOptions: {
        colorProfile: 'FOGRA39',
        pure100KBlackText: true,
        bleedInches: 0.125,
        includeCropMarks: true,
      },
      organizationId: 'org-ats-001',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('generates a compliant handoff packet from an EasyBook project', () => {
      const payload = createHandoffFromBookProject(mockBook, mockTemplate, 32);

      expect(payload.schemaVersion).toBe('1.0');
      expect(payload.sourceApp).toBe('ATS EasyBook');
      expect(payload.sourceProjectId).toBe('test-book-123');
      expect(payload.document.title).toBe('Principles of Modern Typography');
      expect(payload.document.totalPageCount).toBe(32);
      expect(payload.document.trimWidthInches).toBe(6);
      expect(payload.document.trimHeightInches).toBe(9);
      expect(payload.prepress.colorSpace).toBe('CMYK');
      expect(payload.prepress.outputIntentProfile).toBe('FOGRA39');
      expect(payload.impositionIntent.pagesPerSignature).toBe(16);
      expect(payload.impositionIntent.estimatedSignaturesCount).toBe(2);
      expect(payload.impositionIntent.blankPagesBalanceNeeded).toBe(0);
    });

    it('correctly calculates remainder and blank page balance for non-multiple page counts', () => {
      // 30 pages with 16 pages per signature -> 2 signatures (32 total slots), requires 2 blank balance pages
      const payload = createHandoffFromBookProject(mockBook, mockTemplate, 30);
      expect(payload.document.totalPageCount).toBe(30);
      expect(payload.impositionIntent.estimatedSignaturesCount).toBe(2);
      expect(payload.impositionIntent.blankPagesBalanceNeeded).toBe(2);
    });

    it('generates a compliant handoff packet from an ATS Preflight Job', () => {
      const mockJob: PreflightJob = {
        id: 'job-preflight-999',
        fileName: 'monograph-interior.pdf',
        fileSizeBytes: 2048576,
        fileChecksumSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        uploadedAt: new Date().toISOString(),
        uploadedByEmail: 'prepress@atstech.com',
        profileId: 'ats-cmyk-pdfx4',
        status: 'compliant',
        sourceFileStoragePath: 'data/storage/preflight/job-999/original.pdf',
        latestReport: {
          id: 'rep-999',
          jobId: 'job-preflight-999',
          inspectedAt: new Date().toISOString(),
          profileId: 'ats-cmyk-pdfx4',
          profileName: 'ATS CMYK PDF/X-4:2010',
          isCompliant: true,
          complianceScore: 100,
          score: 100,
          totalPageCount: 64,
          pdfVersion: '1.6',
          outputIntent: { conditionId: 'FOGRA39' },
          colorSpacesFound: ['DeviceCMYK', 'DeviceGray'],
          hasRgb: false,
          hasCmyk: true,
          hasSpotColors: false,
          spotColorCount: 0,
          spotColorNames: [],
          hasTransparency: false,
          hasOverprint: true,
          overprintActive: true,
          pure100kBlackEnforced: true,
          summary: { errors: 0, warnings: 0, info: 1 },
          errors: [],
          warnings: [],
          info: [],
          issues: [],
          pages: [
            {
              pageNumber: 1,
              pageBoxes: {
                mediaBox: { x: 0, y: 0, width: 450, height: 666, widthInches: 6.25, heightInches: 9.25, widthMm: 158.75, heightMm: 234.95 },
                trimBox: { x: 9, y: 9, width: 432, height: 648, widthInches: 6.0, heightInches: 9.0, widthMm: 152.4, heightMm: 228.6 },
                orientation: 'portrait',
                bleedAmountInches: { top: 0.125, bottom: 0.125, left: 0.125, right: 0.125 },
                hasStandardBleed: true,
              },
              colorSpacesFound: ['DeviceCMYK'],
              hasRgb: false,
              hasCmyk: true,
              hasSpotColors: false,
              spotColorNames: [],
              hasTransparency: false,
              hasOverprint: true,
              has100KBlackText: true,
              hasRichBlackText: false,
              hasKnockoutRisk: false,
              hasHairlines: false,
              isBlank: false,
              images: [],
              fonts: [],
              issuesCount: { error: 0, warning: 0, info: 0 },
            },
          ],
          fonts: [],
          images: [],
        },
      };

      const payload = createHandoffFromPreflightJob(mockJob);
      expect(payload.schemaVersion).toBe('1.0');
      expect(payload.sourceApp).toBe('ATS Preflight');
      expect(payload.preflightJobId).toBe('job-preflight-999');
      expect(payload.document.pdfFileName).toBe('monograph-interior.pdf');
      expect(payload.document.pdfChecksumSha256).toBe(mockJob.fileChecksumSha256);
      expect(payload.document.totalPageCount).toBe(64);
      expect(payload.document.trimWidthInches).toBe(6.0);
      expect(payload.document.trimHeightInches).toBe(9.0);
      expect(payload.prepress.colorSpace).toBe('CMYK');
      expect(payload.impositionIntent.estimatedSignaturesCount).toBe(4);
      expect(payload.impositionIntent.blankPagesBalanceNeeded).toBe(0);
      expect(payload.context.operatorEmail).toBe('prepress@atstech.com');
    });

    it('verifies that no credentials, passwords, or private access tokens are exposed in payload', () => {
      const payload = createHandoffFromBookProject(mockBook, mockTemplate, 16);
      const str = JSON.stringify(payload);
      expect(str).not.toContain('password');
      expect(str).not.toContain('secret');
      expect(str).not.toContain('token');
      expect(str).not.toContain('Bearer');
    });
  });
});
