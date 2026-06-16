export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEnd = false;
  word = '';
}

export class Trie {
  root = new TrieNode();

  insert(word: string) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, new TrieNode());
      node = node.children.get(ch)!;
    }
    node.isEnd = true;
    node.word = word;
  }

  hasPrefix(prefix: string): boolean {
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch)!;
    }
    return true;
  }
}

export function buildTrie(words: string[]): Trie {
  const trie = new Trie();
  for (const w of words) trie.insert(w);
  return trie;
}
