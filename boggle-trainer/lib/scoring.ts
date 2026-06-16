/** Standard Boggle point values by word length. */
export function scoreWord(word: string): number {
  const len = word.length;
  if (len <= 4) return 1;
  if (len === 5) return 2;
  if (len === 6) return 3;
  if (len === 7) return 5;
  return 11;
}

export function scoreWords(words: string[]): number {
  return words.reduce((sum, w) => sum + scoreWord(w), 0);
}
