import { describe, expect, test } from "vite-plus/test";

import { CryptoError } from "@/lib/crypto/protocol";
import {
  initialState,
  reduce,
  releaseBytes,
  stepOf,
  submitErrorMessage,
  textPreviewOf,
  type AgedResult,
  type AgedState,
  type InputSource,
} from "./aged-state";

const fileInput: InputSource = {
  kind: "file",
  name: "report.pdf",
  bytes: new Uint8Array([1, 2, 3]),
};

const result: AgedResult = {
  mode: "encrypt",
  bytes: new Uint8Array([9]),
  suggestedName: "report.pdf.age",
  nameFellBack: false,
  generatedPassphrase: null,
  textPreview: null,
};

function stateWith(overrides: Partial<AgedState>): AgedState {
  return { ...initialState, ...overrides };
}

describe("stepOf", () => {
  test("maps state to steps", () => {
    expect(stepOf(initialState)).toBe("pick");
    expect(stepOf(stateWith({ input: fileInput }))).toBe("passphrase");
    expect(stepOf(stateWith({ input: fileInput, working: true }))).toBe("working");
    expect(stepOf(stateWith({ input: fileInput, result }))).toBe("done");
  });
});

describe("reduce", () => {
  test("set-input clears result, notice, error, and output-name override", () => {
    const dirty = stateWith({
      result,
      notice: { kind: "multiple-files" },
      submitError: "x",
      outputNameOverride: "y",
    });
    const next = reduce(dirty, { type: "set-input", input: fileInput, mode: "decrypt", detectedAge: true });
    expect(next.result).toBeNull();
    expect(next.notice).toBeNull();
    expect(next.submitError).toBeNull();
    expect(next.outputNameOverride).toBeNull();
    expect(next.mode).toBe("decrypt");
    expect(next.detectedAge).toBe(true);
    expect(stepOf(next)).toBe("passphrase");
  });

  test("a manual override changes the mode without rewriting what was detected", () => {
    const detected = reduce(initialState, {
      type: "set-input",
      input: fileInput,
      mode: "decrypt",
      detectedAge: true,
    });
    const next = reduce(detected, { type: "set-mode", mode: "encrypt" });
    expect(next.mode).toBe("encrypt");
    expect(next.detectedAge).toBe(true);
  });

  test("clear-input forgets what was detected", () => {
    const detected = reduce(initialState, {
      type: "set-input",
      input: fileInput,
      mode: "decrypt",
      detectedAge: true,
    });
    expect(reduce(detected, { type: "clear-input" }).detectedAge).toBe(false);
  });

  test("finished releases the input bytes but keeps the name", () => {
    const next = reduce(stateWith({ input: fileInput, working: true }), {
      type: "finished",
      result,
    });
    expect(stepOf(next)).toBe("done");
    expect(next.input?.kind).toBe("file");
    if (next.input?.kind === "file") {
      expect(next.input.name).toBe("report.pdf");
      expect(next.input.bytes.length).toBe(0);
    }
  });

  test("notice clears the input and stops work", () => {
    const next = reduce(stateWith({ input: fileInput }), {
      type: "notice",
      notice: { kind: "too-big", name: "big.bin", size: 1 },
    });
    expect(next.input).toBeNull();
    expect(stepOf(next)).toBe("pick");
  });

  test("switching mode on the done step starts a fresh flow in that mode", () => {
    const done = stateWith({ input: releaseBytes(fileInput), result });
    const next = reduce(done, { type: "set-mode", mode: "decrypt" });
    expect(next.mode).toBe("decrypt");
    expect(next.result).toBeNull();
    expect(stepOf(next)).toBe("pick");
  });

  test("switching mode elsewhere keeps the flow", () => {
    const next = reduce(stateWith({ input: fileInput, submitError: "x" }), {
      type: "set-mode",
      mode: "decrypt",
    });
    expect(next.input).toBe(fileInput);
    expect(next.submitError).toBeNull();
    expect(stepOf(next)).toBe("passphrase");
  });

  test("reset keeps only the mode", () => {
    const done = stateWith({ mode: "decrypt", input: fileInput, result, submitError: "x" });
    const next = reduce(done, { type: "reset" });
    expect(next).toEqual({ ...initialState, mode: "decrypt" });
  });
});

describe("textPreviewOf", () => {
  test("decodes small UTF-8 text", () => {
    expect(textPreviewOf(new TextEncoder().encode("hello"))).toBe("hello");
  });

  test("rejects binary and oversized data", () => {
    expect(textPreviewOf(new Uint8Array([0xff, 0xfe]))).toBeNull();
    expect(textPreviewOf(new Uint8Array(1024 * 1024))).toBeNull();
  });
});

describe("submitErrorMessage", () => {
  test("maps the worker error codes to human copy", () => {
    expect(submitErrorMessage(new CryptoError("wrong-passphrase", "x"), "decrypt")).toContain(
      "passphrase",
    );
    expect(submitErrorMessage(new CryptoError("not-age-file", "x"), "decrypt")).toContain(
      "age-encrypted",
    );
  });

  test("falls back per mode for unknown failures", () => {
    expect(submitErrorMessage(new Error("boom"), "encrypt")).toContain("Encryption");
    expect(submitErrorMessage(new Error("boom"), "decrypt")).toContain("Decryption");
  });
});
