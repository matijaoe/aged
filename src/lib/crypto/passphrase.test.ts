import { describe, expect, test } from "vite-plus/test";

import {
  defaultPassphraseOptions,
  estimateEntropyBits,
  generatePassphrase,
} from "./passphrase";
import { bip39Words } from "./wordlist";

describe("generatePassphrase", () => {
  test("returns the default word count, all from the wordlist", () => {
    const words = generatePassphrase().split(" ");
    expect(words).toHaveLength(defaultPassphraseOptions.wordCount);
    const set = new Set(bip39Words);
    for (const word of words) {
      expect(set.has(word)).toBe(true);
    }
  });

  test("honors wordCount and separator", () => {
    const phrase = generatePassphrase({ wordCount: 4, separator: "-" });
    expect(phrase.split("-")).toHaveLength(4);
  });

  test("terminates for tiny wordlists", () => {
    for (const wordlist of [["a"], ["a", "b"], ["a", "b", "c"]]) {
      const words = generatePassphrase({ wordCount: 5, wordlist }).split(" ");
      expect(words).toHaveLength(5);
      for (const word of words) {
        expect(wordlist).toContain(word);
      }
    }
  });

  test("draws roughly uniformly", () => {
    const wordlist = ["a", "b", "c"];
    const counts = new Map<string, number>();
    const draws = 30_000;
    const words = generatePassphrase({ wordCount: draws, wordlist }).split(" ");
    for (const word of words) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
    for (const word of wordlist) {
      // Expected 10_000 ± ~5σ; a modulo-bias bug over a 3-word list would
      // skew far beyond this.
      expect(counts.get(word) ?? 0).toBeGreaterThan(9_300);
      expect(counts.get(word) ?? 0).toBeLessThan(10_700);
    }
  });

  test("throws instead of hanging on an empty wordlist", () => {
    expect(() => generatePassphrase({ wordlist: [] })).toThrow("wordlist");
  });

  test("throws on a non-positive or fractional word count", () => {
    expect(() => generatePassphrase({ wordCount: 0 })).toThrow("wordCount");
    expect(() => generatePassphrase({ wordCount: -3 })).toThrow("wordCount");
    expect(() => generatePassphrase({ wordCount: 2.5 })).toThrow("wordCount");
  });
});

describe("estimateEntropyBits", () => {
  test("empty input scores zero", () => {
    expect(estimateEntropyBits("")).toBe(0);
  });

  test("a generated phrase scores wordCount × 11 bits", () => {
    const bits = estimateEntropyBits(generatePassphrase());
    expect(bits).toBeCloseTo(10 * Math.log2(2048), 5);
  });

  test("repeated wordlist words still score as words (documented upper bound)", () => {
    expect(estimateEntropyBits("abandon abandon abandon")).toBeCloseTo(3 * 11, 5);
  });

  test("non-wordlist text falls back to the character-pool estimate", () => {
    // 8 lowercase letters: 8 × log2(26).
    expect(estimateEntropyBits("password")).toBeCloseTo(8 * Math.log2(26), 5);
  });
});
