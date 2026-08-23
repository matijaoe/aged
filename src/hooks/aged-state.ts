import { CryptoError } from "@/lib/crypto/protocol";

/**
 * The app's state machine, kept free of React and worker imports so it can
 * be unit-tested directly. The `useAged` hook in use-aged.ts drives it.
 */

export const maxFileBytes = 100 * 1024 * 1024;
export const maxPreviewBytes = 1024 * 1024;

export type Mode = "encrypt" | "decrypt";

export type InputSource =
  | { kind: "file"; name: string; bytes: Uint8Array }
  | { kind: "text"; text: string };

export interface AgedResult {
  mode: Mode;
  bytes: Uint8Array;
  suggestedName: string;
  /** Decrypt only: there was no `.age` suffix to strip. */
  nameFellBack: boolean;
  /** Encrypt only: set when the passphrase was generated for the user. */
  generatedPassphrase: string | null;
  /** Decrypt only: set when the plaintext is small UTF-8 text. */
  textPreview: string | null;
}

/** A problem with the dropped input, shown on the pick step. */
export type Notice =
  | { kind: "multiple-files" }
  | { kind: "too-big"; name: string; size: number }
  | { kind: "unreadable"; name: string };

export type Step = "pick" | "passphrase" | "working" | "done";

export interface AgedState {
  mode: Mode;
  input: InputSource | null;
  working: boolean;
  result: AgedResult | null;
  notice: Notice | null;
  submitError: string | null;
  /** User's edit of the output name; null until they touch it. */
  outputNameOverride: string | null;
}

export type AgedAction =
  | { type: "set-mode"; mode: Mode }
  | { type: "set-input"; input: InputSource; mode: Mode }
  | { type: "clear-input" }
  | { type: "notice"; notice: Notice }
  | { type: "submit" }
  | { type: "submit-failed"; message: string }
  | { type: "finished"; result: AgedResult }
  | { type: "set-output-name"; name: string }
  | { type: "reset" };

export const initialState: AgedState = {
  mode: "encrypt",
  input: null,
  working: false,
  result: null,
  notice: null,
  submitError: null,
  outputNameOverride: null,
};

export function reduce(state: AgedState, action: AgedAction): AgedState {
  switch (action.type) {
    case "set-mode": {
      // On the done step the input bytes are already released, so switching
      // mode there starts a fresh flow in the chosen mode instead of leaving
      // the switch contradicting the shown result.
      if (state.result !== null) {
        return { ...initialState, mode: action.mode };
      }
      return { ...state, mode: action.mode, submitError: null };
    }
    case "set-input": {
      return {
        ...state,
        mode: action.mode,
        input: action.input,
        result: null,
        notice: null,
        submitError: null,
        working: false,
        outputNameOverride: null,
      };
    }
    case "clear-input": {
      return { ...state, input: null, submitError: null };
    }
    case "notice": {
      return { ...state, notice: action.notice, input: null, working: false };
    }
    case "submit": {
      return { ...state, working: true, submitError: null };
    }
    case "submit-failed": {
      return { ...state, working: false, submitError: action.message };
    }
    case "finished": {
      return {
        ...state,
        working: false,
        result: action.result,
        // The done step only needs the input's name; release the bytes so a
        // 100 MB input isn't held alongside its 100 MB output.
        input: releaseBytes(state.input),
      };
    }
    case "set-output-name": {
      return { ...state, outputNameOverride: action.name };
    }
    case "reset": {
      return { ...initialState, mode: state.mode };
    }
  }
}

export function releaseBytes(input: InputSource | null): InputSource | null {
  if (input?.kind !== "file") {
    return input;
  }
  return { ...input, bytes: new Uint8Array(0) };
}

export function stepOf(state: {
  input: InputSource | null;
  working: boolean;
  result: AgedResult | null;
}): Step {
  if (state.result !== null) {
    return "done";
  }
  if (state.working) {
    return "working";
  }
  if (state.input !== null) {
    return "passphrase";
  }
  return "pick";
}

export function inputBytes(input: InputSource): Uint8Array {
  if (input.kind === "file") {
    return input.bytes;
  }
  return new TextEncoder().encode(input.text);
}

export function textPreviewOf(bytes: Uint8Array): string | null {
  if (bytes.length >= maxPreviewBytes) {
    return null;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function submitErrorMessage(error: unknown, mode: Mode): string {
  if (error instanceof CryptoError) {
    if (error.code === "wrong-passphrase") {
      return "That passphrase doesn't match this file.";
    }
    if (error.code === "not-age-file") {
      return "This isn't an age-encrypted file, so there's nothing to decrypt.";
    }
  }
  if (mode === "encrypt") {
    return "Encryption failed unexpectedly. Try again.";
  }
  return "Decryption failed unexpectedly. The file may be damaged.";
}
