import { EyeIcon, EyeOffIcon, TypeIcon, XIcon } from "lucide-react";
import { useId, useRef, useState } from "react";

import type { InputSource, Mode } from "@/hooks/use-aged";
import { estimateEntropyBits } from "@/lib/crypto/passphrase";
import { secretFieldProps } from "@/lib/secret-fields";
import { fileIconFor } from "@/lib/file-icon";
import { formatBytes } from "@/lib/format";
import { Collapse } from "@/components/collapse";
import { cell } from "@/components/lattice";
import { StrengthBar } from "@/components/strength-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

interface PassphraseStepProps {
  mode: Mode;
  input: InputSource;
  working: boolean;
  submitError: string | null;
  armored: boolean;
  onSubmit: (passphrase: string) => void;
  onClearInput: () => void;
  onArmoredChange: (armored: boolean) => void;
}

export function PassphraseStep({
  mode,
  input,
  working,
  submitError,
  armored,
  onSubmit,
  onClearInput,
  onArmoredChange,
}: PassphraseStepProps) {
  const errorId = useId();
  // The vendored Input does not forward refs, so focus is reached through
  // the field wrapper rather than the control itself.
  const confirmFieldRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const encrypting = mode === "encrypt";
  const confirming = encrypting && value !== "";
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
      if (value !== confirm && value !== "") {
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
    <form
      className={cell.stepBody}
      onSubmit={handleSubmit}
    >
      <InputSummary input={input} onClear={working ? null : onClearInput} />

      <Field className="flex w-full flex-col gap-2.5" name="passphrase">
        <FieldLabel className="text-base">Passphrase</FieldLabel>
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
                aria-label={visible ? "Hide passphrase" : "Show passphrase"}
                disabled={working}
                onClick={() => setVisible((current) => !current)}
                size="icon-xs"
                variant="ghost"
              >
                {visible ? (
                  <EyeOffIcon aria-hidden="true" />
                ) : (
                  <EyeIcon aria-hidden="true" />
                )}
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </div>
        {encrypting && !confirming && (
          <FieldDescription>
            Leave it empty and a strong one will be generated for you.
          </FieldDescription>
        )}
      </Field>

      <Collapse show={confirming}>
        {/* Keyed on whether the row is open: the field is uncontrolled, so
            without a remount its DOM value survives a collapse and reappears
            as a stale confirmation that can never match. */}
        <div className="flex w-full flex-col gap-5 pb-px" key={confirming ? "open" : "closed"}>
          <StrengthBar bits={estimateEntropyBits(value)} />
          <Field className="flex w-full flex-col gap-2.5" name="confirm" ref={confirmFieldRef}>
            <FieldLabel className="text-base">Confirm passphrase</FieldLabel>
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

      {encrypting && (
        <label className="flex w-full cursor-pointer items-start gap-3">
          <Checkbox
            checked={armored}
            className="mt-0.5"
            disabled={working}
            onCheckedChange={(checked) => onArmoredChange(checked === true)}
          />
          <span className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">Output as text</span>
            <span className="text-muted-foreground text-sm">
              ASCII-armored, so it can be pasted into a message.
            </span>
          </span>
        </label>
      )}

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

function InputSummary({
  input,
  onClear,
}: {
  input: InputSource;
  onClear: (() => void) | null;
}) {
  const isFile = input.kind === "file";
  const name = isFile ? input.name : "message";
  const Icon = isFile ? fileIconFor(input.name) : TypeIcon;
  const detail = isFile
    ? formatBytes(input.bytes.length)
    : `${input.text.length.toLocaleString()} characters`;
  return (
    <div className="flex w-full items-center gap-3 rounded-lg border bg-muted/40 py-2.5 pe-2 ps-3.5">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-base" title={name}>
        {name}
      </span>
      <span className="shrink-0 text-muted-foreground text-sm tabular-nums">{detail}</span>
      {onClear !== null && (
        <Button
          aria-label="Remove and start over"
          onClick={onClear}
          size="icon-xs"
          variant="ghost"
        >
          <XIcon aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
