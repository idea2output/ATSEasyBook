import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFArray,
  PDFStream,
  PDFString,
  PDFHexString,
  PDFNumber,
  PDFRef,
} from 'pdf-lib';
import pako from 'pako';
import {
  PreflightReport,
  PreflightProfile,
  PreflightIssue,
  PageInspectionDetail,
  PageBoxesInfo,
  PageBoxRect,
  PreflightFontInfo,
  PreflightImageInfo,
} from '@/types/preflight';
import { getPreflightProfileById } from './preflightProfiles';

const STANDARD_14_FONTS = [
  'Times-Roman',
  'Times-Bold',
  'Times-Italic',
  'Times-BoldItalic',
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
  'Courier',
  'Courier-Bold',
  'Courier-Oblique',
  'Courier-BoldOblique',
  'Symbol',
  'ZapfDingbats',
];

/**
 * Parses a PDF rectangle array [x1, y1, x2, y2] into a PageBoxRect.
 */
function parsePdfBox(boxArray: any): PageBoxRect | undefined {
  if (!boxArray) return undefined;
  let raw: number[] = [];
  if (boxArray instanceof PDFArray) {
    for (let i = 0; i < boxArray.size(); i++) {
      const item = boxArray.get(i);
      if (item instanceof PDFNumber) raw.push(item.asNumber());
      else raw.push(Number(item));
    }
  } else if (Array.isArray(boxArray)) {
    raw = boxArray.map(Number);
  } else if (typeof boxArray === 'object' && 'x' in boxArray && 'width' in boxArray) {
    const x = Number(boxArray.x) || 0;
    const y = Number(boxArray.y) || 0;
    const width = Number(boxArray.width) || 0;
    const height = Number(boxArray.height) || 0;
    return {
      x,
      y,
      width,
      height,
      widthInches: Number((width / 72).toFixed(3)),
      heightInches: Number((height / 72).toFixed(3)),
      widthMm: Number((width * 25.4 / 72).toFixed(1)),
      heightMm: Number((height * 25.4 / 72).toFixed(1)),
    };
  }

  if (raw.length < 4) return undefined;
  const x = Math.min(raw[0], raw[2]);
  const y = Math.min(raw[1], raw[3]);
  const width = Math.abs(raw[2] - raw[0]);
  const height = Math.abs(raw[3] - raw[1]);

  return {
    x,
    y,
    width,
    height,
    widthInches: Number((width / 72).toFixed(3)),
    heightInches: Number((height / 72).toFixed(3)),
    widthMm: Number((width * 25.4 / 72).toFixed(1)),
    heightMm: Number((height * 25.4 / 72).toFixed(1)),
  };
}

/**
 * Deep PDF Inspection Engine for ATS Preflight.
 */
