import {
  BookProject,
  BookTemplate,
  PagePreviewData,
  PreflightIssue,
  PreflightSummary,
  ImagePlacement,
  BookImage,
} from '@/types/book';
import { ALLOWED_IMAGE_MIME_TYPES } from '@/services/images/imageService';
import { getEffectiveTypography } from '@/services/templates/templateRegistry';

export function calculateEffectiveImageDpi(
  placement: ImagePlacement,
  image: BookImage,
  template: BookTemplate
): number {
  const crop = placement.crop || { x: 0, y: 0, width: 1, height: 1 };
  const croppedPixelWidth = Math.max(1, image.width * (crop.width || 1));

  // Usable text column width in inches
  const totalMarginX =
    template.margins.insideInches +
    template.margins.outsideInches +
    template.margins.gutterInches;
  const usablePageWidth = Math.max(1, template.pageWidthInches - totalMarginX);

  let renderedWidthInches = usablePageWidth;
  if (placement.mode === 'float-right') {
    renderedWidthInches = usablePageWidth * ((placement.widthPercent || 45) / 100);
  } else if (placement.mode === 'inline') {
    renderedWidthInches = usablePageWidth * ((placement.widthPercent || 100) / 100);
  } else {
    // full-width
    renderedWidthInches = usablePageWidth;
  }

  const dpi = Math.round(croppedPixelWidth / Math.max(0.5, renderedWidthInches));
  return dpi;
}

export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return null;
}

export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function calculateContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = parseHexColor(hex1);
  const rgb2 = parseHexColor(hex2);
  if (!rgb1 || !rgb2) return 21; // High contrast fallback
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Runs pre-flight print verification checks against book project, template, and paginated pages.
 */
