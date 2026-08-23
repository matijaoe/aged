import { armor } from "age-encryption";
import { describe, expect, test } from "vite-plus/test";

import {
  decryptWithPassphrase,
  encryptWithPassphrase,
  NotAgeFileError,
  WrongPassphraseError,
} from "./core";
import { detectAgeFormat } from "./detect";

// scrypt at work factor 18 costs ~1s per operation; keep this file to a
// handful of operations. CLI interop is covered by scripts/verify-against-age-cli.ts.
describe("core round trip", () => {
  const passphrase = "correct horse battery staple";
  const plaintext = new TextEncoder().encode("attack at dawn \u{1F511}");

  test("encrypt → decrypt round-trips, and error classification holds", async () => {
    const ciphertext = await encryptWithPassphrase(plaintext, passphrase);
    expect(detectAgeFormat(ciphertext)).toBe("binary");

    expect(await decryptWithPassphrase(ciphertext, passphrase)).toEqual(plaintext);

    // Armored input decrypts through the same entry point.
    const armored = new TextEncoder().encode(armor.encode(ciphertext));
    expect(detectAgeFormat(armored)).toBe("armored");
    expect(await decryptWithPassphrase(armored, passphrase)).toEqual(plaintext);

    // Wrong passphrase and non-age input map to their typed errors. This
    // pins the coupling to typage's error message strings, so a dependency
    // bump that rewords them fails here instead of degrading the UX.
    await expect(decryptWithPassphrase(ciphertext, "wrong")).rejects.toBeInstanceOf(
      WrongPassphraseError,
    );
    await expect(
      decryptWithPassphrase(new TextEncoder().encode("not an age file"), passphrase),
    ).rejects.toBeInstanceOf(NotAgeFileError);
  }, 30_000);
});
