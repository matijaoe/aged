import CryptoWorker from "./age.worker?worker&inline";
import { CryptoError, type CryptoOp, type CryptoResponse } from "./protocol";

/**
 * Promise-based client for the crypto worker.
 *
 * The worker is created lazily and reused; `?worker&inline` bundles it into
 * the main chunk so the single-file build keeps working from `file://`.
 */

export { CryptoError };

type Pending = {
  resolve: (data: Uint8Array) => void;
  reject: (error: CryptoError) => void;
};

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker === null) {
    worker = new CryptoWorker();
    worker.onmessage = (event: MessageEvent<CryptoResponse>) => {
      const response = event.data;
      const entry = pending.get(response.id);
      if (entry === undefined) {
        return;
      }
      pending.delete(response.id);
      if (response.ok) {
        entry.resolve(response.data);
      } else {
        entry.reject(new CryptoError(response.code, response.message));
      }
    };
    // A crashed worker (most plausibly out-of-memory on a huge file) would
    // otherwise leave callers pending forever with the UI locked.
    worker.onerror = () => failAllPending();
    worker.onmessageerror = () => failAllPending();
  }
  return worker;
}

function failAllPending(): void {
  const entries = [...pending.values()];
  pending.clear();
  worker?.terminate();
  worker = null;
  for (const entry of entries) {
    entry.reject(
      new CryptoError("unknown", "The encryption engine stopped unexpectedly."),
    );
  }
}

function run(op: CryptoOp, data: Uint8Array, passphrase: string): Promise<Uint8Array> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    // The input is copied rather than transferred: callers may retry the
    // same bytes with a corrected passphrase.
    getWorker().postMessage({ id, op, data, passphrase });
  });
}

export function encrypt(plaintext: Uint8Array, passphrase: string): Promise<Uint8Array> {
  return run("encrypt", plaintext, passphrase);
}

export function decrypt(ciphertext: Uint8Array, passphrase: string): Promise<Uint8Array> {
  return run("decrypt", ciphertext, passphrase);
}
