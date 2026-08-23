/**
 * age file detection by header sniffing.
 *
 * Binary age files start with the version line "age-encryption.org/v1";
 * armored ones with "-----BEGIN AGE ENCRYPTED FILE-----". Both markers are
 * what typage itself checks for, so detection and decryption agree.
 */

const BINARY_MAGIC = "age-encryption.org/v1";
const ARMOR_BEGIN = "-----BEGIN AGE ENCRYPTED FILE-----";

export type AgeFormat = "binary" | "armored";

export function detectAgeFormat(bytes: Uint8Array): AgeFormat | null {
  const head = new TextDecoder().decode(bytes.slice(0, 256));
  if (head.startsWith(BINARY_MAGIC)) {
    return "binary";
  }
  if (head.trimStart().startsWith(ARMOR_BEGIN)) {
    return "armored";
  }
  return null;
}

export function isAgeFile(bytes: Uint8Array): boolean {
  return detectAgeFormat(bytes) !== null;
}
