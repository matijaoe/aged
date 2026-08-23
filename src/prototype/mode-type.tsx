import { motion } from "motion/react";
import { useState } from "react";

import { RadioGroupPrimitive, RadioPrimitive } from "@/components/ui/radio-group";

const modes = [
  { value: "encrypt", label: "Encrypt" },
  { value: "decrypt", label: "Decrypt" },
] as const;

/**
 * The mode as the top cell's own statement: both words set large, the
 * inactive one dimmed, and a rule that slides between them. The slide is
 * the feedback when a dropped age file switches the mode.
 */
export function ModeType() {
  const [mode, setMode] = useState<string>("encrypt");
  return (
    <RadioGroupPrimitive
      aria-label="Mode"
      className="flex items-baseline gap-6 font-semibold text-2xl tracking-tight"
      onValueChange={(value) => setMode(String(value))}
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
  );
}
