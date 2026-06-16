'use client';

import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { gameReducer, initialState } from '@/store/game';
import {
  generateBoard,
  type Pattern,
  type BoardBias,
  suffixToPattern,
  prefixToPattern,
} from '@/lib/board';
import { loadDictionary, isValidWord } from '@/lib/dictionary';
import { canFormWord, findAllWords } from '@/lib/validator';
import { groupByPattern } from '@/lib/patterns';
import { scoreWords } from '@/lib/scoring';
import { loadHistory } from '@/lib/history';
import type { BlindSpot } from '@/lib/analysis';
import type { Trie } from '@/lib/trie';
import BoggleBoard from '@/components/BoggleBoard';
import Timer from '@/components/Timer';
import WordInput from '@/components/WordInput';
import FoundWords from '@/components/FoundWords';
import Results from '@/components/Results';
import BlindSpotDashboard from '@/components/BlindSpotDashboard';

/** Convert a BlindSpot into a BoardBias for board generation. */
function blindSpotToBias(spot: BlindSpot): BoardBias {
  if (spot.type === 'suffix') {
    const p = suffixToPattern(spot.key);
    if (p) return { type: 'pattern', pattern: p };
  }
  if (spot.type === 'prefix') {
    const p = prefixToPattern(spot.key);
    if (p) return { type: 'pattern', pattern: p };
  }
  if (spot.type === 'start_letter') {
    return { type: 'start_letter', letter: spot.key };
  }
  return { type: 'none' };
}

/** Hint shown on the board for blind spots where biasing the board isn't enough. */
function blindSpotHint(spot: BlindSpot): string | null {
  if (spot.type === 'extension') {
    return 'For every word you find, try adding -S, -ED, -ER, -ING';
  }
  if (spot.type === 'anagram') {
    return 'For every word you find, try rearranging those letters';
  }
  if (spot.type === 'length') {
    return `Focus specifically on ${spot.key}-letter words`;
  }
  return null;
}

