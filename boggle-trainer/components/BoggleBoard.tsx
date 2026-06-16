'use client';

import type { Board } from '@/lib/board';

interface Props {
  board: Board;
  highlightLetters?: Set<string>;
}

export default function BoggleBoard({ board, highlightLetters }: Props) {
  if (!board.length) return null;

  return (
    <div className="inline-grid grid-cols-4 gap-2">
      {board.flat().map((letter, i) => {
        const isHighlighted = highlightLetters?.has(letter.toUpperCase());
        return (
          <div
            key={i}
            className={[
              'w-16 h-16 flex items-center justify-center rounded-xl text-2xl font-bold',
              'shadow-md select-none transition-colors duration-200',
              isHighlighted
                ? 'bg-amber-400 text-white shadow-amber-300'
                : 'bg-white text-slate-800 border border-slate-200',
            ].join(' ')}
          >
            {letter === 'Q' ? 'Qu' : letter}
          </div>
        );
      })}
    </div>
  );
}
