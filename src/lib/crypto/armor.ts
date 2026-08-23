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
 *
 * The encoding is written out here rather than delegated to typage's
 * `armor.encode`, which pushes one 65-character string per 48 input bytes
 * into an array and joins it — 5.6 million strings for a ciphertext at the
 * 256 MB cap, built on the main thread on a click. Writing ASCII straight
 * into a buffer sized up front makes the output the only allocation. Only
 * the encode direction is ours; decoding stays typage's, in `core.ts`.
 *
 * `armor.test.ts` pins this byte-for-byte against `armor.encode`, and
 * `verify:cli` feeds the result to the real `age` binary.
 */

/**
 * age's armor is PEM framing: the header line, base64 in 64-character lines,
 * then the footer line, every line ending in a newline — including the last.
 * 48 input bytes make one 64-character line, so the body is walked in 48-byte
 * steps; 48 is a multiple of 3, which is what keeps padding off every line
 * but the final one.
 */
const header = "-----BEGIN AGE ENCRYPTED FILE-----\n";
const footer = "-----END AGE ENCRYPTED FILE-----\n";
const lineInput = 48;
const lineOutput = 64;

const ascii = new TextEncoder();
const headerBytes = ascii.encode(header);
const footerBytes = ascii.encode(footer);

/** RFC 4648 base64, as character codes, because the encoder writes bytes. */
const digits = ascii.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
const padByte = 0x3d; // "="
const newlineByte = 0x0a; // "\n"

/** Exactly how long the armored form will be, so the buffer is sized once. */
function armoredLength(binaryLength: number): number {
  const whole = Math.floor(binaryLength / lineInput);
  const rest = binaryLength % lineInput;
  // A short final line is still padded to a multiple of 4, and still ends in
  // a newline. An input that divides evenly has no final line at all.
  const tail = rest === 0 ? 0 : 4 * Math.ceil(rest / 3) + 1;
  return headerBytes.length + whole * (lineOutput + 1) + tail + footerBytes.length;
}

/**
 * The armored form as bytes, for saving it as a file.
 *
 * This is the direction that carries the whole 256 MB cap — the copy path is
 * capped far lower — so it is the one that builds the buffer, and the text
 * form decodes back out of it.
 *
 * The indexed reads are cast rather than checked: every one of them sits
 * inside a bound the surrounding loop just established, and the casts are
 * what keep the inner loop free of a check run hundreds of millions of times.
 */
export function armorBytes(binary: Uint8Array): Uint8Array {
  const out = new Uint8Array(armoredLength(binary.length));
  out.set(headerBytes, 0);
  let at = headerBytes.length;

  for (let line = 0; line < binary.length; line += lineInput) {
    const lineEnd = Math.min(line + lineInput, binary.length);
    let i = line;

    // Whole 3-byte groups: 24 bits in, four 6-bit digits out, no padding.
    for (; i + 3 <= lineEnd; i += 3) {
      const a = binary[i] as number;
      const b = binary[i + 1] as number;
      const c = binary[i + 2] as number;
      out[at] = digits[a >> 2] as number;
      out[at + 1] = digits[((a & 0b11) << 4) | (b >> 4)] as number;
      out[at + 2] = digits[((b & 0b1111) << 2) | (c >> 6)] as number;
      out[at + 3] = digits[c & 0b111111] as number;
      at += 4;
    }

    // A 1- or 2-byte remainder, which only the final line can have: the bits
    // that are there, zero-filled to a digit boundary, then "=" to four.
    const remainder = lineEnd - i;
    if (remainder === 1) {
      const a = binary[i] as number;
      out[at] = digits[a >> 2] as number;
      out[at + 1] = digits[(a & 0b11) << 4] as number;
      out[at + 2] = padByte;
      out[at + 3] = padByte;
      at += 4;
    } else if (remainder === 2) {
      const a = binary[i] as number;
      const b = binary[i + 1] as number;
      out[at] = digits[a >> 2] as number;
      out[at + 1] = digits[((a & 0b11) << 4) | (b >> 4)] as number;
      out[at + 2] = digits[(b & 0b1111) << 2] as number;
      out[at + 3] = padByte;
      at += 4;
    }

    out[at] = newlineByte;
    at += 1;
  }

  out.set(footerBytes, at);
  return out;
}

/** The same thing as text, which is what the clipboard takes. */
export function armorText(binary: Uint8Array): string {
  return new TextDecoder().decode(armorBytes(binary));
}
