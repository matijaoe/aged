import { FileUpIcon, PenLineIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";

import { maxFileBytes, type Mode, type Notice } from "@/hooks/use-aged";
import { cliCommand } from "@/lib/cli";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { cell } from "@/components/lattice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface PickStepProps {
  mode: Mode;
  notice: Notice | null;
  isDragActive: boolean;
  onBrowse: () => void;
  onText: (text: string) => void;
}

export function PickStep({ mode, notice, isDragActive, onBrowse, onText }: PickStepProps) {
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");

  if (writing) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
        <Field className="flex min-h-0 w-full flex-1 flex-col gap-2.5">
          <FieldLabel className="text-base">
            {mode === "encrypt" ? "Message" : "Armored age text"}
          </FieldLabel>
          {/* Spell check and translation ship editable content to vendor
              servers; this field holds plaintext about to be encrypted. */}
          <Textarea
            autoCapitalize="off"
            autoCorrect="off"
            autoFocus
            className="min-h-0 w-full flex-1 font-mono [&_textarea]:h-full [&_textarea]:min-h-0 [&_textarea]:resize-none [&_textarea]:field-sizing-fixed"
            data-gramm="false"
            onChange={(event) => setText(event.target.value)}
            placeholder={
              mode === "encrypt" ? "Write something to encrypt…" : "Paste an armored age file…"
            }
            size="lg"
            spellCheck={false}
            translate="no"
            value={text}
          />
        </Field>
        <div className="flex w-full shrink-0 gap-2">
          <Button
            className="flex-1"
            disabled={text.trim() === ""}
            onClick={() => onText(text)}
            size="lg"
          >
            Continue
          </Button>
          <Button onClick={() => setWriting(false)} size="lg" variant="ghost">
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cell.stepBody}>
      <button
        className={cn(
          "flex w-full cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-dashed px-6 py-14 outline-2 outline-transparent transition-colors focus-visible:outline-ring",
          isDragActive ? "border-ring bg-accent/64" : "border-border hover:bg-accent/40",
        )}
        onClick={onBrowse}
        type="button"
      >
        <FileUpIcon aria-hidden="true" className="size-6 text-muted-foreground" />
        <span className="font-medium text-base">
          {isDragActive ? "Drop it here" : "Drop a file anywhere, or browse"}
        </span>
        <span className="text-muted-foreground text-sm">Up to {formatBytes(maxFileBytes)}</span>
      </button>

      {notice !== null && (
        <div role="alert">
          <NoticeAlert mode={mode} notice={notice} />
        </div>
      )}

      <Button className="self-center" onClick={() => setWriting(true)} variant="ghost">
        <PenLineIcon aria-hidden="true" />
        {mode === "encrypt" ? "Encrypt a message instead" : "Paste a message instead"}
      </Button>
    </div>
  );
}

function NoticeAlert({ mode, notice }: { mode: Mode; notice: Notice }) {
  if (notice.kind === "multiple-files") {
    return (
      <Alert variant="warning">
        <TriangleAlertIcon aria-hidden="true" />
        <AlertTitle>One file at a time</AlertTitle>
        <AlertDescription>Drop a single file and it will load right away.</AlertDescription>
      </Alert>
    );
  }
  if (notice.kind === "unreadable") {
    return (
      <Alert variant="warning">
        <TriangleAlertIcon aria-hidden="true" />
        <AlertTitle>Couldn't read {notice.name}</AlertTitle>
        <AlertDescription>
          The file may have moved or changed since you picked it. Try dropping it again.
        </AlertDescription>
      </Alert>
    );
  }
  // An oversized file never gets header-sniffed, so infer the likely intent
  // from its name for the escape-hatch command.
  const hintMode = notice.name.toLowerCase().endsWith(".age") ? "decrypt" : mode;
  return (
    <Alert variant="warning">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Too big for the browser</AlertTitle>
      <AlertDescription>
        {notice.name} is {formatBytes(notice.size)}, and aged stops at{" "}
        {formatBytes(maxFileBytes)}. The age CLI has no limit:
        <code className="mt-1 block break-all font-mono text-xs">
          {cliCommand(hintMode, notice.name)}
        </code>
      </AlertDescription>
    </Alert>
  );
}
