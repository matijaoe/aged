import { ArrowLeftRightIcon } from "lucide-react";
import { motion } from "motion/react";


const modes = [
  { value: "encrypt", label: "Encrypt" },
  { value: "decrypt", label: "Decrypt" },
] as const;

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
  mode,
  onChange,
}: {
  mode: string;
  onChange: (mode: string) => void;
}) {
  return <Statement mode={mode} onChange={onChange} />;
}
