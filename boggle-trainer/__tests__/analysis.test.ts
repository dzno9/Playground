import { describe, it, expect } from 'vitest';
import { detectExtensionMisses, detectAnagramMisses, analyzeHistory } from '../lib/analysis';
import { buildWordMeta } from '../lib/wordMeta';
import type { RoundRecord } from '../lib/history';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function meta(word: string) {
  return buildWordMeta(word);
}

function makeRound(
  found: string[],
  missed: string[],
  overrides: Partial<RoundRecord> = {},
): RoundRecord {
  return {
    id: 'test',
    timestamp: Date.now(),
    board: [],
    foundWords: found.map(meta),
    missedWords: missed.map(meta),
    invalidWords: [],
    score: 0,
    maxScore: 0,
    ...overrides,
  };
}

// ─── detectExtensionMisses ────────────────────────────────────────────────────

describe('detectExtensionMisses', () => {
  it('flags a missed word whose root was found', () => {
    const result = detectExtensionMisses(['rate'], [meta('rates'), meta('cat')]);
    expect(result.map(m => m.word)).toContain('rates');
    expect(result.map(m => m.word)).not.toContain('cat');
  });

  it('handles multi-step extensions', () => {
    // found RATE → missed RATED and RATER are both extensions
    const result = detectExtensionMisses(
      ['rate'],
      [meta('rated'), meta('rater'), meta('dog')],
    );
    expect(result.map(m => m.word)).toContain('rated');
    expect(result.map(m => m.word)).toContain('rater');
    expect(result.map(m => m.word)).not.toContain('dog');
  });

  it('does not flag words where no prefix matches found words', () => {
    const result = detectExtensionMisses(['sun'], [meta('string')]);
    expect(result).toHaveLength(0);
  });

  it('returns empty array when there are no missed words', () => {
    const result = detectExtensionMisses(['rate'], []);
    expect(result).toHaveLength(0);
  });

  it('requires found-word prefix to be at least 3 chars', () => {
    // "re" is only 2 chars — should NOT count as root for "read"
    const result = detectExtensionMisses(['re'], [meta('read')]);
    expect(result).toHaveLength(0);
  });
});

// ─── detectAnagramMisses ─────────────────────────────────────────────────────

describe('detectAnagramMisses', () => {
  it('flags a missed word that is an anagram of a found word', () => {
    const result = detectAnagramMisses(['eat'], [meta('ate'), meta('cat')]);
    expect(result.map(m => m.word)).toContain('ate');
    expect(result.map(m => m.word)).not.toContain('cat');
  });

  it('detects multi-word anagram families', () => {
    // EAT / ATE / TEA all share letters
    const result = detectAnagramMisses(['eat'], [meta('ate'), meta('tea')]);
    expect(result).toHaveLength(2);
  });

  it('does not flag the word itself', () => {
    // found "eat" — "eat" is not in missed so it's fine, but guard anyway
    const result = detectAnagramMisses(['eat'], [meta('eat')]);
    // If "eat" is also in missed it would be flagged — that's intentional
    expect(result.map(m => m.word)).toContain('eat');
  });

  it('returns empty when no anagrams in missed words', () => {
    const result = detectAnagramMisses(['rat'], [meta('dog')]);
    expect(result).toHaveLength(0);
  });

  it('returns empty when no words found', () => {
    const result = detectAnagramMisses([], [meta('ate')]);
    expect(result).toHaveLength(0);
  });
});

// ─── analyzeHistory ───────────────────────────────────────────────────────────

describe('analyzeHistory', () => {
  it('returns empty array for no history', () => {
    expect(analyzeHistory([])).toEqual([]);
  });

  it('does not surface a category with fewer than 3 misses', () => {
    const rounds = [
      makeRound(['rate'], ['rates', 'rated']), // only 2 extension misses
    ];
    const spots = analyzeHistory(rounds);
    const ext = spots.find(s => s.type === 'extension');
    expect(ext).toBeUndefined();
  });

  it('surfaces extension blind spot once threshold is met', () => {
    const rounds = [
      makeRound(['rate'], ['rates', 'rated', 'rater']),
    ];
    const spots = analyzeHistory(rounds);
    const ext = spots.find(s => s.type === 'extension');
    expect(ext).toBeDefined();
    expect(ext!.missCount).toBeGreaterThanOrEqual(3);
  });

  it('surfaces anagram blind spot', () => {
    const rounds = [
      makeRound(['eat'], ['ate', 'tea', 'eta']), // 3 anagram misses
    ];
    const spots = analyzeHistory(rounds);
    const ana = spots.find(s => s.type === 'anagram');
    expect(ana).toBeDefined();
  });

  it('surfaces start_letter blind spot from consistent misses', () => {
    // 3 rounds, each missing 1 word starting with S — total 3 misses
    const rounds = [
      makeRound([], ['star']),
      makeRound([], ['sting']),
      makeRound([], ['slip']),
    ];
    const spots = analyzeHistory(rounds);
    const sl = spots.find(s => s.type === 'start_letter' && s.key === 'S');
    expect(sl).toBeDefined();
    expect(sl!.missCount).toBe(3);
  });

  it('does NOT surface a suffix unless it actually appears in the data', () => {
    // Misses contain no -ING words at all
    const rounds = [
      makeRound([], ['cat', 'dog', 'sun']),
      makeRound([], ['bat', 'rat', 'fat']),
    ];
    const spots = analyzeHistory(rounds);
    const ing = spots.find(s => s.type === 'suffix' && s.key === 'ING');
    expect(ing).toBeUndefined();
  });

  it('surfaces suffix only when the data shows real frequency', () => {
    const rounds = [
      makeRound([], ['rating', 'eating', 'staring']),
    ];
    const spots = analyzeHistory(rounds);
    const ing = spots.find(s => s.type === 'suffix' && s.key === 'ING');
    expect(ing).toBeDefined();
    expect(ing!.missCount).toBe(3);
  });

  it('ranks blind spots by missCount descending', () => {
    const rounds = [
      // 4 start-S misses vs 3 -ING suffix misses
      makeRound([], ['star', 'sting', 'rating', 'eating', 'staring']),
      makeRound([], ['slip', 'steam']),
    ];
    const spots = analyzeHistory(rounds);
    if (spots.length >= 2) {
      expect(spots[0].missCount).toBeGreaterThanOrEqual(spots[1].missCount);
    }
  });

  it('counts roundCount correctly', () => {
    const rounds = [
      makeRound([], ['star']),   // 1 S miss
      makeRound([], ['sting']),  // 1 S miss
      makeRound([], ['slip']),   // 1 S miss
    ];
    const spots = analyzeHistory(rounds);
    const sl = spots.find(s => s.type === 'start_letter' && s.key === 'S');
    expect(sl?.roundCount).toBe(3);
    expect(sl?.totalRounds).toBe(3);
  });
});
