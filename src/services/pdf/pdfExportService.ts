import { jsPDF } from 'jspdf';
import {
  BookProject,
  BookTemplate,
  PageBlock,
  PagePreviewData,
  PdfExportOptions,
  TypographySettings,
} from '@/types/book';
import { getEffectiveTypography } from '@/services/templates/templateRegistry';
import { hexToCmyk, parseHexToRgb } from '@/services/cmyk/colorConversion';
import { postProcessToCmykPdf } from '@/services/cmyk/cmykPdfPostProcessor';
import {
  inspectPdfCmykCompliance,
  CmykPreflightReport,
} from '@/services/cmyk/cmykPreflightInspector';
import { prepareRtlTextForPdf } from '@/services/rtl/arabicShaper';
import { isArabicOrUrdu, formatNumerals } from '@/services/rtl/bidiService';

export interface ExportProgressCallback {
  (progressPercent: number, statusText: string): void;
}

export function sanitizePdfFilename(title: string): string {
  const trimmed = (title || '').trim();
  if (!trimmed) return 'book-print.pdf';
  const clean = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${clean || 'book'}-print.pdf`;
}

/**
 * Interface returned by generatePrintPdf, providing backward compatibility with jsPDF's
 * .save() and .output('arraybuffer') while exposing the prepress CMYK report.
 */
export interface PrintPdfExportResult {
  save: (filename?: string) => void;
  output: (type?: 'arraybuffer' | 'blob' | 'datauristring' | string) => any;
  getBytes: () => Uint8Array;
  getPreflightReport: () => CmykPreflightReport;
}

/**
 * Crops an image client-side via canvas before drawing into the PDF.
 */
async function getCroppedDataUrl(
  dataUrl: string,
  crop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  if (
    typeof window === 'undefined' ||
    !window.document ||
    !window.document.createElement ||
    (typeof process !== 'undefined' && process.env?.VITEST)
  ) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result: string) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      finish(dataUrl);
    }, 300);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const cropX = Math.round((crop.x || 0) * img.naturalWidth);
        const cropY = Math.round((crop.y || 0) * img.naturalHeight);
        const cropW = Math.max(1, Math.round((crop.width || 1) * img.naturalWidth));
        const cropH = Math.max(1, Math.round((crop.height || 1) * img.naturalHeight));

        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          finish(dataUrl);
          return;
        }

        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        finish(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        finish(dataUrl);
      }
    };
    img.onerror = () => finish(dataUrl);
    img.src = dataUrl;
  });
}

function mapFontFamilyToPdfFont(
  family: string,
  project?: BookProject
): { fontName: string; isSerif: boolean } {
  if (project?.customFonts) {
    const customMatch = project.customFonts.find(
      (cf) => cf.canEmbedInPdf && family.toLowerCase().includes(cf.familyName.toLowerCase())
    );
    if (customMatch) {
      return { fontName: customMatch.familyName, isSerif: true };
    }
  }

  const lower = family.toLowerCase();
  if (
    lower.includes('inter') ||
    lower.includes('sans') ||
    lower.includes('arial') ||
    lower.includes('helvetica')
  ) {
    return { fontName: 'helvetica', isSerif: false };
  }
  if (lower.includes('courier') || lower.includes('mono')) {
    return { fontName: 'courier', isSerif: false };
  }
  return { fontName: 'times', isSerif: true };
}

/**
 * Draws standard commercial print crop/trim marks at the 4 corners using 100K registration stroke.
 */
function drawCropMarks(
  doc: jsPDF,
  originX: number,
  originY: number,
  trimW: number,
  trimH: number,
  bleed: number
) {
  const markLength = 0.1875; // 3/16 inch mark length
  const markOffset = 0.0625; // 1/16 inch distance from trim edge

  doc.setDrawColor(0, 0, 0, 1); // 100K CMYK stroke
  doc.setLineWidth(0.006); // 0.43 pt thin registration line

  // Top-Left corner
  const tlX = originX;
  const tlY = originY;
  doc.line(tlX - markOffset - markLength, tlY, tlX - markOffset, tlY);
  doc.line(tlX, tlY - markOffset - markLength, tlX, tlY - markOffset);

  // Top-Right corner
  const trX = originX + trimW;
  const trY = originY;
  doc.line(trX + markOffset, trY, trX + markOffset + markLength, trY);
  doc.line(trX, trY - markOffset - markLength, trX, trY - markOffset);

  // Bottom-Left corner
  const blX = originX;
  const blY = originY + trimH;
  doc.line(blX - markOffset - markLength, blY, blX - markOffset, blY);
  doc.line(blX, blY + markOffset, blX, blY + markOffset + markLength);

  // Bottom-Right corner
  const brX = originX + trimW;
  const brY = originY + trimH;
  doc.line(brX + markOffset, brY, brX + markOffset + markLength, brY);
  doc.line(brX, brY + markOffset, brX, brY + markOffset + markLength);
}

/**
 * Generates a print-ready vector PDF adhering strictly to template geometry,
 * bleed, crop marks, running headers, multi-column typography, real CMYK color spaces,
 * embedded ICC output intent, and black overprint settings.
 */
export async function generatePrintPdf(
  project: BookProject,
  template: BookTemplate,
  pages: PagePreviewData[],
  options: PdfExportOptions,
  onProgress?: ExportProgressCallback
): Promise<PrintPdfExportResult> {
  const effectiveTypo = getEffectiveTypography(template, project.typography, project.author);

  const trimW = template.pageWidthInches;
  const trimH = template.pageHeightInches;
  const bleed = options.includeBleed ? template.bleedInches : 0;
  const cropMarkMargin = options.includeCropMarks ? 0.35 : 0;

  const totalPageW = trimW + bleed * 2 + cropMarkMargin * 2;
  const totalPageH = trimH + bleed * 2 + cropMarkMargin * 2;

  const originX = cropMarkMargin + bleed;
  const originY = cropMarkMargin + bleed;

  const orientation = trimW > trimH ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation,
    unit: 'in',
    format: [totalPageW, totalPageH],
    compress: false, // uncompressed stream for clean prepress post-processing
  });

  // Register custom embedded fonts into jsPDF VFS if available
  if (project.customFonts && project.customFonts.length > 0) {
    for (const cf of project.customFonts) {
      if (cf.canEmbedInPdf && cf.dataUrl) {
        try {
          const raw = cf.dataUrl.split(',')[1] || cf.dataUrl;
          const cleanBase64 = raw.replace(/\s+/g, '');
          if (/^[A-Za-z0-9+/]+={0,2}$/.test(cleanBase64) && cleanBase64.length % 4 === 0) {
            const fontFileName = `${cf.familyName.replace(/\s+/g, '_')}.ttf`;
            doc.addFileToVFS(fontFileName, cleanBase64);
            doc.addFont(fontFileName, cf.familyName, 'normal');
          }
        } catch (fontErr) {
          console.warn(`Could not register custom font ${cf.familyName} in jsPDF:`, fontErr);
        }
      }
    }
  }

  // Set document properties
  doc.setProperties({
    title: project.title,
    author: effectiveTypo.authorName || 'Author',
    creator: 'ATS EasyBook CMYK Prepress Engine (Phase 4.1)',
  });

  const totalPagesCount = pages.length;
  const design = project.design || template.design || {};
  const colorSettings = options.colorManagement || project.colorSettings || {
    outputProfileId: 'fogra39',
    blackHandling: 'standard-text',
    overprintBlackText: true,
    overprintBlackRules: true,
  };
  const blackHandling = colorSettings.blackHandling || 'standard-text';

  for (let pIdx = 0; pIdx < totalPagesCount; pIdx++) {
    const page = pages[pIdx];

    if (onProgress) {
      const pct = Math.round(((pIdx + 1) / totalPagesCount) * 50); // first 50% is layout
      onProgress(pct, `Compiling page ${pIdx + 1} of ${totalPagesCount}...`);
    }

    if (pIdx > 0) {
      doc.addPage([totalPageW, totalPageH], orientation);
    }

    // -------------------------------------------------------------
    // Page Background Fill & Optional Background Image
    // -------------------------------------------------------------
    const fillX = originX - bleed;
    const fillY = originY - bleed;
    const fillW = trimW + bleed * 2;
    const fillH = trimH + bleed * 2;

    if (design.backgroundColor && design.backgroundColor.toLowerCase() !== '#ffffff') {
      const bgCmyk = hexToCmyk(design.backgroundColor, {
        isBackground: true,
        blackHandling,
        maxTac: colorSettings.maxTacPercent || 300,
      });
      doc.setFillColor(bgCmyk.c, bgCmyk.m, bgCmyk.y, bgCmyk.k);
      doc.rect(fillX, fillY, fillW, fillH, 'F');
    }

    if (design.backgroundImage) {
      try {
        const bgFormat = design.backgroundImage.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(design.backgroundImage, bgFormat, fillX, fillY, fillW, fillH);
      } catch (bgImgErr) {
        console.warn('Could not draw background image in PDF:', bgImgErr);
      }
    }

    // -------------------------------------------------------------
    // Inset Decorative Border
    // -------------------------------------------------------------
    if (design.borderEnabled) {
      const borderInset = design.borderInsetInches ?? 0.25;
      const borderWidthPt = design.borderWidthPt ?? 1;
      const borderX = originX + borderInset;
      const borderY = originY + borderInset;
      const borderW = trimW - borderInset * 2;
      const borderH = trimH - borderInset * 2;

      const borderCmyk = hexToCmyk(design.borderColor || '#000000', {
        isBlackRule: true,
        blackHandling,
      });
      doc.setDrawColor(borderCmyk.c, borderCmyk.m, borderCmyk.y, borderCmyk.k);
      doc.setLineWidth(borderWidthPt / 72);

      if (design.borderStyle === 'dashed') {
        doc.setLineDashPattern([4 / 72, 2 / 72], 0);
      } else if (design.borderStyle === 'dotted') {
        doc.setLineDashPattern([1 / 72, 2 / 72], 0);
      } else {
        doc.setLineDashPattern([], 0);
      }

      if (design.borderRadiusPt && design.borderRadiusPt > 0) {
        const rInches = design.borderRadiusPt / 72;
        doc.roundedRect(borderX, borderY, borderW, borderH, rInches, rInches, 'S');
      } else {
        doc.rect(borderX, borderY, borderW, borderH, 'S');
      }
      doc.setLineDashPattern([], 0);
    }

    // Optional Crop Marks
    if (options.includeCropMarks) {
      drawCropMarks(doc, originX, originY, trimW, trimH, bleed);
    }

    // If page is intentionally blank (e.g. verso blank before recto chapter), render elegant label
    if (page.isBlankPage) {
      doc.setFont('times', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0, 0.4); // 40K tint
      doc.text('[This page intentionally left blank]', originX + trimW / 2, originY + trimH / 2, {
        align: 'center',
      });
      continue;
    }

    // Margins (with RTL Mirroring)
    const isRtl = project.languageSettings?.direction === 'rtl';
    const numSystem = project.languageSettings?.numeralSystem || 'western';
    const isLeft = page.isLeft;
    const insideMargin = template.margins.insideInches + template.margins.gutterInches;
    const outsideMargin = template.margins.outsideInches;

    // In LTR books: Verso (left) outside is left, inside is right. Recto (right) inside is left, outside is right.
    // In RTL books (spine on right): Verso inside is left, outside is right. Recto inside is right, outside is left.
    let marginLeft = isLeft ? outsideMargin : insideMargin;
    let marginRight = isLeft ? insideMargin : outsideMargin;
    if (isRtl) {
      marginLeft = isLeft ? insideMargin : outsideMargin;
      marginRight = isLeft ? outsideMargin : insideMargin;
    }

    const marginTop = template.margins.topInches;
    const marginBottom = template.margins.bottomInches;

    const contentLeft = originX + marginLeft;
    const contentTop = originY + marginTop;
    const contentWidth = trimW - (marginLeft + marginRight);
    const contentHeight = trimH - (marginTop + marginBottom);

    // CMYK Color definitions
    const hfCmyk = hexToCmyk(design.headerFooterColor || '#5a5a5a', { maxTac: 300 });
    const headCmyk = hexToCmyk(design.headingColor || '#141414', {
      isBodyText: true,
      blackHandling,
    });
    // Standard body text black: strictly C0 M0 Y0 K100
    const textCmyk = { c: 0, m: 0, y: 0, k: 1 };

    // -------------------------------------------------------------
    // Running Header
    // -------------------------------------------------------------
    if (page.headerText && template.headersFooters.showRunningHeaders) {
      const headerY = originY + marginTop * 0.65;
      doc.setFont('times', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(hfCmyk.c, hfCmyk.m, hfCmyk.y, hfCmyk.k);

      const headerTextToDraw =
        isRtl || isArabicOrUrdu(page.headerText)
          ? prepareRtlTextForPdf(page.headerText, numSystem)
          : page.headerText;

      doc.text(headerTextToDraw, originX + trimW / 2, headerY, { align: 'center' });
    }

    // -------------------------------------------------------------
    // Page Numbers
    // -------------------------------------------------------------
    if (template.headersFooters.showPageNumbers) {
      const footerY = originY + trimH - marginBottom * 0.55;
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(hfCmyk.c, hfCmyk.m, hfCmyk.y, hfCmyk.k);

      const formattedPageNum = formatNumerals(String(page.pageNumber), numSystem);
      const pos = effectiveTypo.pageNumberPosition;

      if (pos === 'bottom-center') {
        doc.text(formattedPageNum, originX + trimW / 2, footerY, { align: 'center' });
      } else if (pos === 'bottom-outside') {
        const numX = isRtl
          ? isLeft
            ? contentLeft + contentWidth
            : contentLeft
          : isLeft
          ? contentLeft
          : contentLeft + contentWidth;
        const align = isRtl ? (isLeft ? 'right' : 'left') : isLeft ? 'left' : 'right';
        doc.text(formattedPageNum, numX, footerY, { align });
      } else if (pos === 'top-outside') {
        const topNumY = originY + marginTop * 0.65;
        const numX = isRtl
          ? isLeft
            ? contentLeft + contentWidth
            : contentLeft
          : isLeft
          ? contentLeft
          : contentLeft + contentWidth;
        const align = isRtl ? (isLeft ? 'right' : 'left') : isLeft ? 'left' : 'right';
        doc.text(formattedPageNum, numX, topNumY, { align });
      }
    }

    // -------------------------------------------------------------
    // Page Content Rendering
    // -------------------------------------------------------------
    const isTwoCol = template.columns.count === 2;
    const colGap = isTwoCol ? template.columns.gapInches : 0;
    const singleColW = isTwoCol ? (contentWidth - colGap) / 2 : contentWidth;

    const columnsToRender: PageBlock[][] =
      isTwoCol && page.columns && page.columns.length === 2
        ? page.columns
        : [page.blocks];

    for (let colIdx = 0; colIdx < columnsToRender.length; colIdx++) {
      const colBlocks = columnsToRender[colIdx];
      // In RTL two-column mode, column 0 is the right column, column 1 is the left column
      const colLeft = isTwoCol
        ? isRtl
          ? colIdx === 0
            ? contentLeft + singleColW + colGap
            : contentLeft
          : contentLeft + colIdx * (singleColW + colGap)
        : contentLeft;

      let currentCursorY = contentTop;

      for (let bIdx = 0; bIdx < colBlocks.length; bIdx++) {
        const block = colBlocks[bIdx];
        const blockIsRtl = block.direction === 'rtl' || (block.direction !== 'ltr' && (isRtl || isArabicOrUrdu(block.text || '')));

        if (block.type === 'chapter-heading') {
          const headingFont = mapFontFamilyToPdfFont(effectiveTypo.headingFontFamily, project);
          doc.setFont(headingFont.fontName, 'bold');
          doc.setFontSize(effectiveTypo.headingFontSizePt);
          doc.setTextColor(headCmyk.c, headCmyk.m, headCmyk.y, headCmyk.k);

          currentCursorY += 0.25;
          const isCenter = template.typography.headingStyle.alignment === 'center';
          const headingX = isCenter
            ? colLeft + singleColW / 2
            : blockIsRtl
            ? colLeft + singleColW
            : colLeft;
          const align = isCenter ? 'center' : blockIsRtl ? 'right' : 'left';

          const headingTextToDraw = blockIsRtl
            ? prepareRtlTextForPdf(block.text || '', numSystem)
            : block.text || '';

          doc.text(headingTextToDraw, headingX, currentCursorY, { align });
          currentCursorY += 0.35;
          continue;
        }

        if ((block.type === 'paragraph' || block.type === 'quote' || block.type === 'caption') && block.text) {
          const bodyFont = mapFontFamilyToPdfFont(effectiveTypo.bodyFontFamily, project);
          const isQuote = block.type === 'quote';
          doc.setFont(bodyFont.fontName, isQuote ? 'italic' : 'normal');
          doc.setFontSize(effectiveTypo.bodyFontSizePt);
          // Pure 100K Black for body text
          doc.setTextColor(textCmyk.c, textCmyk.m, textCmyk.y, textCmyk.k);

          const isAfterHeading = bIdx > 0 && colBlocks[bIdx - 1].type === 'chapter-heading';
          const isContinuation = block.isContinuation;
          const shouldIndent = !isAfterHeading && !isContinuation && !isQuote && effectiveTypo.paragraphIndentInches > 0;

          const splitLines = doc.splitTextToSize(block.text, singleColW);
          const lineStep = (effectiveTypo.bodyFontSizePt / 72) * effectiveTypo.bodyLineHeight;

          for (let lIdx = 0; lIdx < splitLines.length; lIdx++) {
            const line = splitLines[lIdx];
            const lineToDraw = blockIsRtl ? prepareRtlTextForPdf(line, numSystem) : line;

            let lineX = colLeft;
            let align: 'left' | 'right' = 'left';

            if (blockIsRtl) {
              align = 'right';
              lineX = colLeft + singleColW - (lIdx === 0 && shouldIndent ? effectiveTypo.paragraphIndentInches : 0);
            } else {
              align = 'left';
              lineX = lIdx === 0 && shouldIndent ? colLeft + effectiveTypo.paragraphIndentInches : colLeft;
            }

            doc.text(lineToDraw, lineX, currentCursorY, { align });
            currentCursorY += lineStep;
          }

          if (effectiveTypo.paragraphSpacingPt > 0) {
            currentCursorY += effectiveTypo.paragraphSpacingPt / 72;
          } else {
            currentCursorY += 0.04;
          }
          continue;
        }

        if (block.type === 'image' && block.placement && block.image) {
          const p = block.placement;
          const img = block.image;

          const availableW = p.mode === 'full-width' ? contentWidth : singleColW;
          const renderW = Math.max(0.5, availableW * ((p.widthPercent || 100) / 100));

          const crop = p.crop || { x: 0, y: 0, width: 1, height: 1 };
          const croppedW = img.width * (crop.width || 1);
          const croppedH = img.height * (crop.height || 1);
          const aspect = croppedW / Math.max(1, croppedH);
          const renderH = renderW / Math.max(0.1, aspect);

          let imgX = colLeft;
          if (p.mode === 'inline') {
            imgX = colLeft + (availableW - renderW) / 2;
          } else if (p.mode === 'float-right') {
            imgX = colLeft + availableW - renderW;
          }

          try {
            const croppedDataUrl = await getCroppedDataUrl(img.dataUrl, crop);
            const format = img.mimeType.includes('png') ? 'PNG' : 'JPEG';
            doc.addImage(croppedDataUrl, format, imgX, currentCursorY, renderW, renderH);
          } catch (e) {
            console.error('Failed to draw image into PDF:', e);
          }

          currentCursorY += renderH;

          // Figure Caption
          if (p.caption && p.caption.trim()) {
            doc.setFont('times', 'italic');
            doc.setFontSize(8.5);
            doc.setTextColor(0, 0, 0, 0.7); // 70K tint
            currentCursorY += 0.12;
            doc.text(p.caption, imgX + renderW / 2, currentCursorY, { align: 'center' });
            currentCursorY += 0.1;
          }

          currentCursorY += 0.15;
        }
      }
    }
  }

  // -------------------------------------------------------------
  // Prepress CMYK Post-Processing Pipeline
  // -------------------------------------------------------------
  if (onProgress) {
    onProgress(70, 'Converting images and vectors to DeviceCMYK ICC profile...');
  }

  const rawPdfBytes = doc.output('arraybuffer');
  const cmykPdfBytes = await postProcessToCmykPdf(
    rawPdfBytes,
    project,
    template,
    options
  );

  if (onProgress) {
    onProgress(90, 'Running independent CMYK / PDF-X prepress inspection...');
  }

  // Deep Prepress Verification Check
  const preflightReport = await inspectPdfCmykCompliance(cmykPdfBytes);
  if (!preflightReport.isCompliant && preflightReport.blockingErrors.length > 0) {
    const errorMsg = `Print-Ready CMYK Prepress Failed: ${preflightReport.blockingErrors.join('; ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return {
    save: (downloadName: string = 'book-print.pdf') => {
      if (typeof window !== 'undefined' && window.document) {
        const blob = new Blob([cmykPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 200);
      }
    },
    output: (type?: string) => {
      if (type === 'arraybuffer') {
        return cmykPdfBytes.buffer;
      }
      if (type === 'blob') {
        return new Blob([cmykPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      }
      return cmykPdfBytes;
    },
    getBytes: () => cmykPdfBytes,
    getPreflightReport: () => preflightReport,
  };
}

/**
 * Dedicated action to generate a print-ready Hindi PDF,
 * embedding selected Devanagari/legacy fonts and preserving Phase 4.1 CMYK rules.
 */
export async function generateHindiPdf(
  project: BookProject,
  template: BookTemplate,
  pages: PagePreviewData[],
  options: PdfExportOptions,
  onProgress?: ExportProgressCallback
): Promise<PrintPdfExportResult> {
  const hindiProject: BookProject = {
    ...project,
    languageSettings: {
      language: 'hi',
      direction: 'ltr',
      numeralSystem: 'western',
      ...project.languageSettings,
    },
  };
  return generatePrintPdf(hindiProject, template, pages, options, onProgress);
}
