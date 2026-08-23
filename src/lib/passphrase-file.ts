import { isAgeFile } from "@/lib/crypto/detect";

/**
 * Bringing a passphrase as a file rather than typing it.
 *
 * The artefact this is built around is the one aged hands out itself on the
 * done step — `<name>.passphrase.txt`, a single short line — so anything
 * that isn't shaped like that is a mistake worth naming rather than
 * silently feeding into a password field.
 *
 * What makes a file eligible is its content, not its name: a passphrase may
 * live in `.txt`, `.md`, `.asc`, or a file with no extension at all, and an
 * extension check would both reject those and be fooled by a renamed PNG.
 * This is the same rule the app already applies to the input itself.
 */
export const maxPassphraseFileBytes = 4096;

/** Enough to catch any binary header, and cheap to read from a huge file. */
const headSampleBytes = 1024;

export type PassphraseFile =
  | { ok: true; passphrase: string; name: string }
  | { ok: false; message: string };

/**
 * Whether these bytes read as text. Decoded in streaming mode so a
 * multi-byte character split by the sample boundary isn't mistaken for
 * binary, and NUL-rejecting because no text file carries one.
 */
export function looksLikeText(bytes: Uint8Array): boolean {
  if (bytes.includes(0)) {
    return false;
  }
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes, { stream: true });
    return true;
  } catch {
    return false;
  }
}

/** The decision for a file within the cap, whose head already read as text. */
export function classifyPassphraseText(bytes: Uint8Array, name: string): PassphraseFile {
  // Decoded fatally rather than leniently: only the head was sampled, so a
  // file that turns to binary further in would otherwise yield a passphrase
  // padded with U+FFFD and fail later as "wrong passphrase" with nothing to
  // show for it.
  if (!looksLikeText(bytes)) {
    return { ok: false, message: `${name} isn't a text file, so it can't hold a passphrase.` };
  }
  // Trimmed because almost every editor adds a trailing newline, and a
  // passphrase that is silently one character off fails the same way.
  // Nothing aged generates has whitespace at either end to lose.
  const passphrase = new TextDecoder().decode(bytes).trim();
  if (passphrase === "") {
    return { ok: false, message: `${name} is empty.` };
  }
  return { ok: true, passphrase, name };
}

export async function readPassphraseFile(file: File): Promise<PassphraseFile> {
  let head: Uint8Array;
  try {
    head = new Uint8Array(await file.slice(0, headSampleBytes).arrayBuffer());
  } catch {
    return { ok: false, message: `Couldn't read ${file.name}.` };
  }
  // Ordered by what is most true about the file. A PNG is not "too big to
  // be a passphrase" — it is not a passphrase at all, whatever its size,
  // and that is the only useful thing to say about it.
  if (!looksLikeText(head)) {
    return { ok: false, message: `${file.name} isn't a text file, so it can't hold a passphrase.` };
  }
  if (isAgeFile(head)) {
    return {
      ok: false,
      message: `${file.name} is an age file, not a passphrase. Go back to load it instead.`,
    };
  }
  if (file.size > maxPassphraseFileBytes) {
    return { ok: false, message: `${file.name} is too long to be a passphrase.` };
  }
  try {
    return classifyPassphraseText(new Uint8Array(await file.arrayBuffer()), file.name);
  } catch {
    return { ok: false, message: `Couldn't read ${file.name}.` };
  }
}
