import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The page is the grid: a lattice drawn with four rules — two column rules
 * running the full height of the viewport and two row rules running its
 * full width — with a node sitting on each crossing.
 *
 * The page is exactly one viewport and never scrolls. The body band takes
 * the space the fixed bands leave, capped at a comfortable height, so on a
 * tall screen the composition sits centred with slack outside the rules and
 * on a short screen the band shrinks instead of overflowing. Content that
 * outgrows the band is the band's problem to absorb, not the page's.
 */

/** Narrow viewports shrink the centre column instead of overflowing. */
const column = "min(34rem, calc(100vw - 2.5rem))";

/**
 * The three bands, owned here rather than by callers: "two fixed, one
 * capped-flex" is the invariant that keeps the page from scrolling, and a
 * caller passing its own height could break it. Below `md` the top band
 * grows, because the wordmark joins the mode statement there and the pair
 * does not fit in 96px.
 */
const bands = {
  top: "h-24 shrink-0 max-md:h-auto max-md:min-h-24",
  body: "min-h-0 max-h-[30rem] flex-1",
  bottom: "h-24 shrink-0",
} as const;

export type Band = keyof typeof bands;

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
        "pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px bg-border",
        side === "left"
          ? "-translate-x-[calc(var(--col)/2)]"
          : "translate-x-[calc(var(--col)/2)]",
      )}
    />
  );
}

/**
 * The rules are 1px boxes drawn from their start edge, so a node centres on
 * that edge plus half a pixel to sit on the rule's true centre line.
 */
function Node({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 z-20 size-[7px] bg-foreground/16",
        "translate-x-[calc(-50%+0.5px)] translate-y-[calc(-50%+0.5px)]",
        side === "left" ? "left-[calc(50%-var(--col)/2)]" : "left-[calc(50%+var(--col)/2)]",
      )}
    />
  );
}

export function LatticeRow({
  band,
  className,
  rule = false,
  left,
  center,
  right,
}: {
  band: Band;
  /** Per-call tweaks only; the band owns the sizing. */
  className?: string;
  /** Draw the row rule, and its nodes, along this row's top edge. */
  rule?: boolean;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className={cn("relative flex justify-center", bands[band], className)}>
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
      {/* Reading order is left, centre, right so the wordmark's h1 precedes
          the mode's h2. The margin cells are positioned, so this costs
          nothing visually. */}
      <MarginCell side="left">{left}</MarginCell>
      <div className="flex w-[var(--col)] shrink-0 grow-0">{center}</div>
      <MarginCell side="right">{right}</MarginCell>
    </div>
  );
}

function MarginCell({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  return (
    <div
      className={cn(
        // Empty margins must not swallow clicks meant for the page; children
        // opt back in.
        "pointer-events-none absolute inset-y-0 flex w-[calc(50%-var(--col)/2)] [&>*]:pointer-events-auto",
        cell.gutter,
        side === "left" ? "right-1/2 mr-[calc(var(--col)/2)]" : "left-1/2 ml-[calc(var(--col)/2)]",
      )}
    >
      {children}
    </div>
  );
}

/** One gutter for every cell, and the two ways content meets a rule. */
export const cell = {
  gutter: "px-4",
  sitsOnRule: "items-end pb-4",
  hangsFromRule: "items-start pt-4",
  /**
   * A step's own container: absorb overflow internally so the band never
   * grows and the page never scrolls.
   */
  stepBody: "flex min-h-0 w-full flex-col gap-5 overflow-y-auto overscroll-contain",
} as const;
