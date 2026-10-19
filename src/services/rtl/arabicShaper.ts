import { formatNumerals, reorderRtlLineForPdf } from './bidiService';
import { NumeralSystem } from '@/types/book';

/**
 * Arabic character representation table: [Isolated, Final, Initial, Medial]
 * Joining Types:
 *   'D' = Dual joining (connects to both prev and next)
 *   'R' = Right joining (connects only to prev)
 *   'U' = Non joining
 */
interface ArabicCharDef {
  joining: 'D' | 'R' | 'U';
  forms: [number, number, number, number]; // [Isolated, Final, Initial, Medial]
}

const ARABIC_GLYPH_TABLE: Record<number, ArabicCharDef> = {
  // Hamza: non-joining
  0x0621: { joining: 'U', forms: [0xfe80, 0xfe80, 0xfe80, 0xfe80] },
  // Alef with Madda: right-joining
  0x0622: { joining: 'R', forms: [0xfe81, 0xfe82, 0xfe81, 0xfe82] },
  // Alef with Hamza Above: right-joining
  0x0623: { joining: 'R', forms: [0xfe83, 0xfe84, 0xfe83, 0xfe84] },
  // Waw with Hamza: right-joining
  0x0624: { joining: 'R', forms: [0xfe85, 0xfe86, 0xfe85, 0xfe86] },
  // Alef with Hamza Below: right-joining
  0x0625: { joining: 'R', forms: [0xfe87, 0xfe88, 0xfe87, 0xfe88] },
  // Yeh with Hamza: dual-joining
  0x0626: { joining: 'D', forms: [0xfe89, 0xfe8a, 0xfe8b, 0xfe8c] },
  // Alef: right-joining
  0x0627: { joining: 'R', forms: [0xfe8d, 0xfe8e, 0xfe8d, 0xfe8e] },
  // Beh: dual-joining
  0x0628: { joining: 'D', forms: [0xfe8f, 0xfe90, 0xfe91, 0xfe92] },
  // Teh Marbuta: right-joining
  0x0629: { joining: 'R', forms: [0xfe93, 0xfe94, 0xfe93, 0xfe94] },
  // Teh: dual-joining
  0x062a: { joining: 'D', forms: [0xfe95, 0xfe96, 0xfe97, 0xfe98] },
  // Theh: dual-joining
  0x062b: { joining: 'D', forms: [0xfe99, 0xfe9a, 0xfe9b, 0xfe9c] },
  // Jeem: dual-joining
  0x062c: { joining: 'D', forms: [0xfe9d, 0xfe9e, 0xfe9f, 0xfea0] },
  // Hah: dual-joining
  0x062d: { joining: 'D', forms: [0xfea1, 0xfea2, 0xfea3, 0xfea4] },
  // Khah: dual-joining
  0x062e: { joining: 'D', forms: [0xfea5, 0xfea6, 0xfea7, 0xfea8] },
  // Dal: right-joining
  0x062f: { joining: 'R', forms: [0xfea9, 0xfeaa, 0xfea9, 0xfeaa] },
  // Thal: right-joining
  0x0630: { joining: 'R', forms: [0xfeab, 0xfeac, 0xfeab, 0xfeac] },
  // Reh: right-joining
  0x0631: { joining: 'R', forms: [0xfead, 0xfeae, 0xfead, 0xfeae] },
  // Zain: right-joining
  0x0632: { joining: 'R', forms: [0xfeaf, 0xfeb0, 0xfeaf, 0xfeb0] },
  // Seen: dual-joining
  0x0633: { joining: 'D', forms: [0xfeb1, 0xfeb2, 0xfeb3, 0xfeb4] },
  // Sheen: dual-joining
  0x0634: { joining: 'D', forms: [0xfeb5, 0xfeb6, 0xfeb7, 0xfeb8] },
  // Sad: dual-joining
  0x0635: { joining: 'D', forms: [0xfeb9, 0xfeba, 0xfebb, 0xfebc] },
  // Dad: dual-joining
  0x0636: { joining: 'D', forms: [0xfebd, 0xfebe, 0xfebf, 0xfec0] },
  // Tah: dual-joining
  0x0637: { joining: 'D', forms: [0xfec1, 0xfec2, 0xfec3, 0xfec4] },
  // Zah: dual-joining
  0x0638: { joining: 'D', forms: [0xfec5, 0xfec6, 0xfec7, 0xfec8] },
  // Ain: dual-joining
  0x0639: { joining: 'D', forms: [0xfec9, 0xfeca, 0xfecb, 0xfecc] },
  // Ghain: dual-joining
  0x063a: { joining: 'D', forms: [0xfecd, 0xfece, 0xfecf, 0xfed0] },
  // Tatweel / Kashida: dual-joining
  0x0640: { joining: 'D', forms: [0x0640, 0x0640, 0x0640, 0x0640] },
  // Feh: dual-joining
  0x0641: { joining: 'D', forms: [0xfed1, 0xfed2, 0xfed3, 0xfed4] },
  // Qaf: dual-joining
  0x0642: { joining: 'D', forms: [0xfed5, 0xfed6, 0xfed7, 0xfed8] },
  // Kaf: dual-joining
  0x0643: { joining: 'D', forms: [0xfed9, 0xfeda, 0xfedb, 0xfedc] },
  // Lam: dual-joining
  0x0644: { joining: 'D', forms: [0xfedd, 0xfede, 0xfedf, 0xfee0] },
  // Meem: dual-joining
  0x0645: { joining: 'D', forms: [0xfee1, 0xfee2, 0xfee3, 0xfee4] },
  // Noon: dual-joining
  0x0646: { joining: 'D', forms: [0xfee5, 0xfee6, 0xfee7, 0xfee8] },
  // Heh: dual-joining
  0x0647: { joining: 'D', forms: [0xfee9, 0xfeea, 0xfeeb, 0xfeec] },
  // Waw: right-joining
  0x0648: { joining: 'R', forms: [0xfeed, 0xfeee, 0xfeed, 0xfeee] },
  // Alef Maksura: right-joining
  0x0649: { joining: 'R', forms: [0xfeef, 0xfef0, 0xfeef, 0xfef0] },
  // Yeh: dual-joining
  0x064a: { joining: 'D', forms: [0xfef1, 0xfef2, 0xfef3, 0xfef4] },

  // --- Urdu Specific Characters ---
  // Tteh (ٹ): dual-joining
  0x0679: { joining: 'D', forms: [0xfb66, 0xfb67, 0xfb68, 0xfb69] },
  // Peh (پ): dual-joining
  0x067e: { joining: 'D', forms: [0xfb56, 0xfb57, 0xfb58, 0xfb59] },
  // Cheh (چ): dual-joining
  0x0686: { joining: 'D', forms: [0xfb7a, 0xfb7b, 0xfb7c, 0xfb7d] },
  // Ddal (ڈ): right-joining
  0x0688: { joining: 'R', forms: [0xfb88, 0xfb89, 0xfb88, 0xfb89] },
  // Rreh (ڑ): right-joining
  0x0691: { joining: 'R', forms: [0xfb8c, 0xfb8d, 0xfb8c, 0xfb8d] },
  // Zheh (ژ): right-joining
  0x0698: { joining: 'R', forms: [0xfb8a, 0xfb8b, 0xfb8a, 0xfb8b] },
  // Gaf (گ): dual-joining
  0x06af: { joining: 'D', forms: [0xfb92, 0xfb93, 0xfb94, 0xfb95] },
  // Noon Ghunna (ں): right-joining
  0x06ba: { joining: 'R', forms: [0xfb9e, 0xfb9f, 0xfb9e, 0xfb9f] },
  // Heh Doachashmee (ھ): dual-joining
  0x06be: { joining: 'D', forms: [0xfbaa, 0xfbab, 0xfbac, 0xfbad] },
  // Urdu Yeh / Choti Yeh (ی): dual-joining
  0x06cc: { joining: 'D', forms: [0xfbfc, 0xfbfd, 0xfbfe, 0xfbff] },
  // Bari Yeh (ے): right-joining
  0x06d2: { joining: 'R', forms: [0xfbae, 0xfbaf, 0xfbae, 0xfbaf] },
};

