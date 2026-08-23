import { bip39Words } from "./wordlist";

/**
 * Passphrase generation and strength estimation.
 *
 * Generation mirrors `age -p`: random words from the BIP39 English wordlist,
 * drawn with `crypto.getRandomValues` using rejection sampling so any
 * wordlist length stays unbiased. The separator differs from the CLI's "-"
 * by design; both it and the word count are parameters because wordlist and
 * format options are planned.
 */

export interface PassphraseOptions {
  /** Number of words. 10 words from a 2048-word list is ~110 bits. */
  wordCount?: number;
  separator?: string;
  wordlist?: readonly string[];
}

export const defaultPassphraseOptions = {
  wordCount: 10,
  separator: " ",
  wordlist: bip39Words,
} as const satisfies Required<PassphraseOptions>;

export function generatePassphrase(options: PassphraseOptions = {}): string {
  const { wordCount, separator, wordlist } = {
    ...defaultPassphraseOptions,
    ...options,
  };
  // Validate before sampling: randomIndex(0) would otherwise spin forever.
  if (wordlist.length === 0) {
    throw new Error("wordlist must not be empty");
  }
  if (!Number.isInteger(wordCount) || wordCount <= 0) {
    throw new Error("wordCount must be a positive integer");
  }
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const word = wordlist[randomIndex(wordlist.length)];
    if (word === undefined) {
      throw new Error("wordlist must not be empty");
    }
    words.push(word);
  }
  return words.join(separator);
}

/**
 * Uniform random integer in [0, bound) via rejection sampling, so word
 * selection carries no modulo bias for wordlists of any length.
 */
function randomIndex(bound: number): number {
  const limit = Math.floor(0x1_0000_0000 / bound) * bound;
  const sample = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(sample);
    const value = sample[0] as number;
    if (value < limit) {
      return value % bound;
    }
  }
}

/**
 * Rough entropy estimate for a passphrase, in bits.
 *
 * A phrase made entirely of wordlist words is scored as words × log2(list
 * size) — what it actually carries if it was generated. Anything else gets
 * the naive length × log2(character pool) estimate. Both are upper bounds;
 * the meter treats them accordingly.
 */
export function estimateEntropyBits(
  passphrase: string,
  wordlist: readonly string[] = bip39Words,
): number {
  const words = passphrase.trim().split(/\s+/);
  const set = wordlistSet(wordlist);
  if (words.length > 1 && words.every((word) => set.has(word.toLowerCase()))) {
    return words.length * Math.log2(wordlist.length);
  }
  let pool = 0;
  if (/[a-z]/.test(passphrase)) {
    pool += 26;
  }
  if (/[A-Z]/.test(passphrase)) {
    pool += 26;
  }
  if (/[0-9]/.test(passphrase)) {
    pool += 10;
  }
  if (/[^a-zA-Z0-9]/.test(passphrase)) {
    pool += 33;
  }
  if (pool === 0) {
    return 0;
  }
  return passphrase.length * Math.log2(pool);
}

let cachedSet: { source: readonly string[]; set: Set<string> } | null = null;

function wordlistSet(wordlist: readonly string[]): Set<string> {
  if (cachedSet?.source !== wordlist) {
    cachedSet = { source: wordlist, set: new Set(wordlist) };
  }
  return cachedSet.set;
}
