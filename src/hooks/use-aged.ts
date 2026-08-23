import { useCallback, useReducer } from "react";

import { decrypt, encrypt } from "@/lib/crypto/client";
import { isAgeFile } from "@/lib/crypto/detect";
import { decryptedName, encryptedName } from "@/lib/crypto/filename";
import { generatePassphrase } from "@/lib/crypto/passphrase";
import {
  backStepFrom,
  initialState,
  inputBytes,
  maxFileBytes,
  maxPreviewBytes,
  reduce,
  submitErrorMessage,
  textPreviewOf,
  type AgedResult,
  type AgedState,
  type InputSource,
  type Mode,
  type Notice,
  type Step,
} from "./aged-state";

export { maxFileBytes, maxPreviewBytes };
export type { AgedResult, InputSource, Mode, Notice, Step };

export interface Aged extends AgedState {
  /** True while an operation is in flight. */
  working: boolean;
  /** Where `back()` would land, or null when this step has no way back. */
  backStep: Step | null;
  setMode: (mode: Mode) => void;
  /** Load a dropped/browsed file list; sniffs the header to pick the mode. */
  loadFiles: (files: readonly File[]) => void;
  /** Load pasted text; armored age text switches the mode to decrypt. */
  loadText: (text: string) => void;
  /** Open the writer, seeded with the keystroke that opened it. */
  compose: (seed: string) => void;
  setDraft: (draft: string) => void;
  /** Take the composed message on as the input. */
  commitDraft: () => void;
  /** Encrypt or decrypt with the given passphrase (already validated). */
  submit: (passphrase: string) => void;
  setOutputName: (name: string) => void;
  setArmored: (armored: boolean) => void;
  back: () => void;
  startOver: () => void;
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
    dispatch({ type: "set-input", input: { kind: "text", text }, ...sniffText(text) });
  }, []);

  const compose = useCallback((seed: string) => {
    dispatch({ type: "compose", seed });
  }, []);

  const setDraft = useCallback((draft: string) => {
    dispatch({ type: "set-draft", draft });
  }, []);

  const { mode, input, draft } = state;

  const commitDraft = useCallback(() => {
    dispatch({ type: "commit-draft", input: { kind: "text", text: draft }, ...sniffText(draft) });
  }, [draft]);

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

  const setArmored = useCallback((armored: boolean) => {
    dispatch({ type: "set-armored", armored });
  }, []);

  const back = useCallback(() => {
    dispatch({ type: "back" });
  }, []);

  const startOver = useCallback(() => {
    dispatch({ type: "start-over" });
  }, []);

  return {
    ...state,
    working: state.step === "working",
    backStep: backStepFrom(state),
    setMode,
    loadFiles,
    loadText,
    compose,
    setDraft,
    commitDraft,
    submit,
    setOutputName,
    setArmored,
    back,
    startOver,
  };
}

/** Armored age text pasted or typed in switches the mode to decrypt. */
function sniffText(text: string): { mode: Mode; detectedAge: boolean } {
  // Sliced first: the markers are ASCII and live at the very start, and a
  // large armored paste would otherwise be copied to bytes just to look at
  // its head.
  const isAge = isAgeFile(new TextEncoder().encode(text.slice(0, 256)));
  return { mode: isAge ? "decrypt" : "encrypt", detectedAge: isAge };
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
    // Ciphertext is binary; the armored form is derived on the done step,
    // where the choice of how it travels actually gets made.
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
