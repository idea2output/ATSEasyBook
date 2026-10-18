import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFArray,
  PDFStream,
} from 'pdf-lib';
import pako from 'pako';

export interface ImagePreflightInfo {
  id: string;
  width: number;
  height: number;
  colorSpace: string;
  isCmyk: boolean;
}

export interface PagePreflightInfo {
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  colorSpacesFound: string[];
  cmykFillCount: number;
  cmykStrokeCount: number;
  rgbFillCount: number;
  rgbStrokeCount: number;
  grayFillCount: number;
  grayStrokeCount: number;
  overprintCallsCount: number;
  hasOverprintExtGState: boolean;
  images: ImagePreflightInfo[];
  bodyTextIs100K: boolean;
}

export interface CmykPreflightReport {
  isCompliant: boolean;
  pdfxVersion: string | null;
  outputCondition: string | null;
  iccProfileEmbedded: boolean;
  totalPageCount: number;
  colorSpacesFound: string[];
  rgbObjectsCount: number;
  cmykObjectsCount: number;
  totalImagesCount: number;
  cmykImagesCount: number;
  rgbImagesCount: number;
  overprintEnabled: boolean;
  bodyTextPure100K: boolean;
  issues: string[];
  blockingErrors: string[];
  warnings: string[];
  pages: PagePreflightInfo[];
}

/**
 * Deeply inspects an exported PDF file to verify CMYK / PDF-X prepress compliance.
 */
