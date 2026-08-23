import { describe, expect, test } from "vite-plus/test";

import { decryptedName, encryptedName, textFileName } from "./filename";

describe("encryptedName", () => {
  test("appends .age to a file name", () => {
    expect(encryptedName("report.pdf")).toBe("report.pdf.age");
  });

  test("typed text becomes message.txt.age", () => {
    expect(encryptedName(null)).toBe(`${textFileName}.age`);
  });
});

describe("decryptedName", () => {
  test("strips the .age suffix", () => {
    expect(decryptedName("report.pdf.age")).toEqual({ name: "report.pdf", fellBack: false });
  });

  test("is case-insensitive about the suffix", () => {
    expect(decryptedName("REPORT.PDF.AGE")).toEqual({ name: "REPORT.PDF", fellBack: false });
  });

  test("strips only one suffix from a double .age name", () => {
    expect(decryptedName("a.age.age")).toEqual({ name: "a.age", fellBack: false });
  });

  test("falls back when there is nothing to strip", () => {
    expect(decryptedName("report.pdf")).toEqual({ name: "decrypted", fellBack: true });
    expect(decryptedName(null)).toEqual({ name: "decrypted", fellBack: true });
  });

  test("falls back when stripping would leave an empty name", () => {
    expect(decryptedName(".age")).toEqual({ name: "decrypted", fellBack: true });
  });
});
