/**
 * Output filename derivation, mirroring the age CLI's convention:
 * `report.pdf` encrypts to `report.pdf.age`, and decrypting strips the
 * suffix back off. Typed text has no filename, so it becomes `message.txt`.
 */

const AGE_SUFFIX = ".age";

export const textFileName = "message.txt";

export function encryptedName(inputName: string | null): string {
  return (inputName ?? textFileName) + AGE_SUFFIX;
}

export interface DecryptedName {
  name: string;
  /** True when there was no `.age` suffix to strip. */
  fellBack: boolean;
}

export function decryptedName(inputName: string | null): DecryptedName {
  if (inputName !== null && inputName.toLowerCase().endsWith(AGE_SUFFIX)) {
    const stripped = inputName.slice(0, -AGE_SUFFIX.length);
    if (stripped.length > 0) {
      return { name: stripped, fellBack: false };
    }
  }
  return { name: "decrypted", fellBack: true };
}
