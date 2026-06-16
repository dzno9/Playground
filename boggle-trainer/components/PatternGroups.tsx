'use client';

import type { PatternGroup } from '@/lib/patterns';
import type { Pattern } from '@/lib/board';

interface Props {
  groups: PatternGroup[];
  onPractice: (pattern: Pattern) => void;
}

const PATTERN_COLORS: Record<string, string> = {
  ing:    'bg-purple-50 border-purple-200 text-purple-800',
  past:   'bg-blue-50  border-blue-200  text-blue-800',
  er:     'bg-cyan-50  border-cyan-200  text-cyan-800',
  plural: 'bg-teal-50  border-teal-200  text-teal-800',
  re:     'bg-orange-50 border-orange-200 text-orange-800',
  un:     'bg-yellow-50 border-yellow-200 text-yellow-800',
  de:     'bg-lime-50  border-lime-200  text-lime-800',
  in:     'bg-emerald-50 border-emerald-200 text-emerald-800',
  short:  'bg-pink-50  border-pink-200  text-pink-800',
};

const BADGE_COLORS: Record<string, string> = {
  ing:    'bg-purple-100 text-purple-700',
  past:   'bg-blue-100  text-blue-700',
  er:     'bg-cyan-100  text-cyan-700',
  plural: 'bg-teal-100  text-teal-700',
  re:     'bg-orange-100 text-orange-700',
  un:     'bg-yellow-100 text-yellow-700',
  de:     'bg-lime-100  text-lime-700',
  in:     'bg-emerald-100 text-emerald-700',
  short:  'bg-pink-100  text-pink-700',
};

export default function PatternGroups({ groups, onPractice }: Props) {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-4 w-full">
      <h3 className="text-lg font-bold text-slate-700">Missed word patterns</h3>
      {groups.map((g) => (
        <div
          key={g.pattern}
          className={`rounded-xl border p-4 ${PATTERN_COLORS[g.pattern] ?? 'bg-slate-50 border-slate-200'}`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-bold text-sm">{g.label}</p>
              <p className="text-xs opacity-70">{g.description}</p>
            </div>
            <button
              onClick={() => onPractice(g.pattern)}
              className="shrink-0 text-xs font-semibold bg-white/80 border border-current
                         rounded-lg px-3 py-1.5 hover:bg-white transition-colors"
            >
              Practice →
            </button>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {g.words.map((w) => (
              <span
                key={w}
                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${BADGE_COLORS[g.pattern] ?? ''}`}
              >
                {w.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
