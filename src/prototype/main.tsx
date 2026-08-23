import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { variants } from "./variants";
import "@/index.css";

function Prototype() {
  const [active, setActive] = useState(variants[0]?.id ?? "");
  const variant = variants.find((item) => item.id === active) ?? variants[0];
  if (variant === undefined) {
    return null;
  }
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between gap-4 border-b px-4 py-2.5">
        <div className="flex gap-1">
          {variants.map((item) => (
            <button
              className={cn(
                "cursor-pointer rounded-md px-2.5 py-1.5 font-medium text-sm transition-colors",
                item.id === variant.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              key={item.id}
              onClick={() => setActive(item.id)}
              type="button"
            >
              {item.name}
            </button>
          ))}
        </div>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center overflow-hidden p-6 pb-[10vh]">
        {variant.render()}
      </main>
      <footer className="border-t px-4 py-2.5 text-muted-foreground text-xs">
        {variant.note}
      </footer>
    </div>
  );
}

const root = document.getElementById("root");
if (root === null) {
  throw new Error("missing #root element");
}
createRoot(root).render(
  <StrictMode>
    <Prototype />
  </StrictMode>,
);
