export type Board = string[][];
export type Pattern =
  | 'short'
  | 'plural'
  | 'past'
  | 'er'
  | 'ing'
  | 're'
  | 'un'
  | 'de'
  | 'in';

// Classic 4x4 Boggle dice (16 dice, each with 6 faces)
const BOGGLE_DICE = [
  'AAEEGN', 'ABBBOO', 'ACHOPS', 'AFFKPS',
  'AOOTTW', 'CIMOTU', 'DEILRX', 'DELRVY',
  'DISTTY', 'EEGHNW', 'EEINSU', 'EHRTVW',
  'EIOSST', 'ELRTTY', 'HIMNQU', 'HLNNRZ',
];

// Letters useful for each pattern (used in practice mode)
const PATTERN_LETTERS: Record<Pattern, string[]> = {
  short:  [],
  plural: ['S', 'S', 'S'],
  past:   ['E', 'D'],
  er:     ['E', 'R'],
  ing:    ['I', 'N', 'G'],
  re:     ['R', 'E'],
  un:     ['U', 'N'],
  de:     ['D', 'E'],
  in:     ['I', 'N'],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rollDie(faces: string): string {
  return faces[Math.floor(Math.random() * faces.length)];
}

export function generateBoard(biasPattern?: Pattern): Board {
  let dice = shuffle([...BOGGLE_DICE]);

  if (biasPattern && biasPattern !== 'short') {
    const needed = PATTERN_LETTERS[biasPattern];
    // Replace the letters on the first N dice to guarantee they include pattern letters
    for (let i = 0; i < Math.min(needed.length, dice.length); i++) {
      // Force this die to show the needed letter by injecting it
      dice[i] = needed[i].repeat(6); // simple: whole die = that letter
    }
    // Re-shuffle so forced letters aren't always in top-left
    dice = shuffle(dice);
  }

  const letters = dice.map(rollDie);
  return [
    letters.slice(0, 4),
    letters.slice(4, 8),
    letters.slice(8, 12),
    letters.slice(12, 16),
  ];
}
