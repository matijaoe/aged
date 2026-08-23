import { FileUpIcon, TriangleAlertIcon } from "lucide-react";

import { maxFileBytes, type Mode, type Notice } from "@/hooks/use-aged";
import { cliCommand } from "@/lib/cli";
import { stripAgeSuffix } from "@/lib/crypto/filename";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PickStepProps {
  mode: Mode;
  notice: Notice | null;
  isDragActive: boolean;
  onBrowse: () => void;
}

export function PickStep({ mode, notice, isDragActive, onBrowse }: PickStepProps) {
  return (
    // Bled out on all four sides: the lattice already draws the rectangle,
    // and the drop target is the whole page — a box inside it would claim a
    // boundary that doesn't exist. The negative margins cancel the cell's
    // padding so the fill meets the rules exactly.
    <div className="-mx-4 -mt-4 -mb-6 flex min-h-0 flex-1 flex-col self-stretch">
      <button
        className={cn(
          "flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2.5 outline-2 -outline-offset-2 outline-transparent transition-colors focus-visible:outline-ring",
          isDragActive ? "bg-accent" : "hover:bg-accent/40",
        )}
        onClick={onBrowse}
        type="button"
      >
        <FileUpIcon aria-hidden="true" className="size-6 text-muted-foreground" />
        {/* "Anything" is the honest headline: both kinds of input arrive the
            same way and the mode is worked out from what lands. */}
        <span className="font-medium text-base">
          {isDragActive ? "Drop it here" : "Drop or paste anything"}
        </span>
        {/* The two ways in that need a name, since neither is something you
            would guess. Mid-drag they are the wrong instruction, and typing
            is only a way in where there is a keyboard, which a coarse
            pointer says there probably isn't. */}
        {!isDragActive && (
          <span className="text-muted-foreground text-sm">
            Browse for a file
            <span className="hidden pointer-fine:inline">, or type to encrypt a message</span>
          </span>
        )}
      </button>

      {notice !== null && (
        <div className="shrink-0 px-4 pb-4" role="alert">
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
  const hintMode = stripAgeSuffix(notice.name) === notice.name ? mode : "decrypt";
  return (
    <Alert variant="warning">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>Too big for the browser</AlertTitle>
      <AlertDescription>
        {notice.name} is {formatBytes(notice.size)}, and aged stops at {formatBytes(maxFileBytes)}.
        The age CLI has no limit:
        <code className="mt-1 block break-all font-mono text-xs">
          {cliCommand(hintMode, notice.name)}
        </code>
      </AlertDescription>
    </Alert>
  );
}
