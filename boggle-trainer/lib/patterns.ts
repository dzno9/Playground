import type { Pattern } from './board';

export interface PatternGroup {
  pattern: Pattern;
  label: string;
  description: string;
  words: string[];
}

const PATTERN_DEFS: { pattern: Pattern; label: string; description: string; test: (w: string) => boolean }[] = [
  {
    pattern: 'ing',
    label: '-ING endings',
    description: 'Words ending in ING (present participle)',
    test: (w) => w.endsWith('ing') && w.length >= 5,
  },
  {
    pattern: 'past',
    label: '-ED endings',
    description: 'Words ending in ED (past tense)',
    test: (w) => w.endsWith('ed') && w.length >= 4,
  },
  {
    pattern: 'er',
    label: '-ER endings',
    description: 'Words ending in ER (comparative or agent)',
    test: (w) => w.endsWith('er') && w.length >= 4,
  },
  {
    pattern: 'plural',
    label: '-S plurals',
    description: 'Words ending in S (plurals or 3rd person singular)',
    test: (w) => w.endsWith('s') && w.length >= 4,
  },
  {
    pattern: 're',
    label: 'RE- prefix',
    description: 'Words starting with RE (again)',
    test: (w) => w.startsWith('re') && w.length >= 5,
  },
  {
    pattern: 'un',
    label: 'UN- prefix',
    description: 'Words starting with UN (not)',
    test: (w) => w.startsWith('un') && w.length >= 5,
  },
  {
    pattern: 'de',
    label: 'DE- prefix',
    description: 'Words starting with DE (remove/reverse)',
    test: (w) => w.startsWith('de') && w.length >= 5,
  },
  {
    pattern: 'in',
    label: 'IN- prefix',
    description: 'Words starting with IN (not/into)',
    test: (w) => w.startsWith('in') && w.length >= 5,
  },
  {
    pattern: 'short',
    label: 'Short words (3–4)',
    description: 'Short 3–4 letter words — easy wins',
    test: (w) => w.length >= 3 && w.length <= 4,
  },
];

/** Assign the most educationally interesting pattern to a word. */
export function classifyWord(word: string): Pattern | null {
  const w = word.toLowerCase();
  for (const def of PATTERN_DEFS) {
    if (def.test(w)) return def.pattern;
  }
  return null;
}

/** Group an array of words into pattern buckets. Only non-empty groups returned. */
export function groupByPattern(words: string[]): PatternGroup[] {
  const groups: Map<Pattern, PatternGroup> = new Map();

  for (const w of words) {
    const p = classifyWord(w);
    if (!p) continue;
    if (!groups.has(p)) {
      const def = PATTERN_DEFS.find((d) => d.pattern === p)!;
      groups.set(p, { pattern: p, label: def.label, description: def.description, words: [] });
    }
    groups.get(p)!.words.push(w);
  }

  // Return in priority order
  return PATTERN_DEFS.map((d) => groups.get(d.pattern)).filter(Boolean) as PatternGroup[];
}
