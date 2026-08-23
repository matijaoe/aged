/** Message contract between the crypto worker and its client. */

export type CryptoOp = "encrypt" | "decrypt";

export interface CryptoRequest {
  id: number;
  op: CryptoOp;
  data: Uint8Array;
  passphrase: string;
  /** Encrypt only: wrap the output in ASCII armor. */
  armored?: boolean;
}

export type CryptoErrorCode = "wrong-passphrase" | "not-age-file" | "unknown";

export type CryptoResponse =
  | { id: number; ok: true; data: Uint8Array }
  | { id: number; ok: false; code: CryptoErrorCode; message: string };

/** The typed error the client surfaces for a failed worker operation. */
export class CryptoError extends Error {
  readonly code: CryptoErrorCode;

  constructor(code: CryptoErrorCode, message: string) {
    super(message);
    this.name = "CryptoError";
    this.code = code;
  }
}
