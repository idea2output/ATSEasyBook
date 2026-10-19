import fs from 'fs';
import path from 'path';
import { BookProject, BookTemplate, PagePreviewData } from './src/types/book';
import { generatePrintPdf } from './src/services/pdf/pdfExportService';
import { inspectPdfCmykCompliance } from './src/services/cmyk/cmykPreflightInspector';
import { runPrintPreflight } from './src/services/preflight/preflightService';
import { defaultPaginationEngine } from './src/services/pagination/paginationEngine';
import { parseManuscript } from './src/services/formatting/manuscriptParser';

const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';

async function main() {
  console.log('=== Generating Phase 8 Mandatory Format Artifacts ===\n');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  // --------------------------------------------------------------------------
  // Format 1: Custom Single-Column Novel Template (5.5" x 8.5" Trade Paperback)
  // --------------------------------------------------------------------------
  console.log('[Format 1] Custom Single-Column Trade Novel (5.5" x 8.5")...');
  const customNovelTemplate: BookTemplate = {
    id: 'custom-novel-5.5x8.5',
    name: 'Custom Trade Novel (5.5" × 8.5")',
    category: 'fiction',
    description: 'Custom compact trade paperback with generous inside margin for binding.',
    isCustom: true,
    pageWidthInches: 5.5,
    pageHeightInches: 8.5,
    bleedInches: 0.125,
    safeAreaInches: 0.25,
    margins: {
      topInches: 0.75,
      bottomInches: 0.75,
      insideInches: 0.875,
      outsideInches: 0.625,
      gutterInches: 0.125,
    },
    columns: { count: 1, gap: '0in', gapInches: 0 },
    typography: {
      fontFamily: 'Georgia, serif',
      bodyFontSizePt: 10.5,
      bodyLineHeight: 1.45,
      chapterHeadingFontSizePt: 20,
      chapterHeadingLineHeight: 1.2,
      paragraphIndentInches: 0.25,
      paragraphSpacingPt: 0,
      textAlign: 'justify',
      headingStyle: {
        fontFamily: 'Georgia, serif',
        fontSizePt: 20,
        alignment: 'center',
        spaceBeforePt: 24,
        spaceAfterPt: 16,
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
    design: {
      textColor: '#000000',
      headingColor: '#000000',
      headerFooterColor: '#555555',
    },
  };

  const novelRaw = `Chapter 1: The Northern Horizon

The winter gale swept across the frozen archipelago with relentless fury. For thirty days the expedition had charted the treacherous ice leads, seeking the elusive passage documented by nineteenth-century navigators.

Every officer understood the peril. The ship groaned beneath the pressure of the pack ice, its timber ribs yielding millimeters against the surging tide. Yet in the observation cabin, the charts remained pristine.`;

  const novelBlocks = parseManuscript(novelRaw);
  const novelPages = defaultPaginationEngine.paginate(novelBlocks, customNovelTemplate, {
    bookTitle: 'The Northern Horizon',
    authorName: 'Arthur Vance',
    images: [],
    placements: [],
  });

  const novelProject: BookProject = {
    id: 'custom-novel-proj',
    title: 'The Northern Horizon',
    author: 'Arthur Vance',
    rawManuscript: novelRaw,
    templateId: customNovelTemplate.id,
    formattedBlocks: novelBlocks,
    images: [],
    placements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const novelPreflight = runPrintPreflight(novelProject, customNovelTemplate, novelPages);
  console.log(`  Preflight issues: ${novelPreflight.issues.length} (Errors: ${novelPreflight.errorsCount})`);
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'preflight-custom-novel.json'),
    JSON.stringify(novelPreflight, null, 2)
  );

  const novelDoc = await generatePrintPdf(novelProject, customNovelTemplate, novelPages, {
    includeBleed: true,
    includeCropMarks: true,
    acknowledgedWarnings: true,
    colorManagement: {
      outputProfileId: 'fogra39',
      blackHandling: 'standard-text',
      overprintBlackText: true,
      overprintBlackRules: true,
    },
  });
  const novelBytes = novelDoc.output('arraybuffer');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'custom-novel-sample.pdf'), Buffer.from(novelBytes));
  const novelCmyk = await inspectPdfCmykCompliance(novelBytes);
  console.log(`  CMYK Compliant: ${novelCmyk.isCompliant}, RGB Objects: ${novelCmyk.rgbObjectsCount}`);

  // --------------------------------------------------------------------------
  // Format 2: Two-Column Report Template (A4 format with column gutters & rules)
  // --------------------------------------------------------------------------
  console.log('\n[Format 2] Two-Column Technical Report Template (A4)...');
  const twoColumnTemplate: BookTemplate = {
    id: 'custom-report-2col-a4',
    name: 'Custom Two-Column A4 Research Report',
    category: 'nonfiction',
    description: 'High-density two-column layout for scientific monographs and industrial reports.',
    isCustom: true,
    pageWidthInches: 8.27,
    pageHeightInches: 11.69,
    bleedInches: 0.125,
    safeAreaInches: 0.35,
    margins: {
      topInches: 0.8,
      bottomInches: 0.8,
      insideInches: 0.9,
      outsideInches: 0.8,
      gutterInches: 0.1,
    },
    columns: { count: 2, gap: '0.3in', gapInches: 0.3 },
    typography: {
      fontFamily: 'Helvetica, Arial, sans-serif',
      bodyFontSizePt: 9.5,
      bodyLineHeight: 1.4,
      chapterHeadingFontSizePt: 18,
      chapterHeadingLineHeight: 1.2,
      paragraphIndentInches: 0,
      paragraphSpacingPt: 6,
      textAlign: 'left',
      headingStyle: {
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSizePt: 18,
        alignment: 'left',
        spaceBeforePt: 20,
        spaceAfterPt: 12,
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
    design: {
      textColor: '#0f172a',
      headingColor: '#000000',
      headerFooterColor: '#64748b',
    },
  };

  const reportRaw = `Technical Report: Computational Aerodynamics

Abstract: High-resolution fluid simulation demands scalable numerical solvers and conservative discretization schemes across unstructured grids.

Section 1: Mathematical Formulation
The governing Navier-Stokes equations express conservation of mass, momentum, and total energy within an Eulerian control volume. Discretization follows a dual-mesh finite volume approach with second-order spatial accuracy.

Section 2: Parallel Performance Benchmarks
Scaling studies conducted across distributed compute nodes demonstrate 92% parallel efficiency up to 4096 cores. Memory bus saturation remains the primary bottleneck during implicit matrix assembly.`;

  const reportBlocks = parseManuscript(reportRaw);
  const reportPages = defaultPaginationEngine.paginate(reportBlocks, twoColumnTemplate, {
    bookTitle: 'Computational Aerodynamics Report',
    authorName: 'Dr. Elena Rostova',
    images: [],
    placements: [],
  });

  const reportProject: BookProject = {
    id: 'two-col-report-proj',
    title: 'Computational Aerodynamics Report',
    author: 'Dr. Elena Rostova',
    rawManuscript: reportRaw,
    templateId: twoColumnTemplate.id,
    formattedBlocks: reportBlocks,
    images: [],
    placements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const reportPreflight = runPrintPreflight(reportProject, twoColumnTemplate, reportPages);
  console.log(`  Preflight issues: ${reportPreflight.issues.length} (Errors: ${reportPreflight.errorsCount})`);
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'preflight-two-column-report.json'),
    JSON.stringify(reportPreflight, null, 2)
  );

  const reportDoc = await generatePrintPdf(reportProject, twoColumnTemplate, reportPages, {
    includeBleed: true,
    includeCropMarks: true,
    acknowledgedWarnings: true,
    colorManagement: {
      outputProfileId: 'fogra39',
      blackHandling: 'standard-text',
      overprintBlackText: true,
      overprintBlackRules: true,
    },
  });
  const reportBytes = reportDoc.output('arraybuffer');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'two-column-report-sample.pdf'), Buffer.from(reportBytes));
  const reportCmyk = await inspectPdfCmykCompliance(reportBytes);
  console.log(`  CMYK Compliant: ${reportCmyk.isCompliant}, RGB Objects: ${reportCmyk.rgbObjectsCount}`);

  // --------------------------------------------------------------------------
  // Format 3: RTL Arabic/Urdu Governed Template (6" x 9" Mirrored Geometry)
  // --------------------------------------------------------------------------
  console.log('\n[Format 3] RTL Arabic/Urdu Governed Template (6" x 9")...');
  const rtlTemplate: BookTemplate = {
    id: 'custom-rtl-governed-6x9',
    name: 'Custom RTL Literary Template (6" × 9")',
    category: 'fiction',
    description: 'Specialized right-to-left book geometry with mirrored gutters and Eastern Arabic numbering.',
    isCustom: true,
    pageWidthInches: 6.0,
    pageHeightInches: 9.0,
    bleedInches: 0.125,
    safeAreaInches: 0.3,
    margins: {
      topInches: 0.8,
      bottomInches: 0.8,
      insideInches: 0.95,
      outsideInches: 0.75,
      gutterInches: 0.15,
    },
    columns: { count: 1, gap: '0in', gapInches: 0 },
    typography: {
      fontFamily: 'Amiri, serif',
      bodyFontSizePt: 12,
      bodyLineHeight: 1.6,
      chapterHeadingFontSizePt: 22,
      chapterHeadingLineHeight: 1.3,
      paragraphIndentInches: 0,
      paragraphSpacingPt: 8,
      textAlign: 'justify',
      headingStyle: {
        fontFamily: 'Amiri, serif',
        fontSizePt: 22,
        alignment: 'right',
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
      maxFloatWidthPercent: 50,
      minDpi: 300,
    },
    design: {
      textColor: '#000000',
      headingColor: '#000000',
      headerFooterColor: '#475569',
    },
  };

  const rtlRaw = `الفصل الأول: أنوار المعرفة

كانت القراءة مفتاح الحضارة الإنسانية عبر القرون. وفي هذا العمل نتحرى أصول التدوين العربي وتطوره من المخطوطات اليدوية إلى الطباعة الحديثة.

إن التنسيق الطباعي المحكم يضمن الحفاظ على سلامة الحروف المتصلة والتشكيل الدقيق وعلامات الترقيم العربية الأصيلة.`;

  const rtlBlocks = parseManuscript(rtlRaw);
  const rtlPages = defaultPaginationEngine.paginate(rtlBlocks, rtlTemplate, {
    bookTitle: 'أنوار المعرفة والتدوين',
    authorName: 'العلامة رضوان الشامي',
    images: [],
    placements: [],
  });

  const rtlProject: BookProject = {
    id: 'rtl-governed-proj',
    title: 'أنوار المعرفة والتدوين',
    author: 'العلامة رضوان الشامي',
    rawManuscript: rtlRaw,
    templateId: rtlTemplate.id,
    languageSettings: {
      documentLanguage: 'ar',
      documentDirection: 'rtl',
      numeralSystem: 'eastern-arabic',
      kashidaJustification: true,
      preserveMixedBidirectional: true,
    },
    formattedBlocks: rtlBlocks,
    images: [],
    placements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const rtlPreflight = runPrintPreflight(rtlProject, rtlTemplate, rtlPages);
  console.log(`  Preflight issues: ${rtlPreflight.issues.length} (Errors: ${rtlPreflight.errorsCount})`);
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'preflight-rtl-governed.json'),
    JSON.stringify(rtlPreflight, null, 2)
  );

  const rtlDoc = await generatePrintPdf(rtlProject, rtlTemplate, rtlPages, {
    includeBleed: true,
    includeCropMarks: true,
    acknowledgedWarnings: true,
    colorManagement: {
      outputProfileId: 'fogra39',
      blackHandling: 'standard-text',
      overprintBlackText: true,
      overprintBlackRules: true,
    },
  });
  const rtlBytes = rtlDoc.output('arraybuffer');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'rtl-governed-template-sample.pdf'), Buffer.from(rtlBytes));
  const rtlCmyk = await inspectPdfCmykCompliance(rtlBytes);
  console.log(`  CMYK Compliant: ${rtlCmyk.isCompliant}, RGB Objects: ${rtlCmyk.rgbObjectsCount}`);

  // --------------------------------------------------------------------------
  // Format 4: Admin Governed Template with Fixed Visual Layers & Page Borders
  // --------------------------------------------------------------------------
  console.log('\n[Format 4] Admin Governed Template with Fixed Layers & Border...');
  const adminGovernedTemplate: BookTemplate = {
    id: 'org-admin-master-edition',
    name: 'ATS Official Governed Master Edition',
    category: 'nonfiction',
    description: 'Corporate institutional publication format with certified fixed visual layers and decorative borders.',
    isCustom: true,
    pageWidthInches: 7.0,
    pageHeightInches: 10.0,
    bleedInches: 0.125,
    safeAreaInches: 0.35,
    margins: {
      topInches: 0.9,
      bottomInches: 0.9,
      insideInches: 1.0,
      outsideInches: 0.8,
      gutterInches: 0.15,
    },
    columns: { count: 1, gap: '0in', gapInches: 0 },
    typography: {
      fontFamily: 'Georgia, serif',
      bodyFontSizePt: 11,
      bodyLineHeight: 1.5,
      chapterHeadingFontSizePt: 22,
      chapterHeadingLineHeight: 1.25,
      paragraphIndentInches: 0.3,
      paragraphSpacingPt: 0,
      textAlign: 'justify',
      headingStyle: {
        fontFamily: 'Georgia, serif',
        fontSizePt: 22,
        alignment: 'center',
        spaceBeforePt: 24,
        spaceAfterPt: 16,
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
    design: {
      backgroundColor: '#fafaf9',
      borderEnabled: true,
      borderColor: '#000000',
      borderWidthPt: 1.5,
      borderStyle: 'solid',
      borderInsetInches: 0.4,
      textColor: '#000000',
      headingColor: '#000000',
      headerFooterColor: '#444444',
    },
    governance: {
      status: 'published',
      visibility: 'organization',
      organizationId: 'ATS Tech Publishing House',
      ownerId: 'admin-corp',
      authorName: 'Chief Editorial Admin',
      version: 1,
      tags: ['certified', 'official', 'master-edition'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    layers: [
      {
        id: 'layer-top-rule',
        name: 'Top Editorial Accent Rule',
        type: 'line',
        xInches: 1.0,
        yInches: 0.75,
        widthInches: 5.0,
        heightInches: 0.04,
        strokeColor: '#000000',
        strokeWidthPt: 1.5,
        zIndex: 5,
        locked: true,
        visible: true,
        mirrorOnVerso: true,
      },
      {
        id: 'layer-bottom-rule',
        name: 'Bottom Running Footer Accent Rule',
        type: 'line',
        xInches: 1.0,
        yInches: 9.15,
        widthInches: 5.0,
        heightInches: 0.04,
        strokeColor: '#000000',
        strokeWidthPt: 0.75,
        zIndex: 5,
        locked: true,
        visible: true,
        mirrorOnVerso: true,
      },
      {
        id: 'layer-dept-stamp',
        name: 'Institutional Header Tag',
        type: 'text',
        xInches: 1.0,
        yInches: 0.58,
        widthInches: 5.0,
        heightInches: 0.16,
        textContent: 'ATS TECH ARCHIVAL SERIES • CERTIFIED FIRST PRINT',
        textColor: '#000000',
        fontFamily: 'sans-serif',
        fontSizePt: 7,
        fontWeight: 'bold',
        textAlign: 'center',
        zIndex: 6,
        locked: true,
        visible: true,
      },
    ],
    contentZones: [
      {
        id: 'admin-content-flow',
        name: 'Governed Flow Area',
        type: 'flowing-text',
        xInches: 1.0,
        yInches: 1.0,
        widthInches: 5.0,
        heightInches: 8.0,
        columns: 1,
        mirrorOnVerso: true,
      },
    ],
  };

  const adminRaw = `Chapter 1: The Principle of Layout Governance

Modern prepress production requires strict structural governance to ensure brand consistency, print-floor efficiency, and error-free press runs across multi-volume catalogs.

By separating fixed visual layers—such as master rules, security stamps, and page borders—from dynamic manuscript content flows, editorial teams maintain creative flexibility without risking mechanical press violations.`;

  const adminBlocks = parseManuscript(adminRaw);
  const adminPages = defaultPaginationEngine.paginate(adminBlocks, adminGovernedTemplate, {
    bookTitle: 'The Principle of Layout Governance',
    authorName: 'ATS Editorial Board',
    images: [],
    placements: [],
  });

  const adminProject: BookProject = {
    id: 'admin-governed-proj',
    title: 'The Principle of Layout Governance',
    author: 'ATS Editorial Board',
    rawManuscript: adminRaw,
    templateId: adminGovernedTemplate.id,
    formattedBlocks: adminBlocks,
    images: [],
    placements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const adminPreflight = runPrintPreflight(adminProject, adminGovernedTemplate, adminPages);
  console.log(`  Preflight issues: ${adminPreflight.issues.length} (Errors: ${adminPreflight.errorsCount})`);
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'preflight-admin-governed.json'),
    JSON.stringify(adminPreflight, null, 2)
  );

  const adminDoc = await generatePrintPdf(adminProject, adminGovernedTemplate, adminPages, {
    includeBleed: true,
    includeCropMarks: true,
    acknowledgedWarnings: true,
    colorManagement: {
      outputProfileId: 'fogra39',
      blackHandling: 'standard-text',
      overprintBlackText: true,
      overprintBlackRules: true,
    },
  });
  const adminBytes = adminDoc.output('arraybuffer');
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'admin-governed-template-sample.pdf'), Buffer.from(adminBytes));
  const adminCmyk = await inspectPdfCmykCompliance(adminBytes);
  console.log(`  CMYK Compliant: ${adminCmyk.isCompliant}, RGB Objects: ${adminCmyk.rgbObjectsCount}`);

  console.log('\n=== All 4 Mandatory Format PDFs & Preflight Reports Generated Successfully ===');
}

main().catch((err) => {
  console.error('Failed to generate Phase 8 artifacts:', err);
  process.exit(1);
});
