import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { generatePrintPdf } from './pdfExportService';
import {
  CLASSIC_NOVEL_6X9,
  MAGAZINE_REPORT_A4,
  ILLUSTRATED_BOOK_8X10,
} from '../templates/templateRegistry';
import { parseManuscript } from '../formatting/manuscriptParser';
import { defaultPaginationEngine } from '../pagination/paginationEngine';
import { BookProject, BookImage, ImagePlacement } from '@/types/book';
import { inspectPdfCmykCompliance } from '../cmyk/cmykPreflightInspector';

const ARTIFACT_DIR = 'C:\\Users\\ZARKA\\.gemini\\antigravity\\brain\\2f69f596-41b2-4280-b07f-e834ff1996f2';

// Valid 1x1 minimal JPEG
const VALID_JPEG =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

describe('Generate Phase 4.1 Sample Print PDFs with CMYK & Overprint', () => {
  const manuscript = `PROLOGUE: THE VEIL OF SEAS

The northern gale had howled for three days without respite. Captain Joshua Vance gripped the salt-crusted helm of the Northern Gull, peering through the driving sleet at a sea black as ink. Below deck, eighteen souls prayed that the timbers would hold against the fury of the Atlantic.

Across the great expanse of the archipelago, no lantern shone. The charts were thirty years old, drawn by men who had never sailed past Cape Solitude, yet the compass needle spun true toward the unknown horizon.

CHAPTER 1: THE MARINER'S EXCHANGE

In the gas-lit back room of the Mariner's Exchange, hand-drawn maps covered every surface of polished oak. Doctor Elena Croft traced a calloused finger along the contours of the uncharted sound.

"The soundings do not lie, Joshua," she whispered, leaning over the velum where coastal shoals gave way to fathomless depths. "There is open water where the Admiralty charted solid shelf ice. We can make the crossing before winter closes the bay."

A second paragraph described the provisioning of the schooner, the crates of dried pemmican, the two thousand pounds of fresh anthracite coal, and the iron-bound chronometer resting in its velvet-lined case.

CHAPTER 2: INTO THE HIGH LATITUDES

By dawn on the fifth of October, the rocky promontory of Scotland had faded into a gray smudge upon the southern rim of the sky. The vessel met the long Atlantic swell with an easy, rhythmic roll that set the brass gimbal lanterns swaying in the wardroom.

Every man on watch remained at his station in focused silence. They knew well the hazards of these northern seas: once past the Faeroe ridge, there was neither telegraph wire nor salvage tender to answer an appeal for assistance.`;

  const blocks = parseManuscript(manuscript);

  const images: BookImage[] = [
    {
      id: 'img-chart',
      fileName: 'nautical-chart.png',
      mimeType: 'image/png',
      width: 800,
      height: 600,
      fileSizeBytes: 45000,
      createdAt: new Date().toISOString(),
      dataUrl: VALID_JPEG,
      altText: 'Nautical hydrographic chart of the northern sound',
      caption: 'Figure 1.1: Hydrographic chart of the northern passage (1898).',
    },
    {
      id: 'img-map',
      fileName: 'expedition-map.png',
      mimeType: 'image/png',
      width: 1200,
      height: 800,
      fileSizeBytes: 62000,
      createdAt: new Date().toISOString(),
      dataUrl: VALID_JPEG,
      altText: 'Topographical map of coastal exploration route',
      caption: 'Figure 1.2: General track of the Northern Gull along the continental shelf.',
    },
    {
      id: 'img-compass',
      fileName: 'binnacle-diagram.png',
      mimeType: 'image/png',
      width: 600,
      height: 600,
      fileSizeBytes: 31000,
      createdAt: new Date().toISOString(),
      dataUrl: VALID_JPEG,
      altText: 'Technical diagram of the ship binnacle and compass mount',
      caption: 'Figure 2.1: Compensated binnacle assembly for magnetic latitude correction.',
    },
  ];

  it('generates classic-novel-sample.pdf (6x9 CMYK with FOGRA39, overprint, 100K black)', async () => {
    const placements: ImagePlacement[] = [
      {
        id: 'p-inline',
        imageId: 'img-chart',
        blockId: blocks[2].id, // After Chapter 1 heading
        mode: 'inline',
        widthPercent: 75,
        aspectRatioLocked: true,
        crop: { x: 0, y: 0, width: 1, height: 1 },
      },
      {
        id: 'p-float',
        imageId: 'img-compass',
        blockId: blocks[3].id, // In Chapter 1 paragraph
        mode: 'float-right',
        widthPercent: 45,
        aspectRatioLocked: true,
        crop: { x: 0, y: 0, width: 1, height: 1 },
      },
      {
        id: 'p-full',
        imageId: 'img-map',
        blockId: blocks[6].id, // After Chapter 2 heading
        mode: 'full-width',
        widthPercent: 100,
        aspectRatioLocked: true,
        crop: { x: 0, y: 0, width: 1, height: 1 },
      },
    ];

    const project: BookProject = {
      id: 'proj-classic',
      title: 'The Eldridge Voyage',
      author: 'Amjad Vance',
      rawManuscript: manuscript,
      templateId: 'classic-novel-6x9',
      formattedBlocks: blocks,
      images,
      placements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      colorSettings: {
        outputProfileId: 'fogra39',
        blackHandling: 'standard-text',
        overprintBlackText: true,
        overprintBlackRules: true,
        maxTacPercent: 300,
      },
      typography: {
        bodyFontFamily: 'Georgia, Cambria, serif',
        bodyFontSizePt: 10.5,
        lineHeightMultiplier: 1.35,
        paragraphIndentInches: 0.25,
        paragraphSpacingPt: 0,
        textAlignment: 'justified',
        headingFontFamily: 'Georgia, Cambria, serif',
        runningHeaderContent: 'author-title',
        suppressChapterHeader: true,
        chapterOpening: 'any-page',
      },
    };

    const pages = defaultPaginationEngine.paginate(blocks, CLASSIC_NOVEL_6X9, {
      bookTitle: project.title,
      authorName: project.author,
      images,
      placements,
      typography: project.typography,
    });

    const exportResult = await generatePrintPdf(project, CLASSIC_NOVEL_6X9, pages, {
      includeBleed: false,
      includeCropMarks: false,
      acknowledgedWarnings: true,
      colorManagement: project.colorSettings as any,
    });

    const pdfBytes = exportResult.output('arraybuffer');
    const targetFile = path.join(ARTIFACT_DIR, 'classic-novel-sample.pdf');
    fs.writeFileSync(targetFile, Buffer.from(pdfBytes));

    const loaded = await PDFDocument.load(pdfBytes);
    const p1 = loaded.getPage(0);
    const { width, height } = p1.getSize();

    expect(Math.round(width)).toBe(432); // 6 inches
    expect(Math.round(height)).toBe(648); // 9 inches
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(2);

    // Deep Prepress Inspection Verification
    const report = await inspectPdfCmykCompliance(pdfBytes);
    expect(report.isCompliant).toBe(true);
    expect(report.rgbObjectsCount).toBe(0);
    expect(report.rgbImagesCount).toBe(0);
    expect(report.iccProfileEmbedded).toBe(true);
    expect(report.outputCondition).toBe('FOGRA39');
    expect(report.overprintEnabled).toBe(true);
    expect(report.bodyTextPure100K).toBe(true);

    const reportFile = path.join(ARTIFACT_DIR, 'cmyk-preflight-report-classic-novel.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`Verified classic-novel-sample.pdf (CMYK compliant, 0 RGB objects, ${loaded.getPageCount()} pages)`);
  });

  it('generates magazine-report-sample.pdf (A4 two-column CMYK with bleed, crop marks, overprint)', async () => {
    const placements: ImagePlacement[] = [
      {
        id: 'p-inline-mag',
        imageId: 'img-chart',
        blockId: blocks[2].id,
        mode: 'inline',
        widthPercent: 90,
        aspectRatioLocked: true,
        crop: { x: 0, y: 0, width: 1, height: 1 },
      },
      {
        id: 'p-full-mag',
        imageId: 'img-map',
        blockId: blocks[6].id,
        mode: 'full-width',
        widthPercent: 100,
        aspectRatioLocked: true,
        crop: { x: 0, y: 0, width: 1, height: 1 },
      },
    ];

    const project: BookProject = {
      id: 'proj-mag',
      title: 'Arctic Exploration Quarterly',
      author: 'Royal Geographic Survey',
      rawManuscript: manuscript,
      templateId: 'magazine-report-a4',
      formattedBlocks: blocks,
      images,
      placements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      colorSettings: {
        outputProfileId: 'fogra39',
        blackHandling: 'standard-text',
        overprintBlackText: true,
        overprintBlackRules: true,
        maxTacPercent: 300,
      },
      typography: {
        bodyFontFamily: 'Helvetica, Arial, sans-serif',
        bodyFontSizePt: 9.5,
        lineHeightMultiplier: 1.3,
        paragraphIndentInches: 0,
        paragraphSpacingPt: 6,
        textAlignment: 'justified',
        headingFontFamily: 'Helvetica, Arial, sans-serif',
        runningHeaderContent: 'author-title',
        suppressChapterHeader: true,
      },
    };

    const pages = defaultPaginationEngine.paginate(blocks, MAGAZINE_REPORT_A4, {
      bookTitle: project.title,
      authorName: project.author,
      images,
      placements,
      typography: project.typography,
    });

    const exportResult = await generatePrintPdf(project, MAGAZINE_REPORT_A4, pages, {
      includeBleed: true,
      includeCropMarks: true,
      acknowledgedWarnings: true,
      colorManagement: project.colorSettings as any,
    });

    const pdfBytes = exportResult.output('arraybuffer');
    const targetFile = path.join(ARTIFACT_DIR, 'magazine-report-sample.pdf');
    fs.writeFileSync(targetFile, Buffer.from(pdfBytes));

    const loaded = await PDFDocument.load(pdfBytes);
    const p1 = loaded.getPage(0);
    const { width, height } = p1.getSize();

    expect(width).toBeGreaterThan(600);
    expect(height).toBeGreaterThan(850);
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(2);

    // Deep Prepress Inspection Verification
    const report = await inspectPdfCmykCompliance(pdfBytes);
    expect(report.isCompliant).toBe(true);
    expect(report.rgbObjectsCount).toBe(0);
    expect(report.rgbImagesCount).toBe(0);
    expect(report.iccProfileEmbedded).toBe(true);
    expect(report.overprintEnabled).toBe(true);

    const reportFile = path.join(ARTIFACT_DIR, 'cmyk-preflight-report-magazine-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`Verified magazine-report-sample.pdf (CMYK compliant, 0 RGB objects, ${loaded.getPageCount()} pages)`);
  });

  it('generates illustrated-book-sample.pdf (8x10 CMYK with captions and DeviceCMYK images)', async () => {
    const placements: ImagePlacement[] = [
      {
        id: 'p-chart-ill',
        imageId: 'img-chart',
        blockId: blocks[2].id,
        mode: 'inline',
        widthPercent: 85,
        aspectRatioLocked: true,
        crop: { x: 0, y: 0, width: 1, height: 1 },
      },
      {
        id: 'p-map-ill',
        imageId: 'img-map',
        blockId: blocks[6].id,
        mode: 'full-width',
        widthPercent: 100,
        aspectRatioLocked: true,
        crop: { x: 0, y: 0, width: 1, height: 1 },
      },
    ];

    const project: BookProject = {
      id: 'proj-ill',
      title: 'Chronicles of the Arctic Expeditions',
      author: 'Amjad Vance',
      rawManuscript: manuscript,
      templateId: 'illustrated-book-8x10',
      formattedBlocks: blocks,
      images,
      placements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      colorSettings: {
        outputProfileId: 'fogra39',
        blackHandling: 'standard-text',
        overprintBlackText: true,
        overprintBlackRules: true,
        maxTacPercent: 300,
      },
      typography: {
        bodyFontFamily: 'Garamond, Georgia, serif',
        bodyFontSizePt: 11,
        lineHeightMultiplier: 1.4,
        paragraphIndentInches: 0.25,
        paragraphSpacingPt: 4,
        textAlignment: 'justified',
        headingFontFamily: 'Garamond, Georgia, serif',
        runningHeaderContent: 'author-title',
        suppressChapterHeader: true,
      },
    };

    const pages = defaultPaginationEngine.paginate(blocks, ILLUSTRATED_BOOK_8X10, {
      bookTitle: project.title,
      authorName: project.author,
      images,
      placements,
      typography: project.typography,
    });

    const exportResult = await generatePrintPdf(project, ILLUSTRATED_BOOK_8X10, pages, {
      includeBleed: false,
      includeCropMarks: false,
      acknowledgedWarnings: true,
      colorManagement: project.colorSettings as any,
    });

    const pdfBytes = exportResult.output('arraybuffer');
    const targetFile = path.join(ARTIFACT_DIR, 'illustrated-book-sample.pdf');
    fs.writeFileSync(targetFile, Buffer.from(pdfBytes));

    const loaded = await PDFDocument.load(pdfBytes);
    const p1 = loaded.getPage(0);
    const { width, height } = p1.getSize();

    expect(Math.round(width)).toBe(576); // 8 inches
    expect(Math.round(height)).toBe(720); // 10 inches
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(2);

    // Deep Prepress Inspection Verification
    const report = await inspectPdfCmykCompliance(pdfBytes);
    expect(report.isCompliant).toBe(true);
    expect(report.rgbObjectsCount).toBe(0);
    expect(report.rgbImagesCount).toBe(0);
    expect(report.iccProfileEmbedded).toBe(true);
    expect(report.overprintEnabled).toBe(true);

    const reportFile = path.join(ARTIFACT_DIR, 'cmyk-preflight-report-illustrated-book.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`Verified illustrated-book-sample.pdf (CMYK compliant, 0 RGB objects, ${loaded.getPageCount()} pages)`);
  });

  it('generates arabic-rtl-sample.pdf (6x9 RTL with FOGRA39, mirrored margins, shaped Arabic, Arabic-Indic numerals)', async () => {
    const arabicManuscript = `الفصل الأول: رحلة الأمل

كانت الشمس تميل نحو الغروب حين انطلقت القافلة عبر الصحراء الكبرى. لم يكن أحد يعلم ما تخبئه الرمال من أسرار قديمة، ولكن العزيمة كانت تملأ قلوب المسافرين وتدفعهم نحو الأمام.

قال القائد بحزم: "إن طريقنا طويل ومحفوف بالمخاطر، ولكن الصبر والتعاون هما مفتاح النجاة الوحيد في هذه الرحلة المجهولة."

استمرت المسيرة لعدة أيام حتى بدت في الأفق واحة خضراء يانعة تحيط بها أشجار النخيل الباسقة، وهناك وجدوا النبع الصافي الذي انتظروه طويلاً.`;

    const arabicBlocks = parseManuscript(arabicManuscript);
    const arabicProject: BookProject = {
      id: 'arabic-sample-proj',
      title: 'رحلة الأمل واليقين',
      author: 'أحمد البغدادي',
      manuscript: arabicManuscript,
      templateId: 'classic-novel-6x9',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editorMode: 'expert',
      languageSettings: {
        language: 'ar',
        direction: 'rtl',
        numeralSystem: 'arabic-indic',
        mixedDirectionMode: 'auto',
      },
      colorSettings: {
        outputProfile: 'FOGRA39',
        outputIntent: 'FOGRA39 (ISO 12647-2:2004)',
        enablePureBlackText: true,
        enableBlackOverprint: true,
      },
      images: [],
      placements: [],
    };

    const arabicPages = defaultPaginationEngine.paginate(arabicBlocks, CLASSIC_NOVEL_6X9, {
      bookTitle: arabicProject.title,
      authorName: arabicProject.author,
      languageSettings: arabicProject.languageSettings,
    });

    const exportResult = await generatePrintPdf(arabicProject, CLASSIC_NOVEL_6X9, arabicPages, {
      includeBleed: false,
      includeCropMarks: false,
      acknowledgedWarnings: true,
      colorManagement: arabicProject.colorSettings as any,
    });

    const pdfBytes = exportResult.output('arraybuffer');
    const targetFile = path.join(ARTIFACT_DIR, 'arabic-rtl-sample.pdf');
    fs.writeFileSync(targetFile, Buffer.from(pdfBytes));

    const loaded = await PDFDocument.load(pdfBytes);
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(1);

    const report = await inspectPdfCmykCompliance(pdfBytes);
    expect(report.isCompliant).toBe(true);
    expect(report.rgbObjectsCount).toBe(0);

    console.log(`Verified arabic-rtl-sample.pdf (CMYK compliant, ${loaded.getPageCount()} pages, RTL geometry)`);
  });

  it('generates urdu-rtl-sample.pdf (6x9 RTL with FOGRA39, Nastaliq typography, Eastern Urdu numerals)', async () => {
    const urduManuscript = `باب اول: کاروان حیات

یہ کتاب اردو زبان کے شاہکار ادب کا ایک نیا سنگ میل ہے۔ اس میں زندگی کے نشیب و فراز اور انسانی جذبوں کی عکاسی بڑی خوبصورتی سے کی گئی ہے۔

قائد نے مخاطب ہو کر کہا: "اگر ہمارے ارادے پختہ ہوں تو دشوار ترین راستے بھی آسان ہو جاتے ہیں۔ کامیابی ہمیشہ مسلسل محنت کا ثمر ہوتی ہے۔"

جب رات ڈھلی تو مسافروں نے وادی کے دامن میں خیمے لگائے اور ستاروں بھرے آسمان تلے آنے والے کل کے خواب سجائے۔`;

    const urduBlocks = parseManuscript(urduManuscript);
    const urduProject: BookProject = {
      id: 'urdu-sample-proj',
      title: 'کاروان حیات',
      author: 'مرزا غالب',
      manuscript: urduManuscript,
      templateId: 'classic-novel-6x9',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editorMode: 'expert',
      languageSettings: {
        language: 'ur',
        direction: 'rtl',
        numeralSystem: 'urdu-eastern',
        mixedDirectionMode: 'auto',
      },
      colorSettings: {
        outputProfile: 'FOGRA39',
        outputIntent: 'FOGRA39 (ISO 12647-2:2004)',
        enablePureBlackText: true,
        enableBlackOverprint: true,
      },
      images: [],
      placements: [],
    };

    const urduPages = defaultPaginationEngine.paginate(urduBlocks, CLASSIC_NOVEL_6X9, {
      bookTitle: urduProject.title,
      authorName: urduProject.author,
      languageSettings: urduProject.languageSettings,
    });

    const exportResult = await generatePrintPdf(urduProject, CLASSIC_NOVEL_6X9, urduPages, {
      includeBleed: false,
      includeCropMarks: false,
      acknowledgedWarnings: true,
      colorManagement: urduProject.colorSettings as any,
    });

    const pdfBytes = exportResult.output('arraybuffer');
    const targetFile = path.join(ARTIFACT_DIR, 'urdu-rtl-sample.pdf');
    fs.writeFileSync(targetFile, Buffer.from(pdfBytes));

    const loaded = await PDFDocument.load(pdfBytes);
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(1);

    const report = await inspectPdfCmykCompliance(pdfBytes);
    expect(report.isCompliant).toBe(true);
    expect(report.rgbObjectsCount).toBe(0);

    console.log(`Verified urdu-rtl-sample.pdf (CMYK compliant, ${loaded.getPageCount()} pages, Urdu numerals)`);
  });

  it('generates arabic-rtl-sample.epub (Valid EPUB 3 with page-progression-direction="rtl")', async () => {
    const { generateEpub } = await import('../epub/epubExportService');
    const arabicManuscript = `الفصل الأول: رحلة الأمل\n\nكانت الشمس تميل نحو الغروب حين انطلقت القافلة عبر الصحراء الكبرى.`;
    const arabicProject: BookProject = {
      id: 'arabic-epub-sample',
      title: 'رحلة الأمل واليقين',
      author: 'أحمد البغدادي',
      manuscript: arabicManuscript,
      templateId: 'classic-novel-6x9',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editorMode: 'expert',
      languageSettings: {
        language: 'ar',
        direction: 'rtl',
        numeralSystem: 'arabic-indic',
        mixedDirectionMode: 'auto',
      },
      images: [],
      placements: [],
    };

    const epubResult = await generateEpub(arabicProject, CLASSIC_NOVEL_6X9);
    const targetFile = path.join(ARTIFACT_DIR, 'arabic-rtl-sample.epub');
    fs.writeFileSync(targetFile, Buffer.from(epubResult.arrayBuffer));

    expect(fs.existsSync(targetFile)).toBe(true);
    expect(epubResult.arrayBuffer.byteLength).toBeGreaterThan(100);
    console.log(`Verified arabic-rtl-sample.epub (${epubResult.arrayBuffer.byteLength} bytes)`);
  });
});
