import {
  EyeIcon,
  EyeOffIcon,
  FileKeyIcon,
  type LucideIcon,
  PaperclipIcon,
  TypeIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import type { InputSource, Mode } from "@/hooks/use-aged";
import { estimateEntropyBits } from "@/lib/crypto/passphrase";
import { usePaste } from "@/hooks/use-paste";
import { readPassphraseFile, type PassphraseFile } from "@/lib/passphrase-file";
import { secretFieldProps } from "@/lib/secret-fields";
import { fileIconFor } from "@/lib/file-icon";
import { formatBytes } from "@/lib/format";
import { Collapse } from "@/components/collapse";
import { cell } from "@/components/lattice";
import { StrengthBar } from "@/components/strength-bar";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

interface PassphraseStepProps {
  mode: Mode;
  input: InputSource;
  working: boolean;
  submitError: string | null;
  /** Files dropped on this step, offered as the passphrase. */
  droppedFiles: readonly File[] | null;
  onSubmit: (passphrase: string) => void;
  onBack: () => void;
  onDroppedFilesHandled: () => void;
}

export function PassphraseStep({
  mode,
  input,
  working,
  submitError,
  droppedFiles,
  onSubmit,
  onBack,
  onDroppedFilesHandled,
}: PassphraseStepProps) {
  const errorId = useId();
  // The vendored Input does not forward refs, so focus is reached through
  // the field wrapper rather than the control itself.
  const passphraseFieldRef = useRef<HTMLDivElement>(null);
  const confirmFieldRef = useRef<HTMLDivElement>(null);
  const passphraseFilePickerRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  // Set when the passphrase arrived whole, out of a file, rather than being
  // typed. While it is set the field gives way to a chip naming the file, so
  // there is nothing to edit — the chip's own control is the way out.
  const [suppliedFrom, setSuppliedFrom] = useState<string | null>(null);

  const encrypting = mode === "encrypt";

  // Writing to the field goes through the editing pipeline rather than
  // assigning to `value`, so React sees the same input event typing
  // produces and the field stays uncontrolled.
  function writePassphrase(text: string): boolean {
    // Excluding the file picker, which shares this wrapper and would
    // otherwise be matched first if it ever moved above the field.
    const field = passphraseFieldRef.current?.querySelector<HTMLInputElement>(
      "input:not([type=file])",
    );
    if (field === null || field === undefined) {
      return false;
    }
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
    document.execCommand("insertText", false, text);
    return true;
  }

  // A file is the whole passphrase rather than something typed into the
  // field, so it goes straight to state and the field gives way to a chip
  // naming it. The passphrase never reaches the DOM at all this way.
  function applyPassphraseFile(result: PassphraseFile) {
    if (!result.ok) {
      setLocalError(result.message);
      return;
    }
    setValue(result.passphrase);
    setConfirm("");
    setLocalError(null);
    setSuppliedFrom(result.name);
  }

  function handlePickedPassphraseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Cleared before anything else so the same file can be picked twice:
    // after removing the chip, re-attaching what was just there is the most
    // likely next move, and an unchanged value fires no change event.
    event.target.value = "";
    if (file === undefined) {
      return;
    }
    void readPassphraseFile(file).then(applyPassphraseFile);
  }

  // Removing it leaves an empty field rather than the file's text to edit
  // around: a passphrase file is an exact record, and half-editing one is
  // never what was meant. Type a new one and it confirms as usual.
  function clearSuppliedPassphrase() {
    setValue("");
    setConfirm("");
    setLocalError(null);
    setSuppliedFrom(null);
  }

  useEffect(() => {
    if (droppedFiles === null) {
      return;
    }
    // Taken as soon as it is read, not when the read resolves: leaving the
    // step mid-read would otherwise strand the file in the parent's state and
    // apply it, unasked, the next time this step opened.
    onDroppedFilesHandled();
    const [file] = droppedFiles;
    if (droppedFiles.length > 1 || file === undefined) {
      // The pick step answers the same gesture by name; silently adopting
      // whichever the browser happened to order first would not.
      setLocalError("One passphrase file at a time.");
      return;
    }
    let cancelled = false;
    void readPassphraseFile(file).then((result) => {
      if (!cancelled) {
        applyPassphraseFile(result);
      }
    });
    return () => {
      cancelled = true;
    };
    // The dropped files are the only trigger. `applyPassphraseFile` is captured
    // here and never re-read, which is safe only because it touches nothing
    // but state setters — give it a prop or a state read and it needs a dep.
  }, [droppedFiles]);

  // The input is already loaded and must stay that way: a paste on this step
  // is a passphrase, never a replacement for what is about to be encrypted.
  usePaste({
    disabled: working,
    onFiles: (files) => {
      const [file] = files;
      if (file !== undefined) {
        void readPassphraseFile(file).then(applyPassphraseFile);
      }
    },
    // There is no field to write into while a file is attached, and the
    // paste has already been claimed by then, so it has to be answered.
    onText: (text) => {
      if (!writePassphrase(text)) {
        setLocalError("Remove the attached passphrase file first, then paste.");
      }
    },
  });

  const confirming = encrypting && value !== "" && suppliedFrom === null;

  // The field is keyed to remount when the row closes so no stale DOM value
  // survives it; the state mirroring that field has to go the same way, or a
  // confirmation can be satisfied by text that is no longer on screen.
  useEffect(() => {
    if (!confirming) {
      setConfirm("");
    }
  }, [confirming]);
  const error = localError ?? submitError;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (working) {
      return;
    }
    if (encrypting) {
      if (value !== "" && value.trim() === "") {
        setLocalError("Spaces alone won't work — type something, or leave it empty.");
        return;
      }
      // Only what was typed gets confirmed. A passphrase out of a file has
      // no confirm field to fill, so checking it against an empty `confirm`
      // is a dead end with no control to escape it.
      if (suppliedFrom === null && value !== confirm && value !== "") {
        setLocalError("The passphrases don't match.");
        return;
      }
      onSubmit(value);
      return;
    }
    if (value === "") {
      setLocalError("Enter the passphrase this file was encrypted with.");
      return;
    }
    onSubmit(value);
  }

  return (
    <form className={cell.stepBody} onSubmit={handleSubmit}>
      <SummaryChip
        // Below md there is no margin to hold the step's Back, so the chip
        // carries it.
        action={
          working ? undefined : (
            <Button
              aria-label="Go back"
              className="md:hidden"
              onClick={onBack}
              size="icon-xs"
              variant="ghost"
            >
              <XIcon aria-hidden="true" />
            </Button>
          )
        }
        detail={
          input.kind === "file"
            ? formatBytes(input.bytes.length)
            : `${input.text.length.toLocaleString()} characters`
        }
        icon={input.kind === "file" ? fileIconFor(input.name) : TypeIcon}
        name={input.kind === "file" ? input.name : "message"}
      />

      <Field className="flex w-full flex-col gap-2.5" name="passphrase" ref={passphraseFieldRef}>
        <FieldLabel>Passphrase</FieldLabel>
        {suppliedFrom !== null ? (
          <SummaryChip
            action={
              working ? undefined : (
                <Button
                  aria-label="Remove this passphrase file"
                  onClick={clearSuppliedPassphrase}
                  size="icon-xs"
                  variant="ghost"
                >
                  <XIcon aria-hidden="true" />
                </Button>
              )
            }
            // Encrypting only: explains the confirm field's absence.
            detail={encrypting ? "Nothing to confirm" : undefined}
            icon={FileKeyIcon}
            name={suppliedFrom}
          />
        ) : (
          <div className="flex w-full gap-2">
            <InputGroup className="min-w-0 flex-1">
              {/* Deliberately uncontrolled: a controlled input makes React
                mirror the value into the DOM's value attribute, putting the
                passphrase into the serialized document. State still tracks
                the text via onChange for validation and the strength bar. */}
              <InputGroupInput
                {...secretFieldProps}
                aria-describedby={error === null ? undefined : errorId}
                aria-invalid={error !== null || undefined}
                autoFocus
                disabled={working}
                onChange={(event) => {
                  setValue(event.target.value);
                  setLocalError(null);
                }}
                onKeyDown={(event) => {
                  // With a passphrase typed, Enter belongs to the confirm
                  // field; submitting here would skip it. An empty field means
                  // "generate one for me", which has nothing to confirm.
                  if (event.key === "Enter" && encrypting && event.currentTarget.value !== "") {
                    event.preventDefault();
                    confirmFieldRef.current?.querySelector("input")?.focus();
                  }
                }}
                size="lg"
                type={visible ? "text" : "password"}
              />
              <InputGroupAddon align="inline-end">
                <Button
                  aria-label="Use a passphrase file"
                  disabled={working}
                  onClick={() => passphraseFilePickerRef.current?.click()}
                  size="icon-xs"
                  variant="ghost"
                >
                  <PaperclipIcon aria-hidden="true" />
                </Button>
                <Button
                  aria-label={visible ? "Hide passphrase" : "Show passphrase"}
                  disabled={working}
                  onClick={() => setVisible((current) => !current)}
                  size="icon-xs"
                  variant="ghost"
                >
                  {visible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
                </Button>
              </InputGroupAddon>
            </InputGroup>
            {/* No `accept`: that list is extension-based, and what a file is
              here is decided from its content — an accept list would hide a
              legitimate extensionless key file and still be fooled by a
              renamed PNG. readPassphraseFile says no with a real reason. */}
            <input
              className="hidden"
              onChange={handlePickedPassphraseFile}
              ref={passphraseFilePickerRef}
              type="file"
            />
          </div>
        )}
        {suppliedFrom === null &&
          (encrypting ? (
            !confirming && (
              <FieldDescription>
                Leave it empty and a strong one will be generated for you.
              </FieldDescription>
            )
          ) : (
            <FieldDescription>Type it, paste it, or attach the passphrase file.</FieldDescription>
          ))}
      </Field>

      <Collapse show={confirming}>
        {/* Keyed on whether the row is open: the field is uncontrolled, so
            without a remount its DOM value survives a collapse and reappears
            as a stale confirmation that can never match. */}
        <div className="flex w-full flex-col gap-5 pb-px" key={confirming ? "open" : "closed"}>
          <StrengthBar bits={estimateEntropyBits(value)} />
          <Field className="flex w-full flex-col gap-2.5" name="confirm" ref={confirmFieldRef}>
            <FieldLabel>Confirm passphrase</FieldLabel>
            <InputGroup>
              <InputGroupInput
                {...secretFieldProps}
                disabled={working}
                onChange={(event) => {
                  setConfirm(event.target.value);
                  setLocalError(null);
                }}
                size="lg"
                type={visible ? "text" : "password"}
              />
            </InputGroup>
          </Field>
        </div>
      </Collapse>

      {error !== null && (
        <p className="text-destructive-foreground text-sm" id={errorId} role="alert">
          {error}
        </p>
      )}

      <Button className="w-full" disabled={working} size="lg" type="submit">
        {working && <Spinner aria-hidden="true" />}
        {working
          ? encrypting
            ? "Encrypting…"
            : "Decrypting…"
          : encrypting
            ? "Encrypt"
            : "Decrypt"}
      </Button>
    </form>
  );
}

/**
 * The row that stands for a thing already chosen — the input on its way in,
 * or a passphrase that arrived as a file rather than being typed. Both say
 * the same thing in the same shape: here is what it is, here is how much of
 * it, and here is the way to take it back.
 */
function SummaryChip({
  icon: Icon,
  name,
  detail,
  action,
}: {
  icon: LucideIcon;
  name: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-lg border bg-muted/40 py-2.5 pe-2 ps-3.5">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      {/* The name is a label on what you already chose, not a heading — it
          reads at the same size as the detail beside it. */}
      <span className="min-w-0 flex-1 truncate text-sm" title={name}>
        {name}
      </span>
      {detail !== undefined && (
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">{detail}</span>
      )}
      {action}
    </div>
  );
}
