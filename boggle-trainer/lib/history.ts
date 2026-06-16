import type { Board } from './board';
import { buildWordMeta, type WordMeta } from './wordMeta';

export interface RoundRecord {
  id: string;
  timestamp: number;
  board: Board;
  foundWords: WordMeta[];
  missedWords: WordMeta[];
  invalidWords: string[];
  score: number;
  maxScore: number;
}

const HISTORY_KEY = 'boggle_history_v2';
const MAX_ROUNDS = 100;

export function buildRoundRecord(params: {
  board: Board;
  foundWords: string[];
  missedWords: string[];
  invalidWords: string[];
  score: number;
  maxScore: number;
}): RoundRecord {
  return {
    id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    board: params.board,
    foundWords: params.foundWords.map(buildWordMeta),
    missedWords: params.missedWords.map(buildWordMeta),
    invalidWords: params.invalidWords,
    score: params.score,
    maxScore: params.maxScore,
  };
}

export function saveRound(record: RoundRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const history = loadHistory();
    history.push(record);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_ROUNDS)));
  } catch {
    // quota exceeded — silently drop
  }
}

export function loadHistory(): RoundRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RoundRecord[];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}
