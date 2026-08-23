import { armor, Decrypter, Encrypter } from "age-encryption";

import { detectAgeFormat } from "./detect";

/**
 * Pure passphrase encrypt/decrypt on top of age-encryption (typage).
 *
 * This module is environment-agnostic: the web worker wraps it for the UI,
 * and the CLI verification script runs it directly under bun. Keep it free
 * of DOM and worker APIs.
 *
 * The scrypt work factor stays at the library default (18), matching the
 * age CLI. It is intentionally not configurable from the outside.
 */

/** Thrown when a ciphertext cannot be opened with the given passphrase. */
export class WrongPassphraseError extends Error {
  constructor() {
    super("The passphrase does not match this file.");
    this.name = "WrongPassphraseError";
  }
}

/** Thrown when the input is not a valid age file at all. */
export class NotAgeFileError extends Error {
  constructor() {
    super("This is not an age-encrypted file.");
    this.name = "NotAgeFileError";
  }
}

export async function encryptWithPassphrase(
  plaintext: Uint8Array,
  passphrase: string,
  armored = false,
): Promise<Uint8Array> {
  const encrypter = new Encrypter();
  encrypter.setPassphrase(passphrase);
  const binary = await encrypter.encrypt(plaintext);
  if (!armored) {
    return binary;
  }
  // Returned as bytes rather than a string so the download and worker paths
  // stay one shape regardless of format.
  return new TextEncoder().encode(armor.encode(binary));
}

export async function decryptWithPassphrase(
  ciphertext: Uint8Array,
  passphrase: string,
): Promise<Uint8Array> {
  const decrypter = new Decrypter();
  decrypter.addPassphrase(passphrase);
  try {
    const binary =
      detectAgeFormat(ciphertext) === "armored"
        ? armor.decode(new TextDecoder().decode(ciphertext))
        : ciphertext;
    return await decrypter.decrypt(binary, "uint8array");
  } catch (error) {
    throw classifyDecryptError(error);
  }
}

function classifyDecryptError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error(String(error));
  }
  // typage throws this exact message when the scrypt stanza is present but
  // the passphrase-derived key fails to unwrap the file key.
  if (error.message.includes("no identity matched")) {
    return new WrongPassphraseError();
  }
  if (
    error.message.includes("invalid header") ||
    error.message.includes("invalid stanza") ||
    error.message.includes("invalid version")
  ) {
    return new NotAgeFileError();
  }
  return error;
}
