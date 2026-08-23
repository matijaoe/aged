import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { cell, Lattice, LatticeRow } from "@/components/lattice";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { DropSurface, type SurfaceConfig, type SurfaceState } from "./drop-zone-surface";

/**
 * The drop-zone lab: the real lattice, the real chrome, one candidate surface.
 * Only the three values that are a matter of taste are left adjustable — the
 * behaviour itself is settled in `drop-zone-surface.tsx`.
 *
 * The configuration lives in the URL hash, so a reload keeps it and a
 * favourite can be handed back as a link rather than described.
 */

const defaults: SurfaceConfig = { pitch: 24, size: 16, strength: 6 };
const keys = ["pitch", "size", "strength"] as const;

function readHash(): SurfaceConfig {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const config = { ...defaults };
  for (const key of keys) {
    const value = Number(params.get(key));
    if (params.has(key) && Number.isFinite(value)) {
      config[key] = value;
    }
  }
  return config;
}

const states: { id: SurfaceState | "auto"; label: string }[] = [
  { id: "auto", label: "Live" },
  { id: "idle", label: "Idle" },
  { id: "hover", label: "Hover" },
  { id: "drag", label: "Drag" },
];

export function DropZoneLab() {
  const [config, setConfig] = useState<SurfaceConfig>(readHash);
  const [forced, setForced] = useState<SurfaceState | "auto">("auto");
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    for (const key of keys) {
      params.set(key, String(config[key]));
    }
    history.replaceState(null, "", `#${params.toString()}`);
  }, [config]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (event.key === "d") {
        setForced((current) => (current === "drag" ? "auto" : "drag"));
      }
      if (event.key === "h") {
        setPanelOpen((open) => !open);
      }
      if (event.key === "r") {
        setConfig({ ...defaults });
      }
    };
    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  }, []);

  const set = useCallback((patch: Partial<SurfaceConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
  }, []);

  return (
    <>
      <Lattice>
        <LatticeRow
          band="top"
          center={
            <header
              className={cn("flex w-full flex-col justify-end gap-4", cell.gutter, cell.sitsOnRule)}
            >
              <h2 className="font-semibold text-3xl tracking-tight">Encrypt</h2>
            </header>
          }
          left={
            <div className={cn("hidden w-full justify-end md:flex", cell.sitsOnRule)}>
              <Wordmark align="end" onHome={() => undefined} />
            </div>
          }
          right={
            <div className={cn("hidden w-full md:flex", cell.sitsOnRule)}>
              <ThemeToggle />
            </div>
          }
        />
        <LatticeRow
          band="body"
          center={
            <main
              className={cn("flex min-h-0 w-full flex-col pb-6", cell.gutter, cell.hangsFromRule)}
            >
              <DropSurface config={config} forced={forced === "auto" ? null : forced} />
            </main>
          }
          rule
        />
        <LatticeRow
          band="bottom"
          center={
            <footer className={cn("flex w-full pb-4", cell.gutter, cell.hangsFromRule)}>
              <span className="font-mono text-muted-foreground/64 text-xs">
                {config.pitch}px pitch · {config.size / 10}px dot · {config.strength}%
              </span>
            </footer>
          }
          right={
            <div
              className={cn(
                "hidden w-full items-start pt-4 md:flex",
                "text-muted-foreground/72 text-xs",
              )}
            >
              <p className="text-balance leading-relaxed">
                Stays on your device
                <br />
                Works offline · age compatible
              </p>
            </div>
          }
          rule
        />
      </Lattice>

      {panelOpen ? (
        <aside className="fixed top-3 left-3 z-50 flex w-56 flex-col gap-3 rounded-lg border bg-popover/88 p-3 text-xs shadow-lg backdrop-blur">
          <div className="flex justify-between text-muted-foreground/64">
            <button
              className="cursor-pointer hover:text-foreground"
              onClick={() => setConfig({ ...defaults })}
              type="button"
            >
              reset (r)
            </button>
            <button
              className="cursor-pointer hover:text-foreground"
              onClick={() => setPanelOpen(false)}
              type="button"
            >
              hide (h)
            </button>
          </div>

          <Slider
            label="Pitch"
            max={40}
            min={12}
            onChange={(pitch) => set({ pitch })}
            value={config.pitch}
          />
          <Slider
            label="Dot size"
            max={30}
            min={6}
            onChange={(size) => set({ size })}
            scale={10}
            value={config.size}
          />
          <Slider
            label="Strength"
            max={16}
            min={2}
            onChange={(strength) => set({ strength })}
            suffix="%"
            value={config.strength}
          />

          <div className="flex flex-wrap gap-1">
            {states.map((state) => (
              <button
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1 font-medium transition-colors",
                  forced === state.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground/64 hover:text-foreground",
                )}
                key={state.id}
                onClick={() => setForced(state.id)}
                type="button"
              >
                {state.label}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground/64 leading-relaxed">
            Hover brightens the field. Dragging a real file in also lights the dots under it —
            <kbd className="px-1 font-mono">d</kbd> fakes that state, but only a real drag moves
            the pool.
          </p>
        </aside>
      ) : (
        <button
          className="fixed top-3 left-3 z-50 cursor-pointer rounded-lg border bg-popover/88 px-2 py-1 font-medium text-xs shadow-lg backdrop-blur"
          onClick={() => setPanelOpen(true)}
          type="button"
        >
          Controls
        </button>
      )}
    </>
  );
}

function Slider({
  label,
  max,
  min,
  onChange,
  scale = 1,
  suffix = "px",
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  /** Divide the stored value by this for display, for sub-pixel sliders. */
  scale?: number;
  suffix?: string;
  value: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex justify-between text-muted-foreground">
        {label}
        <span className="font-mono">
          {value / scale}
          {suffix}
        </span>
      </span>
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="range"
        value={value}
      />
    </label>
  );
}
