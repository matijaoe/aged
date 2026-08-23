import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Four hairlines that run past the viewport edges and intersect to form a
 * rectangle around the content — the page's structure drawn instead of
 * boxed. Corner marks sit at the intersections.
 */
export function GridLines({
  children,
  className,
  marks = true,
}: {
  children: ReactNode;
  className?: string;
  marks?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <div aria-hidden="true" className="pointer-events-none">
        <span className="absolute inset-x-[-100vw] top-0 h-px bg-border" />
        <span className="absolute inset-x-[-100vw] bottom-0 h-px bg-border" />
        <span className="absolute inset-y-[-100vh] left-0 w-px bg-border" />
        <span className="absolute inset-y-[-100vh] right-0 w-px bg-border" />
        {marks && (
          <>
            <CornerMark className="-top-[3px] -left-[3px]" />
            <CornerMark className="-top-[3px] -right-[3px]" />
            <CornerMark className="-bottom-[3px] -left-[3px]" />
            <CornerMark className="-bottom-[3px] -right-[3px]" />
          </>
        )}
      </div>
      {children}
    </div>
  );
}

function CornerMark({ className }: { className: string }) {
  return <span className={cn("absolute size-[7px] bg-muted-foreground/32", className)} />;
}
