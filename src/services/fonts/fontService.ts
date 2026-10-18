import { CustomFont, CustomFontFormat } from '@/types/book';

export const MAX_FONT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface FontValidationResult {
  valid: boolean;
  error?: string;
  format?: CustomFontFormat;
}

export function sanitizeFontFamilyName(name: string): string {
  const clean = name
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[^a-zA-Z0-9_\-\s]/g, '') // strip special characters
    .trim();
  return clean || 'CustomFont';
}

export function getFontFormatFromExtension(filename: string): CustomFontFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'ttf') return 'ttf';
  if (ext === 'otf') return 'otf';
  if (ext === 'woff') return 'woff';
  if (ext === 'woff2') return 'woff2';
  return null;
}

export function canEmbedInPdf(format: CustomFontFormat): boolean {
  // jsPDF supports true-type (.ttf) and open-type (.otf) direct VFS embedding.
  // Compressed web fonts (.woff / .woff2) require complex decompression before embedding.
  return format === 'ttf' || format === 'otf';
}

export function validateFontFile(file: { name: string; size: number; type?: string }): FontValidationResult {
  const format = getFontFormatFromExtension(file.name);
  if (!format) {
    return {
      valid: false,
      error: `Unsupported font format for "${file.name}". Only .ttf, .otf, .woff, and .woff2 files are supported.`,
    };
  }

  if (file.size > MAX_FONT_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Font file "${file.name}" (${sizeMb} MB) exceeds maximum allowed size of 5 MB.`,
    };
  }

  return {
    valid: true,
    format,
  };
}

/**
 * Loads a custom font dynamically into the browser DOM using FontFace API.
 */
export async function loadFontFaceInBrowser(font: CustomFont): Promise<boolean> {
  if (typeof window === 'undefined' || typeof FontFace === 'undefined' || !document.fonts) {
    return true; // Non-browser / Node testing environment
  }

  try {
    // Check if already registered
    const existing = Array.from(document.fonts).find((f) => f.family === font.familyName);
    if (existing && existing.status === 'loaded') {
      return true;
    }

    const fontFace = new FontFace(font.familyName, `url(${font.dataUrl})`);
    const loadedFace = await fontFace.load();
    document.fonts.add(loadedFace);
    return true;
  } catch (err) {
    console.warn(`Failed to load custom font face "${font.familyName}" in browser`, err);
    return false;
  }
}

/**
 * Converts a browser File into a persistent CustomFont object.
 */
export async function createCustomFontFromFile(file: File, customFamilyName?: string): Promise<CustomFont> {
  const validation = validateFontFile(file);
  if (!validation.valid || !validation.format) {
    throw new Error(validation.error || 'Invalid font file.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read font file data.'));
    reader.readAsDataURL(file);
  });

  const familyName = sanitizeFontFamilyName(customFamilyName || file.name);
  const font: CustomFont = {
    id: `font-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    familyName,
    format: validation.format,
    fileName: file.name,
    fileSizeBytes: file.size,
    dataUrl,
    createdAt: new Date().toISOString(),
    canEmbedInPdf: canEmbedInPdf(validation.format),
  };

  // Attempt DOM registration
  await loadFontFaceInBrowser(font);

  return font;
}
