import { FileUpIcon } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { CSSProperties } from "react";

/**
 * The drop zone as a dot field, with one response per thing that actually
 * happens here.
 *
 * - **Hovering** means you are about to click to browse. The field brightens,
 *   and nothing else: hover happens on every visit, so it only has to say the
 *   surface is live.
 * - **Dragging a file** is rare, and the only moment where more is worth it. A
 *   pool of brighter dots follows the file, so the page shows where the drop
 *   will land, and the field leans a few pixels towards it.
 *
 * A file being dragged sends no `pointermove` — `dragover` is the only position
 * signal there is, and it carries the same client coordinates, which is what
 * lets the field answer the file rather than only the cursor.
 *
 * Everything animated is `transform` or `opacity`, and nothing loops.
 */

export type SurfaceState = "idle" | "hover" | "drag";

export interface SurfaceConfig {
  /** Space between dots, in px. */
  pitch: number;
  /** Dot diameter in px, in tenths so the slider can go under 1px. */
  size: number;
  /** Resting ink opacity, in percent. */
  strength: number;
}

/** How much the field's opacity is multiplied by, per state. */
const inkBy: Record<SurfaceState, number> = { idle: 1, hover: 1.8, drag: 3 };
/** Radius of the pool of brightened dots that follows a dragged file. */
const poolRadius = 200;
/** How much brighter the dots inside that pool are. */
const poolBoost = 2.6;
/** How far the field leans towards the file. */
const lean = 6;

const fadeMask = "radial-gradient(115% 115% at 50% 50%, #000 45%, transparent 100%)";

/** One tile with one dot in it, as a mask so the ink follows the theme. */
function dotMask(pitch: number, size: number): string {
  const c = pitch / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pitch} ${pitch}" width="${pitch}" height="${pitch}"><circle cx="${c}" cy="${c}" r="${Math.max(size / 2, 0.3)}" fill="#fff"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** The field itself: an ink-coloured box, masked down to the dots. */
function fieldStyle(pitch: number, size: number, fade: boolean): CSSProperties {
  const mask = dotMask(pitch, size);
  return {
    backgroundColor: "var(--foreground)",
    maskImage: fade ? `${mask}, ${fadeMask}` : mask,
    maskSize: fade ? `${pitch}px ${pitch}px, 100% 100%` : `${pitch}px ${pitch}px`,
    maskRepeat: fade ? "repeat, no-repeat" : "repeat",
    maskComposite: fade ? "intersect" : undefined,
  };
}

export function DropSurface({
  config,
  forced,
}: {
  config: SurfaceConfig;
  /** Pin the state for comparison; `null` follows real input. */
  forced: SurfaceState | null;
}) {
  const reduced = useReducedMotion() ?? false;
  const surface = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const state: SurfaceState = forced ?? (dragging ? "drag" : hovered ? "hover" : "idle");

  // Motion values, so following the file never re-renders React.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 420, damping: 44, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 420, damping: 44, mass: 0.5 });
  // Heavier than the pool, so the field trails behind rather than tracking in
  // lockstep — that lag is what makes it read as a surface, not a cursor effect.
  const rawLeanX = useMotionValue(0);
  const rawLeanY = useMotionValue(0);
  const leanX = useSpring(rawLeanX, { stiffness: 90, damping: 24, mass: 0.9 });
  const leanY = useSpring(rawLeanY, { stiffness: 90, damping: 24, mass: 0.9 });

  const track = useCallback(
    (clientX: number, clientY: number, jump: boolean) => {
      const element = surface.current;
      if (element === null || reduced) {
        return;
      }
      const box = element.getBoundingClientRect();
      const px = clientX - box.left;
      const py = clientY - box.top;
      if (jump) {
        // A drag that starts across the page shouldn't fly the pool in from
        // wherever it was left: it begins where the file already is.
        rawX.jump(px);
        rawY.jump(py);
        x.jump(px);
        y.jump(py);
      } else {
        rawX.set(px);
        rawY.set(py);
      }
      rawLeanX.set((px / box.width - 0.5) * 2 * lean);
      rawLeanY.set((py / box.height - 0.5) * 2 * lean);
    },
    [reduced, rawLeanX, rawLeanY, rawX, rawY, x, y],
  );

  // With no drag in progress the field sits still, wherever the mouse is.
  useEffect(() => {
    if (state !== "drag") {
      rawLeanX.set(0);
      rawLeanY.set(0);
    }
  }, [rawLeanX, rawLeanY, state]);

  const dot = config.size / 10;
  const opacity = (config.strength / 100) * inkBy[state];
  const fieldTransform = useMotionTemplate`translate3d(${leanX}px, ${leanY}px, 0)`;
  const poolTransform = useMotionTemplate`translate3d(calc(${x}px - 50%), calc(${y}px - 50%), 0)`;
  // The pool's inner copy counter-translates back to the surface's origin, so
  // its dots stay locked to the ones underneath. Both halves are transforms, so
  // this stays on the GPU.
  const poolFieldTransform = useMotionTemplate`translate3d(calc(${leanX}px - ${x}px + ${poolRadius}px), calc(${leanY}px - ${y}px + ${poolRadius}px), 0)`;

  return (
    // Bled out on all four sides exactly as the real pick step is: the lattice
    // already draws the rectangle, so the field must meet the rules.
    <div className="-mx-4 -mt-4 -mb-6 flex min-h-0 flex-1 flex-col self-stretch">
      <button
        className="relative flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2.5 overflow-hidden outline-2 -outline-offset-2 outline-transparent focus-visible:outline-ring"
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
          track(event.clientX, event.clientY, true);
        }}
        onDragLeave={() => {
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragging(false);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          track(event.clientX, event.clientY, false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        ref={surface}
        type="button"
      >
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            ...fieldStyle(config.pitch, dot, true),
            opacity,
            transform: fieldTransform,
            transition: "opacity 220ms ease",
          }}
        />
        {!reduced && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 overflow-hidden rounded-full"
            style={{
              height: poolRadius * 2,
              width: poolRadius * 2,
              maskImage: "radial-gradient(circle at center, #000 0%, transparent 72%)",
              transform: poolTransform,
            }}
          >
            <motion.span
              className="absolute top-0 left-0 h-[200vh] w-[200vw]"
              style={{
                ...fieldStyle(config.pitch, dot * 1.8, false),
                opacity: state === "drag" ? opacity * poolBoost : 0,
                transform: poolFieldTransform,
                transition: "opacity 220ms ease",
              }}
            />
          </motion.span>
        )}

        <span className="relative z-10 flex flex-col items-center gap-2.5">
          <FileUpIcon aria-hidden="true" className="size-6 text-muted-foreground" />
          <span className="font-medium text-base">
            {state === "drag" ? "Drop it here" : "Drop or paste anything"}
          </span>
          {state !== "drag" && (
            <span className="text-muted-foreground text-sm">
              Browse for a file, or type to encrypt a message
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
