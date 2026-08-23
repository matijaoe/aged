import { describe, expect, test } from "vite-plus/test";

import { detectAgeFormat, isAgeFile } from "./detect";

const encode = (text: string) => new TextEncoder().encode(text);

describe("detectAgeFormat", () => {
  test("recognizes the binary header", () => {
    expect(detectAgeFormat(encode("age-encryption.org/v1\n-> scrypt ..."))).toBe("binary");
  });

  test("recognizes an armored file, including leading whitespace", () => {
    const armored = "-----BEGIN AGE ENCRYPTED FILE-----\nYWdl\n-----END AGE ENCRYPTED FILE-----";
    expect(detectAgeFormat(encode(armored))).toBe("armored");
    expect(detectAgeFormat(encode("\n  " + armored))).toBe("armored");
  });

  test("rejects near misses and truncated headers", () => {
    expect(detectAgeFormat(encode("age-encryption.org/v"))).toBeNull();
    expect(detectAgeFormat(encode("AGE-ENCRYPTION.ORG/V1"))).toBeNull();
    expect(detectAgeFormat(encode("-----BEGIN PGP MESSAGE-----"))).toBeNull();
  });

  test("handles empty and non-UTF-8 input without throwing", () => {
    expect(detectAgeFormat(new Uint8Array(0))).toBeNull();
    expect(detectAgeFormat(new Uint8Array([0xff, 0xfe, 0x00, 0x80]))).toBeNull();
  });

  test("isAgeFile mirrors detection", () => {
    expect(isAgeFile(encode("age-encryption.org/v1"))).toBe(true);
    expect(isAgeFile(encode("plain text"))).toBe(false);
  });
});
