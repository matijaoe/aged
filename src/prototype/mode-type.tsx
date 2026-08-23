import { ArrowLeftRightIcon } from "lucide-react";
import { motion } from "motion/react";

import { RadioGroupPrimitive, RadioPrimitive } from "@/components/ui/radio-group";

export type ModeTreatment = "underline" | "statement";

const modes = [
  { value: "encrypt", label: "Encrypt" },
  { value: "decrypt", label: "Decrypt" },
] as const;

/** Both words set large, the inactive dimmed, a rule sliding between them. */
function Underline({ mode, onChange }: { mode: string; onChange: (mode: string) => void }) {
  return (
    <div className="flex h-full w-full items-end justify-center px-4 pb-4">
      <RadioGroupPrimitive
        aria-label="Mode"
        className="flex items-baseline gap-7 font-semibold text-2xl tracking-tight"
        onValueChange={(value) => onChange(String(value))}
        value={mode}
      >
        {modes.map((item) => (
          <RadioPrimitive.Root
            className="relative cursor-pointer select-none pb-2 text-muted-foreground/40 outline-2 outline-transparent transition-colors hover:text-muted-foreground focus-visible:outline-ring data-checked:text-foreground"
            key={item.value}
            value={item.value}
          >
            {item.label}
            {mode === item.value && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-px bg-foreground"
                layoutId="mode-underline"
                transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              />
            )}
          </RadioPrimitive.Root>
        ))}
      </RadioGroupPrimitive>
    </div>
  );
}

/**
 * The cell states what is about to happen. With header sniffing the mode is
 * usually derived rather than chosen, so this reads as status with a switch
 * available, not as a question the user must answer first.
 */
function Statement({ mode, onChange }: { mode: string; onChange: (mode: string) => void }) {
  const current = modes.find((item) => item.value === mode) ?? modes[0];
  const other = modes.find((item) => item.value !== mode) ?? modes[1];
  return (
    <div className="flex h-full w-full items-end justify-between gap-4 px-4 pb-4">
      <motion.span
        className="font-semibold text-3xl text-foreground tracking-tight"
        key={current.value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {current.label}
      </motion.span>
      <button
        className="flex cursor-pointer items-center gap-2 text-muted-foreground/64 text-sm outline-2 outline-transparent transition-colors hover:text-foreground focus-visible:outline-ring"
        onClick={() => onChange(other.value)}
        type="button"
      >
        <ArrowLeftRightIcon aria-hidden="true" className="size-3.5" />
        {other.label} instead
      </button>
    </div>
  );
}

export function ModeCell({
  treatment,
  mode,
  onChange,
}: {
  treatment: ModeTreatment;
  mode: string;
  onChange: (mode: string) => void;
}) {
  if (treatment === "statement") {
    return <Statement mode={mode} onChange={onChange} />;
  }
  return <Underline mode={mode} onChange={onChange} />;
}
