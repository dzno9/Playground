import type { RoundRecord } from './history';
import type { WordMeta } from './wordMeta';

export type BlindSpotType =
  | 'start_letter'
  | 'length'
  | 'suffix'
  | 'prefix'
  | 'extension'
  | 'anagram';

export interface BlindSpot {
  id: string;
  type: BlindSpotType;
  /** The specific key: 'A', '3', 'ING', 'extension', … */
  key: string;
  label: string;
  description: string;
  missCount: number;
  roundCount: number;
  totalRounds: number;
  examples: string[];
}

// ─── Per-round detectors ─────────────────────────────────────────────────────

/**
 * A missed word is an "extension miss" when the player found a shorter word that
 * is a proper prefix of the missed word (e.g. found RATE, missed RATES).
 */
export function detectExtensionMisses(
  foundWords: string[],
  missedWords: WordMeta[],
): WordMeta[] {
  const foundSet = new Set(foundWords.map(w => w.toLowerCase()));
  return missedWords.filter(m => {
    for (let len = 3; len < m.word.length; len++) {
      if (foundSet.has(m.word.slice(0, len))) return true;
    }
    return false;
  });
}

/**
 * A missed word is an "anagram miss" when the player found a different word that
 * uses exactly the same set of letters (e.g. found EAT, missed ATE).
 */
export function detectAnagramMisses(
  foundWords: string[],
  missedWords: WordMeta[],
): WordMeta[] {
  const sortedKey = (w: string) => w.toLowerCase().split('').sort().join('');
  const foundKeys = new Set(foundWords.map(sortedKey));
  return missedWords.filter(m => foundKeys.has(sortedKey(m.word)));
}

// ─── History aggregator ───────────────────────────────────────────────────────

interface Bucket {
  count: number;
  rounds: Set<number>;
  examples: Set<string>;
}

function emptyBucket(): Bucket {
  return { count: 0, rounds: new Set(), examples: new Set() };
}

function addToBucket(b: Bucket, roundIdx: number, word: string) {
  b.count++;
  b.rounds.add(roundIdx);
  if (b.examples.size < 6) b.examples.add(word);
}

function toBlindSpot(
  id: string,
  type: BlindSpotType,
  key: string,
  label: string,
  description: string,
  b: Bucket,
  totalRounds: number,
): BlindSpot {
  return {
    id,
    type,
    key,
    label,
    description,
    missCount: b.count,
    roundCount: b.rounds.size,
    totalRounds,
    examples: Array.from(b.examples),
  };
}

export function analyzeHistory(rounds: RoundRecord[]): BlindSpot[] {
  if (rounds.length === 0) return [];
  const total = rounds.length;

  const startLetterMap = new Map<string, Bucket>();
  const lengthMap = new Map<number, Bucket>();
  const suffixMap = new Map<string, Bucket>();
  const prefixMap = new Map<string, Bucket>();
  const extBucket = emptyBucket();
  const anaBucket = emptyBucket();

  rounds.forEach((round, ri) => {
    const foundStrs = round.foundWords.map(w => w.word);

    for (const m of round.missedWords) {
      // Start letter
      const sl = m.startLetter;
      if (!startLetterMap.has(sl)) startLetterMap.set(sl, emptyBucket());
      addToBucket(startLetterMap.get(sl)!, ri, m.word);

      // Length
      const l = m.length;
      if (!lengthMap.has(l)) lengthMap.set(l, emptyBucket());
      addToBucket(lengthMap.get(l)!, ri, m.word);

      // Suffix (data-driven: recorded for every suffix found)
      if (m.suffix) {
        if (!suffixMap.has(m.suffix)) suffixMap.set(m.suffix, emptyBucket());
        addToBucket(suffixMap.get(m.suffix)!, ri, m.word);
      }

      // Prefix
      if (m.prefix) {
        if (!prefixMap.has(m.prefix)) prefixMap.set(m.prefix, emptyBucket());
        addToBucket(prefixMap.get(m.prefix)!, ri, m.word);
      }
    }

    // Extensions
    for (const m of detectExtensionMisses(foundStrs, round.missedWords)) {
      addToBucket(extBucket, ri, m.word);
    }

    // Anagrams
    for (const m of detectAnagramMisses(foundStrs, round.missedWords)) {
      addToBucket(anaBucket, ri, m.word);
    }
  });

  const spots: BlindSpot[] = [];

  // Start letter — only surface letters with ≥ 3 misses to avoid noise
  for (const [letter, b] of startLetterMap) {
    if (b.count >= 3) {
      spots.push(toBlindSpot(
        `start_${letter}`, 'start_letter', letter,
        `Words starting with ${letter}`,
        `You frequently miss words that begin with "${letter}"`,
        b, total,
      ));
    }
  }

  // Length — surface any length with ≥ 3 misses
  for (const [len, b] of lengthMap) {
    if (b.count >= 3) {
      spots.push(toBlindSpot(
        `length_${len}`, 'length', String(len),
        `${len}-letter words`,
        `You miss many ${len}-letter words`,
        b, total,
      ));
    }
  }

  // Suffix — only surface when the data actually supports it (≥ 3 misses)
  for (const [suffix, b] of suffixMap) {
    if (b.count >= 3) {
      spots.push(toBlindSpot(
        `suffix_${suffix}`, 'suffix', suffix,
        `-${suffix} endings`,
        `You miss words ending in "-${suffix.toLowerCase()}"`,
        b, total,
      ));
    }
  }

  // Prefix
  for (const [prefix, b] of prefixMap) {
    if (b.count >= 3) {
      spots.push(toBlindSpot(
        `prefix_${prefix}`, 'prefix', prefix,
        `${prefix}- words`,
        `You miss words that start with "${prefix.toLowerCase()}-"`,
        b, total,
      ));
    }
  }

  // Extensions
  if (extBucket.count >= 3) {
    spots.push(toBlindSpot(
      'extension', 'extension', 'extension',
      'Word extensions',
      'You found the root but missed derived forms (e.g. found RATE, missed RATES/RATED)',
      extBucket, total,
    ));
  }

  // Anagrams
  if (anaBucket.count >= 3) {
    spots.push(toBlindSpot(
      'anagram', 'anagram', 'anagram',
      'Anagram families',
      'You found one word but missed its anagrams (e.g. found EAT, missed ATE/TEA)',
      anaBucket, total,
    ));
  }

  // Rank purely by miss count — no pre-assumed importance
  return spots.sort((a, b) => b.missCount - a.missCount);
}
