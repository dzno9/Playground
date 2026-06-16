'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { gameReducer, initialState } from '@/store/game';
import { generateBoard, type Pattern } from '@/lib/board';
import { loadDictionary, isValidWord } from '@/lib/dictionary';
import { canFormWord, findAllWords } from '@/lib/validator';
import { groupByPattern } from '@/lib/patterns';
import { scoreWords } from '@/lib/scoring';
import BoggleBoard from '@/components/BoggleBoard';
import Timer from '@/components/Timer';
import WordInput from '@/components/WordInput';
import FoundWords from '@/components/FoundWords';
import Results from '@/components/Results';
import type { Trie } from '@/lib/trie';

export default function Home() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trieRef = useRef<Trie | null>(null);
  const stateRef = useRef(state);

  // Keep stateRef in sync so finishRound never reads stale values
  useEffect(() => { stateRef.current = state; });

  // Preload dictionary on mount
  useEffect(() => {
    loadDictionary().then(({ trie }) => {
      trieRef.current = trie;
    });
  }, []);

  // Manage the countdown interval
  useEffect(() => {
    if (state.phase !== 'playing' && state.phase !== 'practice') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.phase]);

  // Auto-end when time runs out
  useEffect(() => {
    if ((state.phase === 'playing' || state.phase === 'practice') && state.timeLeft === 0) {
      finishRound();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.timeLeft, state.phase]);

  const startGame = useCallback(async (biasPattern?: Pattern) => {
    dispatch({ type: 'LOADING' });
    try {
      const { trie } = await loadDictionary();
      trieRef.current = trie;
      const board = generateBoard(biasPattern);
      const allValidWords = findAllWords(board, trie);

      if (biasPattern) {
        dispatch({ type: 'START_PRACTICE', pattern: biasPattern, board, allValidWords });
      } else {
        dispatch({ type: 'START', board, allValidWords });
      }
    } catch (e) {
      dispatch({ type: 'LOAD_ERROR', message: String(e) });
    }
  }, []);

  const finishRound = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'playing' && s.phase !== 'practice') return;
    const missed = s.allValidWords.filter((w) => !s.foundWords.includes(w));
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
    const onBoard = canFormWord(state.board, w);
    const valid = isValidWord(w);
    dispatch({ type: 'SUBMIT_WORD', word: w, valid, onBoard });
  }, [state.board]);

  const handlePractice = useCallback((pattern: Pattern) => {
    startGame(pattern);
  }, [startGame]);

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
          <div className="flex flex-col items-center gap-6 mt-16">
            <p className="text-slate-600 text-center max-w-sm">
              You have <strong>3 minutes</strong> to find as many words as possible on a 4×4 board.
              After the round, see which patterns you missed and practice them.
            </p>
            {state.loadError && (
              <p className="text-red-500 text-sm">Error: {state.loadError}</p>
            )}
            <button
              onClick={() => startGame()}
              className="px-8 py-4 bg-blue-500 text-white rounded-2xl font-bold text-xl
                         hover:bg-blue-600 transition-colors shadow-lg cursor-pointer"
            >
              Start game
            </button>
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
            {state.phase === 'practice' && state.practicePattern && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2
                              text-amber-800 text-sm font-semibold">
                Practice mode — board biased toward{' '}
                <span className="font-bold uppercase">{state.practicePattern}</span> pattern
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
            onPractice={handlePractice}
          />
        )}
      </div>
    </main>
  );
}
