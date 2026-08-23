import {
  decryptWithPassphrase,
  encryptWithPassphrase,
  NotAgeFileError,
  WrongPassphraseError,
} from "./core";
import type { CryptoErrorCode, CryptoRequest, CryptoResponse } from "./protocol";

/**
 * The crypto worker. scrypt at work factor 18 costs about a second of solid
 * CPU, so it runs here to keep the main thread free.
 */

self.onmessage = async (event: MessageEvent<CryptoRequest>) => {
  const { id, op, data, passphrase } = event.data;
  // The message is the app's only trust boundary; an unrecognized request
  // must fail closed instead of falling through to a crypto operation.
  if (
    typeof id !== "number" ||
    (op !== "encrypt" && op !== "decrypt") ||
    !(data instanceof Uint8Array) ||
    typeof passphrase !== "string"
  ) {
    respond({
      id: typeof id === "number" ? id : -1,
      ok: false,
      code: "unknown",
      message: "malformed request",
    });
    return;
  }
  try {
    const result =
      op === "encrypt"
        ? await encryptWithPassphrase(data, passphrase)
        : await decryptWithPassphrase(data, passphrase);
    respond({ id, ok: true, data: result }, [result.buffer as ArrayBuffer]);
  } catch (error) {
    respond({ id, ok: false, code: codeFor(error), message: messageFor(error) });
  }
};

function respond(response: CryptoResponse, transfer: ArrayBuffer[] = []): void {
  (self as unknown as Worker).postMessage(response, transfer);
}

function codeFor(error: unknown): CryptoErrorCode {
  if (error instanceof WrongPassphraseError) {
    return "wrong-passphrase";
  }
  if (error instanceof NotAgeFileError) {
    return "not-age-file";
  }
  return "unknown";
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
