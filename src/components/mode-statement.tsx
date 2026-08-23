import { ArrowLeftRightIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { Mode } from "@/hooks/use-aged";
import { cn } from "@/lib/utils";

const labels: Record<Mode, string> = {
  encrypt: "Encrypt",
  decrypt: "Decrypt",
};

/**
 * The mode as a statement rather than a picker. Header sniffing means the
 * mode is usually derived from what was dropped, so the cell says what is
 * about to happen and offers the override beside it. The word swapping is
 * the feedback when a dropped age file flips the mode.
 */
export function ModeStatement({
  mode,
  onModeChange,
  disabled = false,
}: {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  disabled?: boolean;
}) {
  const other: Mode = mode === "encrypt" ? "decrypt" : "encrypt";
  return (
    <div className="flex h-full w-full items-end justify-between gap-4 px-4 pb-4">
      <h2 className="relative flex font-semibold text-3xl tracking-tight">
        {/* Reserve the widest label so the override never shifts. */}
        <span aria-hidden="true" className="invisible">
          {labels.encrypt}
        </span>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0"
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: 10 }}
            key={mode}
            transition={{ type: "spring", duration: 0.4, bounce: 0.18 }}
          >
            {labels[mode]}
          </motion.span>
        </AnimatePresence>
      </h2>
      <button
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-md text-muted-foreground/64 text-sm outline-2 outline-transparent transition-colors hover:text-foreground focus-visible:outline-ring",
          disabled && "pointer-events-none opacity-64",
        )}
        disabled={disabled}
        onClick={() => onModeChange(other)}
        type="button"
      >
        <ArrowLeftRightIcon aria-hidden="true" className="size-3.5" />
        {labels[other]} instead
      </button>
    </div>
  );
}
