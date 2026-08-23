import { describe, expect, test } from "vite-plus/test";

import { classifyPassphraseText, looksLikeText, readPassphraseFile } from "./passphrase-file";

const encode = (text: string) => new TextEncoder().encode(text);
const messageOf = (result: { ok: boolean } & Record<string, unknown>) =>
  result.ok ? "" : String(result.message);

describe("looksLikeText", () => {
  test("accepts UTF-8, including a character split by the sample boundary", () => {
    expect(looksLikeText(encode("correct horse"))).toBe(true);
    // "é" is two bytes; only the first one is sampled.
    expect(looksLikeText(encode("café").slice(0, 4))).toBe(true);
  });

  test("rejects a PNG header and anything carrying a NUL", () => {
    expect(looksLikeText(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      false,
    );
    expect(looksLikeText(new Uint8Array([0x61, 0x00, 0x62]))).toBe(false);
  });
});

describe("classifyPassphraseText", () => {
  test("takes a plain line, minus the newline an editor adds", () => {
    expect(classifyPassphraseText(encode("correct horse battery\n"), "key.txt")).toEqual({
      ok: true,
      passphrase: "correct horse battery",
      name: "key.txt",
    });
  });

  test("refuses a file with nothing but whitespace", () => {
    expect(messageOf(classifyPassphraseText(encode("  \n\n"), "empty.txt"))).toContain("empty");
  });
});

describe("readPassphraseFile", () => {
  test("names a binary file for what it is, not for its size", async () => {
    const png = new Uint8Array(3 * 1024 * 1024);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = await readPassphraseFile(new File([png], "preview.png", { type: "image/png" }));
    expect(messageOf(result)).toContain("isn't a text file");
    expect(messageOf(result)).not.toContain("big");
  });

  test("refuses an age file, which was meant as the input", async () => {
    const armored = "-----BEGIN AGE ENCRYPTED FILE-----\nYWdlLWVu\n";
    const result = await readPassphraseFile(new File([armored], "secret.age"));
    expect(messageOf(result)).toContain("age file");
  });

  test("refuses text that is too long to be a passphrase", async () => {
    const result = await readPassphraseFile(new File(["a".repeat(5000)], "notes.txt"));
    expect(messageOf(result)).toContain("too long");
  });

  test("accepts the file aged itself writes", async () => {
    const result = await readPassphraseFile(
      new File(["topple defy maze arch raise"], "out.age.passphrase.txt"),
    );
    expect(result).toMatchObject({ ok: true, passphrase: "topple defy maze arch raise" });
  });
});
