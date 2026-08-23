import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A page-level lattice. The two column rules run the full height of the
 * viewport and every row rule runs its full width, so the regions are cells
 * of the page rather than compartments inside a box.
 */
export function Grid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative w-full", className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[-100vh] left-0 w-px bg-border"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[-100vh] right-0 w-px bg-border"
      />
      {children}
    </div>
  );
}

/** One row of the lattice. Its rule bleeds past the viewport on both sides. */
export function GridRow({
  children,
  className,
  rule = true,
  last = false,
}: {
  children: ReactNode;
  className?: string;
  /** Draw the rule above this row. */
  rule?: boolean;
  /** Also draw the closing rule below it. */
  last?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      {rule && <Rule className="top-0" />}
      {last && <Rule className="bottom-0" />}
      {children}
    </div>
  );
}

function Rule({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-[-100vw] h-px bg-border", className)}
    />
  );
}

/** A cell inside a row; the rule between cells is only as tall as the row. */
export function GridCell({
  children,
  className,
  rule = false,
}: {
  children: ReactNode;
  className?: string;
  /** Draw the rule on this cell's leading edge. */
  rule?: boolean;
}) {
  return <div className={cn(rule && "border-l", className)}>{children}</div>;
}
