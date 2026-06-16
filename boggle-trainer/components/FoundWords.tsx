'use client';

import { scoreWord } from '@/lib/scoring';

interface Props {
  foundWords: string[];
  invalidWords: string[];
  totalScore: number;
}

export default function FoundWords({ foundWords, invalidWords, totalScore }: Props) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-slate-700">Found ({foundWords.length})</h3>
          <span className="text-blue-600 font-bold text-lg">{totalScore} pts</span>
        </div>
        <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
          {foundWords.length === 0 && (
            <p className="text-slate-400 text-sm">No words yet…</p>
          )}
          {[...foundWords].reverse().map((w) => (
            <span
              key={w}
              className="bg-green-100 text-green-800 text-sm font-semibold px-2 py-0.5 rounded-md"
              title={`${scoreWord(w)} pt${scoreWord(w) !== 1 ? 's' : ''}`}
            >
              {w.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {invalidWords.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
          <h3 className="font-bold text-red-600 mb-2">Invalid ({invalidWords.length})</h3>
          <div className="flex flex-wrap gap-1">
            {invalidWords.map((w) => (
              <span
                key={w}
                className="bg-red-100 text-red-700 text-sm font-semibold px-2 py-0.5 rounded-md line-through"
              >
                {w.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
