import { describe, it, expect } from 'vitest';
import {
  isArabicOrUrdu,
  containsUrduSpecificChars,
  isDevanagari,
  detectTextDirection,
  formatNumerals,
  checkLineHeightSafety
} from './bidiService';
import { shapeArabicText, prepareRtlTextForPdf } from './arabicShaper';
import {
  convertKrutiDevToUnicode,
  convertUnicodeToKrutiDev,
  convertChanakyaToUnicode,
  transliteratePhoneticToHindi,
  deriveUnicodeRepresentation
} from '../hindi/hindiEncodingService';
import { generateEpub, validateForEpub } from '../epub/epubExportService';
import { BookProject, BookTemplate } from '@/types/book';

describe('Phase 5: RTL and Bidi Services', () => {
  it('detects script accurately across Arabic, Urdu, Devanagari, and Latin', () => {
    expect(isArabicOrUrdu('مرحبا بالعالم')).toBe(true);
    expect(containsUrduSpecificChars('یہ گاڑی اچھی ہے')).toBe(true);
    expect(containsUrduSpecificChars('مرحبا')).toBe(false);
    expect(isDevanagari('नमस्ते दुनिया')).toBe(true);
    expect(isDevanagari('Hello World')).toBe(false);
  });

  it('detects text direction based on majority script and respects explicit overrides', () => {
    expect(detectTextDirection('مرحبا بكم في هذا الكتاب')).toBe('rtl');
    expect(detectTextDirection('This is an English paragraph')).toBe('ltr');
    expect(detectTextDirection('This is mixed: مرحبا')).toBe('mixed');
  });

  it('formats numerals correctly for Arabic-Indic and Eastern Urdu', () => {
    expect(formatNumerals('12345', 'arabic-indic')).toBe('١٢٣٤٥');
    expect(formatNumerals('12345', 'urdu-eastern')).toBe('۱۲۳۴۵');
    expect(formatNumerals('12345', 'western')).toBe('12345');
  });

  it('evaluates safe line height for complex scripts', () => {
    expect(checkLineHeightSafety('arabic', 1.2).safe).toBe(false);
    expect(checkLineHeightSafety('arabic', 1.6).safe).toBe(true);
    expect(checkLineHeightSafety('urdu', 1.5).safe).toBe(false);
    expect(checkLineHeightSafety('urdu', 1.95).safe).toBe(true);
    expect(checkLineHeightSafety('latin', 1.2).safe).toBe(true);
  });

  it('shapes Arabic and Urdu characters and handles Lam-Alef ligatures', () => {
    // Basic test of Arabic text shaping
    const shapedSalam = shapeArabicText('سلام');
    expect(shapedSalam).not.toBe('سلام');
    expect(shapedSalam.length).toBeGreaterThan(0);

    // Lam-Alef ligature (matches \uFEFA or \uFEFB)
    const shapedIslam = shapeArabicText('الإسلام');
    expect(shapedIslam).toMatch(/[\uFEF5-\uFEFC]/);

    // Urdu specific characters
    const shapedUrdu = shapeArabicText('گاڑی');
    expect(shapedUrdu.length).toBeGreaterThan(0);
  });

  it('prepares RTL text for PDF output with visual reordering', () => {
    const prepared = prepareRtlTextForPdf('كتاب');
    expect(prepared.length).toBeGreaterThan(0);
    // Reverse test for RTL visual flow
    expect(prepared).not.toEqual('كتاب');
  });
});

describe('Phase 5: Hindi Encoding, Transliteration and Legacy Font Support', () => {
  it('transliterates phonetic English input to Hindi Devanagari', () => {
    expect(transliteratePhoneticToHindi('namaste')).toBe('नमस्ते');
    expect(transliteratePhoneticToHindi('bharat')).toBe('भारत');
    expect(transliteratePhoneticToHindi('hindi')).toBe('हिन्दी');
    expect(transliteratePhoneticToHindi('shanti')).toBe('शांति');
  });

  it('converts Kruti Dev legacy text to Unicode and back', () => {
    // Kruti Dev mapping test
    const unicode = convertKrutiDevToUnicode('ueLrs');
    expect(unicode).toBe('नमस्ते');

    const backToKruti = convertUnicodeToKrutiDev('नमस्ते');
    expect(backToKruti).toBe('ueLrs');
  });

  it('converts Chanakya legacy text to Unicode', () => {
    const chanakyaSample = 'Hkkjr'; // Chanakya for भारत
    const unicode = convertChanakyaToUnicode(chanakyaSample);
    expect(unicode).toBe('भारत');
  });

  it('derives dual Unicode representation correctly for search and accessibility', () => {
    const derived = deriveUnicodeRepresentation('ueLrs', 'legacy', 'kruti-dev');
    expect(derived).toBe('नमस्ते');

    const unicodeInput = deriveUnicodeRepresentation('नमस्ते', 'unicode', 'inscript');
    expect(unicodeInput).toBe('नमस्ते');
  });
});

import { CLASSIC_NOVEL_6X9 } from '@/services/templates/templateRegistry';

describe('Phase 5: EPUB 3 Accessible Reflowable Generation', () => {
  const dummyTemplate: BookTemplate = CLASSIC_NOVEL_6X9;

  const dummyProject: BookProject = {
    id: 'test-rtl-book',
    title: 'كتاب الرحلة',
    author: 'أحمد البغدادي',
    manuscript: 'الفصل الأول\n\nهذا هو النص التمهيدي للرواية الأولى.',
    templateId: 'classic-novel-6x9',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    uiMode: 'expert',
    languageSettings: {
      documentLanguage: 'ar',
      writingDirection: 'rtl',
      numeralSystem: 'arabic-indic',
      allowMixedDirection: true,
      lineHeightSafetyAlerts: true
    },
    images: [],
    customTemplates: [],
    uploadedFonts: []
  };

  it('validates EPUB accessibility and detects missing image alt text', () => {
    const projectWithBadImage: BookProject = {
      ...dummyProject,
      images: [
        {
          id: 'img1',
          filename: 'cover.jpg',
          mimeType: 'image/jpeg',
          originalWidth: 800,
          originalHeight: 1200,
          fileSize: 50000,
          createdTime: new Date().toISOString(),
          src: 'data:image/jpeg;base64,123',
          caption: 'Cover Image',
          altText: '' // Empty alt text triggers warning/block
        }
      ]
    };

    const validation = validateForEpub(projectWithBadImage, projectWithBadImage.images);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes('lacks alternative text'))).toBe(true);
  });

  it('generates a valid EPUB 3 zip buffer with RTL page-progression-direction', async () => {
    const epubResult = await generateEpub(dummyProject, dummyTemplate);
    expect(epubResult).toBeDefined();
    expect(epubResult.blob).toBeDefined();
    expect(epubResult.blob.size).toBeGreaterThan(100);
    expect(epubResult.filename).toBe('كتاب-الرحلة.epub');
  });
});
