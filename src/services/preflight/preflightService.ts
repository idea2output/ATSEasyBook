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
import { ARABIC_URDU_REGEX, DEVANAGARI_REGEX } from '@/services/rtl/bidiService';

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
  const primaryFont = (effectiveTypo.bodyFontFamily || 'Georgia').split(',')[0].trim().replace(/['"]/g, '');
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
    } else {
      passedCount++;
    }
  }

  // Error 7: Missing or Invalid Custom CMYK Profile
  if (project.colorSettings?.outputProfileId === 'custom') {
    if (!project.colorSettings.customProfile?.iccDataUrl) {
      issues.push({
        id: 'err-missing-custom-cmyk-profile',
        severity: 'error',
        category: 'color',
        title: 'Missing custom ICC profile data',
        description: 'Custom CMYK output is selected, but no valid .icc / .icm profile has been uploaded. Select a standard profile (FOGRA39, FOGRA51, GRACoL) or upload a printer profile.',
        actionType: 'open-color',
        actionLabel: 'Manage Color',
      });
    } else {
      passedCount++;
    }
  } else {
    passedCount++;
  }

  // Error 8: Corrupt or Unconvertible Raster Image
  let corruptImageCount = 0;
  for (const img of images) {
    if (!img.dataUrl || img.dataUrl.length < 20 || !img.dataUrl.startsWith('data:image/')) {
      corruptImageCount++;
      issues.push({
        id: `err-corrupt-image-${img.id}`,
        severity: 'error',
        category: 'image',
        title: `Corrupt image data for "${img.filename}"`,
        description: `Image data cannot be loaded or converted to CMYK. Re-upload this image in the library.`,
        imageId: img.id,
        actionType: 'open-library',
        actionLabel: 'Inspect Library',
      });
    }
  }
  if (corruptImageCount === 0) {
    passedCount++;
  }

  // Warning 11: Text Black is not pure 100K (C0 M0 Y0 K100)
  if (project.design?.textColor) {
    const textRgb = parseHexColor(project.design.textColor);
    if (textRgb) {
      const isPure100K = (textRgb.r === 0 && textRgb.g === 0 && textRgb.b === 0) ||
                         (textRgb.r <= 35 && textRgb.g <= 35 && textRgb.b <= 35 && Math.abs(textRgb.r - textRgb.g) < 5 && Math.abs(textRgb.g - textRgb.b) < 5);
      if (!isPure100K) {
        issues.push({
          id: 'warn-text-black-not-pure-100k',
          severity: 'warning',
          category: 'color',
          title: `Body text color is tinted (${project.design.textColor}) rather than pure 100K Black`,
          description: `Publishing standards require body text to be printed in pure C0 M0 Y0 K100. Tinted or 4-color black text risks registration halos on press.`,
          actionType: 'open-color',
          actionLabel: 'Color Settings',
        });
      }
    }
  }

  // Warning 12: Rich Black used on thin rules / small borders (< 2 pt)
  if (project.colorSettings?.blackHandling === 'rich-black-preset') {
    if (project.design?.borderEnabled && (project.design.borderWidthPt ?? 1) < 2) {
      issues.push({
        id: 'warn-rich-black-on-fine-rules',
        severity: 'warning',
        category: 'color',
        title: 'Rich Black preset active with fine decorative border (< 2 pt)',
        description: 'Rich black (4-color ink build) on fine rules and borders under 2 pt can cause ink misregistration on high-speed presses. Use pure 100K black for thin rules.',
        actionType: 'open-color',
        actionLabel: 'Adjust Black',
      });
    }
  }

  // Warning 13: 100K Black Overprint Disabled
  if (project.colorSettings?.overprintBlackText === false || project.colorSettings?.overprintBlackRules === false) {
    issues.push({
      id: 'warn-black-overprint-disabled',
      severity: 'warning',
      category: 'color',
      title: 'Black overprint is disabled',
      description: 'Overprinting 100K black text and rules prevents white registration gaps when paper shifts on press. Keep black overprint enabled unless your printer specifically requests knockout.',
      actionType: 'open-color',
      actionLabel: 'Enable Overprint',
    });
  }

  // Warning 14: Total Ink Coverage (TAC) Limit
  const maxTac = project.colorSettings?.maxTacPercent || 300;
  if (project.design?.backgroundColor && project.design.backgroundColor.toLowerCase() !== '#ffffff') {
    const bgRgb = parseHexColor(project.design.backgroundColor);
    if (bgRgb) {
      const c = (255 - bgRgb.r) / 255;
      const m = (255 - bgRgb.g) / 255;
      const y = (255 - bgRgb.b) / 255;
      const rawTac = Math.round((c + m + y) * 100);
      if (rawTac > maxTac) {
        issues.push({
          id: 'warn-tac-exceeded',
          severity: 'warning',
          category: 'color',
          title: `Page background ink coverage (${rawTac}%) exceeds profile limit (${maxTac}%)`,
          description: `Total ink coverage (TAC) of ${rawTac}% exceeds the configured press limit (${maxTac}%). Color conversion will compress ink density during export.`,
          actionType: 'open-color',
          actionLabel: 'Inspect TAC',
        });
      }
    }
  }

  // -------------------------------------------------------------
  // PHASE 5: LANGUAGE, RTL, HINDI & EPUB PREFLIGHT CHECKS
  // -------------------------------------------------------------

  // Warning 15: Missing Language / Direction Configuration
  const hasComplexScript =
    ARABIC_URDU_REGEX.test(project.rawManuscript || '') ||
    DEVANAGARI_REGEX.test(project.rawManuscript || '');

  if (!project.languageSettings && hasComplexScript) {
    issues.push({
      id: 'warn-missing-language-config',
      severity: 'warning',
      category: 'language',
      title: 'Document language and direction not configured for complex script',
      description: 'Manuscript contains Arabic, Urdu, or Devanagari text, but document language and writing direction are not explicitly configured.',
      actionType: 'open-language',
      actionLabel: 'Set Language',
    });
  } else if (project.languageSettings && (!project.languageSettings.language || !project.languageSettings.direction)) {
    issues.push({
      id: 'warn-missing-language-config',
      severity: 'warning',
      category: 'language',
      title: 'Incomplete language or direction configuration',
      description: 'Document language or writing direction is partially configured. Please verify Language Settings.',
      actionType: 'open-language',
      actionLabel: 'Set Language',
    });
  } else {
    passedCount++;
  }

  // Warning 16: RTL / Complex Script Font Glyph Coverage
  const docLang = project.languageSettings?.language || 'en';
  const fontFam = effectiveTypo.bodyFontFamily || 'serif';
  const hasArabicOrUrdu = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(project.rawManuscript || '');
  const hasDevanagari = /[\u0900-\u097F]/.test(project.rawManuscript || '');

  if (hasArabicOrUrdu || docLang === 'ar' || docLang === 'ur') {
    const isUrdu = docLang === 'ur' || /[\u0679\u067E\u0686\u0688\u0691\u0698\u06AF\u06BA\u06BE\u06CC\u06D2]/.test(project.rawManuscript || '');
    const isRtlFont =
      fontFam.toLowerCase().includes('amiri') ||
      fontFam.toLowerCase().includes('nastaliq') ||
      fontFam.toLowerCase().includes('arabic') ||
      fontFam.toLowerCase().includes('scheherazade');

    if (!isRtlFont) {
      issues.push({
        id: 'warn-rtl-font-missing',
        severity: 'warning',
        category: 'font',
        title: `Selected font "${fontFam}" may lack full ${isUrdu ? 'Urdu Nastaliq' : 'Arabic'} glyph coverage`,
        description: `Arabic and Urdu scripts require specialized OpenType fonts for cursive joining and ligatures. Recommend selecting "Amiri" (Arabic) or "Noto Nastaliq Urdu" (Urdu).`,
        actionType: 'open-fonts',
        actionLabel: 'Select Font',
      });
    } else {
      passedCount++;
    }

    // Warning 17: Unsafe Line Height for Arabic / Urdu
    const currentLineHeight = effectiveTypo.bodyLineHeight;
    const minSafeLineHeight = isUrdu ? 1.8 : 1.5;
    if (currentLineHeight < minSafeLineHeight) {
      issues.push({
        id: 'warn-unsafe-rtl-line-height',
        severity: 'warning',
        category: 'typography',
        title: `Line height (${currentLineHeight.toFixed(2)}) is unsafe for ${isUrdu ? 'Urdu' : 'Arabic'} typography`,
        description: `${isUrdu ? 'Urdu Nastaliq' : 'Arabic'} ascenders, descenders, and diacritics risk clipping with line height below ${minSafeLineHeight}. Recommend at least ${isUrdu ? '1.90' : '1.65'}.`,
        actionType: 'open-typography',
        actionLabel: 'Adjust Spacing',
      });
    } else {
      passedCount++;
    }
  }

  // Warning 18: Mixed-Direction Text Requiring Editorial Review
  const hasLatinLetters = /[A-Za-z]/.test(project.rawManuscript || '');
  if (hasArabicOrUrdu && hasLatinLetters) {
    issues.push({
      id: 'warn-mixed-direction-text',
      severity: 'warning',
      category: 'language',
      title: 'Manuscript contains mixed-direction text (RTL and LTR)',
      description: 'Your manuscript combines Arabic/Urdu and Latin text. Review block-level direction overrides in the Structured Blocks tab to ensure correct reading order for embedded English phrases.',
      actionType: 'open-blocks',
      actionLabel: 'Inspect Blocks',
    });
  }

  // Warning 19: Missing Image Alt Text for EPUB Accessibility
  let missingAltCount = 0;
  for (const img of images) {
    if (!img.altText || !img.altText.trim()) {
      missingAltCount++;
      issues.push({
        id: `warn-epub-missing-alt-${img.id}`,
        severity: 'warning',
        category: 'epub',
        title: `Image "${img.filename}" lacks alternative text for EPUB`,
        description: `Accessible EPUB 3 export requires descriptive alt text for screen readers and accessibility verification. Add alt text in the Image Library before exporting EPUB.`,
        imageId: img.id,
        actionType: 'open-library',
        actionLabel: 'Add Alt Text',
      });
    }
  }
  if (missingAltCount === 0) {
    passedCount++;
  }

  // Warning 20: Dedicated Hindi Module Checks
  if (project.hindiSettings || hasDevanagari || docLang === 'hi') {
    const isHindiFont =
      fontFam.toLowerCase().includes('devanagari') ||
      fontFam.toLowerCase().includes('mangal') ||
      fontFam.toLowerCase().includes('kruti') ||
      fontFam.toLowerCase().includes('chanakya');

    if (!isHindiFont && hasDevanagari) {
      issues.push({
        id: 'warn-hindi-font-missing',
        severity: 'warning',
        category: 'hindi',
        title: `Selected font "${fontFam}" lacks Devanagari script support`,
        description: 'Manuscript contains Devanagari Hindi text. Ensure a Unicode Devanagari font (such as Noto Sans Devanagari) or a configured legacy font is selected.',
        actionType: 'open-hindi',
        actionLabel: 'Hindi Settings',
      });
    } else {
      passedCount++;
    }

    if (project.hindiSettings?.encodingType === 'legacy' && !project.hindiSettings.enableDerivedUnicode) {
      issues.push({
        id: 'warn-hindi-legacy-derived-unicode',
        severity: 'warning',
        category: 'hindi',
        title: 'Derived Unicode search representation disabled for legacy Hindi font',
        description: 'Legacy fonts like Kruti Dev store non-Unicode text. Enabling derived Unicode provides accessible search indexing and EPUB export.',
        actionType: 'open-hindi',
        actionLabel: 'Configure Hindi',
      });
    }
  }

  // -------------------------------------------------------------
  // Phase 8: Template Geometry, Layers & Content Zones Preflight
  // -------------------------------------------------------------
  // 1. Template Geometry Validation
  if (template.pageWidthInches <= 0 || template.pageHeightInches <= 0) {
    issues.push({
      id: 'err-template-invalid-dimensions',
      severity: 'error',
      category: 'template',
      title: 'Invalid template page dimensions',
      description: `Page dimensions (${template.pageWidthInches}" × ${template.pageHeightInches}") must be positive values greater than 0.`,
      actionType: 'open-template',
      actionLabel: 'Edit Template',
    });
  } else {
    passedCount++;
  }

  // Horizontal Margins overflow
  const totalHorizMargins =
    (template.margins.insideInches || 0) +
    (template.margins.outsideInches || 0) +
    (template.margins.gutterInches || 0);
  if (totalHorizMargins >= template.pageWidthInches) {
    issues.push({
      id: 'err-template-margins-overflow',
      severity: 'error',
      category: 'template',
      title: 'Template margins exceed page width',
      description: `Horizontal margins and gutter total (${totalHorizMargins.toFixed(2)}") equal or exceed trim width (${template.pageWidthInches}").`,
      actionType: 'open-template',
      actionLabel: 'Adjust Margins',
    });
  }

  // 2. Bleed sufficiency for full-bleed background designs
  const hasPageBg =
    (project.design?.backgroundColor && project.design.backgroundColor.toLowerCase() !== '#ffffff') ||
    project.design?.backgroundImage ||
    project.design?.backgroundImageUrl;
  if (hasPageBg && (template.bleedInches || 0) <= 0) {
    issues.push({
      id: 'warn-template-insufficient-bleed',
      severity: 'warning',
      category: 'template',
      title: 'Insufficient bleed for full-color background',
      description: 'The layout includes an edge-to-edge background color or image, but bleed is set to 0. Commercial print houses recommend at least 0.125" (3.175mm) bleed to prevent unprinted edges.',
      actionType: 'open-template',
      actionLabel: 'Set Bleed',
    });
  } else {
    passedCount++;
  }

  // 3. Content Zones checks
  if (template.contentZones && template.contentZones.length > 0) {
    for (const zone of template.contentZones) {
      if (zone.widthInches <= 0 || zone.heightInches <= 0) {
        issues.push({
          id: `err-zone-zero-dim-${zone.id}`,
          severity: 'error',
          category: 'template',
          title: `Content zone "${zone.name}" has zero dimensions`,
          description: `Zone "${zone.name}" has non-positive width or height and cannot accommodate content flow.`,
          actionType: 'open-template',
          actionLabel: 'Fix Zone',
        });
      }

      // Check if zone penetrates safe area
      const safe = template.safeAreaInches || 0.25;
      if (
        zone.xInches < safe ||
        zone.yInches < safe ||
        zone.xInches + zone.widthInches > template.pageWidthInches - safe + 0.05 ||
        zone.yInches + zone.heightInches > template.pageHeightInches - safe + 0.05
      ) {
        issues.push({
          id: `warn-zone-safe-area-${zone.id}`,
          severity: 'warning',
          category: 'template',
          title: `Content zone "${zone.name}" extends outside safe area`,
          description: `Content zone "${zone.name}" is positioned closer to the trim line than the configured ${safe}" safe margin. Content near trim edges risks being trimmed during binding.`,
          actionType: 'open-template',
          actionLabel: 'Adjust Zone',
        });
      }
    }
  }

  // 4. Fixed Layers checks
  if (template.layers && template.layers.length > 0) {
    for (const layer of template.layers) {
      if (layer.type === 'image' && !layer.imageDataUrl) {
        issues.push({
          id: `err-layer-missing-image-${layer.id}`,
          severity: 'error',
          category: 'template',
          title: `Fixed image layer "${layer.name}" missing image source`,
          description: `Template layer "${layer.name}" is configured as an image but has no asset file or image URL attached.`,
          actionType: 'open-template',
          actionLabel: 'Attach Image',
        });
      }

      // Check excessive bleed overflow (> 0.5in past bleed edge)
      const maxAllowedX = template.pageWidthInches + (template.bleedInches || 0) * 2 + 0.5;
      if (layer.xInches + layer.widthInches > maxAllowedX) {
        issues.push({
          id: `warn-layer-bleed-overflow-${layer.id}`,
          severity: 'warning',
          category: 'template',
          title: `Layer "${layer.name}" extends significantly outside bleed`,
          description: `Layer "${layer.name}" extends more than 0.5" past the trim and bleed boundary.`,
          actionType: 'open-template',
          actionLabel: 'Resize Layer',
        });
      }
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
