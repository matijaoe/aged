import { cn } from "@/lib/utils";

export function Wordmark({
  align = "start",
  onHome,
  disabled = false,
}: {
  align?: "start" | "end";
  onHome: () => void;
  /** Mid-operation there is nothing safe to go home to. */
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", align === "end" && "items-end text-right")}>
      <h1 className="font-semibold text-foreground text-lg tracking-tight">
        {/* The name is the way back to the start. A button rather than a
            link, since nothing navigates, and inside the heading rather
            than around it: a heading is not phrasing content and cannot
            sit inside a button. The accessible name stays "aged." so the
            heading still reads as the heading. */}
        <button
          className="cursor-pointer rounded-sm outline-2 outline-offset-4 outline-transparent transition-opacity hover:opacity-72 focus-visible:outline-ring disabled:pointer-events-none"
          disabled={disabled}
          onClick={onHome}
          title="Start over"
          type="button"
        >
          aged.
        </button>
      </h1>
      <p className="text-balance text-muted-foreground text-sm leading-relaxed">
        age encryption, entirely in your browser.
      </p>
    </div>
  );
}