export default function Home() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trieRef = useRef<Trie | null>(null);
  const stateRef = useRef(state);
  const [hasHistory, setHasHistory] = useState(false);

  // Keep stateRef current so finishRound never reads stale values
  useEffect(() => { stateRef.current = state; });

  // Preload dictionary + check history on mount
  useEffect(() => {
    loadDictionary().then(({ trie }) => { trieRef.current = trie; });
    setHasHistory(loadHistory().length > 0);
  }, []);

  // Refresh hasHistory whenever we leave the results screen
  useEffect(() => {
    if (state.phase === 'idle') {
      setHasHistory(loadHistory().length > 0);
    }
  }, [state.phase]);

  // Countdown interval — only while actively playing
  useEffect(() => {
    if (state.phase !== 'playing' && state.phase !== 'practice') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.phase]);

  // Auto-end when time hits 0
  useEffect(() => {
    if ((state.phase === 'playing' || state.phase === 'practice') && state.timeLeft === 0) {
      finishRound();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.timeLeft, state.phase]);

  // ── Core game actions ──────────────────────────────────────────────────────

  const startGame = useCallback(async () => {
    dispatch({ type: 'LOADING' });
    try {
      const { trie } = await loadDictionary();
      trieRef.current = trie;
      const board = generateBoard();
      dispatch({ type: 'START', board, allValidWords: findAllWords(board, trie) });
    } catch (e) {
      dispatch({ type: 'LOAD_ERROR', message: String(e) });
    }
  }, []);

  const startPractice = useCallback(async (bias: BoardBias, label: string, hint: string | null) => {
    dispatch({ type: 'LOADING' });
    try {
      const { trie } = await loadDictionary();
      trieRef.current = trie;
      const board = generateBoard(bias);
      dispatch({
        type: 'START_PRACTICE',
        label,
        hint,
        board,
        allValidWords: findAllWords(board, trie),
      });
    } catch (e) {
      dispatch({ type: 'LOAD_ERROR', message: String(e) });
    }
  }, []);

  const finishRound = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'playing' && s.phase !== 'practice') return;
    const missed = s.allValidWords.filter(w => !s.foundWords.includes(w));
    dispatch({
      type: 'END_ROUND',
      result: {
        board: s.board,
        foundWords: s.foundWords,
        missedWords: missed,
        invalidWords: s.invalidWords,
        score: scoreWords(s.foundWords),
        maxScore: scoreWords(s.allValidWords),
        patternGroups: groupByPattern(missed),
      },
    });
  }, []);

  const handleWordSubmit = useCallback((word: string) => {
    const w = word.toLowerCase();
    dispatch({ type: 'SUBMIT_WORD', word: w, valid: isValidWord(w), onBoard: canFormWord(stateRef.current.board, w) });
  }, []);

  // From per-round PatternGroups (secondary, still useful immediate feedback)
  const handlePatternPractice = useCallback((pattern: Pattern) => {
    const bias: BoardBias = pattern === 'short' ? { type: 'none' } : { type: 'pattern', pattern };
    startPractice(bias, `${pattern.toUpperCase()} pattern`, null);
  }, [startPractice]);

  // From BlindSpotDashboard (data-driven)
  const handleBlindSpotPractice = useCallback((spot: BlindSpot) => {
    startPractice(blindSpotToBias(spot), spot.label, blindSpotHint(spot));
  }, [startPractice]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-4">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Boggle Trainer
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Build pattern recognition, not just word lists
          </p>
        </div>

        {/* IDLE */}
        {state.phase === 'idle' && (
          <div className="flex flex-col items-center gap-5 mt-16">
            <p className="text-slate-600 text-center max-w-sm">
              You have <strong>3 minutes</strong> to find as many words as possible.
              After the round, your misses are saved and analysed to surface your real blind spots.
            </p>
            {state.loadError && (
              <p className="text-red-500 text-sm">Error: {state.loadError}</p>
            )}
            <button
              onClick={startGame}
              className="px-8 py-4 bg-blue-500 text-white rounded-2xl font-bold text-xl
                         hover:bg-blue-600 transition-colors shadow-lg cursor-pointer"
            >
              Start game
            </button>
            {hasHistory && (
              <button
                onClick={() => dispatch({ type: 'SHOW_ANALYSIS' })}
                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold
                           hover:bg-slate-200 transition-colors cursor-pointer"
              >
                My Blind Spots →
              </button>
            )}
          </div>
        )}

        {/* LOADING */}
        {state.phase === 'loading' && (
          <div className="flex flex-col items-center gap-4 mt-20">
            <div className="w-10 h-10 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-slate-500">Loading dictionary…</p>
          </div>
        )}

        {/* PLAYING / PRACTICE */}
        {(state.phase === 'playing' || state.phase === 'practice') && (
          <div className="flex flex-col items-center gap-6">
            {/* Practice banner */}
            {state.phase === 'practice' && state.practiceLabel && (
              <div className="w-full max-w-sm space-y-1">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2
                                text-amber-800 text-sm font-semibold text-center">
                  Practice: <span className="font-bold">{state.practiceLabel}</span>
                </div>
                {state.practiceHint && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2
                                  text-blue-700 text-xs text-center">
                    Tip: {state.practiceHint}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-6">
              <Timer seconds={state.timeLeft} />
              <button
                onClick={finishRound}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold
                           hover:bg-slate-300 transition-colors text-sm cursor-pointer"
              >
                End round
              </button>
            </div>

            <BoggleBoard board={state.board} />
            <WordInput onSubmit={handleWordSubmit} />
            <FoundWords
              foundWords={state.foundWords}
              invalidWords={state.invalidWords}
              totalScore={scoreWords(state.foundWords)}
            />
          </div>
        )}

        {/* RESULTS */}
        {state.phase === 'results' && state.result && (
          <Results
            result={state.result}
            onNewGame={() => dispatch({ type: 'RESET' })}
            onPractice={handlePatternPractice}
            onViewBlindSpots={() => dispatch({ type: 'SHOW_ANALYSIS' })}
          />
        )}

        {/* ANALYSIS */}
        {state.phase === 'analysis' && (
          <BlindSpotDashboard
            onPractice={handleBlindSpotPractice}
            onBack={() => dispatch({ type: 'RESET' })}
          />
        )}
      </div>
    </main>
  );
}
