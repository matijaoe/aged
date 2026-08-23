import { ArrowLeftRightIcon } from "lucide-react";
import { motion } from "motion/react";

import type { Mode } from "@/hooks/use-aged";
import { Button } from "@/components/ui/button";

const labels: Record<Mode, string> = {
  encrypt: "Encrypt",
  decrypt: "Decrypt",
};

/**
 * The mode as a statement rather than a picker. Header sniffing means the
 * mode is usually derived from what was dropped, so the cell says what is
 * about to happen and offers the override beside it. The word swapping is
 * the feedback when a dropped age file flips the mode, which is why the
 * heading is a live region — the swap is otherwise silent to a screen reader.
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
    <div className="flex h-full w-full items-end justify-between gap-4">
      <h2 aria-live="polite" className="font-semibold text-3xl tracking-tight">
        {/* Both labels are the same length, so swapping the word cannot
            change the heading's width and no spacer is needed. */}
        <motion.span
          animate={{ opacity: 1, y: 0 }}
          className="inline-block"
          initial={{ opacity: 0, y: 8 }}
          key={mode}
          transition={{ type: "spring", duration: 0.4, bounce: 0.18 }}
        >
          {labels[mode]}
        </motion.span>
      </h2>
      <Button
        className="text-muted-foreground/64 hover:text-foreground"
        disabled={disabled}
        onClick={() => onModeChange(other)}
        size="xs"
        variant="ghost"
      >
        <ArrowLeftRightIcon aria-hidden="true" />
        {labels[other]} instead
      </Button>
    </div>
  );
}
