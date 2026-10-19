export interface KeyboardLayoutDefinition {
  id: string;
  name: string;
  description: string;
  normalMap: Record<string, string>;
  shiftMap: Record<string, string>;
}

/**
 * Kruti Dev Remington Typewriter Keyboard Layout.
 * In Remington layout, physical keystrokes produce ASCII characters that
 * the Kruti Dev font maps to Devanagari glyphs.
 */
export const REMINGTON_KRUTI_DEV_LAYOUT: KeyboardLayoutDefinition = {
  id: 'remington-kruti',
  name: 'Kruti Dev — Remington Layout',
  description: 'Standard Remington Hindi typewriter keyboard layout for Kruti Dev fonts.',
  normalMap: {
    q: 'q', // ु (matra u)
    w: 'w', // ू (matra uu)
    e: 'e', // म
    r: 'r', // त
    t: 't', // ज
    y: 'y', // ल
    u: 'u', // न
    i: 'i', // प
    o: 'o', // व
    p: 'p', // च
    '[': '[', // ख
    ']': ']', // comma
    a: 'a', // ं (anusvara)
    s: 's', // े (matra e)
    d: 'd', // क
    f: 'f', // ि (matra short i)
    g: 'g', // ह
    h: 'h', // ी (matra long i)
    j: 'j', // र
    k: 'k', // ा (matra aa)
    l: 'l', // स
    ';': ';', // य
    "'": "'", // श
    z: 'z', // ्र (ra under)
    x: 'x', // ग
    c: 'c', // ब
    v: 'v', // अ
    b: 'b', // इ
    n: 'n', // द
    m: 'm', // उ
    ',': ',', // ए
    '.': '.', // ् (virama)
    '/': '/', // ध
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '0': '0',
    '-': '-',
    '=': '=',
  },
  shiftMap: {
    Q: 'Q', // फ
    W: 'W', // ॅ
    E: 'E', // म् (half ma)
    R: 'R', // त् (half ta)
    T: 'T', // ज् (half ja)
    Y: 'Y', // ल् (half la)
    U: 'U', // न् (half na)
    I: 'I', // प् (half pa)
    O: 'O', // व् (half va)
    P: 'P', // च् (half cha)
    '{': '{', // क्ष
    '}': '}', // द्व
    A: 'A', // ँ (chandrabindu)
    S: 'S', // ै (matra ai)
    D: 'D', // क् (half ka)
    F: 'F', // थ् (half tha)
    G: 'G', // भ
    H: 'H', // भ् (half bha)
    J: 'J', // श्र
    K: 'K', // ज्ञ
    L: 'L', // स् (half sa)
    ':': ':', // रू
    '"': '"', // ष् (half sha)
    Z: 'Z', // र् (reph)
    X: 'X', // ग् (half ga)
    C: 'C', // ब् (half ba)
    V: 'V', // ट
    B: 'B', // ठ
    N: 'N', // छ
    M: 'M', // ड
    '<': '<', // ढ
    '>': '>', // झ
    '?': '?', // घ्
    '!': '!',
    '@': '@',
    '#': '#',
    $: '$',
    '%': '%',
    '^': '^',
    '&': '&',
    '*': '*',
    '(': '(',
    ')': ')',
    _: '_',
    '+': '+',
  },
};

/**
 * Walkman Chanakya Typewriter Keyboard Layout.
 */
export const CHANAKYA_LAYOUT: KeyboardLayoutDefinition = {
  id: 'chanakya',
  name: 'Walkman Chanakya Layout',
  description: 'Standard Chanakya Hindi keyboard layout for legacy Walkman Chanakya fonts.',
  normalMap: { ...REMINGTON_KRUTI_DEV_LAYOUT.normalMap },
  shiftMap: { ...REMINGTON_KRUTI_DEV_LAYOUT.shiftMap },
};

/**
 * Unicode InScript Standard Keyboard Layout.
 * Directly maps keyboard keys to Unicode Devanagari characters (U+0900 - U+097F).
 */
export const INSCRIPT_UNICODE_LAYOUT: KeyboardLayoutDefinition = {
  id: 'inscript',
  name: 'Unicode Devanagari — InScript',
  description: 'Standard Indian Government InScript keyboard layout for Unicode Devanagari.',
  normalMap: {
    q: 'ौ', // matra au
    w: 'ै', // matra ai
    e: 'ा', // matra aa
    r: 'ी', // matra ii
    t: 'ू', // matra uu
    y: 'ब',
    u: 'ह',
    i: 'ग',
    o: 'द',
    p: 'ज',
    '[': 'ड',
    ']': '़', // nukta
    a: 'ो', // matra o
    s: 'े', // matra e
    d: '्', // virama / halant
    f: 'ि', // matra i
    g: 'ु', // matra u
    h: 'प',
    j: 'र',
    k: 'क',
    l: 'त',
    ';': 'च',
    "'": 'ट',
    z: 'े',
    x: 'ं', // anusvara
    c: 'म',
    v: 'न',
    b: 'व',
    n: 'ल',
    m: 'स',
    ',': ',',
    '.': '।', // purna viram
    '/': 'य',
    '1': '१',
    '2': '२',
    '3': '३',
    '4': '४',
    '5': '५',
    '6': '६',
    '7': '७',
    '8': '८',
    '9': '९',
    '0': '०',
  },
  shiftMap: {
    Q: 'औ',
    W: 'ऐ',
    E: 'आ',
    R: 'ई',
    T: 'ऊ',
    Y: 'भ',
    U: 'ङ',
    I: 'घ',
    O: 'ध',
    P: 'झ',
    '{': 'ढ',
    '}': 'ञ',
    A: 'ओ',
    S: 'ए',
    D: 'अ',
    F: 'इ',
    G: 'उ',
    H: 'फ',
    J: 'ऋ',
    K: 'ख',
    L: 'थ',
    ':': 'छ',
    '"': 'ठ',
    X: 'ँ', // chandrabindu
    C: 'ण',
    V: 'ष',
    B: 'श',
    M: 'श',
    '<': 'ष',
    '>': '।',
    '?': '?',
  },
};

export const KEYBOARD_LAYOUTS: Record<string, KeyboardLayoutDefinition> = {
  'remington-kruti': REMINGTON_KRUTI_DEV_LAYOUT,
  chanakya: CHANAKYA_LAYOUT,
  inscript: INSCRIPT_UNICODE_LAYOUT,
};

export function getKeyboardLayout(id: string): KeyboardLayoutDefinition {
  return KEYBOARD_LAYOUTS[id] || REMINGTON_KRUTI_DEV_LAYOUT;
}
