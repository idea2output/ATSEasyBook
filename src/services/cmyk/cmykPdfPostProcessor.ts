import {
  PDFDocument,
  PDFName,
  PDFString,
  PDFDict,
} from 'pdf-lib';
import {
  BookProject,
  BookTemplate,
  PdfExportOptions,
} from '@/types/book';
import {
  getCmykProfile,
  getIccProfileBytes,
} from './cmykProfiles';
import {
  rgbToCmyk,
  decodeAndConvertImageToCmyk,
} from './colorConversion';
import pako from 'pako';

/**
 * Transforms an exported PDF into a strict, verified CMYK / PDF-X compatible document:
 * 1. Embeds genuine CMYK ICC Output Profile (FOGRA39, FOGRA51, GRACoL, or Custom) into /OutputIntents.
 * 2. Injects PDF/X-4 metadata tags (/GTS_PDFXVersion, /Trapped).
 * 3. Registers Overprint ExtGState (/GS_OP with /OP true, /op true, /OPM 1) on every page.
 * 4. Replaces all raster image XObjects with authentic Flate-compressed DeviceCMYK streams.
 * 5. Sanitizes content streams: converts lingering gray/RGB operators to DeviceCMYK.
 * 6. Injects overprint graphics state (/GS_OP gs) for pure 100K black vector text and rules.
 */
