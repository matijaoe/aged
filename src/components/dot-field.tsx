import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

import type { CSSProperties } from "react";

/**
 * The dot field behind the pick step, and the only thing that says the empty
 * cell is a surface you can drop onto.
 *
 * Its two responses answer the only two things that happen here, and no more:
 * hovering (you are about to click to browse) just brightens the dots, because
 * hover happens on every visit; dragging a file lights the dots under it and
 * leans the field a few pixels its way, because that is rare and is the one
 * moment where showing *where the drop lands* is worth something.
 *
 * A dragged file sends no `pointermove` — `dragover` is the only position
 * signal there is, and it is listened for on the window rather than on the
 * cell, because the whole page is the drop target.
 *
 * Brightness is driven by `--dots` and `--pool`, set by the button this sits
 * in, so hover stays a CSS concern (correctly gated away from touch, where a
 * tap would otherwise fire a hover that never ends) and never re-renders React.
 * Only `transform` and `opacity` animate, and nothing loops.
 */

/** Space between dots, and the dot's diameter, in px. */
const pitch = 24;
const dot = 1.6;
/** Radius of the pool of brightened dots that follows a dragged file. */
const poolRadius = 200;
/** How far the field leans towards the file. */
const lean = 6;

/** Softens where the field meets the lattice rules. */
const fade = "radial-gradient(115% 115% at 50% 50%, #000 45%, transparent 100%)";
const poolFade = "radial-gradient(circle at center, #000 0%, transparent 72%)";

/**
 * One tile with one dot in it, as a mask so the ink follows the theme.
 *
 * Tiled from the centre, not the top-left corner: the cell is almost never an
 * exact multiple of the pitch, and tiling from a corner dumps the whole
 * remainder against the opposite two rules, so the right and bottom edges sit
 * tight while the left and top have a full gap. Centring splits the remainder
 * evenly, and every layer uses the same origin so their dots stay locked
 * together.
 */
function dots(size: number): CSSProperties {
  const c = pitch / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pitch} ${pitch}" width="${pitch}" height="${pitch}"><circle cx="${c}" cy="${c}" r="${size / 2}" fill="#fff"/></svg>`;
  const mask = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return {
    backgroundColor: "var(--foreground)",
    maskImage: mask,
    maskSize: `${pitch}px ${pitch}px`,
    maskPosition: "center",
    WebkitMaskImage: mask,
    WebkitMaskSize: `${pitch}px ${pitch}px`,
    WebkitMaskPosition: "center",
  };
}

export function DotField({ dragging }: { dragging: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const field = useRef<HTMLSpanElement>(null);
  // The pool's copy of the field has to match the cell exactly, or its centred
  // tiling would resolve to a different origin and its dots would land between
  // the ones underneath instead of on top of them.
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = field.current;
    if (element === null) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry !== undefined) {
        setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Motion values, so following the file never re-renders React.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 420, damping: 44, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 420, damping: 44, mass: 0.5 });
  // Heavier than the pool, so the field trails behind rather than tracking in
  // lockstep — that lag is what makes it read as a surface answering the file
  // rather than an effect stuck to the pointer.
  const rawLeanX = useMotionValue(0);
  const rawLeanY = useMotionValue(0);
  const leanX = useSpring(rawLeanX, { stiffness: 90, damping: 24, mass: 0.9 });
  const leanY = useSpring(rawLeanY, { stiffness: 90, damping: 24, mass: 0.9 });

  useEffect(() => {
    const element = field.current;
    if (element === null || reduced) {
      return;
    }
    if (!dragging) {
      // Settle back to rest; the pool is faded out by now either way.
      rawLeanX.set(0);
      rawLeanY.set(0);
      return;
    }
    // The pool must not fly in from wherever the last drag left it: the first
    // report of this drag places it, and the rest are followed.
    let placed = false;
    const onDragOver = (event: DragEvent) => {
      const box = element.getBoundingClientRect();
      const px = event.clientX - box.left;
      const py = event.clientY - box.top;
      if (placed) {
        rawX.set(px);
        rawY.set(py);
      } else {
        placed = true;
        rawX.jump(px);
        rawY.jump(py);
        x.jump(px);
        y.jump(py);
      }
      rawLeanX.set((px / box.width - 0.5) * 2 * lean);
      rawLeanY.set((py / box.height - 0.5) * 2 * lean);
    };
    addEventListener("dragover", onDragOver);
    return () => removeEventListener("dragover", onDragOver);
  }, [dragging, reduced, rawLeanX, rawLeanY, rawX, rawY, x, y]);

  const fieldTransform = useMotionTemplate`translate3d(${leanX}px, ${leanY}px, 0)`;
  const poolTransform = useMotionTemplate`translate3d(calc(${x}px - 50%), calc(${y}px - 50%), 0)`;
  // The pool's copy of the field counter-translates back to the cell's origin,
  // so its dots stay locked to the ones underneath. Both halves are transforms,
  // so this stays on the GPU.
  const poolFieldTransform = useMotionTemplate`translate3d(calc(${leanX}px - ${x}px + ${poolRadius}px), calc(${leanY}px - ${y}px + ${poolRadius}px), 0)`;

  return (
    // The fade is a mask on the wrapper rather than a second mask composited
    // onto each layer: nesting composes in every browser, `mask-composite`
    // does not, and its fallback would be an unmasked block of foreground.
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      ref={field}
      style={{ maskImage: fade, WebkitMaskImage: fade }}
    >
      <motion.span
        className="absolute inset-0"
        style={{
          ...dots(dot),
          opacity: "var(--dots)",
          transform: fieldTransform,
          transition: "opacity 220ms ease",
        }}
      />
      {!reduced && (
        <motion.span
          className="absolute top-0 left-0 overflow-hidden rounded-full"
          style={{
            height: poolRadius * 2,
            width: poolRadius * 2,
            maskImage: poolFade,
            WebkitMaskImage: poolFade,
            transform: poolTransform,
          }}
        >
          <motion.span
            className="absolute top-0 left-0"
            style={{
              ...dots(dot * 1.8),
              height: box.height,
              width: box.width,
              opacity: "var(--pool)",
              transform: poolFieldTransform,
              transition: "opacity 220ms ease",
            }}
          />
        </motion.span>
      )}
    </span>
  );
}
