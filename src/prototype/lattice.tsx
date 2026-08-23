import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A fixed three-column, three-row lattice drawn with exactly four rules:
 * two column rules running the full height of the viewport and two row
 * rules running its full width. Regions are the cells those rules already
 * make — nothing is subdivided further, and no row changes height when the
 * step changes.
 */

const column = "31rem";

export function Lattice({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full" style={{ ["--col" as string]: column }}>
      <Column className="left-1/2 -translate-x-[calc(var(--col)/2)]" />
      <Column className="left-1/2 translate-x-[calc(var(--col)/2)]" />
      {children}
    </div>
  );
}

function Column({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-y-[-100vh] w-px bg-border", className)}
    />
  );
}

/**
 * One row of the lattice: a fixed-height band split into the left margin
 * cell, the centre cell, and the right margin cell.
 */
export function LatticeRow({
  height,
  rule = false,
  left,
  center,
  right,
}: {
  height: string;
  /** Draw the row rule along this row's top edge. */
  rule?: boolean;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className={cn("relative flex justify-center", height)}>
      {rule && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[-100vw] top-0 h-px bg-border"
        />
      )}
      <div className="flex w-[var(--col)] shrink-0 grow-0 justify-center">{center}</div>
      <div className="pointer-events-none absolute inset-y-0 right-1/2 mr-[calc(var(--col)/2)] flex w-[min(22rem,calc(50vw-var(--col)/2))]">
        <div className="pointer-events-auto flex w-full">{left}</div>
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-1/2 ml-[calc(var(--col)/2)] flex w-[min(22rem,calc(50vw-var(--col)/2))]">
        <div className="pointer-events-auto flex w-full">{right}</div>
      </div>
    </div>
  );
}
