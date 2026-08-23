import { CopyIcon } from "lucide-react";

import { CopyButton } from "@/components/copy-button";

/**
 * The equivalent age CLI command, always visible. It teaches the tool and
 * is the escape hatch when anything in the browser fails.
 */
export function CliHint({ command }: { command: string }) {
  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      <code className="min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs">
        <span aria-hidden="true" className="select-none text-muted-foreground/56">
          ${" "}
        </span>
        {command}
      </code>
      <CopyButton icon={CopyIcon} size="icon-xs" subject="command" value={command} />
    </div>
  );
}
