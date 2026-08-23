import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { DropZoneLab } from "./drop-zone";
import { ThemeIconLab } from "./theme-icons";
import type { FlowStep } from "./flow-parts";
import { App } from "./variants";
import "@/index.css";

const steps: { id: FlowStep; label: string }[] = [
  { id: "pick", label: "Pick" },
  { id: "passphrase", label: "Passphrase" },
  { id: "result", label: "Result" },
];

type Lab = "drop-zone" | "theme-icon" | "flow";

const labs: { id: Lab; label: string }[] = [
  { id: "drop-zone", label: "Drop zone" },
  { id: "theme-icon", label: "Theme icon" },
  { id: "flow", label: "Flow" },
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
    <div className="flex gap-0.5">
      {items.map((item) => (
        <button
          className={cn(
            "cursor-pointer rounded-md px-2 py-1 font-medium text-xs transition-colors",
            item.id === active
              ? "bg-accent text-foreground"
              : "text-muted-foreground/64 hover:text-foreground",
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
  const [lab, setLab] = useState<Lab>("drop-zone");
  const [step, setStep] = useState<FlowStep>("pick");
  return (
    <>
      {lab === "drop-zone" ? (
        <DropZoneLab />
      ) : lab === "theme-icon" ? (
        <ThemeIconLab />
      ) : (
        <App step={step} />
      )}
      {/* Floats over the lattice so the page stays exactly one viewport. */}
      <div className="fixed top-0 right-0 z-50 flex items-center gap-4 p-3">
        <div className="flex items-center gap-3 rounded-lg border bg-popover/88 px-2 py-1.5 shadow-lg backdrop-blur">
          <Toolbar active={lab} items={labs} onSelect={setLab} />
          {lab === "flow" && (
            <>
              <span className="h-4 w-px bg-border" />
              <Toolbar active={step} items={steps} onSelect={setStep} />
            </>
          )}
          <span className="h-4 w-px bg-border" />
          <ThemeToggle />
        </div>
      </div>
    </>
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
