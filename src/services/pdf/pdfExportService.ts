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
 * Crops an image client-side via canvas before drawing into the PDF.
 */
async function getCroppedDataUrl(
  dataUrl: string,
  crop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  // If no canvas support (e.g. pure Node or jsdom test environment), return dataUrl directly
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

import { parseHexColor } from '@/services/preflight/preflightService';

function mapFontFamilyToPdfFont(
  family: string,
  project?: BookProject
): { fontName: string; isSerif: boolean } {
  // Check if family references an embedded custom font
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
 * Draws standard commercial print crop/trim marks at the 4 corners of the page trim area.
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

  doc.setDrawColor(0, 0, 0);
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
 * bleed, crop marks, running headers, and multi-column typography.
 */
export async function generatePrintPdf(
  project: BookProject,
  template: BookTemplate,
  pages: PagePreviewData[],
  options: PdfExportOptions,
  onProgress?: ExportProgressCallback
): Promise<jsPDF> {
  const effectiveTypo = getEffectiveTypography(template, project.typography, project.author);

  const trimW = template.pageWidthInches;
  const trimH = template.pageHeightInches;
  const bleed = options.includeBleed ? template.bleedInches : 0;
  const cropMarkMargin = options.includeCropMarks ? 0.35 : 0; // extra sheet area for crop marks

  const totalPageW = trimW + bleed * 2 + cropMarkMargin * 2;
  const totalPageH = trimH + bleed * 2 + cropMarkMargin * 2;

  const originX = cropMarkMargin + bleed;
  const originY = cropMarkMargin + bleed;

  const orientation = trimW > trimH ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation,
    unit: 'in',
    format: [totalPageW, totalPageH],
    compress: true,
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
    creator: 'ATS EasyBook Print Engine (Phase 4)',
  });

  const totalPagesCount = pages.length;
  const design = project.design || template.design || {};

  for (let pIdx = 0; pIdx < totalPagesCount; pIdx++) {
    const page = pages[pIdx];

    if (onProgress) {
      const pct = Math.round(((pIdx + 1) / totalPagesCount) * 100);
      onProgress(pct, `Rendering PDF page ${pIdx + 1} of ${totalPagesCount}...`);
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
      const bgRgb = parseHexColor(design.backgroundColor);
      if (bgRgb) {
        doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
        doc.rect(fillX, fillY, fillW, fillH, 'F');
      }
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

      const borderRgb = parseHexColor(design.borderColor || '#000000') || { r: 0, g: 0, b: 0 };
      doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
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
      doc.setTextColor(150, 150, 150);
      doc.text('[This page intentionally left blank]', originX + trimW / 2, originY + trimH / 2, {
        align: 'center',
      });
      continue;
    }

    // Determine mirrored margin offsets for Verso (even) vs Recto (odd)
    const isLeft = page.isLeft;
    const insideMargin = template.margins.insideInches + template.margins.gutterInches;
    const outsideMargin = template.margins.outsideInches;
    const marginLeft = isLeft ? outsideMargin : insideMargin;
    const marginRight = isLeft ? insideMargin : outsideMargin;
    const marginTop = template.margins.topInches;
    const marginBottom = template.margins.bottomInches;

    const contentLeft = originX + marginLeft;
    const contentTop = originY + marginTop;
    const contentWidth = trimW - (marginLeft + marginRight);
    const contentHeight = trimH - (marginTop + marginBottom);

    // Color definitions from design
    const hfRgb = parseHexColor(design.headerFooterColor || '#5a5a5a') || { r: 90, g: 90, b: 90 };
    const headRgb = parseHexColor(design.headingColor || '#141414') || { r: 20, g: 20, b: 20 };
    const textRgb = parseHexColor(design.textColor || '#1e1e1e') || { r: 30, g: 30, b: 30 };

    // -------------------------------------------------------------
    // Running Header
    // -------------------------------------------------------------
    if (page.headerText && template.headersFooters.showRunningHeaders) {
      const headerY = originY + marginTop * 0.65;
      doc.setFont('times', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(hfRgb.r, hfRgb.g, hfRgb.b);

      // Centered or split header
      doc.text(page.headerText, originX + trimW / 2, headerY, { align: 'center' });
    }

    // -------------------------------------------------------------
    // Page Numbers
    // -------------------------------------------------------------
    if (template.headersFooters.showPageNumbers) {
      const footerY = originY + trimH - marginBottom * 0.55;
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(hfRgb.r, hfRgb.g, hfRgb.b);

      const pos = effectiveTypo.pageNumberPosition;
      if (pos === 'bottom-center') {
        doc.text(String(page.pageNumber), originX + trimW / 2, footerY, { align: 'center' });
      } else if (pos === 'bottom-outside') {
        const numX = isLeft ? contentLeft : contentLeft + contentWidth;
        doc.text(String(page.pageNumber), numX, footerY, { align: isLeft ? 'left' : 'right' });
      } else if (pos === 'top-outside') {
        const topNumY = originY + marginTop * 0.65;
        const numX = isLeft ? contentLeft : contentLeft + contentWidth;
        doc.text(String(page.pageNumber), numX, topNumY, { align: isLeft ? 'left' : 'right' });
      }
    }

    // -------------------------------------------------------------
    // Page Content Rendering (One or Two Columns)
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
      const colLeft = isTwoCol
        ? contentLeft + colIdx * (singleColW + colGap)
        : contentLeft;

      let currentCursorY = contentTop;

      for (let bIdx = 0; bIdx < colBlocks.length; bIdx++) {
        const block = colBlocks[bIdx];

        if (block.type === 'chapter-heading') {
          const headingFont = mapFontFamilyToPdfFont(effectiveTypo.headingFontFamily, project);
          doc.setFont(headingFont.fontName, 'bold');
          doc.setFontSize(effectiveTypo.headingFontSizePt);
          doc.setTextColor(headRgb.r, headRgb.g, headRgb.b);

          currentCursorY += 0.25; // Space before heading
          const headingX =
            template.typography.headingStyle.alignment === 'center'
              ? colLeft + singleColW / 2
              : colLeft;
          const align =
            template.typography.headingStyle.alignment === 'center' ? 'center' : 'left';

          doc.text(block.text || '', headingX, currentCursorY, { align });
          currentCursorY += 0.35; // Space after heading
          continue;
        }

        if (block.type === 'paragraph' && block.text) {
          const bodyFont = mapFontFamilyToPdfFont(effectiveTypo.bodyFontFamily, project);
          doc.setFont(bodyFont.fontName, 'normal');
          doc.setFontSize(effectiveTypo.bodyFontSizePt);
          doc.setTextColor(textRgb.r, textRgb.g, textRgb.b);

          const isAfterHeading = bIdx > 0 && colBlocks[bIdx - 1].type === 'chapter-heading';
          const isContinuation = block.isContinuation;
          const shouldIndent = !isAfterHeading && !isContinuation && effectiveTypo.paragraphIndentInches > 0;

          // Split paragraph into lines that fit singleColW
          const splitLines = doc.splitTextToSize(block.text, singleColW);
          const lineStep = (effectiveTypo.bodyFontSizePt / 72) * effectiveTypo.bodyLineHeight;

          for (let lIdx = 0; lIdx < splitLines.length; lIdx++) {
            const line = splitLines[lIdx];
            const lineX = lIdx === 0 && shouldIndent ? colLeft + effectiveTypo.paragraphIndentInches : colLeft;
            doc.text(line, lineX, currentCursorY);
            currentCursorY += lineStep;
          }

          // Paragraph spacing
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

          // Full-width in 2-col spans full content width; otherwise single column width
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
            doc.setTextColor(80, 80, 80);
            currentCursorY += 0.12;
            doc.text(p.caption, imgX + renderW / 2, currentCursorY, { align: 'center' });
            currentCursorY += 0.1;
          }

          currentCursorY += 0.15; // Bottom margin after image
        }
      }
    }
  }

  return doc;
}
