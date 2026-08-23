import { armor } from "age-encryption";

/**
 * ASCII armor: the same ciphertext re-encoded as printable text.
 *
 * Keyless and reversible by anyone, so it is applied to a finished result
 * rather than chosen before encrypting — the choice is about how the output
 * travels, and nothing is re-encrypted to change it.
 *
 * Kept apart from `core.ts` on purpose: this is the one piece of the crypto
 * layer the UI calls directly, and importing the core would pull typage's
 * cipher graph into the main bundle alongside the inlined worker's copy.
 */
export function armorText(binary: Uint8Array): string {
  return armor.encode(binary);
}

/** The same text as bytes, for saving it as a file. */
export function armorBytes(binary: Uint8Array): Uint8Array {
  return new TextEncoder().encode(armorText(binary));
}

/**
 * What `armorText` would produce, without producing it: the header and
 * footer lines, then 65 bytes per whole 48-byte group and a short final
 * line. Exact, so the result step can state a size without spending a
 * second and a third of a gigabyte to find it out.
 */
export function armoredLength(byteLength: number): number {
  const whole = Math.floor(byteLength / 48);
  const rest = byteLength % 48;
  const lastLine = rest > 0 ? 4 * Math.ceil(rest / 3) + 1 : 0;
  return 35 + whole * 65 + lastLine + 33;
}
