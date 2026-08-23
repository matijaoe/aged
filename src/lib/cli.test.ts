import { describe, expect, test } from "vite-plus/test";

import { cliCommand, namesOneFile } from "./cli";

describe("cliCommand", () => {
  test("encrypt with a plain name", () => {
    expect(cliCommand("encrypt", "report.pdf")).toBe("age -p -o report.pdf.age report.pdf");
  });

  test("decrypt derives the stripped output name", () => {
    expect(cliCommand("decrypt", "report.pdf.age")).toBe("age -d -o report.pdf report.pdf.age");
  });

  test("uses generic placeholders when nothing is loaded", () => {
    expect(cliCommand("encrypt", null)).toBe("age -p -o file.age file");
    expect(cliCommand("decrypt", null)).toBe("age -d -o file file.age");
  });

  test("armoring adds -a, and only when encrypting", () => {
    expect(cliCommand("encrypt", "notes.txt", null, true)).toBe(
      "age -p -a -o notes.txt.age notes.txt",
    );
    expect(cliCommand("decrypt", "notes.txt.age", null, true)).toBe(
      "age -d -o notes.txt notes.txt.age",
    );
  });

  test("an explicit output name wins", () => {
    expect(cliCommand("decrypt", "x.age", "notes.txt")).toBe("age -d -o notes.txt x.age");
  });

  test("quotes names with spaces and apostrophes", () => {
    expect(cliCommand("encrypt", "my file.txt")).toBe("age -p -o 'my file.txt.age' 'my file.txt'");
    expect(cliCommand("encrypt", "it's.txt")).toBe("age -p -o 'it'\\''s.txt.age' 'it'\\''s.txt'");
  });

  test("protects names starting with a dash from flag parsing", () => {
    expect(cliCommand("encrypt", "-t.txt")).toBe("age -p -o ./-t.txt.age ./-t.txt");
    expect(cliCommand("encrypt", "--help")).toBe("age -p -o ./--help.age ./--help");
  });

  test("replaces control characters instead of emitting them", () => {
    const command = cliCommand("encrypt", "bad\nname.txt");
    expect(command).not.toContain("\n");
    expect(command).toContain("?");
  });
});

describe("namesOneFile", () => {
  test("derived names never collide", () => {
    expect(namesOneFile("encrypt", "report.pdf")).toBe(false);
    expect(namesOneFile("decrypt", "report.pdf.age")).toBe(false);
  });

  test("dropping the pinned suffix lands on the input's own name", () => {
    expect(namesOneFile("encrypt", "report.pdf", "report.pdf")).toBe(true);
    expect(namesOneFile("decrypt", "report.pdf.age", "report.pdf.age")).toBe(true);
  });

  test("a file named `decrypted` collides with the fallback name", () => {
    expect(namesOneFile("decrypt", "decrypted")).toBe(true);
  });

  test("a control character renders as the same token a literal ? does", () => {
    // shellName replaces control characters with "?", so these two names
    // reach the shell as one and the same command.
    expect(namesOneFile("encrypt", "a\u0001b", "a?b")).toBe(true);
    expect(namesOneFile("encrypt", "ab", "a?b")).toBe(false);
  });
});
