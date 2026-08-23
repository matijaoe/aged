/**
 * Verifies the crypto core against the real age CLI.
 *
 * The age CLI only accepts passphrases from a terminal, so it is driven
 * through `expect`. Run with: bun scripts/verify-against-age-cli.ts
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  decryptWithPassphrase,
  encryptWithPassphrase,
  NotAgeFileError,
  WrongPassphraseError,
} from "../src/lib/crypto/core";
import { detectAgeFormat } from "../src/lib/crypto/detect";
import { generatePassphrase } from "../src/lib/crypto/passphrase";

for (const tool of ["age", "expect"]) {
  if (Bun.spawnSync(["which", tool]).exitCode !== 0) {
    console.error(`This script needs \`${tool}\` on PATH.`);
    process.exit(1);
  }
}

const dir = mkdtempSync(join(tmpdir(), "aged-verify-"));
const passphrase = generatePassphrase();
const plaintext = new TextEncoder().encode(
  "aged CLI interop check \u{1F511} " + "x".repeat(100_000),
);

let failures = 0;

function check(name: string, ok: boolean, detail = ""): void {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) {
    failures++;
  }
}

// Values reach the Tcl script through the environment, never by string
// interpolation into the script text: Tcl's $env() substitution result is
// not re-parsed, so passphrases and paths can contain any character.
function runExpect(script: string, env: Record<string, string>): boolean {
  const result = Bun.spawnSync(["expect", "-c", script], {
    cwd: dir,
    env: { ...process.env, ...env },
  });
  return result.exitCode === 0;
}

function ageDecrypt(inFile: string, outFile: string, pass: string): boolean {
  return runExpect(
    `
    spawn age -d -o $env(AGED_OUT) $env(AGED_IN)
    expect "Enter passphrase*"
    send -- "$env(AGED_PASS)\\r"
    expect eof
    catch wait result
    exit [lindex $result 3]
    `,
    { AGED_IN: inFile, AGED_OUT: outFile, AGED_PASS: pass },
  );
}

function ageEncrypt(inFile: string, outFile: string, pass: string, armored: boolean): boolean {
  return runExpect(
    `
    spawn age -p ${armored ? "-a " : ""}-o $env(AGED_OUT) $env(AGED_IN)
    expect "Enter passphrase*"
    send -- "$env(AGED_PASS)\\r"
    expect "Confirm passphrase*"
    send -- "$env(AGED_PASS)\\r"
    expect eof
    catch wait result
    exit [lindex $result 3]
    `,
    { AGED_IN: inFile, AGED_OUT: outFile, AGED_PASS: pass },
  );
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((byte, i) => byte === b[i]);
}

try {
  // 1. Library round trip.
  const libCiphertext = await encryptWithPassphrase(plaintext, passphrase);
  const libRoundTrip = await decryptWithPassphrase(libCiphertext, passphrase);
  check("library encrypt → library decrypt", bytesEqual(libRoundTrip, plaintext));
  check("library output detected as binary age", detectAgeFormat(libCiphertext) === "binary");

  // 2. Library encrypt → age CLI decrypt.
  writeFileSync(join(dir, "lib.age"), libCiphertext);
  const cliDecryptOk = ageDecrypt("lib.age", "lib.out", passphrase);
  check(
    "library encrypt → age CLI decrypt",
    cliDecryptOk && bytesEqual(readFileSync(join(dir, "lib.out")), plaintext),
  );

  // 3. age CLI encrypt (binary) → library decrypt.
  writeFileSync(join(dir, "plain.bin"), plaintext);
  check("age CLI encrypt (binary)", ageEncrypt("plain.bin", "cli.age", passphrase, false));
  const cliBinary = new Uint8Array(readFileSync(join(dir, "cli.age")));
  check("CLI output detected as binary age", detectAgeFormat(cliBinary) === "binary");
  check(
    "age CLI encrypt → library decrypt",
    bytesEqual(await decryptWithPassphrase(cliBinary, passphrase), plaintext),
  );

  // 4. age CLI encrypt (armored) → library decrypt.
  check("age CLI encrypt (armored)", ageEncrypt("plain.bin", "cli-armored.age", passphrase, true));
  const cliArmored = new Uint8Array(readFileSync(join(dir, "cli-armored.age")));
  check("armored output detected as armored age", detectAgeFormat(cliArmored) === "armored");
  check(
    "age CLI armored encrypt → library decrypt",
    bytesEqual(await decryptWithPassphrase(cliArmored, passphrase), plaintext),
  );

  // 5. Error classification.
  check(
    "wrong passphrase → WrongPassphraseError",
    await decryptWithPassphrase(libCiphertext, "not the passphrase").then(
      () => false,
      (error) => error instanceof WrongPassphraseError,
    ),
  );
  check(
    "garbage input → NotAgeFileError",
    await decryptWithPassphrase(new TextEncoder().encode("not an age file"), passphrase).then(
      () => false,
      (error) => error instanceof NotAgeFileError,
    ),
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll checks passed.");
