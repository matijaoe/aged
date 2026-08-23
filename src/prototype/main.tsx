import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import type { FlowStep } from "./flow-parts";
import { variants } from "./variants";
import "@/index.css";

const steps: { id: FlowStep; label: string }[] = [
  { id: "pick", label: "Pick" },
  { id: "passphrase", label: "Passphrase" },
  { id: "result", label: "Result" },
];

function Toolbar<T extends string>({
  items,
  active,
  onSelect,
}: {
  items: { id: T; label: string }[];
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="flex gap-1">
      {items.map((item) => (
        <button
          className={cn(
            "cursor-pointer rounded-md px-2.5 py-1.5 font-medium text-sm transition-colors",
            item.id === active
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          key={item.id}
          onClick={() => onSelect(item.id)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Prototype() {
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [step, setStep] = useState<FlowStep>("pick");
  const variant = variants.find((item) => item.id === variantId) ?? variants[0];
  if (variant === undefined) {
    return null;
  }
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between gap-6 border-b px-4 py-2.5">
        <Toolbar
          active={variant.id}
          items={variants.map((item) => ({ id: item.id, label: item.name }))}
          onSelect={setVariantId}
        />
        <div className="flex items-center gap-4">
          <Toolbar active={step} items={steps} onSelect={setStep} />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center overflow-hidden p-6 pb-[8vh]">
        {variant.render(step)}
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
