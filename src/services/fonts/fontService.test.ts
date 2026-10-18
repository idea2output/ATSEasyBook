import { describe, it, expect } from 'vitest';
import {
  validateFontFile,
  sanitizeFontFamilyName,
  getFontFormatFromExtension,
  canEmbedInPdf,
  MAX_FONT_FILE_SIZE_BYTES,
} from './fontService';

describe('fontService', () => {
  it('correctly detects font formats from extensions', () => {
    expect(getFontFormatFromExtension('Roboto-Regular.ttf')).toBe('ttf');
    expect(getFontFormatFromExtension('Cinzel-Bold.otf')).toBe('otf');
    expect(getFontFormatFromExtension('Inter.var.woff')).toBe('woff');
    expect(getFontFormatFromExtension('Playfair.woff2')).toBe('woff2');
    expect(getFontFormatFromExtension('notes.txt')).toBeNull();
    expect(getFontFormatFromExtension('archive.zip')).toBeNull();
  });

  it('validates supported font formats under 5 MB', () => {
    const validTtf = { name: 'EldridgeSerif.ttf', size: 1024 * 1024 };
    const res = validateFontFile(validTtf);
    expect(res.valid).toBe(true);
    expect(res.format).toBe('ttf');
  });

  it('rejects unsupported file formats', () => {
    const invalidFile = { name: 'document.pdf', size: 20000 };
    const res = validateFontFile(invalidFile);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Unsupported font format');
  });

  it('rejects font files exceeding the 5 MB limit', () => {
    const oversizedFile = { name: 'GiantCJKFont.otf', size: MAX_FONT_FILE_SIZE_BYTES + 1024 };
    const res = validateFontFile(oversizedFile);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds maximum allowed size');
  });

  it('determines print PDF embeddability', () => {
    expect(canEmbedInPdf('ttf')).toBe(true);
    expect(canEmbedInPdf('otf')).toBe(true);
    expect(canEmbedInPdf('woff')).toBe(false);
    expect(canEmbedInPdf('woff2')).toBe(false);
  });

  it('sanitizes font family names properly', () => {
    expect(sanitizeFontFamilyName('MyCustomFont-Bold.ttf')).toBe('MyCustomFont-Bold');
    expect(sanitizeFontFamilyName('EB_Garamond_12.otf')).toBe('EB_Garamond_12');
    expect(sanitizeFontFamilyName('Bad#@$Font!Name*.woff')).toBe('BadFontName');
  });
});
