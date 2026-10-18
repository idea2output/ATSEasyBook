import { describe, it, expect } from 'vitest';
import {
  AVAILABLE_TEMPLATES,
  getTemplateById,
  getEffectiveTypography,
  CLASSIC_NOVEL_6X9,
  DIGEST_NOVEL_5_5X8_5,
  STANDARD_PAPERBACK_6X9,
  NONFICTION_6X9,
  ILLUSTRATED_BOOK_8X10,
  MAGAZINE_REPORT_A4,
} from './templateRegistry';

describe('templateRegistry', () => {
  it('defines all 6 standard book and magazine templates', () => {
    expect(AVAILABLE_TEMPLATES.length).toBe(6);
    const ids = AVAILABLE_TEMPLATES.map((t) => t.id);
    expect(ids).toContain('classic-novel-6x9');
    expect(ids).toContain('digest-novel-5.5x8.5');
    expect(ids).toContain('standard-paperback-6x9');
    expect(ids).toContain('nonfiction-6x9');
    expect(ids).toContain('illustrated-book-8x10');
    expect(ids).toContain('magazine-report-a4');
  });

  it('provides structured geometry, bleed, safe area, and margin data for every template', () => {
    for (const t of AVAILABLE_TEMPLATES) {
      expect(t.pageWidthInches).toBeGreaterThan(0);
      expect(t.pageHeightInches).toBeGreaterThan(t.pageWidthInches * 0.8);
      expect(t.bleedInches).toBeGreaterThanOrEqual(0);
      expect(t.safeAreaInches).toBeGreaterThan(0);

      // Margins
      expect(t.margins.topInches).toBeGreaterThan(0);
      expect(t.margins.bottomInches).toBeGreaterThan(0);
      expect(t.margins.insideInches).toBeGreaterThan(0);
      expect(t.margins.outsideInches).toBeGreaterThan(0);

      const marginW = t.margins.insideInches + t.margins.outsideInches + t.margins.gutterInches;
      const marginH = t.margins.topInches + t.margins.bottomInches;
      expect(marginW).toBeLessThan(t.pageWidthInches);
      expect(marginH).toBeLessThan(t.pageHeightInches);

      // Typography
      expect(t.typography.bodyFontSizePt).toBeGreaterThanOrEqual(8);
      expect(t.typography.bodyLineHeight).toBeGreaterThan(1.0);
    }
  });

  it('configures Magazine/Report as a two-column template', () => {
    expect(MAGAZINE_REPORT_A4.columns.count).toBe(2);
    expect(MAGAZINE_REPORT_A4.columns.gapInches).toBeGreaterThan(0);
  });

  it('correctly resolves templates by id with fallback', () => {
    expect(getTemplateById('digest-novel-5.5x8.5').name).toContain('Digest Novel');
    expect(getTemplateById('nonexistent-id')).toEqual(CLASSIC_NOVEL_6X9);
  });

  it('merges user typography overrides with template defaults', () => {
    const merged = getEffectiveTypography(
      CLASSIC_NOVEL_6X9,
      {
        bodyFontSizePt: 12,
        textAlign: 'left',
        chapterOpening: 'recto-only',
      },
      'Test Author'
    );

    expect(merged.bodyFontSizePt).toBe(12);
    expect(merged.textAlign).toBe('left');
    expect(merged.chapterOpening).toBe('recto-only');
    expect(merged.authorName).toBe('Test Author');
    // Default fallback
    expect(merged.bodyFontFamily).toBe(CLASSIC_NOVEL_6X9.typography.fontFamily);
  });
});
