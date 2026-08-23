import { CopyIcon, FileUpIcon, PenLineIcon } from "lucide-react";

import {
  segmentedControlItemVariants,
  segmentedControlRootClassName,
} from "@/lib/segmented-control";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadioGroupPrimitive, RadioPrimitive } from "@/components/ui/radio-group";

/**
 * Static stand-ins for the real flow, one size larger than today, used to
 * judge layout only. No crypto, no state machine.
 */

export function ModeSwitchLg() {
  const itemClassName = cn(segmentedControlItemVariants({ size: "lg", state: "checked" }), "grow");
  return (
    <RadioGroupPrimitive
      aria-label="Mode"
      className={cn(segmentedControlRootClassName, "w-full")}
      defaultValue="encrypt"
    >
      <RadioPrimitive.Root className={itemClassName} value="encrypt">
        Encrypt
      </RadioPrimitive.Root>
      <RadioPrimitive.Root className={itemClassName} value="decrypt">
        Decrypt
      </RadioPrimitive.Root>
    </RadioGroupPrimitive>
  );
}

export function DropZoneLg({ bare = false }: { bare?: boolean }) {
  return (
    <button
      className={cn(
        "flex w-full cursor-pointer flex-col items-center gap-2.5 rounded-xl px-6 py-14 transition-colors",
        bare
          ? "border border-border border-dashed hover:bg-muted/40"
          : "border border-input border-dashed bg-muted/40 hover:bg-muted",
      )}
      type="button"
    >
      <FileUpIcon aria-hidden="true" className="size-6 text-muted-foreground" />
      <span className="font-medium text-base">Drop a file anywhere, or browse</span>
      <span className="text-muted-foreground text-sm">
        Up to 100 MB · nothing leaves your browser
      </span>
    </button>
  );
}

export function WriteInstead() {
  return (
    <Button className="self-center" size="default" variant="ghost">
      <PenLineIcon aria-hidden="true" />
      Write a message instead
    </Button>
  );
}

export function CliLine({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <code className="min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs">
        <span aria-hidden="true" className="select-none text-muted-foreground/56">
          ${" "}
        </span>
        age -p -o file.age file
      </code>
      <Button aria-label="Copy command" size="icon-xs" variant="ghost">
        <CopyIcon aria-hidden="true" />
      </Button>
    </div>
  );
}

export function Wordmark({ centered = false }: { centered?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1", centered && "items-center text-center")}>
      <h1 className="font-semibold text-foreground text-lg tracking-tight">aged</h1>
      <p className="text-muted-foreground text-sm">age encryption, entirely in your browser.</p>
    </div>
  );
}
