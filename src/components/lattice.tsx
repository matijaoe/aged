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

export function Lattice({
  children,
  active = false,
}: {
  children: ReactNode;
  /** Lights the rules while a file is held over the page. */
  active?: boolean;
}) {
  return (
    <div
      className="relative flex h-dvh flex-col justify-center overflow-hidden bg-background"
      style={{ ["--col" as string]: column }}
    >
      <Column active={active} side="left" />
      <Column active={active} side="right" />
      {children}
    </div>
  );
}

const ruleColor = (active: boolean) =>
  active ? "bg-ring/64 transition-colors duration-200" : "bg-border transition-colors duration-200";

function Column({ active, side }: { active: boolean; side: "left" | "right" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-0 z-10 w-px",
        ruleColor(active),
        side === "left"
          ? "left-1/2 -translate-x-[calc(var(--col)/2)]"
          : "left-1/2 translate-x-[calc(var(--col)/2)]",
      )}
    />
  );
}

/**
 * The small square where a row rule crosses a column rule. The rules are
 * 1px boxes drawn from their start edge, so the node centres on that edge
 * plus half a pixel to sit on the rule's true centre line.
 */
function Node({ active, side }: { active: boolean; side: "left" | "right" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 z-20 size-[7px]",
        "translate-x-[calc(-50%+0.5px)] translate-y-[calc(-50%+0.5px)]",
        active ? "bg-ring/72" : "bg-foreground/16",
        "transition-colors duration-200",
        side === "left" ? "left-[calc(50%-var(--col)/2)]" : "left-[calc(50%+var(--col)/2)]",
      )}
    />
  );
}

/**
 * A band of the lattice: the left margin cell, the centre cell, and the
 * right margin cell.
 */
export function LatticeRow({
  className,
  rule = false,
  active = false,
  left,
  center,
  right,
}: {
  /** Band sizing: a fixed height, or grow with a cap for the body. */
  className: string;
  /** Draw the row rule, and its nodes, along this row's top edge. */
  rule?: boolean;
  active?: boolean;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className={cn("relative flex justify-center", className)}>
      {rule && (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-10 h-px",
              ruleColor(active),
            )}
          />
          <Node active={active} side="left" />
          <Node active={active} side="right" />
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

/** One gutter for every cell, and the two ways content meets a rule. */
export const cell = {
  gutter: "px-4",
  sitsOnRule: "items-end pb-4",
  hangsFromRule: "items-start pt-4",
} as const;
