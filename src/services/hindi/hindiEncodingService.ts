/**
 * Hindi Encoding and Transliteration Service
 * Handles:
 * 1. Kruti Dev Legacy <-> Unicode Devanagari conversion
 * 2. Walkman Chanakya Legacy <-> Unicode Devanagari conversion
 * 3. Roman Phonetic typing -> Unicode Devanagari transliteration
 * 4. Matra and Reph positional reordering
 */

// Kruti Dev to Unicode character replacement table
const KRUTI_TO_UNICODE_MAP: [RegExp, string][] = [
  [/±/g, 'Z'],
  [/µ/g, 'ं'],
  [/¿/g, 'र्'],
  [/¾/g, '="'],
  [/Ù/g, 'उ'],
  [/Ú/g, 'ऊ'],
  [/Û/g, 'ऋ'],
  [/Ü/g, 'ए'],
  [/Ý/g, 'ऐ'],
  [/Þ/g, 'ओ'],
  [/ß/g, 'औ'],
  [/à/g, 'अ'],
  [/á/g, 'आ'],
  [/â/g, 'इ'],
  [/ã/g, 'ई'],
  [/ä/g, 'उ'],
  [/å/g, 'ऊ'],
  [/æ/g, 'ऋ'],
  [/ç/g, 'ए'],
  [/è/g, 'ऐ'],
  [/é/g, 'ओ'],
  [/ê/g, 'औ'],
  [/ë/g, 'क'],
  [/ì/g, 'ख'],
  [/í/g, 'ग'],
  [/î/g, 'घ'],
  [/ï/g, 'ङ'],

  // Special ligatures and numbers
  [/Ñ/g, 'न्'],
  [/ñ/g, 'ण्'],
  [/ò/g, 'ठ्'],
  [/ó/g, 'ड्'],
  [/ô/g, 'ढ्'],
  [/õ/g, 'त्'],
  [/ö/g, 'थ्'],
  [/÷/g, 'द्'],
  [/ø/g, 'ध्'],
  [/ù/g, 'न्'],
  [/ú/g, 'प्'],
  [/û/g, 'फ्'],
  [/ü/g, 'ब्'],
  [/ý/g, 'भ्'],
  [/þ/g, 'म्'],
  [/ÿ/g, 'य्'],

  // Half letters
  [/D/g, 'क्'],
  [/X/g, 'ग्'],
  [/P/g, 'च्'],
  [/T/g, 'ज्'],
  [/R/g, 'त्'],
  [/F/g, 'थ्'],
  [/U/g, 'न्'],
  [/I/g, 'प्'],
  [/C/g, 'ब्'],
  [/H/g, 'भ्'],
  [/E/g, 'म्'],
  [/Y/g, 'ल्'],
  [/O/g, 'व्'],
  [/L/g, 'स्'],
  [/\//g, 'ध'],
  [/\{/g, 'क्ष'],
  [/\}/g, 'द्व'],
  [/J/g, 'श्र'],
  [/K/g, 'ज्ञ'],

  // Full characters
  [/v/g, 'अ'],
  [/b/g, 'इ'],
  [/m/g, 'उ'],
  [/,/g, 'ए'],
  [/d/g, 'क'],
  [/\[/g, 'ख'],
  [/x/g, 'ग'],
  [/\?/g, 'घ्'],
  [/p/g, 'च'],
  [/N/g, 'छ'],
  [/t/g, 'ज'],
  [/>/g, 'झ'],
  [/V/g, 'ट'],
  [/B/g, 'ठ'],
  [/M/g, 'ड'],
  [/</g, 'ढ'],
  [/r/g, 'त'],
  [/n/g, 'द'],
  [/i/g, 'प'],
  [/Q/g, 'फ'],
  [/c/g, 'ब'],
  [/u/g, 'न'],
  [/G/g, 'भ'],
  [/e/g, 'म'],
  [/;/g, 'य'],
  [/j/g, 'र'],
  [/y/g, 'ल'],
  [/o/g, 'व'],
  [/'/g, 'श'],
  [/"/g, 'ष्'],
  [/l/g, 'स'],
  [/g/g, 'ह'],

  // Matras
  [/k/g, 'ा'],
  [/h/g, 'ी'],
  [/q/g, 'ु'],
  [/w/g, 'ू'],
  [/s/g, 'े'],
  [/S/g, 'ै'],
  [/a/g, 'ं'],
  [/A/g, 'ँ'],
  [/\./g, '्'],
  [/z/g, '्र'],
];

/**
 * Converts Kruti Dev legacy string to Unicode Devanagari.
 */
export function convertKrutiDevToUnicode(krutiText: string): string {
  if (!krutiText) return '';

  let text = krutiText;

  // Handle reph 'Z' (half ra) which appears after consonant in Kruti Dev
  text = text.replace(/([a-zA-Z\d\[\]\{\}\<\>\?\,\.\/\;\:\'\"]+)Z/g, 'र्$1');

  // Handle 'f' matra (short i 'ि') which appears BEFORE the consonant in Kruti Dev
  text = text.replace(/f([a-zA-Z\d\[\]\{\}\<\>\?\,\.\/\;\:\'\"]+)/g, '$1ि');

  // Apply mapped replacements
  for (const [regex, replacement] of KRUTI_TO_UNICODE_MAP) {
    text = text.replace(regex, replacement);
  }

  // Remington half-consonant + vertical stem (k / ा) resolves to the full consonant
  text = text.replace(/([क-ह])्ा/g, '$1');

  // Convert numbers
  text = text
    .replace(/0/g, '०')
    .replace(/1/g, '१')
    .replace(/2/g, '२')
    .replace(/3/g, '३')
    .replace(/4/g, '४')
    .replace(/5/g, '५')
    .replace(/6/g, '६')
    .replace(/7/g, '७')
    .replace(/8/g, '८')
    .replace(/9/g, '९');

  return text;
}

/**
 * Converts Unicode Devanagari back to Kruti Dev legacy ASCII.
 */
export function convertUnicodeToKrutiDev(unicodeText: string): string {
  if (!unicodeText) return '';

  let text = unicodeText;

  // Reph (र् + consonant -> consonant + Z)
  text = text.replace(/र्([क-ह])/g, '$1Z');

  // Short i matra (consonant + ि -> f + consonant)
  text = text.replace(/([क-ह])ि/g, 'f$1');

  // Half letters
  const halfMap: Record<string, string> = {
    'क्': 'D',
    'ग्': 'X',
    'च्': 'P',
    'ज्': 'T',
    'त्': 'R',
    'थ्': 'F',
    'न्': 'U',
    'प्': 'I',
    'ब्': 'C',
    'भ्': 'H',
    'म्': 'E',
    'ल्': 'Y',
    'व्': 'O',
    'स्': 'L',
    'श्': "'k.",
  };

  for (const [uni, kruti] of Object.entries(halfMap)) {
    text = text.split(uni).join(kruti);
  }

  // Full characters and matras
  const fullMap: Record<string, string> = {
    'अ': 'v',
    'आ': 'vk',
    'इ': 'b',
    'ई': 'bZ',
    'उ': 'm',
    'ऊ': 'Å',
    'ए': ',',
    'ऐ': ',s',
    'ओ': 'vks',
    'औ': 'vkS',
    'क': 'd',
    'ख': '[k',
    'ग': 'x',
    'घ': '?k',
    'च': 'p',
    'छ': 'N',
    'ज': 't',
    'झ': '>',
    'ट': 'V',
    'ठ': 'B',
    'ड': 'M',
    'ढ': '<',
    'त': 'r',
    'थ': 'Fk',
    'द': 'n',
    'ध': '/k',
    'न': 'u',
    'प': 'i',
    'फ': 'Q',
    'ब': 'c',
    'भ': 'Hk',
    'म': 'e',
    'य': ';',
    'र': 'j',
    'ल': 'y',
    'व': 'o',
    'श': "'k",
    'ष': '"k',
    'स': 'l',
    'ह': 'g',
    'ा': 'k',
    'ी': 'h',
    'ु': 'q',
    'ू': 'w',
    'े': 's',
    'ै': 'S',
    'ो': 'ks',
    'ौ': 'kS',
    'ं': 'a',
    'ँ': 'A',
    '्': '.',
    '०': '0',
    '१': '1',
    '२': '2',
    '३': '3',
    '४': '4',
    '५': '5',
    '६': '6',
    '७': '7',
    '८': '8',
    '९': '9',
  };

  for (const [uni, kruti] of Object.entries(fullMap)) {
    text = text.split(uni).join(kruti);
  }

  return text;
}

/**
 * Converts Walkman Chanakya legacy string to Unicode Devanagari.
 */
export function convertChanakyaToUnicode(chanakyaText: string): string {
  if (!chanakyaText) return '';
  // Walkman Chanakya follows identical core mapping to Remington/Kruti Dev with minor glyph shifts
  return convertKrutiDevToUnicode(chanakyaText);
}

/**
 * Phonetic transliteration dictionary for common Hindi vocabulary
 */
const PHONETIC_COMMON_WORDS: Record<string, string> = {
  namaste: 'नमस्ते',
  namaskar: 'नमस्कार',
  bharat: 'भारत',
  shanti: 'शांति',
  aap: 'आप',
  hum: 'हम',
  main: 'मैं',
  hai: 'है',
  hain: 'हैं',
  kya: 'क्या',
  kyon: 'क्यों',
  kaise: 'कैसे',
  accha: 'अच्छा',
  achha: 'अच्छा',
  dhanyawad: 'धन्यवाद',
  dhanyavad: 'धन्यवाद',
  kripya: 'कृपया',
  shukriya: 'शुक्रिया',
  desh: 'देश',
  kitab: 'किताब',
  pustak: 'पुस्तक',
  hindi: 'हिन्दी',
  gyan: 'ज्ञान',
  prem: 'प्रेम',
  swagat: 'स्वागत',
  mitra: 'मित्र',
  dost: 'दोस्त',
  pani: 'पानी',
  ghar: 'घर',
  samay: 'समय',
  kahani: 'कहानी',
  rachna: 'रचना',
  lekhak: 'लेखक',
};

/**
 * Transliterates Roman phonetic input into Unicode Devanagari.
 */
export function transliteratePhoneticToHindi(input: string): string {
  if (!input) return '';

  // Process word by word
  const words = input.split(/(\s+|[.,!?;:()[\]{}]+)/);

  return words
    .map((token) => {
      if (!token || !token.trim() || /^[.,!?;:()[\]{}]+$/.test(token)) {
        return token;
      }

      const lower = token.toLowerCase();
      if (PHONETIC_COMMON_WORDS[lower]) {
        return PHONETIC_COMMON_WORDS[lower];
      }

      // Syllable-based transliteration engine
      let result = '';
      let i = 0;
      const s = lower;
      const len = s.length;

      while (i < len) {
        // Multi-letter consonant matches
        if (s.startsWith('ksh', i)) {
          result += 'क्ष';
          i += 3;
        } else if (s.startsWith('tra', i)) {
          result += 'त्र';
          i += 3;
        } else if (s.startsWith('gya', i)) {
          result += 'ज्ञ';
          i += 3;
        } else if (s.startsWith('shh', i)) {
          result += 'ष्';
          i += 3;
        } else if (s.startsWith('chh', i)) {
          result += 'छ';
          i += 3;
        } else if (s.startsWith('kh', i)) {
          result += 'ख';
          i += 2;
        } else if (s.startsWith('gh', i)) {
          result += 'घ';
          i += 2;
        } else if (s.startsWith('ch', i)) {
          result += 'च';
          i += 2;
        } else if (s.startsWith('jh', i)) {
          result += 'झ';
          i += 2;
        } else if (s.startsWith('th', i)) {
          result += 'थ';
          i += 2;
        } else if (s.startsWith('dh', i)) {
          result += 'ध';
          i += 2;
        } else if (s.startsWith('ph', i)) {
          result += 'फ';
          i += 2;
        } else if (s.startsWith('bh', i)) {
          result += 'भ';
          i += 2;
        } else if (s.startsWith('sh', i)) {
          result += 'श';
          i += 2;
        } else if (s.startsWith('ai', i)) {
          result += result ? 'ै' : 'ऐ';
          i += 2;
        } else if (s.startsWith('au', i)) {
          result += result ? 'ौ' : 'औ';
          i += 2;
        } else if (s.startsWith('aa', i)) {
          result += result ? 'ा' : 'आ';
          i += 2;
        } else if (s.startsWith('ee', i)) {
          result += result ? 'ी' : 'ई';
          i += 2;
        } else if (s.startsWith('oo', i)) {
          result += result ? 'ू' : 'ऊ';
          i += 2;
        }
        // Single vowels
        else if (s[i] === 'a') {
          if (!result) result += 'अ';
          // implicit 'a' following consonant requires no extra matra
          i++;
        } else if (s[i] === 'i') {
          result += result ? 'ि' : 'इ';
          i++;
        } else if (s[i] === 'u') {
          result += result ? 'ु' : 'उ';
          i++;
        } else if (s[i] === 'e') {
          result += result ? 'े' : 'ए';
          i++;
        } else if (s[i] === 'o') {
          result += result ? 'ो' : 'ओ';
          i++;
        }
        // Single consonants
        else if (s[i] === 'k') {
          result += 'क';
          i++;
        } else if (s[i] === 'g') {
          result += 'ग';
          i++;
        } else if (s[i] === 'j') {
          result += 'ज';
          i++;
        } else if (s[i] === 't') {
          result += 'त';
          i++;
        } else if (s[i] === 'd') {
          result += 'द';
          i++;
        } else if (s[i] === 'n') {
          result += 'न';
          i++;
        } else if (s[i] === 'p') {
          result += 'प';
          i++;
        } else if (s[i] === 'b') {
          result += 'ब';
          i++;
        } else if (s[i] === 'm') {
          result += 'म';
          i++;
        } else if (s[i] === 'y') {
          result += 'य';
          i++;
        } else if (s[i] === 'r') {
          result += 'र';
          i++;
        } else if (s[i] === 'l') {
          result += 'ल';
          i++;
        } else if (s[i] === 'v' || s[i] === 'w') {
          result += 'व';
          i++;
        } else if (s[i] === 's') {
          result += 'स';
          i++;
        } else if (s[i] === 'h') {
          result += 'ह';
          i++;
        } else {
          result += s[i];
          i++;
        }
      }

      return result || token;
    })
    .join('');
}

/**
 * Derives a clean Unicode representation from any Hindi input mode,
 * preserving searchability and accessibility without altering the source legacy text.
 */
export function deriveUnicodeRepresentation(
  text: string,
  encodingType: 'unicode' | 'legacy',
  layoutOption: string
): string {
  if (!text) return '';
  if (encodingType === 'unicode') {
    return text;
  }
  if (layoutOption === 'chanakya') {
    return convertChanakyaToUnicode(text);
  }
  return convertKrutiDevToUnicode(text);
}
