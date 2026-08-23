import { FileUpIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";

import { maxFileBytes, type Mode, type Notice } from "@/hooks/use-aged";
import { cliCommand } from "@/lib/cli";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface PickStepProps {
  mode: Mode;
  notice: Notice | null;
  isDragActive: boolean;
  /** Composing a message rather than choosing a file. */
  writing: boolean;
  onBrowse: () => void;
  onText: (text: string) => void;
  onCancelWriting: () => void;
}

export function PickStep({
  mode,
  notice,
  isDragActive,
  writing,
  onBrowse,
  onText,
  onCancelWriting,
}: PickStepProps) {
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
              mode === "encrypt" ? "Write something to encrypt…" : "Armored age text…"
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
          <Button onClick={onCancelWriting} size="lg" variant="ghost">
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
      {/* No border, and bled out to the rules: the lattice already draws the
          rectangle, and the drop target is the whole page — a box here would
          claim a boundary that doesn't exist. The negative margins cancel the
          cell's gutter so the fill meets the rules exactly. */}
      <button
        className={cn(
          "-mx-4 -mt-4 flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2.5 outline-2 -outline-offset-2 outline-transparent transition-colors focus-visible:outline-ring",
          isDragActive ? "bg-accent" : "hover:bg-accent/40",
        )}
        onClick={onBrowse}
        type="button"
      >
        <FileUpIcon aria-hidden="true" className="size-6 text-muted-foreground" />
        <span className="font-medium text-base">
          {isDragActive ? "Drop it here" : "Drop a file, paste, or click to browse"}
        </span>
        <span className="text-muted-foreground text-sm">Up to {formatBytes(maxFileBytes)}</span>
      </button>

      {notice !== null && (
        <div className="shrink-0" role="alert">
          <NoticeAlert mode={mode} notice={notice} />
        </div>
      )}

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
