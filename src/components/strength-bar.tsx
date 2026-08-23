import { Meter, MeterIndicator, MeterTrack } from "@/components/ui/meter";
import { cn } from "@/lib/utils";

/**
 * Passphrase strength as a bar that shifts color with the entropy
 * estimate, with the bit count spelled out beside it. The estimate is an
 * upper bound, so the thresholds are deliberately strict: real security
 * for an exposed age file needs a generated passphrase, not a memorable one.
 */

const fullBits = 128;

function colorFor(bits: number): string {
  if (bits < 50) {
    return "bg-destructive";
  }
  if (bits < 80) {
    return "bg-warning";
  }
  return "bg-success";
}

export function StrengthBar({ bits }: { bits: number }) {
  const shown = Math.min(bits, fullBits);
  return (
    <div className="flex items-center gap-3">
      <Meter
        aria-label="Passphrase strength"
        className="flex-1"
        max={fullBits}
        value={shown}
      >
        <MeterTrack className="h-1 rounded-full bg-border">
          <MeterIndicator className={cn("rounded-full", colorFor(bits))} />
        </MeterTrack>
      </Meter>
      <span className="text-muted-foreground text-xs tabular-nums">
        ≈{Math.round(bits)} bits
      </span>
    </div>
  );
}
