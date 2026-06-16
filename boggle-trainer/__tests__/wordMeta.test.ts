import { describe, it, expect } from 'vitest';
import {
  getShape,
  detectSuffix,
  detectPrefix,
  buildWordMeta,
} from '../lib/wordMeta';

describe('getShape', () => {
  it('labels vowels V and consonants C', () => {
    expect(getShape('cat')).toBe('CVC');
  });

  it('handles double vowels', () => {
    expect(getShape('rain')).toBe('CVVC');
  });

  it('handles consonant clusters', () => {
    expect(getShape('trip')).toBe('CCVC');
  });

  it('handles all vowels', () => {
    expect(getShape('eau')).toBe('VVV');
  });

  it('handles long words', () => {
    expect(getShape('string')).toBe('CCCVCC');
  });
});

describe('detectSuffix', () => {
  it('detects -ING (length >= 5)', () => {
    expect(detectSuffix('running')).toBe('ING');
    expect(detectSuffix('sing')).toBeNull(); // only 4 letters, min for ING is 5
  });

  it('detects -ED (length >= 4)', () => {
    expect(detectSuffix('rated')).toBe('ED');
    expect(detectSuffix('red')).toBeNull(); // too short
  });

  it('detects -ER (length >= 4)', () => {
    expect(detectSuffix('faster')).toBe('ER');
    expect(detectSuffix('her')).toBeNull();
  });

  it('detects -S (length >= 4)', () => {
    expect(detectSuffix('cats')).toBe('S');
    expect(detectSuffix('bus')).toBeNull(); // too short
  });

  it('detects -TION before shorter suffixes (length >= 6)', () => {
    expect(detectSuffix('nation')).toBe('TION');
  });

  it('detects -EST (length >= 5)', () => {
    expect(detectSuffix('fastest')).toBe('EST');
  });

  it('returns null when no suffix matches', () => {
    expect(detectSuffix('dog')).toBeNull();
    expect(detectSuffix('cat')).toBeNull();
  });
});

describe('detectPrefix', () => {
  it('detects RE- (length >= 5)', () => {
    expect(detectPrefix('rethink')).toBe('RE');
    expect(detectPrefix('read')).toBeNull(); // too short
  });

  it('detects UN- (length >= 5)', () => {
    expect(detectPrefix('undo')).toBeNull(); // only 4
    expect(detectPrefix('undone')).toBe('UN');
  });

  it('detects DE- (length >= 5)', () => {
    expect(detectPrefix('debug')).toBe('DE');
  });

  it('detects IN- (length >= 5)', () => {
    expect(detectPrefix('input')).toBe('IN');
  });

  it('returns null when no prefix matches', () => {
    expect(detectPrefix('cat')).toBeNull();
    expect(detectPrefix('faster')).toBeNull();
  });
});

describe('buildWordMeta', () => {
  it('extracts all fields for a simple word', () => {
    const m = buildWordMeta('cat');
    expect(m.word).toBe('cat');
    expect(m.length).toBe(3);
    expect(m.startLetter).toBe('C');
    expect(m.endLetter).toBe('T');
    expect(m.suffix).toBeNull();
    expect(m.prefix).toBeNull();
    expect(m.shape).toBe('CVC');
  });

  it('normalises to lowercase', () => {
    const m = buildWordMeta('RUNNING');
    expect(m.word).toBe('running');
    expect(m.suffix).toBe('ING');
    expect(m.startLetter).toBe('R');
  });

  it('picks up both suffix and prefix', () => {
    const m = buildWordMeta('refills');
    expect(m.prefix).toBe('RE');
    expect(m.suffix).toBe('S');
  });
});
