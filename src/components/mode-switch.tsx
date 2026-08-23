import { motion } from "motion/react";

import type { Mode } from "@/hooks/use-aged";
import {
  segmentedControlItemVariants,
  segmentedControlRootClassName,
} from "@/lib/segmented-control";
import { cn } from "@/lib/utils";
import { RadioGroupPrimitive, RadioPrimitive } from "@/components/ui/radio-group";

/**
 * The Encrypt/Decrypt segmented control — a radio group, since exactly one
 * mode is always selected. The thumb is a shared motion element so that
 * when a dropped age file switches the mode, the slide itself is the
 * feedback.
 */

const modes = [
  { value: "encrypt", label: "Encrypt" },
  { value: "decrypt", label: "Decrypt" },
] as const;

// The checked background is rendered by the motion thumb instead of the
// recipe's data-checked classes, so it can slide between items.
const itemClassName = cn(
  segmentedControlItemVariants({ size: "default" }),
  "grow data-checked:text-foreground",
);

interface ModeSwitchProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  disabled?: boolean;
}

export function ModeSwitch({ mode, onModeChange, disabled = false }: ModeSwitchProps) {
  return (
    <RadioGroupPrimitive
      aria-label="Mode"
      className={cn(segmentedControlRootClassName, "w-full")}
      disabled={disabled}
      value={mode}
      onValueChange={(value) => {
        onModeChange(value as Mode);
      }}
    >
      {modes.map((item) => (
        <RadioPrimitive.Root className={itemClassName} key={item.value} value={item.value}>
          {mode === item.value && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-md bg-background shadow-sm/5 dark:bg-input"
              layoutId="mode-switch-thumb"
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            />
          )}
          {item.label}
        </RadioPrimitive.Root>
      ))}
    </RadioGroupPrimitive>
  );
}
