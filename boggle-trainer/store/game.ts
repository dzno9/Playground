import type { Board, Pattern } from '@/lib/board';
import type { PatternGroup } from '@/lib/patterns';

export type Phase = 'idle' | 'loading' | 'playing' | 'results' | 'practice';

export interface RoundResult {
  board: Board;
  foundWords: string[];
  missedWords: string[];
  invalidWords: string[];
  score: number;
  maxScore: number;
  patternGroups: PatternGroup[];
}

export interface GameState {
  phase: Phase;
  board: Board;
  timeLeft: number;       // seconds
  foundWords: string[];   // valid words found this round (normalised lower)
  invalidWords: string[]; // words entered that aren't on board or not in dict
  allValidWords: string[];
  result: RoundResult | null;
  practicePattern: Pattern | null;
  loadError: string | null;
}

export const ROUND_SECONDS = 180;

export const initialState: GameState = {
  phase: 'idle',
  board: [],
  timeLeft: ROUND_SECONDS,
  foundWords: [],
  invalidWords: [],
  allValidWords: [],
  result: null,
  practicePattern: null,
  loadError: null,
};

export type Action =
  | { type: 'LOADING' }
  | { type: 'START'; board: Board; allValidWords: string[] }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'SUBMIT_WORD'; word: string; valid: boolean; onBoard: boolean }
  | { type: 'TICK' }
  | { type: 'END_ROUND'; result: RoundResult }
  | { type: 'START_PRACTICE'; pattern: Pattern; board: Board; allValidWords: string[] }
  | { type: 'RESET' };

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, phase: 'loading', loadError: null };

    case 'START':
      return {
        ...state,
        phase: 'playing',
        board: action.board,
        allValidWords: action.allValidWords,
        foundWords: [],
        invalidWords: [],
        timeLeft: ROUND_SECONDS,
        result: null,
        practicePattern: null,
      };

    case 'LOAD_ERROR':
      return { ...state, phase: 'idle', loadError: action.message };

    case 'SUBMIT_WORD': {
      const w = action.word.toLowerCase();
      if (state.foundWords.includes(w)) return state; // already found
      if (!action.valid || !action.onBoard) {
        if (state.invalidWords.includes(w)) return state;
        return { ...state, invalidWords: [...state.invalidWords, w] };
      }
      return { ...state, foundWords: [...state.foundWords, w] };
    }

    case 'TICK':
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };

    case 'END_ROUND':
      return { ...state, phase: 'results', result: action.result };

    case 'START_PRACTICE':
      return {
        ...state,
        phase: 'practice',
        board: action.board,
        allValidWords: action.allValidWords,
        foundWords: [],
        invalidWords: [],
        timeLeft: ROUND_SECONDS,
        practicePattern: action.pattern,
      };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}
