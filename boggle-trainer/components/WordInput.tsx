'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface Props {
  onSubmit: (word: string) => void;
  disabled?: boolean;
}

export default function WordInput({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const word = value.trim();
    if (word.length >= 3) onSubmit(word);
    setValue('');
    inputRef.current?.focus();
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="flex gap-2 w-full max-w-sm">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        onKeyDown={handleKey}
        disabled={disabled}
        placeholder="Type a word…"
        autoFocus
        className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-300 focus:border-blue-400
                   outline-none text-lg font-semibold text-slate-800 uppercase tracking-widest
                   disabled:opacity-40"
      />
      <button
        onClick={submit}
        disabled={disabled || value.trim().length < 3}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600
                   disabled:opacity-40 transition-colors"
      >
        Add
      </button>
    </div>
  );
}
