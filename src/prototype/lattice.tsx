import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The page is the grid: a fixed lattice drawn with four rules — two column
 * rules running the full height of the viewport and two row rules running
 * its full width — with a node sitting on each crossing. Nothing scrolls,
 * and no rule moves when the step changes; only the centre cell's contents.
 */

const column = "34rem";

export function Lattice({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex h-dvh flex-col justify-center overflow-hidden bg-background"
      style={{ ["--col" as string]: column }}
    >
      <Column side="left" />
      <Column side="right" />
      {children}
    </div>
  );
}

function Column({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-0 z-10 w-px bg-border",
        side === "left"
          ? "left-1/2 -translate-x-[calc(var(--col)/2)]"
          : "left-1/2 translate-x-[calc(var(--col)/2)]",
      )}
    />
  );
}

/** The small square where a row rule crosses a column rule. */
function Node({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 z-20",
        side === "left"
          ? "left-[calc(50%-var(--col)/2)]"
          : "left-[calc(50%+var(--col)/2)]",
      )}
    >
      <span className="block size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-[5px] border bg-background" />
    </span>
  );
}

/**
 * A band of the lattice: the left margin cell, the fixed-width centre cell,
 * and the right margin cell.
 */
export function LatticeRow({
  height,
  grow = false,
  rule = false,
  left,
  center,
  right,
}: {
  height?: string;
  grow?: boolean;
  /** Draw the row rule, and its nodes, along this row's top edge. */
  rule?: boolean;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className={cn("relative flex justify-center", grow ? "min-h-0 flex-1" : height)}>
      {rule && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-border"
          />
          <Node side="left" />
          <Node side="right" />
        </>
      )}
      <div className="flex w-[var(--col)] shrink-0 grow-0">{center}</div>
      <MarginCell side="left">{left}</MarginCell>
      <MarginCell side="right">{right}</MarginCell>
    </div>
  );
}

function MarginCell({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-y-0 flex w-[calc(50%-var(--col)/2)]",
        side === "left" ? "right-1/2 mr-[calc(var(--col)/2)]" : "left-1/2 ml-[calc(var(--col)/2)]",
      )}
    >
      <div className="pointer-events-auto flex w-full">{children}</div>
    </div>
  );
}