export async function inspectPdfCmykCompliance(
  pdfBytes: ArrayBuffer | Uint8Array
): Promise<CmykPreflightReport> {
  const doc = await PDFDocument.load(pdfBytes);
  const totalPageCount = doc.getPageCount();

  const blockingErrors: string[] = [];
  const warnings: string[] = [];
  const issues: string[] = [];

  // 1. Inspect Catalog OutputIntents
  let hasValidOutputIntent = false;
  let outputCondition: string | null = null;
  let iccProfileEmbedded = false;

  const outputIntents = doc.catalog.lookup(PDFName.of('OutputIntents'));
  if (outputIntents && outputIntents instanceof PDFArray && outputIntents.size() > 0) {
    const firstIntent = doc.context.lookup(outputIntents.get(0));
    if (firstIntent && firstIntent instanceof PDFDict) {
      const sType = firstIntent.lookup(PDFName.of('S'));
      const condId = firstIntent.lookup(PDFName.of('OutputConditionIdentifier'));
      const destProfile = firstIntent.lookup(PDFName.of('DestOutputProfile'));

      if (condId) {
        outputCondition = condId.toString().replace(/[()]/g, '');
      }

      if (sType && sType.toString() === '/GTS_PDFX') {
        hasValidOutputIntent = true;
      }

      if (destProfile) {
        const profileStream = doc.context.lookup(destProfile);
        if (profileStream) {
          iccProfileEmbedded = true;
        }
      }
    }
  }

  if (!hasValidOutputIntent) {
    blockingErrors.push('Missing or invalid CMYK OutputIntent (/GTS_PDFX). Required for PDF/X and press RIPs.');
  }
  if (!iccProfileEmbedded) {
    blockingErrors.push('Missing embedded ICC Output Profile in /DestOutputProfile stream.');
  }

  // 2. Check PDF/X Version
  const pdfxVersionObj = doc.catalog.lookup(PDFName.of('GTS_PDFXVersion'));
  const pdfxVersion = pdfxVersionObj ? pdfxVersionObj.toString().replace(/[()]/g, '') : null;

  // 3. Inspect Every Page
  const pages = doc.getPages();
  const pageReports: PagePreflightInfo[] = [];

  let totalRgbObjects = 0;
  let totalCmykObjects = 0;
  let totalImagesCount = 0;
  let totalCmykImages = 0;
  let totalRgbImages = 0;
  let allBodyText100K = true;
  let anyOverprintCalls = 0;

  const globalColorSpaces = new Set<string>();

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    const { width, height } = page.getSize();
    const resources = page.node.Resources();

    const pageColorSpaces = new Set<string>();
    const pageImages: ImagePreflightInfo[] = [];

    // Check ExtGState
    let hasOverprintExtGState = false;
    if (resources) {
      const extGState = resources.lookup(PDFName.of('ExtGState'));
      if (extGState && extGState instanceof PDFDict) {
        const gsOp = extGState.lookup(PDFName.of('GS_OP'));
        if (gsOp) {
          hasOverprintExtGState = true;
        }
      }
    }

    // Check Image XObjects
    if (resources) {
      const xobjects = resources.lookup(PDFName.of('XObject'));
      if (xobjects && xobjects instanceof PDFDict) {
        const entries = xobjects.entries();
        for (const [key, ref] of entries) {
          const xobj = doc.context.lookup(ref);
          if (xobj && xobj instanceof PDFStream) {
            const subtype = xobj.dict.lookup(PDFName.of('Subtype'));
            if (subtype && subtype.toString() === '/Image') {
              totalImagesCount++;
              const w = Number(xobj.dict.lookup(PDFName.of('Width'))?.toString() || 0);
              const h = Number(xobj.dict.lookup(PDFName.of('Height'))?.toString() || 0);
              const cs = xobj.dict.lookup(PDFName.of('ColorSpace'))?.toString() || '/Unknown';

              const isCmyk = cs === '/DeviceCMYK';
              if (isCmyk) {
                totalCmykImages++;
                pageColorSpaces.add('DeviceCMYK');
                globalColorSpaces.add('DeviceCMYK');
              } else {
                totalRgbImages++;
                pageColorSpaces.add(cs);
                globalColorSpaces.add(cs);
                blockingErrors.push(`Page ${pIdx + 1}: Image "${key.toString()}" uses non-CMYK color space (${cs}).`);
              }

              pageImages.push({
                id: key.toString(),
                width: w,
                height: h,
                colorSpace: cs,
                isCmyk,
              });
            }
          }
        }
      }
    }

    // Scan Content Stream
    let cmykFill = 0;
    let cmykStroke = 0;
    let rgbFill = 0;
    let rgbStroke = 0;
    let grayFill = 0;
    let grayStroke = 0;
    let overprintCalls = 0;
    let bodyText100K = true;

    const contentsRef = page.node.Contents();
    if (contentsRef) {
      const streamObj = doc.context.lookup(contentsRef);
      if (streamObj && typeof (streamObj as any).getContents === 'function') {
        const rawBytes = (streamObj as any).getContents();
        let text = '';
        try {
          text = pako.inflate(rawBytes, { to: 'string' });
        } catch {
          text = new TextDecoder().decode(rawBytes);
        }

        // CMYK fills 'k'
        const kMatches = text.match(/(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s+k\b/g);
        cmykFill = kMatches ? kMatches.length : 0;
        if (cmykFill > 0) {
          pageColorSpaces.add('DeviceCMYK');
          globalColorSpaces.add('DeviceCMYK');
        }

        // CMYK strokes 'K'
        const capKMatches = text.match(/(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s+K\b/g);
        cmykStroke = capKMatches ? capKMatches.length : 0;
        if (cmykStroke > 0) {
          pageColorSpaces.add('DeviceCMYK');
          globalColorSpaces.add('DeviceCMYK');
        }

        // RGB fills 'rg'
        const rgMatches = text.match(/(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s+rg\b/g);
        rgbFill = rgMatches ? rgMatches.length : 0;
        if (rgbFill > 0) {
          pageColorSpaces.add('DeviceRGB');
          globalColorSpaces.add('DeviceRGB');
          blockingErrors.push(`Page ${pIdx + 1}: Found ${rgbFill} unmanaged DeviceRGB fill color objects.`);
        }

        // RGB strokes 'RG'
        const capRgMatches = text.match(/(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s+RG\b/g);
        rgbStroke = capRgMatches ? capRgMatches.length : 0;
        if (rgbStroke > 0) {
          pageColorSpaces.add('DeviceRGB');
          globalColorSpaces.add('DeviceRGB');
          blockingErrors.push(`Page ${pIdx + 1}: Found ${rgbStroke} unmanaged DeviceRGB stroke color objects.`);
        }

        // Gray fills 'g'
        const gMatches = text.match(/(\d*\.?\d+)\s+g\b/g);
        grayFill = gMatches ? gMatches.length : 0;
        if (grayFill > 0) {
          pageColorSpaces.add('DeviceGray');
          globalColorSpaces.add('DeviceGray');
          warnings.push(`Page ${pIdx + 1}: Found ${grayFill} DeviceGray fill objects (recommend converting to 100K DeviceCMYK).`);
        }

        // Gray strokes 'G'
        const capGMatches = text.match(/(\d*\.?\d+)\s+G\b/g);
        grayStroke = capGMatches ? capGMatches.length : 0;
        if (grayStroke > 0) {
          pageColorSpaces.add('DeviceGray');
          globalColorSpaces.add('DeviceGray');
          warnings.push(`Page ${pIdx + 1}: Found ${grayStroke} DeviceGray stroke objects.`);
        }

        // Overprint invocations
        const opMatches = text.match(/\/GS_OP\s+gs\b/g);
        overprintCalls = opMatches ? opMatches.length : 0;
        anyOverprintCalls += overprintCalls;

        // Check 100K body text: verify pages containing multi-line body paragraphs
        const tjCount = (text.match(/\bTj\b/g) || []).length;
        if (tjCount > 3) {
          const has100K = text.includes('0 0 0 1 k') || text.includes('0. 0. 0. 1. k');
          if (!has100K) {
            bodyText100K = false;
            allBodyText100K = false;
            warnings.push(`Page ${pIdx + 1}: Body text does not appear to be pure C0 M0 Y0 K100.`);
          }
        }
      }
    }

    totalRgbObjects += rgbFill + rgbStroke;
    totalCmykObjects += cmykFill + cmykStroke;

    pageReports.push({
      pageNumber: pIdx + 1,
      widthPt: width,
      heightPt: height,
      colorSpacesFound: Array.from(pageColorSpaces),
      cmykFillCount: cmykFill,
      cmykStrokeCount: cmykStroke,
      rgbFillCount: rgbFill,
      rgbStrokeCount: rgbStroke,
      grayFillCount: grayFill,
      grayStrokeCount: grayStroke,
      overprintCallsCount: overprintCalls,
      hasOverprintExtGState,
      images: pageImages,
      bodyTextIs100K: bodyText100K,
    });
  }

  if (totalRgbObjects > 0 || totalRgbImages > 0) {
    blockingErrors.push(`Document contains ${totalRgbObjects} RGB vector/text objects and ${totalRgbImages} RGB images. Print-Ready CMYK export requires zero RGB objects.`);
  }

  if (anyOverprintCalls === 0) {
    warnings.push('No overprint (/GS_OP gs) invocations detected for 100K black text or rules.');
  }

  const isCompliant =
    blockingErrors.length === 0 &&
    hasValidOutputIntent &&
    iccProfileEmbedded &&
    totalRgbObjects === 0 &&
    totalRgbImages === 0;

  return {
    isCompliant,
    pdfxVersion,
    outputCondition,
    iccProfileEmbedded,
    totalPageCount,
    colorSpacesFound: Array.from(globalColorSpaces),
    rgbObjectsCount: totalRgbObjects,
    cmykObjectsCount: totalCmykObjects,
    totalImagesCount,
    cmykImagesCount: totalCmykImages,
    rgbImagesCount: totalRgbImages,
    overprintEnabled: anyOverprintCalls > 0,
    bodyTextPure100K: allBodyText100K,
    issues: [...blockingErrors, ...warnings],
    blockingErrors,
    warnings,
    pages: pageReports,
  };
}
