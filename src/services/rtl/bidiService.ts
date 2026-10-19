import { NumeralSystem, WritingDirection } from '@/types/book';

/**
 * Unicode ranges for scripts:
 * Arabic: U+0600 to U+06FF, U+0750 to U+077F, U+08A0 to U+08FF
 * Arabic Presentation Forms-A: U+FB50 to U+FDFF
 * Arabic Presentation Forms-B: U+FE70 to U+FEFF
 * Devanagari: U+0900 to U+097F
 */
export const ARABIC_URDU_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
export const URDU_SPECIFIC_REGEX = /[\u0679\u067E\u0686\u0688\u0691\u0698\u06AF\u06BA\u06BE\u06CC\u06D2]/;
export const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
export const LATIN_REGEX = /[A-Za-z]/;

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const URDU_EASTERN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Detects the dominant direction of a text string based on script character counts.
 */
export function detectTextDirection(text: string): 'rtl' | 'ltr' | 'mixed' {
  if (!text || !text.trim()) return 'ltr';

  let rtlCount = 0;
  let ltrCount = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (ARABIC_URDU_REGEX.test(char)) {
      rtlCount++;
    } else if (LATIN_REGEX.test(char)) {
      ltrCount++;
    }
  }

  if (rtlCount > 0 && ltrCount > 0) {
    return 'mixed';
  }
  if (rtlCount > 0) {
    return 'rtl';
  }
  return 'ltr';
}

/**
 * Checks whether text contains Arabic or Urdu script characters.
 */
export function isArabicOrUrdu(text: string): boolean {
  return ARABIC_URDU_REGEX.test(text || '');
}

/**
 * Checks whether text contains Urdu-specific characters.
 */
export function containsUrduSpecificChars(text: string): boolean {
  return URDU_SPECIFIC_REGEX.test(text || '');
}

/**
 * Checks whether text contains Devanagari (Hindi) script characters.
 */
export function isDevanagari(text: string): boolean {
  return DEVANAGARI_REGEX.test(text || '');
}

/**
 * Formats Western digits in a string into the chosen NumeralSystem.
 */
export function formatNumerals(text: string, system: NumeralSystem = 'western'): string {
  if (!text || system === 'western') return text;

  const targetDigits = system === 'arabic-indic' ? ARABIC_INDIC_DIGITS : URDU_EASTERN_DIGITS;

  return text.replace(/[0-9]/g, (digit) => {
    const idx = parseInt(digit, 10);
    return targetDigits[idx] || digit;
  });
}

/**
 * Checks if line height is safe for Arabic / Urdu typography.
 * Arabic needs at least 1.5; Urdu Nastaliq requires at least 1.8 to prevent glyph collision.
 */
export function checkLineHeightSafety(
  language: string,
  lineHeight: number
): { safe: boolean; recommended: number; message?: string } {
  const lang = (language || 'en').toLowerCase();
  if (lang === 'ur' || lang.includes('urdu')) {
    if (lineHeight < 1.75) {
      return {
        safe: false,
        recommended: 1.9,
        message: `Line height ${lineHeight.toFixed(2)} is too tight for Urdu Nastaliq script. Urdu ascenders and descenders require at least 1.80 (recommended 1.90 - 2.10).`,
      };
    }
  } else if (lang === 'ar' || lang.includes('arabic')) {
    if (lineHeight < 1.45) {
      return {
        safe: false,
        recommended: 1.65,
        message: `Line height ${lineHeight.toFixed(2)} is too tight for Arabic script. Arabic diacritics and ligatures require at least 1.50 (recommended 1.60 - 1.80).`,
      };
    }
  }
  return { safe: true, recommended: lineHeight };
}

/**
 * Reorders words and tokens on an RTL line for standard LTR-coordinate PDF drawing.
 * Ensures that embedded English words and numbers stay left-to-right, while
 * Arabic words appear right-to-left.
 */
export function reorderRtlLineForPdf(line: string): string {
  if (!line || !line.trim()) return line;

  // Tokenize by whitespace, preserving space delimiters
  const tokens = line.split(/(\s+)/);
  if (tokens.length <= 1) {
    return line;
  }

  // Reverse tokens so the first word in the sentence ends up at the rightmost position
  const reversed = [...tokens].reverse();
  return reversed.join('');
}
