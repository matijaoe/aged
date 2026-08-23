import { CryptoError } from "@/lib/crypto/protocol";

/**
 * The app's state machine, kept free of React and worker imports so it can
 * be unit-tested directly. The `useAged` hook in use-aged.ts drives it.
 *
 * The step is stored rather than derived from which data happens to exist.
 * Deriving it made "where you are" and "what you have" the same fact, so
 * moving backwards meant destroying something — which is why going back
 * used to mean starting over. Here a backward move changes only the step;
 * the only action that clears anything is `start-over`.
 */

/**
 * 256 MB, sized against the heap rather than against any one allocation. A
 * single ArrayBuffer still allocates at 1024 MB and only throws at 2048 MB,
 * so the buffer is not the ceiling — the ~4192 MB heap is, and the pipeline
 * spends it several times over.
 *
 * Two peaks, for an N-byte input. While working: the main-thread read, the
 * structured-clone copy the worker receives (client.ts copies rather than
 * transfers, on purpose) and the worker's output, so 3N. At an armored
 * download: the result, the armored form at ~1.35N, and the Blob's copy of
 * it, so ~3.7N — the input itself is gone by then, released when the result
 * landed. That is ~950 MB here, well inside the budget.
 */
export const maxFileBytes = 256 * 1024 * 1024;
export const maxPreviewBytes = 1024 * 1024;

export type Mode = "encrypt" | "decrypt";

export type Step = "pick" | "compose" | "passphrase" | "working" | "done";

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

export interface AgedState {
  step: Step;
  mode: Mode;
  input: InputSource | null;
  /**
   * The message being composed. Retained past the compose step so going
   * back lands on the text rather than an empty field, and doubling as the
   * record of where the input came from: only composing ever sets it, so a
   * non-empty draft means the passphrase step's way back is the writer.
   */
  draft: string;
  result: AgedResult | null;
  notice: Notice | null;
  submitError: string | null;
  /** User's edit of the output name; null until they touch it. */
  outputNameOverride: string | null;
  /**
   * What the header sniff said about the current input, kept separately from
   * `mode` so a manual override doesn't erase what was detected. Only an
   * input that really is an age file makes an override meaningful: forcing
   * decrypt on anything else can only ever produce "not an age file".
   */
  detectedAge: boolean;
  /** Encrypt only: hand the result over as printable text instead of binary. */
  armored: boolean;
}

export type AgedAction =
  | { type: "set-mode"; mode: Mode }
  | { type: "compose"; seed: string }
  | { type: "set-draft"; draft: string }
  | { type: "set-input"; input: InputSource; mode: Mode; detectedAge: boolean }
  | { type: "commit-draft"; input: InputSource; mode: Mode; detectedAge: boolean }
  | { type: "notice"; notice: Notice }
  | { type: "submit" }
  | { type: "submit-failed"; message: string }
  | { type: "finished"; result: AgedResult }
  | { type: "set-output-name"; name: string }
  | { type: "set-armored"; armored: boolean }
  | { type: "back" }
  | { type: "start-over" };

export const initialState: AgedState = {
  step: "pick",
  mode: "encrypt",
  input: null,
  draft: "",
  result: null,
  notice: null,
  submitError: null,
  outputNameOverride: null,
  detectedAge: false,
  armored: false,
};

/** Where a backward move from each step lands. `null` means there is none. */
export function backStepFrom(state: AgedState): Step | null {
  switch (state.step) {
    case "compose": {
      return "pick";
    }
    case "passphrase": {
      return state.draft === "" ? "pick" : "compose";
    }
    // The pick step is already the start; an operation in flight has nothing
    // to go back to until it settles; and a finished result is not a step you
    // reverse into — the only move from there is to start again, which the
    // step offers itself.
    default: {
      return null;
    }
  }
}

export function reduce(state: AgedState, action: AgedAction): AgedState {
  switch (action.type) {
    case "set-mode": {
      // On the done step the result contradicts a flipped mode, so switching
      // there starts a fresh flow in the chosen mode instead.
      if (state.step === "done") {
        return { ...initialState, mode: action.mode };
      }
      return { ...state, mode: action.mode, submitError: null };
    }
    case "compose": {
      return { ...state, step: "compose", draft: action.seed, notice: null };
    }
    case "set-draft": {
      return { ...state, draft: action.draft };
    }
    case "set-input":
    case "commit-draft": {
      return {
        ...state,
        step: "passphrase",
        mode: action.mode,
        input: action.input,
        // Arriving with a file or a paste abandons any message in progress,
        // which is also what keeps `draft` an honest record of the way back.
        draft: action.type === "commit-draft" ? state.draft : "",
        result: null,
        notice: null,
        submitError: null,
        outputNameOverride: null,
        detectedAge: action.detectedAge,
      };
    }
    case "notice": {
      return { ...state, step: "pick", notice: action.notice, input: null };
    }
    case "submit": {
      return { ...state, step: "working", submitError: null };
    }
    case "submit-failed": {
      // Ignored unless the flow is still where it was left: an operation that
      // lands after the user has moved on must not drag the step back with
      // it, which would put a step on screen whose data has gone.
      if (state.step !== "working") {
        return state;
      }
      return { ...state, step: "passphrase", submitError: action.message };
    }
    case "finished": {
      if (state.step !== "working") {
        return state;
      }
      return { ...state, step: "done", result: action.result, input: releaseInput(state.input) };
    }
    case "set-output-name": {
      return { ...state, outputNameOverride: action.name };
    }
    case "set-armored": {
      return { ...state, armored: action.armored };
    }
    case "back": {
      const step = backStepFrom(state);
      if (step === null) {
        return state;
      }
      return {
        ...state,
        step,
        // A result belongs to the passphrase that produced it, so stepping
        // back off the done step retires it rather than leaving something
        // stale on the far side of a change.
        result: step === "passphrase" ? null : state.result,
        outputNameOverride: step === "passphrase" ? null : state.outputNameOverride,
        // Returning to the start means choosing a different input.
        input: step === "pick" ? null : state.input,
        detectedAge: step === "pick" ? false : state.detectedAge,
        submitError: null,
        notice: null,
      };
    }
    case "start-over": {
      return { ...initialState, mode: state.mode };
    }
  }
}

/**
 * Everything the input carried except its name, which is all the result step
 * needs: the name goes in the CLI hint and seeds the output's. Dropping the
 * payload here is what keeps a full-size input from sitting alongside a
 * full-size output — the result has no way back, so nothing will ask for it
 * again.
 */
export function releaseInput(input: InputSource | null): InputSource | null {
  if (input === null) {
    return null;
  }
  if (input.kind === "file") {
    return { ...input, bytes: new Uint8Array(0) };
  }
  return { ...input, text: "" };
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
