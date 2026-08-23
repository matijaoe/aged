/**
 * Output filename derivation, mirroring the age CLI's convention:
 * `report.pdf` encrypts to `report.pdf.age`, and decrypting strips the
 * suffix back off. Typed text has no filename, so it becomes `message.txt`.
 */

/**
 * The suffix aged appends. Exported because the UI pins it beside the name
 * rather than leaving it as text the user has to select around.
 */
export const ageSuffix = ".age";

export const textFileName = "message.txt";

export function encryptedName(inputName: string | null): string {
  return (inputName ?? textFileName) + ageSuffix;
}

/** The name without aged's suffix, or unchanged when it has none. */
export function stripAgeSuffix(name: string): string {
  return name.toLowerCase().endsWith(ageSuffix) ? name.slice(0, -ageSuffix.length) : name;
}

export interface DecryptedName {
  name: string;
  /** True when there was no `.age` suffix to strip. */
  fellBack: boolean;
}

export function decryptedName(inputName: string | null): DecryptedName {
  if (inputName !== null) {
    const stripped = stripAgeSuffix(inputName);
    if (stripped !== inputName && stripped.length > 0) {
      return { name: stripped, fellBack: false };
    }
  }
  return { name: "decrypted", fellBack: true };
}