export function runPrintPreflight(
  project: BookProject,
  template: BookTemplate,
  pages: PagePreviewData[]
): PreflightSummary {
  const issues: PreflightIssue[] = [];
  let passedCount = 0;

  const images = project.images || [];
  const placements = project.placements || [];
  const effectiveTypo = getEffectiveTypography(template, project.typography, project.author);

  // -------------------------------------------------------------
  // ERROR CHECKS (Must block export)
  // -------------------------------------------------------------

  // Error 1: Empty Manuscript
  const hasText = project.rawManuscript && project.rawManuscript.trim().length > 0;
  if (!hasText) {
    issues.push({
      id: 'err-empty-manuscript',
      severity: 'error',
      category: 'manuscript',
      title: 'Manuscript is empty',
      description: 'Your book project contains no manuscript content. Add text in the editor before exporting to PDF.',
      actionType: 'open-blocks',
      actionLabel: 'Open Editor',
    });
  } else {
    passedCount++;
  }

  // Error 2: Overflow / Unplaced Content
  if (hasText && pages.length === 0) {
    issues.push({
      id: 'err-unplaced-content',
      severity: 'error',
      category: 'geometry',
      title: 'Unplaced content error',
      description: 'Manuscript content could not be flowed into preview pages with the current template geometry.',
      actionType: 'open-typography',
      actionLabel: 'Check Settings',
    });
  } else {
    passedCount++;
  }

  // Error 3: Missing Source Images
  let missingSourceCount = 0;
  for (const placement of placements) {
    const src = images.find((img) => img.id === placement.imageId);
    if (!src) {
      missingSourceCount++;
      issues.push({
        id: `err-missing-source-${placement.id}`,
        severity: 'error',
        category: 'image',
        title: 'Missing image file',
        description: `Image placement (${placement.mode}) refers to an image that was removed from the library.`,
        placementId: placement.id,
        actionType: 'open-library',
        actionLabel: 'View Library',
      });
    }
  }
  if (missingSourceCount === 0) {
    passedCount++;
  }

  // Error 4: Unsupported Image MIME Type
  let unsupportedMimeCount = 0;
  for (const image of images) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(image.mimeType.toLowerCase())) {
      unsupportedMimeCount++;
      issues.push({
        id: `err-unsupported-mime-${image.id}`,
        severity: 'error',
        category: 'image',
        title: `Unsupported image format (${image.mimeType})`,
        description: `Image "${image.filename}" has format ${image.mimeType}. Only PNG, JPEG, and WebP are supported for PDF compilation.`,
        imageId: image.id,
        actionType: 'open-library',
        actionLabel: 'Replace Image',
      });
    }
  }
  if (unsupportedMimeCount === 0) {
    passedCount++;
  }

  // Error 5: Invalid Template Geometry
  const totalMarginW =
    template.margins.insideInches + template.margins.outsideInches + template.margins.gutterInches;
  const totalMarginH = template.margins.topInches + template.margins.bottomInches;
  if (totalMarginW >= template.pageWidthInches || totalMarginH >= template.pageHeightInches) {
    issues.push({
      id: 'err-invalid-geometry',
      severity: 'error',
      category: 'geometry',
      title: 'Invalid page margins or trim geometry',
      description: `Template margins exceed printable page area (${template.pageWidthInches} × ${template.pageHeightInches} in).`,
      actionType: 'open-typography',
      actionLabel: 'Adjust Geometry',
    });
  } else {
    passedCount++;
  }

  // -------------------------------------------------------------
  // WARNING CHECKS (Allowed after explicit acknowledgement)
  // -------------------------------------------------------------

  // Warning 1: Low-Resolution Image (< 300 DPI)
  for (const placement of placements) {
    const image = images.find((img) => img.id === placement.imageId);
    if (!image) continue;

    const dpi = calculateEffectiveImageDpi(placement, image, template);
    if (dpi < 300) {
      // Locate page number where placement renders
      const pageWithPlacement = pages.find((p) =>
        p.blocks.some((b) => b.type === 'image' && b.placement?.id === placement.id)
      );

      issues.push({
        id: `warn-low-dpi-${placement.id}`,
        severity: 'warning',
        category: 'image',
        title: `Low image resolution (${dpi} DPI at rendered size)`,
        description: `"${image.filename}" renders at approximately ${dpi} DPI (standard commercial print target is 300 DPI). May appear pixelated in print.`,
        pageNumber: pageWithPlacement?.pageNumber,
        placementId: placement.id,
        imageId: image.id,
        actionType: 'select-image',
        actionLabel: 'Inspect Image',
      });
    }
  }

  // Warning 2: Missing Image Alt Text
  for (const image of images) {
    if (!image.altText || !image.altText.trim()) {
      issues.push({
        id: `warn-missing-alt-${image.id}`,
        severity: 'warning',
        category: 'image',
        title: `Missing accessibility Alt Text for "${image.filename}"`,
        description: 'Publishing standards recommend descriptive Alt Text for all figures and illustrations.',
        imageId: image.id,
        actionType: 'open-library',
        actionLabel: 'Add Alt Text',
      });
    }
  }

  // Warning 3: Image too close to safe margin / extending into bleed
  for (const placement of placements) {
    if (placement.mode === 'full-width' && template.bleedInches === 0) {
      issues.push({
        id: `warn-fullwidth-safe-margin-${placement.id}`,
        severity: 'warning',
        category: 'geometry',
        title: 'Full-width image near trim boundary',
        description: `Full-width image placement reaches page margins. Verify critical content is within the 0.25" safe area.`,
        placementId: placement.id,
        actionType: 'select-image',
        actionLabel: 'Adjust Width',
      });
    }
  }

  // Warning 4: Non-embedded or fallback system fonts
  const primaryFont = effectiveTypo.bodyFontFamily.split(',')[0].trim().replace(/['"]/g, '');
  const unrecommendedFonts = ['Courier', 'Arial', 'Comic Sans MS'];
  if (unrecommendedFonts.includes(primaryFont)) {
    issues.push({
      id: 'warn-fallback-font',
      severity: 'warning',
      category: 'typography',
      title: `System fallback typeface selected (${primaryFont})`,
      description: `The font "${primaryFont}" is a system-level typewriter or utility font. Publishing standards recommend an editorial serif (Georgia, Garamond, Palatino) or publication sans (Inter).`,
      actionType: 'open-typography',
      actionLabel: 'Change Font',
    });
  }

  // Warning 5: Blank pages caused by layout rules
  const blankPages = pages.filter((p) => p.isBlankPage);
  for (const bp of blankPages) {
    issues.push({
      id: `warn-blank-page-${bp.pageNumber}`,
      severity: 'warning',
      category: 'manuscript',
      title: `Intentional blank leaf on Page ${bp.pageNumber}`,
      description: `Page ${bp.pageNumber} is blank due to the "Start chapters on right-hand page (recto)" rule.`,
      pageNumber: bp.pageNumber,
      actionType: 'go-to-page',
      actionLabel: 'View Page',
    });
  }

  // Warning 6: Large storage data usage (> 3 MB)
  const totalImageBytes = images.reduce((acc, img) => acc + (img.fileSize || 0), 0);
  if (totalImageBytes > 3 * 1024 * 1024) {
    const mb = (totalImageBytes / (1024 * 1024)).toFixed(1);
    issues.push({
      id: 'warn-large-storage',
      severity: 'warning',
      category: 'storage',
      title: `High localStorage data footprint (${mb} MB)`,
      description: 'Your project contains several high-resolution images stored in browser localStorage. Ensure you export your work promptly.',
      actionType: 'open-library',
      actionLabel: 'Optimize Images',
    });
  }

  // Warning 7: Low text contrast against page background (WCAG AA < 4.5:1)
  if (project.design?.textColor && project.design?.backgroundColor) {
    const ratio = calculateContrastRatio(project.design.textColor, project.design.backgroundColor);
    if (ratio < 4.5) {
      issues.push({
        id: 'warn-low-contrast',
        severity: 'warning',
        category: 'design',
        title: `Low text contrast against page background (${ratio.toFixed(1)}:1)`,
        description: `The body text color (${project.design.textColor}) against page background (${project.design.backgroundColor}) has a contrast ratio of ${ratio.toFixed(1)}:1. Publishing standards recommend at least 4.5:1 for legibility.`,
        actionType: 'open-design',
        actionLabel: 'Adjust Colors',
      });
    }
  }

  // Warning 8: Border too close to trim / safe area
  if (project.design?.borderEnabled) {
    const inset = project.design.borderInsetInches ?? 0.35;
    if (inset < template.safeAreaInches) {
      issues.push({
        id: 'warn-border-near-trim',
        severity: 'warning',
        category: 'design',
        title: `Page border close to trim edge (${inset} in)`,
        description: `The page border inset (${inset}") is within the template safe margin (${template.safeAreaInches}"). Borders placed too close to trim risk being shaved off or appearing uneven during bindery cuts.`,
        actionType: 'open-design',
        actionLabel: 'Adjust Border',
      });
    }
  }

  // Warning 9: Background image without template bleed
  if (project.design?.backgroundImageUrl) {
    if (template.bleedInches === 0) {
      issues.push({
        id: 'warn-bg-image-no-bleed',
        severity: 'warning',
        category: 'design',
        title: 'Background image on template without trim bleed',
        description: 'A page background image is active, but the selected template provides no bleed margin. Trimming variations may leave unprinted white slivers.',
        actionType: 'open-design',
        actionLabel: 'Inspect Background',
      });
    }
  }

  // Warning 10: Custom font format not directly embeddable in vector PDF
  if (project.customFonts && project.customFonts.length > 0) {
    for (const font of project.customFonts) {
      if (!font.canEmbedInPdf) {
        const isUsedInBody = effectiveTypo.bodyFontFamily.includes(font.familyName);
        const isUsedInHeading = effectiveTypo.headingFontFamily.includes(font.familyName);
        if (isUsedInBody || isUsedInHeading) {
          issues.push({
            id: `warn-font-not-embeddable-${font.id}`,
            severity: 'warning',
            category: 'font',
            title: `Custom font "${font.familyName}" format (.${font.format}) cannot embed in vector PDF`,
            description: `Web fonts in .${font.format} format cannot be embedded directly into print-ready PDF streams. Standard serif/sans fallback will be used in export. Upload .ttf or .otf for vector embedding.`,
            actionType: 'open-fonts',
            actionLabel: 'Manage Fonts',
          });
        }
      }
    }
  }

  // Error 6: Custom template geometry check
  if (template.isCustom) {
    if (template.pageWidthInches <= 0 || template.pageHeightInches <= 0) {
      issues.push({
        id: 'err-custom-template-geometry',
        severity: 'error',
        category: 'geometry',
        title: 'Invalid custom template dimensions',
        description: `Custom template trim dimensions must be positive values (current: ${template.pageWidthInches} × ${template.pageHeightInches} in).`,
        actionType: 'open-typography',
        actionLabel: 'Fix Template',
      });
    }
  }

  const errorsCount = issues.filter((i) => i.severity === 'error').length;
  const warningsCount = issues.filter((i) => i.severity === 'warning').length;

  // Estimated PDF size in MB: base PDF structure (~0.2MB) + total compressed image size
  const estimatedPdfSizeMb = Math.round((0.25 + totalImageBytes / (1024 * 1024) * 0.85) * 10) / 10;

  return {
    errorsCount,
    warningsCount,
    passedCount,
    totalPages: pages.length,
    trimSize: `${template.pageWidthInches} × ${template.pageHeightInches} in`,
    estimatedPdfSizeMb,
    issues,
  };
}
