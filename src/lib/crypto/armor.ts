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
