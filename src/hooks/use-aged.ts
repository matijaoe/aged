import { useCallback, useReducer } from "react";

import { decrypt, encrypt } from "@/lib/crypto/client";
import { isAgeFile } from "@/lib/crypto/detect";
import { decryptedName, encryptedName } from "@/lib/crypto/filename";
import { generatePassphrase } from "@/lib/crypto/passphrase";
import {
  initialState,
  inputBytes,
  maxFileBytes,
  reduce,
  stepOf,
  submitErrorMessage,
  textPreviewOf,
  type AgedResult,
  type AgedState,
  type InputSource,
  type Mode,
  type Notice,
  type Step,
} from "./aged-state";

export { maxFileBytes, stepOf };
export type { AgedResult, InputSource, Mode, Notice, Step };

export interface Aged extends AgedState {
  step: Step;
  setMode: (mode: Mode) => void;
  /** Load a dropped/browsed file list; sniffs the header to pick the mode. */
  loadFiles: (files: readonly File[]) => void;
  /** Load a typed message; armored age text switches the mode to decrypt. */
  loadText: (text: string) => void;
  clearInput: () => void;
  /** Encrypt or decrypt with the given passphrase (already validated). */
  submit: (passphrase: string) => void;
  setOutputName: (name: string) => void;
  reset: () => void;
}

export function useAged(): Aged {
  const [state, dispatch] = useReducer(reduce, initialState);

  const setMode = useCallback((mode: Mode) => {
    dispatch({ type: "set-mode", mode });
  }, []);

  const loadFiles = useCallback((files: readonly File[]) => {
    void (async () => {
      const [file] = files;
      if (file === undefined) {
        return;
      }
      if (files.length > 1) {
        dispatch({ type: "notice", notice: { kind: "multiple-files" } });
        return;
      }
      if (file.size > maxFileBytes) {
        dispatch({
          type: "notice",
          notice: { kind: "too-big", name: file.name, size: file.size },
        });
        return;
      }
      let bytes: Uint8Array;
      try {
        bytes = new Uint8Array(await file.arrayBuffer());
      } catch {
        dispatch({ type: "notice", notice: { kind: "unreadable", name: file.name } });
        return;
      }
      // The header decides the mode; the user can still override it, but
      // only when what we found was actually an age file.
      const isAge = isAgeFile(bytes);
      dispatch({
        type: "set-input",
        input: { kind: "file", name: file.name, bytes },
        mode: isAge ? "decrypt" : "encrypt",
        detectedAge: isAge,
      });
    })();
  }, []);

  const loadText = useCallback((text: string) => {
    const isAge = isAgeFile(new TextEncoder().encode(text));
    dispatch({
      type: "set-input",
      input: { kind: "text", text },
      mode: isAge ? "decrypt" : "encrypt",
      detectedAge: isAge,
    });
  }, []);

  const clearInput = useCallback(() => {
    dispatch({ type: "clear-input" });
  }, []);

  const { mode, input } = state;

  const submit = useCallback(
    (passphrase: string) => {
      if (input === null) {
        return;
      }
      void (async () => {
        dispatch({ type: "submit" });
        try {
          const result =
            mode === "encrypt"
              ? await runEncrypt(input, passphrase)
              : await runDecrypt(input, passphrase);
          dispatch({ type: "finished", result });
        } catch (error) {
          dispatch({
            type: "submit-failed",
            message: submitErrorMessage(error, mode),
          });
        }
      })();
    },
    [mode, input],
  );

  const setOutputName = useCallback((name: string) => {
    dispatch({ type: "set-output-name", name });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  return {
    ...state,
    step: stepOf(state),
    setMode,
    loadFiles,
    loadText,
    clearInput,
    submit,
    setOutputName,
    reset,
  };
}

async function runEncrypt(input: InputSource, passphrase: string): Promise<AgedResult> {
  const generated = passphrase === "";
  const effective = generated ? generatePassphrase() : passphrase;
  const bytes = await encrypt(inputBytes(input), effective);
  return {
    mode: "encrypt",
    bytes,
    suggestedName: encryptedName(input.kind === "file" ? input.name : null),
    nameFellBack: false,
    generatedPassphrase: generated ? effective : null,
    textPreview: null,
  };
}

async function runDecrypt(input: InputSource, passphrase: string): Promise<AgedResult> {
  const bytes = await decrypt(inputBytes(input), passphrase);
  const { name, fellBack } = decryptedName(input.kind === "file" ? input.name : null);
  return {
    mode: "decrypt",
    bytes,
    suggestedName: name,
    nameFellBack: fellBack,
    generatedPassphrase: null,
    textPreview: textPreviewOf(bytes),
  };
}
