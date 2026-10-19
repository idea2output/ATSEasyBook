import {
  BookTemplate,
  TemplateUnit,
  ContentZone,
  TemplateLayer,
} from '@/types/book';

export const INCHES_TO_MM = 25.4;
export const INCHES_TO_PT = 72;
export const MM_TO_PT = 72 / 25.4;

/**
 * Converts a measurement from one unit to another.
 */
export function convertUnits(
  value: number,
  from: TemplateUnit,
  to: TemplateUnit
): number {
  if (from === to) return value;
  // Convert 'from' -> inches
  let inches = value;
  if (from === 'mm') {
    inches = value / INCHES_TO_MM;
  } else if (from === 'pt') {
    inches = value / INCHES_TO_PT;
  }

  // Convert inches -> 'to'
  if (to === 'in') return inches;
  if (to === 'mm') return inches * INCHES_TO_MM;
  if (to === 'pt') return inches * INCHES_TO_PT;
  return inches;
}

export function toInches(value: number, from: TemplateUnit): number {
  return convertUnits(value, from, 'in');
}

export function fromInches(valueInInches: number, to: TemplateUnit): number {
  return convertUnits(valueInInches, 'in', to);
}

export function formatUnit(
  valueInInches: number,
  unit: TemplateUnit,
  decimals: number = 2
): string {
  const converted = fromInches(valueInInches, unit);
  const rounded = Number(converted.toFixed(decimals));
  switch (unit) {
    case 'mm':
      return `${rounded} mm`;
    case 'pt':
      return `${rounded} pt`;
    case 'in':
    default:
      return `${rounded}"`;
  }
}

export interface GeometryValidationInput {
  pageWidthInches: number;
  pageHeightInches: number;
  bleedInches: number;
  safeAreaInches: number;
  margins: {
    topInches: number;
    bottomInches: number;
    insideInches: number;
    outsideInches: number;
    gutterInches: number;
  };
  columns?: {
    count: 1 | 2;
    gapInches: number;
  };
  contentZones?: ContentZone[];
  layers?: TemplateLayer[];
}

export interface GeometryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates physical page geometry, margins, safe areas, columns, zones, and layers.
 */
export function validatePageGeometry(input: GeometryValidationInput): GeometryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const {
    pageWidthInches,
    pageHeightInches,
    bleedInches,
    safeAreaInches,
    margins,
    columns,
    contentZones,
    layers,
  } = input;

  // 1. Page dimensions
  if (pageWidthInches <= 0 || isNaN(pageWidthInches)) {
    errors.push('Page width must be greater than 0.');
  } else if (pageWidthInches < 3.0) {
    errors.push(`Page width (${pageWidthInches}") is below minimum supported size (3.0").`);
  } else if (pageWidthInches > 24.0) {
    warnings.push(`Page width (${pageWidthInches}") is unusually large for standard book presses.`);
  }

  if (pageHeightInches <= 0 || isNaN(pageHeightInches)) {
    errors.push('Page height must be greater than 0.');
  } else if (pageHeightInches < 3.0) {
    errors.push(`Page height (${pageHeightInches}") is below minimum supported size (3.0").`);
  } else if (pageHeightInches > 24.0) {
    warnings.push(`Page height (${pageHeightInches}") is unusually large for standard book presses.`);
  }

  // 2. Bleed & Safe area
  if (bleedInches < 0) {
    errors.push('Bleed must be 0 or positive.');
  } else if (bleedInches > 0.5) {
    warnings.push(`Bleed (${bleedInches}") is larger than typical commercial prepress standard (0.125").`);
  }

  if (safeAreaInches < 0) {
    errors.push('Safe area margin must be 0 or positive.');
  } else if (
    pageWidthInches > 0 &&
    safeAreaInches >= Math.min(pageWidthInches, pageHeightInches) / 2
  ) {
    errors.push('Safe area margin cannot exceed half the page dimension.');
  }

  // 3. Margins & Gutter
  const totalHorizMargin = (margins?.insideInches || 0) + (margins?.outsideInches || 0) + (margins?.gutterInches || 0);
  const usableWidth = pageWidthInches - totalHorizMargin;

  if (totalHorizMargin >= pageWidthInches) {
    errors.push(
      `Horizontal margins and gutter total (${totalHorizMargin.toFixed(2)}") equal or exceed page width (${pageWidthInches}").`
    );
  } else if (usableWidth < 1.5) {
    errors.push(
      `Usable text width (${usableWidth.toFixed(2)}") is too narrow. Reduce inside/outside margins or gutter.`
    );
  }

  const totalVertMargin = (margins?.topInches || 0) + (margins?.bottomInches || 0);
  const usableHeight = pageHeightInches - totalVertMargin;

  if (totalVertMargin >= pageHeightInches) {
    errors.push(
      `Vertical margins total (${totalVertMargin.toFixed(2)}") equals or exceeds page height (${pageHeightInches}").`
    );
  } else if (usableHeight < 1.5) {
    errors.push(
      `Usable text height (${usableHeight.toFixed(2)}") is too narrow. Reduce top/bottom margins.`
    );
  }

  // 4. Columns
  if (columns && columns.count === 2) {
    if (columns.gapInches < 0) {
      errors.push('Column gap cannot be negative.');
    } else if (columns.gapInches >= usableWidth) {
      errors.push('Column gap is wider than the available text width.');
    } else {
      const colWidth = (usableWidth - columns.gapInches) / 2;
      if (colWidth < 1.0) {
        warnings.push(`Column width (${colWidth.toFixed(2)}") is tight for readable body text.`);
      }
    }
  }

  // 5. Content Zones (if defined)
  if (contentZones && contentZones.length > 0) {
    for (const zone of contentZones) {
      if (zone.widthInches <= 0 || zone.heightInches <= 0) {
        errors.push(`Content zone "${zone.name || zone.id}" has invalid zero or negative dimensions.`);
      }
      if (zone.xInches < 0 || zone.yInches < 0) {
        warnings.push(`Content zone "${zone.name || zone.id}" starts outside the page trim area.`);
      }
      if (zone.xInches + zone.widthInches > pageWidthInches + 0.01) {
        warnings.push(`Content zone "${zone.name || zone.id}" extends past the right trim edge.`);
      }
      if (zone.yInches + zone.heightInches > pageHeightInches + 0.01) {
        warnings.push(`Content zone "${zone.name || zone.id}" extends past the bottom trim edge.`);
      }
    }
  }

  // 6. Template Layers (if defined)
  if (layers && layers.length > 0) {
    const maxBleedX = pageWidthInches + bleedInches * 2;
    const maxBleedY = pageHeightInches + bleedInches * 2;

    for (const layer of layers) {
      if (layer.widthInches < 0 || layer.heightInches < 0) {
        errors.push(`Layer "${layer.name || layer.id}" has negative dimensions.`);
      }
      // Fixed layers extending dramatically beyond bleed (e.g. > 1 inch beyond bleed)
      if (
        layer.xInches + layer.widthInches > maxBleedX + 1.0 ||
        layer.yInches + layer.heightInches > maxBleedY + 1.0
      ) {
        warnings.push(
          `Layer "${layer.name || layer.id}" extends significantly past the page bleed zone.`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
