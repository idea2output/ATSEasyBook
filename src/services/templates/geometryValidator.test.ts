import { describe, it, expect } from 'vitest';
import {
  convertUnits,
  toInches,
  fromInches,
  formatUnit,
  validatePageGeometry,
} from './geometryValidator';

describe('geometryValidator', () => {
  describe('Unit Conversions', () => {
    it('converts inches to mm and pt accurately', () => {
      expect(convertUnits(1, 'in', 'mm')).toBeCloseTo(25.4, 4);
      expect(convertUnits(1, 'in', 'pt')).toBeCloseTo(72, 4);
      expect(convertUnits(25.4, 'mm', 'in')).toBeCloseTo(1, 4);
      expect(convertUnits(72, 'pt', 'in')).toBeCloseTo(1, 4);
      expect(convertUnits(25.4, 'mm', 'pt')).toBeCloseTo(72, 2);
    });

    it('toInches and fromInches helpers work for all units', () => {
      expect(toInches(6, 'in')).toBe(6);
      expect(toInches(254, 'mm')).toBeCloseTo(10, 4);
      expect(toInches(144, 'pt')).toBeCloseTo(2, 4);

      expect(fromInches(6, 'in')).toBe(6);
      expect(fromInches(10, 'mm')).toBeCloseTo(254, 4);
      expect(fromInches(2, 'pt')).toBeCloseTo(144, 4);
    });

    it('formatUnit formats nicely with labels', () => {
      expect(formatUnit(6, 'in')).toBe('6"');
      expect(formatUnit(1, 'mm')).toBe('25.4 mm');
      expect(formatUnit(1, 'pt')).toBe('72 pt');
    });
  });

  describe('Page Geometry Validation', () => {
    const validGeometry = {
      pageWidthInches: 6.0,
      pageHeightInches: 9.0,
      bleedInches: 0.125,
      safeAreaInches: 0.25,
      margins: {
        topInches: 0.75,
        bottomInches: 0.75,
        insideInches: 0.75,
        outsideInches: 0.5,
        gutterInches: 0.125,
      },
      columns: {
        count: 1 as const,
        gapInches: 0,
      },
    };

    it('passes for standard 6x9 trade paperback', () => {
      const result = validatePageGeometry(validGeometry);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid or too small page dimensions', () => {
      const invalid = {
        ...validGeometry,
        pageWidthInches: 0,
        pageHeightInches: -1,
      };
      const result = validatePageGeometry(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('rejects horizontal margins that exceed page width', () => {
      const invalid = {
        ...validGeometry,
        pageWidthInches: 5.0,
        margins: {
          ...validGeometry.margins,
          insideInches: 2.5,
          outsideInches: 2.5,
          gutterInches: 0.5,
        },
      };
      const result = validatePageGeometry(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('margins and gutter total'))).toBe(true);
    });

    it('rejects vertical margins that leave less than 1.5 inches for text', () => {
      const invalid = {
        ...validGeometry,
        pageHeightInches: 9.0,
        margins: {
          ...validGeometry.margins,
          topInches: 4.0,
          bottomInches: 4.0,
        },
      };
      const result = validatePageGeometry(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Usable text height'))).toBe(true);
    });

    it('validates two-column configurations and warns on narrow columns', () => {
      const twoColValid = {
        ...validGeometry,
        pageWidthInches: 8.5,
        columns: {
          count: 2 as const,
          gapInches: 0.25,
        },
      };
      const result = validatePageGeometry(twoColValid);
      expect(result.isValid).toBe(true);

      const twoColTooWideGap = {
        ...twoColValid,
        columns: {
          count: 2 as const,
          gapInches: 10.0, // gap exceeds usable width
        },
      };
      const gapResult = validatePageGeometry(twoColTooWideGap);
      expect(gapResult.isValid).toBe(false);
      expect(gapResult.errors.some((e) => e.includes('Column gap is wider'))).toBe(true);
    });

    it('validates content zones with zero or negative dimensions', () => {
      const withBadZone = {
        ...validGeometry,
        contentZones: [
          {
            id: 'z1',
            name: 'Faulty Zone',
            type: 'flowing-text' as const,
            xInches: 0.5,
            yInches: 0.5,
            widthInches: 0,
            heightInches: 5.0,
          },
        ],
      };
      const result = validatePageGeometry(withBadZone);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid zero or negative dimensions'))).toBe(true);
    });
  });
});
