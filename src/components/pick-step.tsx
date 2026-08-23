import { FileUpIcon, PenLineIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";

import { Collapse } from "@/components/collapse";

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
  onBrowse: () => void;
  onText: (text: string) => void;
}

export function PickStep({ mode, notice, isDragActive, onBrowse, onText }: PickStepProps) {
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState("");

  if (writing) {
    return (
      <div className="flex flex-col gap-3">
        <Field>
          <FieldLabel>Message</FieldLabel>
          {/* Spell check and translation ship editable content to vendor
              servers; this field holds plaintext about to be encrypted. */}
          <Textarea
            autoCapitalize="off"
            autoCorrect="off"
            autoFocus
            className="min-h-28 font-mono text-sm"
            data-gramm="false"
            spellCheck={false}
            translate="no"
            onChange={(event) => setText(event.target.value)}
            placeholder={mode === "encrypt" ? "Write something to encrypt…" : "Paste an armored age file…"}
            value={text}
          />
        </Field>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={text.trim() === ""}
            onClick={() => onText(text)}
          >
            Continue
          </Button>
          <Button onClick={() => setWriting(false)} variant="ghost">
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 outline-2 outline-transparent transition-colors focus-visible:outline-ring",
          isDragActive
            ? "border-ring bg-accent"
            : "border-input bg-muted/40 hover:bg-muted",
        )}
        onClick={onBrowse}
        type="button"
      >
        <FileUpIcon aria-hidden="true" className="size-5 text-muted-foreground" />
        <span className="font-medium text-sm">
          {isDragActive ? "Drop it here" : "Drop a file anywhere, or browse"}
        </span>
        <span className="text-muted-foreground text-xs">
          Up to {formatBytes(maxFileBytes)} · nothing leaves your browser
        </span>
      </button>

      <Collapse show={notice !== null}>
        {notice !== null && <NoticeAlert mode={mode} notice={notice} />}
      </Collapse>

      <Button className="self-center" onClick={() => setWriting(true)} size="sm" variant="ghost">
        <PenLineIcon aria-hidden="true" />
        {mode === "encrypt" ? "Write a message instead" : "Paste armored text instead"}
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
