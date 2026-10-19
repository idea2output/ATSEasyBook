import { ManagedFont, CustomFontFormat } from '@/types/book';
import {
  ARABIC_URDU_REGEX,
  URDU_SPECIFIC_REGEX,
  DEVANAGARI_REGEX,
} from '@/services/rtl/bidiService';

/**
 * Built-in Preset Managed Fonts across scripts:
 */
export const SYSTEM_MANAGED_FONTS: ManagedFont[] = [
  {
    id: 'font-kruti-dev-010',
    displayName: 'Kruti Dev 010 (Legacy Hindi)',
    familyName: 'Kruti Dev 010',
    encodingType: 'legacy',
    supportedScript: 'devanagari',
    associatedKeyboardLayout: 'remington-kruti',
    format: 'ttf',
    fileName: 'Kruti_Dev_010.ttf',
    fileSizeBytes: 48200,
    dataUrl: '', // system font or fallback
    createdAt: '2026-10-18T00:00:00Z',
    canEmbedInPdf: true,
    license: 'Standard Desktop Publishing License',
    isSystemPreset: true,
  },
  {
    id: 'font-walkman-chanakya',
    displayName: 'Walkman Chanakya (Legacy Hindi)',
    familyName: 'Walkman Chanakya',
    encodingType: 'legacy',
    supportedScript: 'devanagari',
    associatedKeyboardLayout: 'chanakya',
    format: 'ttf',
    fileName: 'Walkman_Chanakya.ttf',
    fileSizeBytes: 52400,
    dataUrl: '',
    createdAt: '2026-10-18T00:00:00Z',
    canEmbedInPdf: true,
    license: 'Standard Commercial DTP License',
    isSystemPreset: true,
  },
  {
    id: 'font-noto-sans-devanagari',
    displayName: 'Noto Sans Devanagari (Unicode)',
    familyName: 'Noto Sans Devanagari',
    encodingType: 'unicode',
    supportedScript: 'devanagari',
    associatedKeyboardLayout: 'inscript',
    format: 'ttf',
    fileName: 'NotoSansDevanagari-Regular.ttf',
    fileSizeBytes: 384000,
    dataUrl: '',
    createdAt: '2026-10-18T00:00:00Z',
    canEmbedInPdf: true,
    license: 'SIL Open Font License 1.1',
    isSystemPreset: true,
  },
  {
    id: 'font-amiri-arabic',
    displayName: 'Amiri (Arabic Naskh)',
    familyName: 'Amiri',
    encodingType: 'unicode',
    supportedScript: 'arabic',
    associatedKeyboardLayout: 'none',
    format: 'ttf',
    fileName: 'Amiri-Regular.ttf',
    fileSizeBytes: 412000,
    dataUrl: '',
    createdAt: '2026-10-18T00:00:00Z',
    canEmbedInPdf: true,
    license: 'SIL Open Font License 1.1',
    isSystemPreset: true,
  },
  {
    id: 'font-noto-nastaliq-urdu',
    displayName: 'Noto Nastaliq Urdu (Urdu)',
    familyName: 'Noto Nastaliq Urdu',
    encodingType: 'unicode',
    supportedScript: 'urdu',
    associatedKeyboardLayout: 'none',
    format: 'ttf',
    fileName: 'NotoNastaliqUrdu-Regular.ttf',
    fileSizeBytes: 620000,
    dataUrl: '',
    createdAt: '2026-10-18T00:00:00Z',
    canEmbedInPdf: true,
    license: 'SIL Open Font License 1.1',
    isSystemPreset: true,
  },
];

const STORAGE_KEY_MANAGED_FONTS = 'ats_easybook_managed_fonts';

export function getAllManagedFonts(): ManagedFont[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [...SYSTEM_MANAGED_FONTS];
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MANAGED_FONTS);
    if (!stored) {
      return [...SYSTEM_MANAGED_FONTS];
    }
    const customList = JSON.parse(stored) as ManagedFont[];
    // Merge system presets with user fonts
    const customIds = new Set(customList.map((f) => f.id));
    const presets = SYSTEM_MANAGED_FONTS.filter((p) => !customIds.has(p.id));
    return [...presets, ...customList];
  } catch {
    return [...SYSTEM_MANAGED_FONTS];
  }
}

export function saveCustomManagedFont(font: ManagedFont): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const all = getAllManagedFonts().filter((f) => !f.isSystemPreset);
    const existingIdx = all.findIndex((f) => f.id === font.id);
    if (existingIdx >= 0) {
      all[existingIdx] = font;
    } else {
      all.push(font);
    }
    localStorage.setItem(STORAGE_KEY_MANAGED_FONTS, JSON.stringify(all));
  } catch (err) {
    console.error('Failed to save managed font in localStorage:', err);
  }
}

/**
 * Validates whether a selected font has the required script glyphs for a manuscript.
 */
export function checkFontGlyphCoverage(
  text: string,
  fontFamily: string,
  allFonts: ManagedFont[] = getAllManagedFonts()
): { supported: boolean; script: string; missingScript?: string; warning?: string } {
  if (!text || !text.trim()) {
    return { supported: true, script: 'latin' };
  }

  const hasArabic = ARABIC_URDU_REGEX.test(text);
  const hasUrdu = URDU_SPECIFIC_REGEX.test(text);
  const hasDevanagari = DEVANAGARI_REGEX.test(text);

  const matchedFont = allFonts.find(
    (f) =>
      f.familyName.toLowerCase() === fontFamily.toLowerCase() ||
      fontFamily.toLowerCase().includes(f.familyName.toLowerCase())
  );

  if (hasUrdu) {
    if (!matchedFont || matchedFont.supportedScript !== 'urdu') {
      return {
        supported: false,
        script: 'urdu',
        missingScript: 'Urdu Nastaliq',
        warning: `Selected font "${fontFamily}" does not support Urdu Nastaliq glyphs used in this manuscript. Recommend selecting "Noto Nastaliq Urdu" or uploading an Urdu font.`,
      };
    }
    return { supported: true, script: 'urdu' };
  }

  if (hasArabic) {
    if (!matchedFont || (matchedFont.supportedScript !== 'arabic' && matchedFont.supportedScript !== 'urdu')) {
      return {
        supported: false,
        script: 'arabic',
        missingScript: 'Arabic',
        warning: `Selected font "${fontFamily}" lacks Arabic glyph coverage. Recommend selecting "Amiri" or another Arabic Naskh font.`,
      };
    }
    return { supported: true, script: 'arabic' };
  }

  if (hasDevanagari) {
    if (!matchedFont || matchedFont.supportedScript !== 'devanagari') {
      return {
        supported: false,
        script: 'devanagari',
        missingScript: 'Devanagari (Hindi)',
        warning: `Selected font "${fontFamily}" does not support Devanagari script. Recommend selecting "Noto Sans Devanagari" or a legacy Hindi font like "Kruti Dev 010".`,
      };
    }
    return { supported: true, script: 'devanagari' };
  }

  return { supported: true, script: 'latin' };
}
