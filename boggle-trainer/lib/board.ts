export type Board = string[][];

// Pattern is kept for per-round suffix/prefix labelling in PatternGroups
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

// BoardBias controls board generation for practice mode
export type BoardBias =
  | { type: 'pattern'; pattern: Pattern }
  | { type: 'start_letter'; letter: string }
  | { type: 'none' };

// Classic 4x4 Boggle dice (16 dice, each with 6 faces)
const BOGGLE_DICE = [
  'AAEEGN', 'ABBBOO', 'ACHOPS', 'AFFKPS',
  'AOOTTW', 'CIMOTU', 'DEILRX', 'DELRVY',
  'DISTTY', 'EEGHNW', 'EEINSU', 'EHRTVW',
  'EIOSST', 'ELRTTY', 'HIMNQU', 'HLNNRZ',
];

// Letters to force onto dice for each pattern bias
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

export function generateBoard(bias?: BoardBias): Board {
  let dice = shuffle([...BOGGLE_DICE]);

  if (bias && bias.type !== 'none') {
    if (bias.type === 'pattern' && bias.pattern !== 'short') {
      const needed = PATTERN_LETTERS[bias.pattern];
      for (let i = 0; i < Math.min(needed.length, dice.length); i++) {
        dice[i] = needed[i].repeat(6);
      }
      dice = shuffle(dice);
    } else if (bias.type === 'start_letter') {
      // Force 3 dice to always show the target letter
      for (let i = 0; i < 3; i++) {
        dice[i] = bias.letter.repeat(6);
      }
      dice = shuffle(dice);
    }
  }

  const letters = dice.map(rollDie);
  return [
    letters.slice(0, 4),
    letters.slice(4, 8),
    letters.slice(8, 12),
    letters.slice(12, 16),
  ];
}

/** Map a suffix string back to its Pattern for board biasing. */
export function suffixToPattern(suffix: string): Pattern | null {
  const MAP: Record<string, Pattern> = {
    S: 'plural', ED: 'past', ER: 'er', ING: 'ing',
  };
  return MAP[suffix] ?? null;
}

/** Map a prefix string back to its Pattern for board biasing. */
export function prefixToPattern(prefix: string): Pattern | null {
  const MAP: Record<string, Pattern> = {
    RE: 're', UN: 'un', DE: 'de', IN: 'in',
  };
  return MAP[prefix] ?? null;
}
