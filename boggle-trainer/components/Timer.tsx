'use client';

interface Props {
  seconds: number;
}

export default function Timer({ seconds }: Props) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const isUrgent = seconds <= 30;

  return (
    <div
      className={[
        'text-4xl font-mono font-bold tabular-nums',
        isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-700',
      ].join(' ')}
    >
      {m}:{s.toString().padStart(2, '0')}
    </div>
  );
}
