import { cn } from "@/lib/utils";

export function Wordmark({ align = "start" }: { align?: "start" | "end" }) {
  return (
    <div className={cn("flex flex-col", align === "end" && "items-end text-right")}>
      <h1 className="font-semibold text-foreground text-lg tracking-tight">aged.</h1>
      <p className="text-balance text-muted-foreground text-sm leading-relaxed">
        age encryption, entirely in your browser.
      </p>
    </div>
  );
}