/**
 * Checks if a Unicode code point is an Arabic diacritic (Tashkeel)
 */
function isTashkeel(code: number): boolean {
  return (code >= 0x064b && code <= 0x0652) || code === 0x0670;
}

/**
 * Finds the previous connectable character index, skipping diacritics.
 */
function getPrevConnectableIndex(text: string, currentIndex: number): number {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const code = text.charCodeAt(i);
    if (!isTashkeel(code)) {
      return i;
    }
  }
  return -1;
}

/**
 * Finds the next connectable character index, skipping diacritics.
 */
function getNextConnectableIndex(text: string, currentIndex: number): number {
  for (let i = currentIndex + 1; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (!isTashkeel(code)) {
      return i;
    }
  }
  return -1;
}

/**
 * Shapes an Arabic/Urdu string into contextual Presentation Forms (Isolated, Initial, Medial, Final)
 * and resolves mandatory Lam-Alef ligatures.
 */
export function shapeArabicText(text: string): string {
  if (!text) return '';

  const chars: string[] = [];
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);

    // If it's a diacritic or not an Arabic glyph in our table, preserve directly
    if (isTashkeel(code) || !ARABIC_GLYPH_TABLE[code]) {
      chars.push(text[i]);
      continue;
    }

    const prevIdx = getPrevConnectableIndex(text, i);
    const nextIdx = getNextConnectableIndex(text, i);

    const prevChar = prevIdx >= 0 ? text.charCodeAt(prevIdx) : 0;
    const nextChar = nextIdx >= 0 ? text.charCodeAt(nextIdx) : 0;

    const prevDef = prevChar ? ARABIC_GLYPH_TABLE[prevChar] : null;
    const nextDef = nextChar ? ARABIC_GLYPH_TABLE[nextChar] : null;

    // Check for Lam-Alef Ligatures: Lam (0x0644) followed by Alef variants
    if (code === 0x0644 && nextChar) {
      let ligatureForms: [number, number] | null = null;
      if (nextChar === 0x0627) {
        ligatureForms = [0xfefb, 0xfefc]; // Lam + Alef
      } else if (nextChar === 0x0622) {
        ligatureForms = [0xfef5, 0xfef6]; // Lam + Alef Madda
      } else if (nextChar === 0x0623) {
        ligatureForms = [0xfef7, 0xfef8]; // Lam + Alef Hamza Above
      } else if (nextChar === 0x0625) {
        ligatureForms = [0xfef9, 0xfefa]; // Lam + Alef Hamza Below
      }

      if (ligatureForms) {
        // Does previous character connect forward?
        const connectsPrev = prevDef && (prevDef.joining === 'D' || prevDef.joining === 'R');
        const ligCode = connectsPrev ? ligatureForms[1] : ligatureForms[0];
        chars.push(String.fromCharCode(ligCode));
        i = nextIdx; // skip the Alef
        continue;
      }
    }

    const currentDef = ARABIC_GLYPH_TABLE[code];
    const connectsPrev =
      prevDef &&
      (prevDef.joining === 'D' || prevDef.joining === 'R') &&
      (currentDef.joining === 'D' || currentDef.joining === 'R');

    const connectsNext =
      nextDef &&
      (nextDef.joining === 'D' || nextDef.joining === 'R') &&
      currentDef.joining === 'D';

    let formIndex = 0; // Isolated by default
    if (connectsPrev && connectsNext) {
      formIndex = 3; // Medial
    } else if (connectsPrev) {
      formIndex = 1; // Final
    } else if (connectsNext) {
      formIndex = 2; // Initial
    } else {
      formIndex = 0; // Isolated
    }

    const glyphCode = currentDef.forms[formIndex] || code;
    chars.push(String.fromCharCode(glyphCode));
  }

  return chars.join('');
}

/**
 * Prepares an Arabic/Urdu string for PDF rendering:
 * 1. Formats numbers according to user numeral system.
 * 2. Shapes all Arabic/Urdu characters into presentation forms.
 * 3. Reverses the shaped Arabic letter runs so that drawing left-to-right
 *    in PDF displays them correctly right-to-left.
 */
export function prepareRtlTextForPdf(text: string, numeralSystem: NumeralSystem = 'western'): string {
  if (!text) return '';

  const withNumerals = formatNumerals(text, numeralSystem);

  // Split into tokens preserving whitespace and non-Arabic segments
  const tokens = withNumerals.split(/(\s+|[0-9٠-٩۰-۹A-Za-z\-_.,:;!?'"()[\]{}]+)/);

  const processedTokens = tokens.map((token) => {
    // If token contains Arabic characters, shape and reverse characters within the word
    if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(token)) {
      const shaped = shapeArabicText(token);
      return Array.from(shaped).reverse().join('');
    }
    // Numbers, Latin words, punctuation retain forward orientation
    return token;
  });

  // Reorder the sequence of tokens across the line
  return reorderRtlLineForPdf(processedTokens.join(''));
}
