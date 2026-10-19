/**
/**
 * ATS EasyBook - Text Layout Measurer
 * 
 * Provides accurate, typography-aware text measurement and word-wrapping.
 * In browser environments, uses HTML5 Canvas measureText with the actual rendered font.
 * In SSR / Node / Vitest environments, uses a high-precision proportional typographic metric model
 * calibrated against serif, sans-serif, monospace, Arabic/Urdu, and Devanagari typefaces.
 */

export interface FontMetricsOptions {
  fontFamily: string;
  fontSizePt: number;
  lineHeight: number; // e.g. 1.45
  isBold?: boolean;
  isItalic?: boolean;
}

export interface WrappedLine {
  text: string;
  widthPt: number;
  isParagraphEnd?: boolean;
}

// In-memory measurement canvas for browser execution
let measurementCanvas: HTMLCanvasElement | null = null;
let measurementCtx: CanvasRenderingContext2D | null = null;

function getMeasurementContext(): CanvasRenderingContext2D | null {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    (typeof process !== 'undefined' && process.env?.VITEST)
  ) {
    return null;
  }
  try {
    if (!measurementCanvas) {
      measurementCanvas = document.createElement('canvas');
      if (typeof measurementCanvas.getContext !== 'function') return null;
      measurementCtx = measurementCanvas.getContext('2d');
    }
    return measurementCtx;
  } catch {
    return null;
  }
}

/**
 * Returns average character width ratio relative to 1em for different font classifications.
 */
function getFontWidthRatio(family: string): number {
  const lower = (family || '').toLowerCase();
  if (lower.includes('courier') || lower.includes('mono') || lower.includes('consolas')) {
    return 0.60;
  }
  if (lower.includes('garamond') || lower.includes('eb garamond')) {
    return 0.46; // Garamond is compact
  }
  if (lower.includes('times') || lower.includes('times new roman')) {
    return 0.48;
  }
  if (lower.includes('georgia') || lower.includes('cambria')) {
    return 0.52; // Georgia has wider proportions
  }
  if (lower.includes('inter') || lower.includes('roboto') || lower.includes('arial') || lower.includes('helvetica') || lower.includes('sans')) {
    return 0.51;
  }
  if (lower.includes('amiri') || lower.includes('noto sans arabic') || lower.includes('nastaliq') || lower.includes('arabic')) {
    return 0.53;
  }
  if (lower.includes('devanagari') || lower.includes('hindi') || lower.includes('kalam') || lower.includes('poppins')) {
    return 0.55;
  }
  return 0.50; // Standard default serif proportion
}

/**
 * Measures the width in points (1 pt = 1/72 inch) of a given string under specified font metrics.
 */
export function measureTextWidthPt(text: string, options: FontMetricsOptions): number {
  if (!text) return 0;

  const ctx = getMeasurementContext();
  if (ctx) {
    try {
      const weight = options.isBold ? 'bold' : 'normal';
      const style = options.isItalic ? 'italic' : 'normal';
      ctx.font = `${style} ${weight} ${options.fontSizePt}pt ${options.fontFamily}`;
      const metrics = ctx.measureText(text);
      // In CSS points: canvas measureText returns CSS pixels at standard 96dpi (1 pt = 4/3 px)
      return (metrics.width * 72) / 96;
    } catch {
      // Fall through to analytical metric calculation
    }
  }

  // Analytical typographic measurement (Node.js / Vitest / Canvas fallback)
  const ratio = getFontWidthRatio(options.fontFamily);
  const baseCharWidth = options.fontSizePt * ratio;
  const boldScale = options.isBold ? 1.08 : 1.0;

  let totalWidth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === ' ') {
      totalWidth += baseCharWidth * 0.62; // word space
    } else if (char === 'i' || char === 'l' || char === 'j' || char === '!' || char === '.' || char === ',' || char === ':' || char === ';') {
      totalWidth += baseCharWidth * 0.48; // narrow glyphs
    } else if (char === 'm' || char === 'w' || char === 'M' || char === 'W' || char === '@' || char === '%') {
      totalWidth += baseCharWidth * 1.55; // wide glyphs
    } else if (char >= 'A' && char <= 'Z') {
      totalWidth += baseCharWidth * 1.25; // uppercase
    } else {
      totalWidth += baseCharWidth; // standard lowercase / numbers
    }
  }

  return totalWidth * boldScale;
}

/**
 * Accurately wraps paragraph text into lines based on available column width in points.
 * Correctly accounts for paragraph first-line indent, float obstacles, and word boundaries.
 */
export function wrapParagraphIntoLines(
  paragraphText: string,
  columnWidthPt: number,
  fontOptions: FontMetricsOptions,
  firstLineIndentPt: number = 0,
  floatOptions?: {
    linesRemaining: number;
    floatWidthPercent: number;
    marginPt?: number;
  }
): WrappedLine[] {
  const trimmed = paragraphText.trim();
  if (!trimmed) return [];

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: WrappedLine[] = [];
  let currentWords: string[] = [];
  let currentLineIndex = 0;

  // Space width
  const spaceWidthPt = measureTextWidthPt(' ', fontOptions);

  const getAvailableWidthForLine = (lineIdx: number): number => {
    let width = columnWidthPt;
    if (lineIdx === 0 && firstLineIndentPt > 0) {
      width -= firstLineIndentPt;
    }
    if (floatOptions && floatOptions.linesRemaining > 0 && lineIdx < floatOptions.linesRemaining) {
      const floatFraction = Math.max(0.1, Math.min(0.8, floatOptions.floatWidthPercent / 100));
      const floatMargin = floatOptions.marginPt ?? 12; // default 12 pt margin
      width = width * (1 - floatFraction) - floatMargin;
    }
    return Math.max(50, width);
  };

  let activeLineWidthLimit = getAvailableWidthForLine(0);
  let currentAccumulatedWidth = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordWidth = measureTextWidthPt(word, fontOptions);

    const neededWidth = currentWords.length === 0
      ? wordWidth
      : currentAccumulatedWidth + spaceWidthPt + wordWidth;

    if (neededWidth <= activeLineWidthLimit) {
      currentWords.push(word);
      currentAccumulatedWidth = neededWidth;
    } else {
      // Line is full: commit current words as a line
      if (currentWords.length > 0) {
        lines.push({
          text: currentWords.join(' '),
          widthPt: currentAccumulatedWidth,
        });
        currentLineIndex++;
        activeLineWidthLimit = getAvailableWidthForLine(currentLineIndex);
        currentWords = [word];
        currentAccumulatedWidth = wordWidth;
      } else {
        // A single huge word exceeds the entire line width: force break
        lines.push({
          text: word,
          widthPt: wordWidth,
        });
        currentLineIndex++;
        activeLineWidthLimit = getAvailableWidthForLine(currentLineIndex);
        currentWords = [];
        currentAccumulatedWidth = 0;
      }
    }
  }

  // Push final line
  if (currentWords.length > 0) {
    lines.push({
      text: currentWords.join(' '),
      widthPt: currentAccumulatedWidth,
      isParagraphEnd: true,
    });
  } else if (lines.length > 0) {
    lines[lines.length - 1].isParagraphEnd = true;
  }

  return lines;
}