export async function inspectPdfDocument(
  pdfBuffer: ArrayBuffer | Uint8Array,
  profileOrId: PreflightProfile | string = 'ats-standard-print'
): Promise<PreflightReport> {
  const profile = typeof profileOrId === 'string'
    ? getPreflightProfileById(profileOrId)
    : profileOrId;

  const bytes = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);

  // 1. Validate magic bytes
  const header = String.fromCharCode(...Array.from(bytes.slice(0, 8)));
  if (!header.startsWith('%PDF-')) {
    throw new Error('Malformed PDF: Missing "%PDF-" header signature.');
  }

  const pdfVersionMatch = header.match(/%PDF-(\d+\.\d+)/);
  const pdfVersion = pdfVersionMatch ? pdfVersionMatch[1] : '1.4';

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('encrypt')) {
      return createEncryptedPdfReport(profile, pdfVersion);
    }
    throw new Error(`Corrupted PDF structure: ${err.message || 'Cannot parse PDF catalog'}`);
  }

  const totalPageCount = doc.getPageCount();
  const issues: PreflightIssue[] = [];

  // Check 1: Check PDF Encryption
  const trailer = doc.context.trailerInfo;
  const isEncrypted = doc.isEncrypted || !!trailer.Encrypt;
  if (isEncrypted) {
    issues.push({
      id: 'sec-encrypted-pdf',
      severity: 'error',
      category: 'interactive-security',
      pageNumbers: [],
      title: 'PDF is password protected or encrypted',
      description: 'Encrypted PDFs cannot be rendered or separated by commercial RIPs. Remove password protection before submission.',
      ruleId: 'no-encryption',
      suggestedResolution: 'Export a decrypted, unencrypted PDF copy from source software.',
      isRepairable: false,
      status: 'unresolved',
    });
  }

  // Check 2: Catalog OutputIntents
  let hasValidOutputIntent = false;
  let outputConditionId: string | null = null;
  let outputRegistryName: string | null = null;
  let isPdfx = false;
  let hasIccEmbedded = false;

  const catalog = doc.catalog;
  const outputIntents = catalog.lookup(PDFName.of('OutputIntents'));
  if (outputIntents && outputIntents instanceof PDFArray && outputIntents.size() > 0) {
    const firstIntent = doc.context.lookup(outputIntents.get(0));
    if (firstIntent && firstIntent instanceof PDFDict) {
      const sType = firstIntent.lookup(PDFName.of('S'));
      const condId = firstIntent.lookup(PDFName.of('OutputConditionIdentifier'));
      const regName = firstIntent.lookup(PDFName.of('RegistryName'));
      const destProfile = firstIntent.lookup(PDFName.of('DestOutputProfile'));

      if (condId) {
        outputConditionId = condId.toString().replace(/[()]/g, '');
      }
      if (regName) {
        outputRegistryName = regName.toString().replace(/[()]/g, '');
      }
      if (sType && sType.toString() === '/GTS_PDFX') {
        isPdfx = true;
        hasValidOutputIntent = true;
      }
      if (destProfile) {
        hasIccEmbedded = true;
      }
    }
  }

  if (profile.rules.requireOutputIntent && !hasValidOutputIntent) {
    issues.push({
      id: 'out-missing-output-intent',
      severity: 'error',
      category: 'output-intent',
      pageNumbers: [],
      title: 'Missing CMYK Output Intent (/GTS_PDFX)',
      description: `The selected profile (${profile.name}) requires a certified CMYK Output Intent with embedded ICC profile.`,
      ruleId: 'require-output-intent',
      suggestedResolution: 'Inject certified CMYK OutputIntent (e.g. FOGRA39 or GRACoL) using ATS Repair workspace.',
      isRepairable: true,
      repairActionId: 'inject-cmyk-output-intent',
      status: 'unresolved',
    });
  }

  // Check 3: Interactive Security (AcroForms, JavaScript, Annotations)
  const acroForm = catalog.lookup(PDFName.of('AcroForm'));
  if (acroForm && profile.rules.disallowInteractiveForms) {
    issues.push({
      id: 'sec-acroform-present',
      severity: 'warning',
      category: 'interactive-security',
      pageNumbers: [],
      title: 'Interactive Form Fields (AcroForm) Present',
      description: 'Interactive forms can cause unpredictable RIP rendering or missing field values on print plates.',
      ruleId: 'no-interactive-forms',
      suggestedResolution: 'Flatten or strip form annotations into standard static page content.',
      isRepairable: true,
      repairActionId: 'strip-annotations-and-forms',
      status: 'unresolved',
    });
  }

  const names = catalog.lookup(PDFName.of('Names'));
  let hasJs = false;
  if (names && names instanceof PDFDict) {
    const jsDict = names.lookup(PDFName.of('JavaScript'));
    if (jsDict) hasJs = true;
  }
  if (hasJs && profile.rules.disallowJavaScript) {
    issues.push({
      id: 'sec-javascript-present',
      severity: 'error',
      category: 'interactive-security',
      pageNumbers: [],
      title: 'Embedded JavaScript Actions Detected',
      description: 'Embedded scripts are prohibited in print production workflows due to security and execution instability.',
      ruleId: 'no-javascript',
      suggestedResolution: 'Strip embedded scripts before sending to press.',
      isRepairable: true,
      repairActionId: 'strip-javascript',
      status: 'unresolved',
    });
  }

  // Document-wide Font Map
  const fontRegistry = new Map<string, PreflightFontInfo>();

  // Page-by-page Inspection
  const pagesDetail: PageInspectionDetail[] = [];
  const globalColorSpaces = new Set<string>();
  let totalImagesCount = 0;
  let totalLowDpiImages = 0;
  let minDpiFound = 9999;
  let totalRgbObjects = 0;
  const spotColorsFound = new Set<string>();

  const pages = doc.getPages();

  for (let idx = 0; idx < pages.length; idx++) {
    const page = pages[idx];
    const pageNumber = idx + 1;
    const pageNode = page.node;

    // 1. Page Boxes
    const mediaBox = parsePdfBox(page.getMediaBox()) || {
      x: 0,
      y: 0,
      width: 612,
      height: 792,
      widthInches: 8.5,
      heightInches: 11.0,
      widthMm: 215.9,
      heightMm: 279.4,
    };
    const cropBox = parsePdfBox(pageNode.lookup(PDFName.of('CropBox')));
    const bleedBox = parsePdfBox(pageNode.lookup(PDFName.of('BleedBox')));
    const trimBox = parsePdfBox(pageNode.lookup(PDFName.of('TrimBox')));
    const artBox = parsePdfBox(pageNode.lookup(PDFName.of('ArtBox')));

    const orientation: 'portrait' | 'landscape' | 'square' =
      mediaBox.width > mediaBox.height + 1
        ? 'landscape'
        : mediaBox.height > mediaBox.width + 1
        ? 'portrait'
        : 'square';

    // Calculate Bleed Amount
    let bleedAmount = { top: 0, bottom: 0, left: 0, right: 0 };
    if (trimBox && bleedBox) {
      bleedAmount = {
        top: Math.max(0, Number(((bleedBox.height - trimBox.height) / (2 * 72)).toFixed(3))),
        bottom: Math.max(0, Number(((bleedBox.height - trimBox.height) / (2 * 72)).toFixed(3))),
        left: Math.max(0, Number(((bleedBox.width - trimBox.width) / (2 * 72)).toFixed(3))),
        right: Math.max(0, Number(((bleedBox.width - trimBox.width) / (2 * 72)).toFixed(3))),
      };
    } else if (trimBox && mediaBox) {
      bleedAmount = {
        top: Math.max(0, Number(((mediaBox.height - trimBox.height) / (2 * 72)).toFixed(3))),
        bottom: Math.max(0, Number(((mediaBox.height - trimBox.height) / (2 * 72)).toFixed(3))),
        left: Math.max(0, Number(((mediaBox.width - trimBox.width) / (2 * 72)).toFixed(3))),
        right: Math.max(0, Number(((mediaBox.width - trimBox.width) / (2 * 72)).toFixed(3))),
      };
    }

    const maxBleedFound = Math.max(bleedAmount.top, bleedAmount.bottom, bleedAmount.left, bleedAmount.right);
    const hasStandardBleed = maxBleedFound >= profile.rules.minBleedInches - 0.01;

    const pageBoxes: PageBoxesInfo = {
      mediaBox,
      cropBox,
      bleedBox,
      trimBox,
      artBox,
      orientation,
      bleedAmountInches: bleedAmount,
      hasStandardBleed,
    };

    // Page Box Issues
    if (!trimBox && profile.rules.minBleedInches > 0) {
      issues.push({
        id: `box-missing-trimbox-p${pageNumber}`,
        severity: 'warning',
        category: 'page-boxes',
        pageNumbers: [pageNumber],
        title: `Page ${pageNumber}: Missing explicit TrimBox`,
        description: 'Page lacks a defined TrimBox. Modern imposition RIPs require a TrimBox to accurately position trims.',
        ruleId: 'require-trimbox',
        suggestedResolution: 'Define explicit TrimBox matching targeted book trim dimensions.',
        isRepairable: true,
        repairActionId: 'normalize-page-boxes',
        status: 'unresolved',
      });
    }

    if (!hasStandardBleed && profile.rules.minBleedInches > 0) {
      issues.push({
        id: `bleed-insufficient-p${pageNumber}`,
        severity: profile.rules.strictCmykOnly ? 'error' : 'warning',
        category: 'bleed',
        pageNumbers: [pageNumber],
        title: `Page ${pageNumber}: Insufficient bleed allowance (${maxBleedFound.toFixed(3)}")`,
        description: `Profile requires minimum ${profile.rules.minBleedInches}" bleed. Found ${maxBleedFound.toFixed(3)}". Content near trim may suffer white edges after cutting.`,
        ruleId: 'min-bleed-allowance',
        suggestedResolution: 'Expand page geometry and extend artwork 0.125" beyond trim box.',
        isRepairable: true,
        repairActionId: 'normalize-page-boxes',
        status: 'unresolved',
      });
    }

    // 2. Parse Page Resources & Content Streams
    const pageColorSpaces = new Set<string>();
    const pageFontsUsed: string[] = [];
    const pageImages: PreflightImageInfo[] = [];

    let hasOverprint = false;
    let has100KBlackText = true;
    let hasRichBlackText = false;
    let hasKnockoutRisk = false;
    let hasHairlines = false;
    let hasTransparency = false;

    // Check Annotations on this page
    const annots = pageNode.lookup(PDFName.of('Annots'));
    if (annots && annots instanceof PDFArray && annots.size() > 0 && profile.rules.disallowAnnotations) {
      issues.push({
        id: `annots-present-p${pageNumber}`,
        severity: 'info',
        category: 'interactive-security',
        pageNumbers: [pageNumber],
        title: `Page ${pageNumber}: Contains ${annots.size()} PDF Annotation(s)`,
        description: 'Sticky notes, comments, or markup annotations detected. These may print unintentionally if not stripped.',
        ruleId: 'no-annotations',
        suggestedResolution: 'Strip annotations before sending production copy to print.',
        isRepairable: true,
        repairActionId: 'strip-annotations-and-forms',
        status: 'unresolved',
      });
    }

    // Check Resources
    const resources = pageNode.lookup(PDFName.of('Resources'));
    if (resources && resources instanceof PDFDict) {
      // A. Check Fonts
      const fontDict = resources.lookup(PDFName.of('Font'));
      if (fontDict && fontDict instanceof PDFDict) {
        const fontEntries = fontDict.entries();
        for (const [key, fontVal] of fontEntries) {
          const fontObj = doc.context.lookup(fontVal);
          if (fontObj && fontObj instanceof PDFDict) {
            const baseFont = fontObj.lookup(PDFName.of('BaseFont'))?.toString().replace(/^\//, '') || 'UnknownFont';
            const subtype = fontObj.lookup(PDFName.of('Subtype'))?.toString().replace(/^\//, '') || 'Type1';

            pageFontsUsed.push(baseFont);

            const isStandard14 = STANDARD_14_FONTS.some((sf) => baseFont.includes(sf));
            const isSubset = /^[A-Z]{6}\+/.test(baseFont);

            // Check embedding via FontDescriptor
            let isEmbedded = false;
            const descriptor = fontObj.lookup(PDFName.of('FontDescriptor'));
            if (descriptor && descriptor instanceof PDFDict) {
              const f1 = descriptor.lookup(PDFName.of('FontFile'));
              const f2 = descriptor.lookup(PDFName.of('FontFile2'));
              const f3 = descriptor.lookup(PDFName.of('FontFile3'));
              if (f1 || f2 || f3) isEmbedded = true;
            }

            if (!fontRegistry.has(baseFont)) {
              fontRegistry.set(baseFont, {
                name: baseFont,
                baseFont,
                subtype,
                isEmbedded: isEmbedded || isStandard14,
                isSubset,
                isStandard14,
                pagesUsed: [pageNumber],
              });
            } else {
              const existing = fontRegistry.get(baseFont)!;
              if (!existing.pagesUsed.includes(pageNumber)) {
                existing.pagesUsed.push(pageNumber);
              }
            }

            if (!isEmbedded && !isStandard14 && profile.rules.requireAllFontsEmbedded) {
              issues.push({
                id: `font-unembedded-${baseFont}-p${pageNumber}`,
                severity: 'error',
                category: 'fonts',
                pageNumbers: [pageNumber],
                title: `Page ${pageNumber}: Font "${baseFont}" is not embedded`,
                description: 'Unembedded fonts will cause text substitution or glyph scrambling on commercial RIPs.',
                ruleId: 'require-embedded-fonts',
                suggestedResolution: 'Re-export PDF with full font embedding or convert text outlines in source artwork.',
                isRepairable: false,
                status: 'unresolved',
              });
            }
          }
        }
      }

      // B. Check XObjects (Images and Transparency Groups)
      const xObjectDict = resources.lookup(PDFName.of('XObject'));
      if (xObjectDict && xObjectDict instanceof PDFDict) {
        const xEntries = xObjectDict.entries();
        for (const [xKey, xVal] of xEntries) {
          const xObj = doc.context.lookup(xVal);
          if (xObj && xObj instanceof PDFStream) {
            const subtype = xObj.dict.lookup(PDFName.of('Subtype'))?.toString();
            if (subtype === '/Image') {
              totalImagesCount++;
              const w = Number(xObj.dict.lookup(PDFName.of('Width'))) || 100;
              const h = Number(xObj.dict.lookup(PDFName.of('Height'))) || 100;

              let colorSpace = xObj.dict.lookup(PDFName.of('ColorSpace'))?.toString().replace(/^\//, '') || 'DeviceRGB';
              if (colorSpace.includes('DeviceRGB') || colorSpace.includes('RGB')) {
                colorSpace = 'DeviceRGB';
                pageColorSpaces.add('DeviceRGB');
                globalColorSpaces.add('DeviceRGB');
                totalRgbObjects++;
              } else if (colorSpace.includes('DeviceCMYK') || colorSpace.includes('CMYK')) {
                colorSpace = 'DeviceCMYK';
                pageColorSpaces.add('DeviceCMYK');
                globalColorSpaces.add('DeviceCMYK');
              } else if (colorSpace.includes('DeviceGray') || colorSpace.includes('Gray')) {
                colorSpace = 'DeviceGray';
                pageColorSpaces.add('DeviceGray');
                globalColorSpaces.add('DeviceGray');
              } else if (colorSpace.includes('Separation')) {
                pageColorSpaces.add('Separation');
                globalColorSpaces.add('Separation');
              }

              // Display approximation
              const displayW = Math.min(mediaBox.width * 0.7, 400);
              const displayH = Math.min(mediaBox.height * 0.7, 500);

              const dpiX = Math.round((w / (displayW / 72)));
              const dpiY = Math.round((h / (displayH / 72)));
              const minDpi = Math.min(dpiX, dpiY);
              if (minDpi < minDpiFound) minDpiFound = minDpi;

              const isLow = minDpi < profile.rules.minImageDpiPrint;
              const isVeryLow = minDpi < profile.rules.minImageDpiWarning;
              if (isLow) totalLowDpiImages++;

              pageImages.push({
                id: xKey.toString().replace(/^\//, ''),
                pageNumber,
                widthPx: w,
                heightPx: h,
                pixelWidth: w,
                pixelHeight: h,
                displayWidthPt: displayW,
                displayHeightPt: displayH,
                effectiveDpiX: dpiX,
                effectiveDpiY: dpiY,
                effectiveDpi: minDpi,
                colorSpace,
                bitsPerComponent: 8,
                isLowRes: isLow,
                isVeryLowRes: isVeryLow,
              });

              if (isVeryLow) {
                issues.push({
                  id: `img-very-low-res-${xKey}-p${pageNumber}`,
                  severity: 'error',
                  category: 'images',
                  pageNumbers: [pageNumber],
                  title: `Page ${pageNumber}: Critical low-resolution image (${minDpi} DPI)`,
                  description: `Image "${xKey.toString().replace(/^\//, '')}" has effective resolution of ${minDpi} DPI, far below the ${profile.rules.minImageDpiWarning} DPI threshold. Severe pixelation will occur.`,
                  ruleId: 'min-image-dpi',
                  suggestedResolution: 'Replace with high-resolution image asset (>= 300 DPI) before printing.',
                  isRepairable: false,
                  status: 'unresolved',
                });
              } else if (isLow) {
                issues.push({
                  id: `img-low-res-${xKey}-p${pageNumber}`,
                  severity: 'warning',
                  category: 'images',
                  pageNumbers: [pageNumber],
                  title: `Page ${pageNumber}: Low-resolution image (${minDpi} DPI)`,
                  description: `Image "${xKey.toString().replace(/^\//, '')}" is ${minDpi} DPI. Recommended print resolution is ${profile.rules.minImageDpiPrint} DPI.`,
                  ruleId: 'min-image-dpi',
                  suggestedResolution: 'Supply high-resolution 300 DPI image.',
                  isRepairable: false,
                  status: 'unresolved',
                });
              }
            } else if (subtype === '/Form') {
              const group = xObj.dict.lookup(PDFName.of('Group'));
              if (group && group instanceof PDFDict) {
                const s = group.lookup(PDFName.of('S'))?.toString();
                if (s === '/Transparency') {
                  hasTransparency = true;
                }
              }
            }
          }
        }
      }

      // C. Check ExtGState (Overprint, BlendMode, Alpha)
      const extGStateDict = resources.lookup(PDFName.of('ExtGState'));
      if (extGStateDict && extGStateDict instanceof PDFDict) {
        const gEntries = extGStateDict.entries();
        for (const [, gVal] of gEntries) {
          const gObj = doc.context.lookup(gVal);
          if (gObj && gObj instanceof PDFDict) {
            const op = gObj.lookup(PDFName.of('OP'))?.toString();
            const opLower = gObj.lookup(PDFName.of('op'))?.toString();
            const bm = gObj.lookup(PDFName.of('BM'))?.toString();
            const ca = Number(gObj.lookup(PDFName.of('ca')));
            const caUpper = Number(gObj.lookup(PDFName.of('CA')));

            if (op === 'true' || opLower === 'true') {
              hasOverprint = true;
            }
            if ((ca && ca < 1) || (caUpper && caUpper < 1) || (bm && bm !== '/Normal')) {
              hasTransparency = true;
            }
          }
        }
      }
    }

    // 3. Scan Raw Content Stream Operators
    const contentsRef = pageNode.lookup(PDFName.of('Contents'));
    let contentBytes: Uint8Array[] = [];
    if (contentsRef instanceof PDFStream) {
      contentBytes.push(contentsRef.getContents());
    } else if (contentsRef instanceof PDFArray) {
      for (let i = 0; i < contentsRef.size(); i++) {
        const stream = doc.context.lookup(contentsRef.get(i));
        if (stream instanceof PDFStream) {
          contentBytes.push(stream.getContents());
        }
      }
    }

    let streamText = '';
    for (const b of contentBytes) {
      try {
        const decompressed = pako.inflate(b);
        streamText += ' ' + new TextDecoder('latin1').decode(decompressed);
      } catch {
        streamText += ' ' + new TextDecoder('latin1').decode(b);
      }
    }

    // Color space operators in stream
    if (/[0-9.]+\s+[0-9.]+\s+[0-9.]+\s+(rg|RG)/.test(streamText)) {
      pageColorSpaces.add('DeviceRGB');
      globalColorSpaces.add('DeviceRGB');
      totalRgbObjects++;
    }
    if (/[0-9.]+\s+[0-9.]+\s+[0-9.]+\s+[0-9.]+\s+(k|K)/.test(streamText)) {
      pageColorSpaces.add('DeviceCMYK');
      globalColorSpaces.add('DeviceCMYK');
    }
    if (/[0-9.]+\s+(g|G)/.test(streamText)) {
      pageColorSpaces.add('DeviceGray');
      globalColorSpaces.add('DeviceGray');
    }

    // Hairlines (< 0.25 pt rule width)
    const strokeWidthRegex = /([0-9.]+)\s+w\b/g;
    let strokeMatch: RegExpExecArray | null;
    while ((strokeMatch = strokeWidthRegex.exec(streamText)) !== null) {
      const val = parseFloat(strokeMatch[1]);
      if (val > 0 && val < profile.rules.minRuleWidthPt) {
        hasHairlines = true;
        break;
      }
    }

    if (hasHairlines && profile.rules.flagHairlines) {
      issues.push({
        id: `vector-hairline-p${pageNumber}`,
        severity: 'warning',
        category: 'vector-rules',
        pageNumbers: [pageNumber],
        title: `Page ${pageNumber}: Hairline rule detected (< ${profile.rules.minRuleWidthPt} pt)`,
        description: 'Very thin strokes (< 0.25 pt) may break or disappear when exposed on lithographic printing plates.',
        ruleId: 'min-rule-width',
        suggestedResolution: 'Increase stroke width to at least 0.25 pt (or 0.5 pt for reverse knockout rules).',
        isRepairable: false,
        status: 'unresolved',
      });
    }

    // Overprint checks: If pure black text is used without overprint
    if (profile.rules.enforceBlackTextOverprint && !hasOverprint && pageFontsUsed.length > 0) {
      issues.push({
        id: `black-no-overprint-p${pageNumber}`,
        severity: 'warning',
        category: 'black-overprint',
        pageNumbers: [pageNumber],
        title: `Page ${pageNumber}: Black text overprint is inactive`,
        description: 'Black vector text knocks out underlying colors. Press plate misregistration will cause visible white halos.',
        ruleId: 'enforce-black-overprint',
        suggestedResolution: 'Enable black overprint (/GS_OP true) in ATS Repair workspace.',
        isRepairable: true,
        repairActionId: 'enforce-100k-black-overprint',
        status: 'unresolved',
      });
    }

    // Blank page check
    const isBlank = pageFontsUsed.length === 0 && pageImages.length === 0 && streamText.trim().length === 0;
    if (isBlank) {
      issues.push({
        id: `blank-page-p${pageNumber}`,
        severity: 'info',
        category: 'blank-pages',
        pageNumbers: [pageNumber],
        title: `Page ${pageNumber}: Deliberate blank page detected`,
        description: 'Page contains no text or visual artwork. Verify if intentional for chapter recto alignment.',
        ruleId: 'flag-blank-pages',
        suggestedResolution: 'Confirm whether blank page is intended for recto chapter starts.',
        isRepairable: false,
        status: 'unresolved',
      });
    }

    // Check RGB error in CMYK-only profile
    if (pageColorSpaces.has('DeviceRGB') && profile.rules.strictCmykOnly) {
      issues.push({
        id: `color-rgb-detected-p${pageNumber}`,
        severity: 'error',
        category: 'color-space',
        pageNumbers: [pageNumber],
        title: `Page ${pageNumber}: RGB color objects detected`,
        description: `Profile "${profile.name}" strictly forbids RGB color space. All colors must be CMYK or spot separations.`,
        ruleId: 'strict-cmyk-only',
        suggestedResolution: 'Convert all RGB images and vector fills to CMYK ICC output profile.',
        isRepairable: true,
        repairActionId: 'convert-rgb-to-cmyk',
        status: 'unresolved',
      });
    }

    // Check Transparency in profiles that forbid it
    if (hasTransparency && !profile.rules.allowTransparency) {
      issues.push({
        id: `transparency-disallowed-p${pageNumber}`,
        severity: 'error',
        category: 'transparency',
        pageNumbers: [pageNumber],
        title: `Page ${pageNumber}: Live transparency detected`,
        description: 'Selected profile does not permit live transparency. Transparency flattener is required for legacy press RIPs.',
        ruleId: 'disallow-transparency',
        suggestedResolution: 'Flatten transparency in design source or convert to PDF/X-1a.',
        isRepairable: false,
        status: 'unresolved',
      });
    }

    // Compile page details
    const colorSpacesArr = Array.from(pageColorSpaces);
    const pageErrors = issues.filter((i) => i.pageNumbers.includes(pageNumber) && i.severity === 'error').length;
    const pageWarnings = issues.filter((i) => i.pageNumbers.includes(pageNumber) && i.severity === 'warning').length;
    const pageInfos = issues.filter((i) => i.pageNumbers.includes(pageNumber) && i.severity === 'info').length;

    pagesDetail.push({
      pageNumber,
      pageBoxes,
      colorSpacesFound: colorSpacesArr.length > 0 ? colorSpacesArr : ['DeviceCMYK'],
      hasRgb: pageColorSpaces.has('DeviceRGB'),
      hasCmyk: pageColorSpaces.has('DeviceCMYK') || colorSpacesArr.length === 0,
      hasSpotColors: pageColorSpaces.has('Separation'),
      spotColorNames: [],
      hasTransparency,
      hasOverprint,
      has100KBlackText,
      hasRichBlackText,
      hasKnockoutRisk,
      hasHairlines,
      isBlank,
      images: pageImages,
      fonts: pageFontsUsed,
      issuesCount: {
        error: pageErrors,
        warning: pageWarnings,
        info: pageInfos,
      },
    });
  }

  // Summary counts
  const errorsCount = issues.filter((i) => i.severity === 'error').length;
  const warningsCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;
  const passedCount = 14 - Math.min(14, errorsCount + warningsCount);

  const isCompliant = errorsCount === 0;

  // Compliance score calculation (0 - 100)
  const scoreDeductions = (errorsCount * 25) + (warningsCount * 5);
  const complianceScore = Math.max(0, Math.min(100, 100 - scoreDeductions));

  const allFonts = Array.from(fontRegistry.values());
  const unembeddedFonts = allFonts.filter((f) => !f.isEmbedded && !f.isStandard14).length;

  const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: reportId,
    jobId: '',
    inspectedAt: new Date().toISOString(),
    profileId: profile.id,
    profileName: profile.name,
    isCompliant,
    complianceScore,
    score: complianceScore,
    totalPageCount,
    pdfVersion,
    outputIntent: outputConditionId
      ? {
          conditionId: outputConditionId,
          registryName: outputRegistryName || undefined,
          isPdfx,
          hasIccEmbedded,
        }
      : undefined,
    summary: {
      errorsCount,
      warningsCount,
      infoCount,
      passedCount,
      errors: errorsCount,
      warnings: warningsCount,
      info: infoCount,
      passed: passedCount,
    },
    colorSummary: {
      colorSpaces: Array.from(globalColorSpaces),
      cmykCompliant: !globalColorSpaces.has('DeviceRGB') && totalRgbObjects === 0,
      hasRgb: globalColorSpaces.has('DeviceRGB') || totalRgbObjects > 0,
      rgbObjectsCount: totalRgbObjects,
      spotColors: Array.from(spotColorsFound),
      pure100kBlackEnforced: !issues.some((i) => i.id.includes('rich-black')),
      overprintActive: !issues.some((i) => i.id.includes('overprint-missing')),
    },
    fontSummary: {
      totalFonts: allFonts.length,
      embeddedCount: allFonts.length - unembeddedFonts,
      unembeddedCount: unembeddedFonts,
      allEmbedded: unembeddedFonts === 0,
    },
    imageSummary: {
      totalImages: totalImagesCount,
      lowDpiCount: totalLowDpiImages,
      minDpiFound: totalImagesCount > 0 ? minDpiFound : 300,
    },
    securitySummary: {
      hasEncryption: isEncrypted,
      hasJavaScript: hasJs,
      hasForms: !!acroForm,
      hasAnnotations: issues.some((i) => i.category === 'interactive-security'),
    },
    issues,
    pages: pagesDetail,
    fonts: allFonts,
    images: pagesDetail.flatMap((p) => p.images),
  };
}

/**
 * Creates an error report for encrypted/password protected PDFs.
 */
function createEncryptedPdfReport(profile: PreflightProfile, pdfVersion: string): PreflightReport {
  return {
    id: `rep-enc-${Date.now()}`,
    jobId: '',
    inspectedAt: new Date().toISOString(),
    profileId: profile.id,
    profileName: profile.name,
    isCompliant: false,
    complianceScore: 0,
    score: 0,
    totalPageCount: 0,
    pdfVersion,
    summary: {
      errorsCount: 1,
      warningsCount: 0,
      infoCount: 0,
      passedCount: 0,
      errors: 1,
      warnings: 0,
      info: 0,
      passed: 0,
    },
    colorSummary: {
      colorSpaces: [],
      cmykCompliant: false,
      hasRgb: false,
      rgbObjectsCount: 0,
      spotColors: [],
    },
    fontSummary: { totalFonts: 0, embeddedCount: 0, unembeddedCount: 0, allEmbedded: false },
    imageSummary: { totalImages: 0, lowDpiCount: 0, minDpiFound: 0 },
    securitySummary: { hasEncryption: true, hasJavaScript: false, hasForms: false, hasAnnotations: false },
    issues: [
      {
        id: 'sec-encrypted-fatal',
        severity: 'error',
        category: 'interactive-security',
        pageNumbers: [],
        title: 'PDF is password encrypted',
        description: 'The uploaded PDF is protected with an encryption dictionary. Print preflight cannot inspect encrypted content.',
        ruleId: 'no-encryption',
        suggestedResolution: 'Decrypt or remove password protection prior to upload.',
        isRepairable: false,
        status: 'unresolved',
      },
    ],
    pages: [],
    fonts: [],
    images: [],
  };
}
