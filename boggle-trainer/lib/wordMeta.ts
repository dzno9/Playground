const VOWELS = new Set('aeiou');

export interface WordMeta {
  word: string;
  length: number;
  startLetter: string;
  endLetter: string;
  suffix: string | null;
  prefix: string | null;
  shape: string;
}

export function getShape(word: string): string {
  return word.toLowerCase().split('').map(c => (VOWELS.has(c) ? 'V' : 'C')).join('');
}

// Order matters: longer suffixes must be checked first to avoid false positives
const SUFFIX_RULES: [string, number][] = [
  ['tion', 6],
  ['ing',  5],
  ['est',  5],
  ['ed',   4],
  ['er',   4],
  ['s',    4],
];

const PREFIX_RULES: [string, number][] = [
  ['re', 5],
  ['un', 5],
  ['de', 5],
  ['in', 5],
];

export function detectSuffix(word: string): string | null {
  const w = word.toLowerCase();
  for (const [suffix, minLen] of SUFFIX_RULES) {
    if (w.length >= minLen && w.endsWith(suffix)) return suffix.toUpperCase();
  }
  return null;
}

export function detectPrefix(word: string): string | null {
  const w = word.toLowerCase();
  for (const [prefix, minLen] of PREFIX_RULES) {
    if (w.length >= minLen && w.startsWith(prefix)) return prefix.toUpperCase();
  }
  return null;
}

export function buildWordMeta(word: string): WordMeta {
  const w = word.toLowerCase();
  return {
    word: w,
    length: w.length,
    startLetter: w[0].toUpperCase(),
    endLetter: w[w.length - 1].toUpperCase(),
    suffix: detectSuffix(w),
    prefix: detectPrefix(w),
    shape: getShape(w),
  };
}
