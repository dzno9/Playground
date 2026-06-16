'use client';

import { useEffect, useState } from 'react';
import { loadHistory, clearHistory } from '@/lib/history';
import { analyzeHistory, type BlindSpot, type BlindSpotType } from '@/lib/analysis';

const TYPE_COLORS: Record<BlindSpotType, string> = {
  start_letter: 'bg-blue-50  border-blue-200  text-blue-800',
  length:       'bg-pink-50  border-pink-200  text-pink-800',
  suffix:       'bg-purple-50 border-purple-200 text-purple-800',
  prefix:       'bg-orange-50 border-orange-200 text-orange-800',
  extension:    'bg-amber-50  border-amber-200  text-amber-800',
  anagram:      'bg-teal-50   border-teal-200   text-teal-800',
};

const TYPE_BADGE: Record<BlindSpotType, string> = {
  start_letter: 'bg-blue-100  text-blue-700',
  length:       'bg-pink-100  text-pink-700',
  suffix:       'bg-purple-100 text-purple-700',
  prefix:       'bg-orange-100 text-orange-700',
  extension:    'bg-amber-100  text-amber-700',
  anagram:      'bg-teal-100   text-teal-700',
};

interface Props {
  onPractice: (spot: BlindSpot) => void;
  onBack: () => void;
}

export default function BlindSpotDashboard({ onPractice, onBack }: Props) {
  const [spots, setSpots] = useState<BlindSpot[]>([]);
  const [roundCount, setRoundCount] = useState(0);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const history = loadHistory();
    setRoundCount(history.length);
    setSpots(analyzeHistory(history));
  }, [cleared]);

  const handleClear = () => {
    clearHistory();
    setCleared(c => !c);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium cursor-pointer"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Blind Spots</h2>
          <p className="text-slate-500 text-xs">
            Based on {roundCount} round{roundCount !== 1 ? 's' : ''} of history
            {roundCount === 0 && ' — play a round to see your patterns'}
          </p>
        </div>
      </div>

      {roundCount === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500">No history yet.</p>
          <p className="text-slate-400 text-sm mt-1">
            Complete a round and come back here to see which patterns you miss most.
          </p>
        </div>
      )}

      {roundCount > 0 && spots.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center text-green-800">
          <p className="font-semibold">No clear blind spots yet.</p>
          <p className="text-sm mt-1">
            Play more rounds — patterns surface once a category has ≥ 3 misses.
          </p>
        </div>
      )}

      {spots.map((spot, i) => (
        <div
          key={spot.id}
          className={`rounded-xl border p-4 ${TYPE_COLORS[spot.type]}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold opacity-50">#{i + 1}</span>
                <p className="font-bold text-sm">{spot.label}</p>
              </div>
              <p className="text-xs opacity-70">{spot.description}</p>
              <p className="text-xs mt-1 opacity-60">
                {spot.missCount} miss{spot.missCount !== 1 ? 'es' : ''} across{' '}
                {spot.roundCount} of {spot.totalRounds} round{spot.totalRounds !== 1 ? 's' : ''}
              </p>
              {spot.examples.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {spot.examples.map(w => (
                    <span
                      key={w}
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${TYPE_BADGE[spot.type]}`}
                    >
                      {w.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onPractice(spot)}
              className="shrink-0 text-xs font-semibold bg-white/80 border border-current
                         rounded-lg px-3 py-1.5 hover:bg-white transition-colors cursor-pointer"
            >
              Practice →
            </button>
          </div>
        </div>
      ))}

      {roundCount > 0 && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            Clear all history
          </button>
        </div>
      )}
    </div>
  );
}
