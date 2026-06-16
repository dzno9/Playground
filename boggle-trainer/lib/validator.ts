import type { Board } from './board';
import type { Trie, TrieNode } from './trie';

const ROWS = 4;
const COLS = 4;

const NEIGHBORS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0,  -1],          [0,  1],
  [1,  -1], [1,  0], [1,  1],
];

/** Check if a specific word can be traced on the board. */
export function canFormWord(board: Board, word: string): boolean {
  const w = word.toLowerCase();
  if (w.length < 3) return false;

  function dfs(r: number, c: number, idx: number, visited: number[]): boolean {
    if (idx === w.length) return true;
    for (const [dr, dc] of NEIGHBORS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const npos = nr * COLS + nc;
      if (visited.includes(npos)) continue;
      if (board[nr][nc].toLowerCase() !== w[idx]) continue;
      visited.push(npos);
      if (dfs(nr, nc, idx + 1, visited)) return true;
      visited.pop();
    }
    return false;
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].toLowerCase() === w[0]) {
        if (dfs(r, c, 1, [r * COLS + c])) return true;
      }
    }
  }
  return false;
}

/** Find every word in the trie that can be traced on the board. */
export function findAllWords(board: Board, trie: Trie): string[] {
  const found = new Set<string>();

  function dfs(r: number, c: number, node: TrieNode, visited: number[]) {
    const ch = board[r][c].toLowerCase();
    const next = node.children.get(ch);
    if (!next) return;

    if (next.isEnd && next.word.length >= 3) found.add(next.word);

    const pos = r * COLS + c;
    visited.push(pos);

    for (const [dr, dc] of NEIGHBORS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const npos = nr * COLS + nc;
      if (!visited.includes(npos)) {
        dfs(nr, nc, next, visited);
      }
    }

    visited.pop();
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      dfs(r, c, trie.root, []);
    }
  }

  return Array.from(found).sort();
}
