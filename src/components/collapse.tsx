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
      <div className="overflow-hidden">
        <div className={className}>{children}</div>
      </div>
    </div>
  );
}
