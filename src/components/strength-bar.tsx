import { Meter, MeterIndicator, MeterTrack } from "@/components/ui/meter";
import { cn } from "@/lib/utils";

/**
 * Passphrase strength as a full-width meter with the estimate read out
 * beneath it: a word for what it means, the bit count for what it is.
 *
 * The estimate is an upper bound, so the thresholds are deliberately
 * strict — real security for a file you might share needs a generated
 * passphrase, not a memorable one.
 */

const fullBits = 128;

function grade(bits: number): { label: string; bar: string; text: string } {
  if (bits < 50) {
    return { label: "Weak", bar: "bg-destructive", text: "text-destructive-foreground" };
  }
  if (bits < 80) {
    return { label: "Fair", bar: "bg-warning", text: "text-warning-foreground" };
  }
  return { label: "Strong", bar: "bg-success", text: "text-success-foreground" };
}

export function StrengthBar({ bits }: { bits: number }) {
  const { label, bar, text } = grade(bits);
  return (
    <div className="flex w-full flex-col gap-2">
      <Meter
        aria-label="Passphrase strength"
        className="w-full"
        max={fullBits}
        value={Math.min(bits, fullBits)}
      >
        <MeterTrack className="h-1 rounded-full bg-border">
          <MeterIndicator className={cn("rounded-full", bar)} />
        </MeterTrack>
      </Meter>
      <div className="flex w-full items-baseline justify-between gap-3">
        <span className={cn("font-medium text-sm", text)}>{label}</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          ≈{Math.round(bits)} bits of entropy
        </span>
      </div>
    </div>
  );
}