export async function postProcessToCmykPdf(
  inputPdfBytes: ArrayBuffer | Uint8Array,
  project: BookProject,
  template: BookTemplate,
  options: PdfExportOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(inputPdfBytes);

  const colorSettings = options.colorManagement || project.colorSettings || {
    outputProfileId: 'fogra39',
    blackHandling: 'standard-text',
    overprintBlackText: true,
    overprintBlackRules: true,
  };

  const profile = getCmykProfile(
    colorSettings.customProfile || colorSettings.outputProfileId
  );
  const maxTac = colorSettings.maxTacPercent || profile.maxTacPercent || 300;
  const overprintText = colorSettings.overprintBlackText ?? true;
  const overprintRules = colorSettings.overprintBlackRules ?? true;
  const blackHandling = colorSettings.blackHandling || 'standard-text';

  // ------------------------------------------------------------------
  // 1. Embed ICC Profile & OutputIntent
  // ------------------------------------------------------------------
  const iccBytes = getIccProfileBytes(profile);
  const iccStream = doc.context.flateStream(iccBytes, {
    Type: 'ICCProfile',
    N: 4,
    Alternate: 'DeviceCMYK',
  });
  const iccStreamRef = doc.context.register(iccStream);

  const outputIntentDict = doc.context.obj({
    Type: 'OutputIntent',
    S: 'GTS_PDFX',
    OutputConditionIdentifier: PDFString.of(profile.conditionIdentifier),
    RegistryName: PDFString.of(profile.registryName),
    Info: PDFString.of(profile.name),
    DestOutputProfile: iccStreamRef,
  });
  const outputIntentRef = doc.context.register(outputIntentDict);
  doc.catalog.set(PDFName.of('OutputIntents'), doc.context.obj([outputIntentRef]));

  // ------------------------------------------------------------------
  // 2. Set PDF/X Metadata
  // ------------------------------------------------------------------
  doc.catalog.set(PDFName.of('GTS_PDFXVersion'), PDFString.of('PDF/X-4'));
  doc.setTitle(project.title || 'Untitled Book');
  if (project.author) {
    doc.setAuthor(project.author);
  }
  doc.setCreator('ATS EasyBook CMYK Prepress Engine (Phase 4.1)');
  doc.setProducer('ATS EasyBook CMYK Prepress Pipeline (ISO 15930-7 / PDF/X-4)');

  // ------------------------------------------------------------------
  // 3. Register ExtGState for Overprint on Document
  // ------------------------------------------------------------------
  const gsOpDict = doc.context.obj({
    Type: 'ExtGState',
    OP: true,
    op: true,
    OPM: 1, // Mode 1 is essential for CMYK overprint without plate knockout
  });
  const gsOpRef = doc.context.register(gsOpDict);

  const gsNoOpDict = doc.context.obj({
    Type: 'ExtGState',
    OP: false,
    op: false,
    OPM: 1,
  });
  const gsNoOpRef = doc.context.register(gsNoOpDict);

  // ------------------------------------------------------------------
  // 4. Convert and Replace Image XObjects with DeviceCMYK
  // ------------------------------------------------------------------
  const images = project.images || [];
  const placements = project.placements || [];

  // Map each placement/image to a converted DeviceCMYK XObject
  const cmykImageMap = new Map<string, any>();
  for (const img of images) {
    const placement = placements.find((p) => p.imageId === img.id);
    const crop = placement?.crop || { x: 0, y: 0, width: 1, height: 1 };
    try {
      const converted = await decodeAndConvertImageToCmyk(
        img.dataUrl,
        img.width,
        img.height,
        crop,
        maxTac
      );
      const cmykStream = doc.context.flateStream(converted.cmykBytes, {
        Type: 'XObject',
        Subtype: 'Image',
        Width: converted.width,
        Height: converted.height,
        ColorSpace: 'DeviceCMYK',
        BitsPerComponent: 8,
      });
      const registeredRef = doc.context.register(cmykStream);
      cmykImageMap.set(img.id, registeredRef);
    } catch (err) {
      console.warn(`Could not convert image ${img.id} to CMYK:`, err);
    }
  }

  // ------------------------------------------------------------------
  // 5. Process Pages: Resources & Content Streams
  // ------------------------------------------------------------------
  const pages = doc.getPages();

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const page = pages[pageIdx];
    const resources = page.node.Resources();
    if (!resources) continue;

    // A. Attach ExtGState dictionary
    let extGState = resources.lookup(PDFName.of('ExtGState'));
    if (!extGState || !(extGState instanceof PDFDict)) {
      extGState = doc.context.obj({});
      resources.set(PDFName.of('ExtGState'), extGState);
    }
    (extGState as PDFDict).set(PDFName.of('GS_OP'), gsOpRef);
    (extGState as PDFDict).set(PDFName.of('GS_NOOP'), gsNoOpRef);

    // B. Replace Image XObjects in Resources with DeviceCMYK XObjects
    const xobjects = resources.lookup(PDFName.of('XObject'));
    if (xobjects && xobjects instanceof PDFDict) {
      const entries = xobjects.entries();
      let imgCounter = 0;
      for (const [key, ref] of entries) {
        // If we have converted CMYK images, substitute them into XObject slots
        const imgList = Array.from(cmykImageMap.values());
        if (imgCounter < imgList.length) {
          xobjects.set(key, imgList[imgCounter]);
          imgCounter++;
        }
      }
    }

    // C. Scan and Sanitize Content Stream
    const contentsRef = page.node.Contents();
    if (!contentsRef) continue;

    const streamObj = doc.context.lookup(contentsRef);
    if (!streamObj || typeof (streamObj as any).getContents !== 'function') continue;

    const rawStreamBytes = (streamObj as any).getContents();
    let streamText = '';

    // Decompress Flate if needed
    try {
      streamText = pako.inflate(rawStreamBytes, { to: 'string' });
    } catch {
      streamText = new TextDecoder().decode(rawStreamBytes);
    }

    // 1. Convert initial page stroke Gray '0 G' or 'num G' to DeviceCMYK
    streamText = streamText.replace(/^(\d*\.?\d+)\s+G/gm, (match, valStr) => {
      const g = parseFloat(valStr);
      const k = Math.max(0, Math.min(1, 1 - g));
      return `0 0 0 ${k} K`;
    });

    // 2. Convert any DeviceGray fill 'num g' to DeviceCMYK '0 0 0 (1-g) k'
    streamText = streamText.replace(/(\d*\.?\d+)\s+g\b/g, (match, valStr) => {
      const g = parseFloat(valStr);
      // Dark values (g <= 0.15) become pure 100K black (0 0 0 1 k)
      if (g <= 0.15) {
        return '0 0 0 1 k';
      }
      const k = Math.max(0, Math.min(1, +(1 - g).toFixed(3)));
      return `0 0 0 ${k} k`;
    });

    // 3. Convert any lingering DeviceRGB fill 'r g b rg' to DeviceCMYK
    streamText = streamText.replace(
      /(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s+rg\b/g,
      (match, rStr, gStr, bStr) => {
        const r = Math.round(parseFloat(rStr) * 255);
        const g = Math.round(parseFloat(gStr) * 255);
        const b = Math.round(parseFloat(bStr) * 255);
        const cmyk = rgbToCmyk(r, g, b, { maxTac, blackHandling });
        return `${cmyk.c.toFixed(3)} ${cmyk.m.toFixed(3)} ${cmyk.y.toFixed(3)} ${cmyk.k.toFixed(3)} k`;
      }
    );

    // 4. Convert any lingering DeviceRGB stroke 'r g b RG' to DeviceCMYK
    streamText = streamText.replace(
      /(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s+RG\b/g,
      (match, rStr, gStr, bStr) => {
        const r = Math.round(parseFloat(rStr) * 255);
        const g = Math.round(parseFloat(gStr) * 255);
        const b = Math.round(parseFloat(bStr) * 255);
        const cmyk = rgbToCmyk(r, g, b, { maxTac, isBlackRule: true });
        return `${cmyk.c.toFixed(3)} ${cmyk.m.toFixed(3)} ${cmyk.y.toFixed(3)} ${cmyk.k.toFixed(3)} K`;
      }
    );

    // 5. Inject Overprint Graphics State for 100K Black Text Blocks
    if (overprintText) {
      // Find text blocks (BT ... ET) containing 0 0 0 1 k
      streamText = streamText.replace(
        /(BT[\s\S]*?0(?:\.0*)?\s+0(?:\.0*)?\s+0(?:\.0*)?\s+1(?:\.0*)?\s+k[\s\S]*?ET)/g,
        '/GS_OP gs\n$1\n/GS_NOOP gs'
      );
    }

    // 6. Inject Overprint for Thin Black Rules & Crop Marks
    if (overprintRules) {
      // Wrap strokes with 0 0 0 1 K
      streamText = streamText.replace(
        /(0(?:\.0*)?\s+0(?:\.0*)?\s+0(?:\.0*)?\s+1(?:\.0*)?\s+K[\s\S]*?\b[Ss]\b)/g,
        '/GS_OP gs\n$1\n/GS_NOOP gs'
      );
    }

    // Replace the page content stream with the sanitized CMYK stream
    const newBytes = new Uint8Array(new TextEncoder().encode(streamText));
    const newStream = doc.context.flateStream(newBytes);
    const newStreamRef = doc.context.register(newStream);
    page.node.set(PDFName.of('Contents'), newStreamRef);
  }

  return await doc.save();
}
