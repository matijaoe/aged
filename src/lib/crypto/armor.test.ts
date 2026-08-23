import { armor } from "age-encryption";
import { describe, expect, test } from "vite-plus/test";

import { armorBytes, armorText } from "./armor";

const decoder = new TextDecoder();

/** Deterministic bytes, so a failure reproduces from the size alone. */
function bytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = i % 256;
  }
  return out;
}

// The encoder here is ours, not typage's, so the whole of its correctness is
// "typage would have written exactly this". These sizes are where it could
// differ: either side of a 48-byte line, and every base64 remainder (0, 1, 2
// bytes left over) at the end of one.
const sizes = [
  0, 1, 2, 3, 4, 5, 6, 46, 47, 48, 49, 50, 51, 94, 95, 96, 97, 143, 144, 145, 191, 192, 193,
  // Larger and irregular, including a size that lands on nothing in particular.
  1000, 4096, 65_535, 65_536, 100_003,
];

describe("armor", () => {
  test("is byte-for-byte typage's armor.encode", () => {
    for (const size of sizes) {
      const input = bytes(size);
      expect(armorText(input), `armorText(${size})`).toBe(armor.encode(input));
    }
  });

  test("armorBytes is the UTF-8 of the same text", () => {
    for (const size of sizes) {
      const input = bytes(size);
      expect(decoder.decode(armorBytes(input)), `armorBytes(${size})`).toBe(armor.encode(input));
    }
  });

  test("typage decodes it back to the input", () => {
    for (const size of sizes) {
      const input = bytes(size);
      expect(armor.decode(armorText(input)), `round trip ${size}`).toEqual(input);
    }
  });

  test("the framing is PEM with a final newline", () => {
    const text = armorText(bytes(100));
    const lines = text.split("\n");

    expect(lines[0]).toBe("-----BEGIN AGE ENCRYPTED FILE-----");
    expect(lines.at(-2)).toBe("-----END AGE ENCRYPTED FILE-----");
    // Nothing after the footer's newline: `at(-1)` is the empty tail of the
    // split, which is the assertion that the file ends in exactly one.
    expect(lines.at(-1)).toBe("");
    // 100 bytes is two full lines and a 4-byte remainder.
    expect(lines.slice(1, -2).map((line) => line.length)).toEqual([64, 64, 8]);
  });

  test("an empty input is the framing and nothing else", () => {
    expect(armorText(new Uint8Array(0))).toBe(
      "-----BEGIN AGE ENCRYPTED FILE-----\n-----END AGE ENCRYPTED FILE-----\n",
    );
  });

  test("reads a view at an offset, not the buffer under it", () => {
    // Ciphertext reaches here as whatever slice the caller has; indexing the
    // backing buffer instead of the view would silently armor the wrong bytes.
    const backing = bytes(200);
    const view = backing.subarray(51, 149);
    expect(armorText(view)).toBe(armor.encode(view));
  });
});
