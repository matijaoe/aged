import { describe, expect, test } from "vite-plus/test";

import { CryptoError } from "@/lib/crypto/protocol";
import {
  backStepFrom,
  initialState,
  reduce,
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

/** Walk a file all the way to the result the way the app does. */
function doneWithFile(): AgedState {
  const loaded = reduce(initialState, {
    type: "set-input",
    input: fileInput,
    mode: "encrypt",
    detectedAge: false,
  });
  return reduce(reduce(loaded, { type: "submit" }), { type: "finished", result });
}

describe("backStepFrom", () => {
  test("the start and an operation in flight have no way back", () => {
    expect(backStepFrom(initialState)).toBeNull();
    expect(backStepFrom(stateWith({ step: "working" }))).toBeNull();
  });

  test("the passphrase step returns to whichever step supplied the input", () => {
    expect(backStepFrom(stateWith({ step: "passphrase" }))).toBe("pick");
    expect(backStepFrom(stateWith({ step: "passphrase", draft: "hi" }))).toBe("compose");
  });

  test("a finished result is not reversed into; it is started again", () => {
    expect(backStepFrom(stateWith({ step: "done" }))).toBeNull();
  });
});

describe("reduce", () => {
  test("set-input clears result, notice, error, and output-name override", () => {
    const dirty = stateWith({
      step: "done",
      result,
      notice: { kind: "multiple-files" },
      submitError: "x",
      outputNameOverride: "y",
    });
    const next = reduce(dirty, {
      type: "set-input",
      input: fileInput,
      mode: "decrypt",
      detectedAge: true,
    });
    expect(next.step).toBe("passphrase");
    expect(next.result).toBeNull();
    expect(next.notice).toBeNull();
    expect(next.submitError).toBeNull();
    expect(next.outputNameOverride).toBeNull();
    expect(next.mode).toBe("decrypt");
    expect(next.detectedAge).toBe(true);
  });

  test("a file abandons a message in progress, so the way back stays honest", () => {
    const composing = reduce(initialState, { type: "compose", seed: "half a message" });
    const loaded = reduce(composing, {
      type: "set-input",
      input: fileInput,
      mode: "encrypt",
      detectedAge: false,
    });
    expect(loaded.draft).toBe("");
    expect(backStepFrom(loaded)).toBe("pick");
  });

  test("committing a draft keeps it, so the way back is the writer", () => {
    const composing = reduce(initialState, { type: "compose", seed: "hello" });
    const committed = reduce(composing, {
      type: "commit-draft",
      input: { kind: "text", text: "hello" },
      mode: "encrypt",
      detectedAge: false,
    });
    expect(committed.step).toBe("passphrase");
    expect(backStepFrom(committed)).toBe("compose");
    expect(reduce(committed, { type: "back" }).draft).toBe("hello");
  });

  test("finishing keeps the input's name and drops its payload", () => {
    const done = doneWithFile();
    expect(done.step).toBe("done");
    expect(done.input?.kind).toBe("file");
    if (done.input?.kind === "file") {
      expect(done.input.name).toBe("report.pdf");
      expect(done.input.bytes.length).toBe(0);
    }
  });

  test("a finished message keeps its name too, and lets go of the text", () => {
    const typed = reduce(initialState, {
      type: "commit-draft",
      input: { kind: "text", text: "a long message" },
      mode: "encrypt",
      detectedAge: false,
    });
    const done = reduce(reduce(typed, { type: "submit" }), { type: "finished", result });
    expect(done.input).toEqual({ kind: "text", text: "" });
  });

  test("back does nothing on the result; only start-over leaves it", () => {
    const done = doneWithFile();
    expect(reduce(done, { type: "back" })).toBe(done);
    expect(reduce(done, { type: "start-over" })).toEqual({
      ...initialState,
      mode: done.mode,
    });
  });

  test("stepping back to the start lets go of the input", () => {
    const loaded = reduce(initialState, {
      type: "set-input",
      input: fileInput,
      mode: "decrypt",
      detectedAge: true,
    });
    const next = reduce(loaded, { type: "back" });
    expect(next.step).toBe("pick");
    expect(next.input).toBeNull();
    expect(next.detectedAge).toBe(false);
  });

  test("back does nothing where there is nowhere to go", () => {
    expect(reduce(initialState, { type: "back" })).toBe(initialState);
    const working = stateWith({ step: "working", input: fileInput });
    expect(reduce(working, { type: "back" })).toBe(working);
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

  test("notice returns to the start and drops the input", () => {
    const next = reduce(stateWith({ step: "passphrase", input: fileInput }), {
      type: "notice",
      notice: { kind: "too-big", name: "big.bin", size: 1 },
    });
    expect(next.input).toBeNull();
    expect(next.step).toBe("pick");
  });

  test("switching mode on the result starts a fresh flow in that mode", () => {
    const next = reduce(doneWithFile(), { type: "set-mode", mode: "decrypt" });
    expect(next.mode).toBe("decrypt");
    expect(next.result).toBeNull();
    expect(next.step).toBe("pick");
  });

  test("switching mode elsewhere keeps the flow", () => {
    const next = reduce(stateWith({ step: "passphrase", input: fileInput, submitError: "x" }), {
      type: "set-mode",
      mode: "decrypt",
    });
    expect(next.input).toBe(fileInput);
    expect(next.submitError).toBeNull();
    expect(next.step).toBe("passphrase");
  });

  test("a failed submit returns to the passphrase step with the reason", () => {
    const working = stateWith({ step: "working", input: fileInput });
    const next = reduce(working, { type: "submit-failed", message: "nope" });
    expect(next.step).toBe("passphrase");
    expect(next.submitError).toBe("nope");
  });

  test("start-over keeps only the mode", () => {
    const done = { ...doneWithFile(), mode: "decrypt" as const, draft: "x", submitError: "y" };
    expect(reduce(done, { type: "start-over" })).toEqual({ ...initialState, mode: "decrypt" });
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
