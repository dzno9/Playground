'use client';

import { useEffect, useRef } from 'react';
import type { RoundResult } from '@/store/game';
import type { Pattern } from '@/lib/board';
import { scoreWord } from '@/lib/scoring';
import { buildRoundRecord, saveRound } from '@/lib/history';
import PatternGroups from './PatternGroups';

interface Props {
  result: RoundResult;
  onNewGame: () => void;
  onPractice: (pattern: Pattern) => void;
  onViewBlindSpots: () => void;
}

export default function Results({ result, onNewGame, onPractice, onViewBlindSpots }: Props) {
  const { foundWords, missedWords, invalidWords, score, maxScore, patternGroups } = result;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const savedRef = useRef(false);

  // Save this round to localStorage exactly once when the results screen mounts
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    const record = buildRoundRecord({
      board: result.board,
      foundWords,
      missedWords,
      invalidWords,
      score,
      maxScore,
    });
    saveRound(record);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Score header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
        <p className="text-slate-500 text-sm font-medium mb-1">Round complete</p>
        <p className="text-5xl font-bold text-slate-800">
          {score} <span className="text-slate-400 text-2xl">/ {maxScore} pts</span>
        </p>
        <p className="text-slate-500 text-sm mt-1">{pct}% of available points</p>
        <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Word breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <WordList title="You found" words={foundWords} color="green" />
        <WordList title="You missed" words={missedWords} color="amber" />
        <WordList title="Invalid" words={invalidWords} color="red" />
      </div>

      {/* Per-round pattern groups — suffix/prefix as secondary, not prescribed */}
      {patternGroups.length > 0 && (
        <PatternGroups groups={patternGroups} onPractice={onPractice} />
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onNewGame}
          className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold text-lg
                     hover:bg-blue-600 transition-colors shadow-sm cursor-pointer"
        >
          New game
        </button>
        <button
          onClick={onViewBlindSpots}
          className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-lg
                     hover:bg-slate-200 transition-colors shadow-sm cursor-pointer"
        >
          My Blind Spots →
        </button>
      </div>
    </div>
  );
}

function WordList({
  title,
  words,
  color,
}: {
  title: string;
  words: string[];
  color: 'green' | 'amber' | 'red';
}) {
  const clr = {
    green: { card: 'border-green-200', header: 'text-green-700', badge: 'bg-green-100 text-green-800' },
    amber: { card: 'border-amber-200', header: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
    red:   { card: 'border-red-200',   header: 'text-red-700',   badge: 'bg-red-100   text-red-700'  },
  }[color];

  return (
    <div className={`bg-white rounded-xl border ${clr.card} shadow-sm p-4`}>
      <h4 className={`font-bold text-sm mb-2 ${clr.header}`}>
        {title} ({words.length})
      </h4>
      <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
        {words.length === 0 && <p className="text-slate-400 text-xs">None</p>}
        {words.map((w) => (
          <span
            key={w}
            title={`${scoreWord(w)} pt${scoreWord(w) !== 1 ? 's' : ''}`}
            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${clr.badge}`}
          >
            {w.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
