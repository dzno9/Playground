import { buildTrie, Trie } from './trie';

let wordSet: Set<string> | null = null;
let trie: Trie | null = null;

export async function loadDictionary(): Promise<{ wordSet: Set<string>; trie: Trie }> {
  if (wordSet && trie) return { wordSet, trie };

  const res = await fetch('/words.txt');
  const text = await res.text();
  const words = text
    .split('\n')
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 3 && w.length <= 16 && /^[a-z]+$/.test(w));

  wordSet = new Set(words);
  trie = buildTrie(words);
  return { wordSet, trie };
}

export function isValidWord(word: string): boolean {
  return wordSet?.has(word.toLowerCase()) ?? false;
}
