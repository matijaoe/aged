import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shows and hides children with a height-and-opacity collapse. Content
 * stays mounted (state in hidden fields survives); `inert` keeps it out of
 * the tab order and accessibility tree while hidden. CSS-transitioned so it
 * always settles at its end state.
 */
export function Collapse({
  show,
  className,
  children,
}: {
  show: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
        show ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      inert={!show}
    >
      {/* The clip that makes the height animation work also shears the focus
          ring off anything focusable inside it, since a ring is painted
          outside its control's border box. Inset by its own padding and
          widened by the same amount — the same trick as `cell.stepBody` —
          which leaves the content exactly where it was and moves the clip
          edge off it. Horizontally only: vertical padding cannot collapse to
          nothing, so it would hold the row open when hidden. */}
      <div className="-mx-2 w-[calc(100%+(--spacing(4)))] overflow-hidden px-2">
        <div className={className}>{children}</div>
      </div>
    </div>
  );
}
