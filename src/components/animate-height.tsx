import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Animates its own height to follow the measured height of its content, so
 * the card grows and shrinks smoothly as steps change. CSS-transitioned on
 * purpose: a CSS transition always lands on its end state, so the layout
 * can never strand mid-animation the way a JS-driven spring can when frames
 * are throttled.
 */
export function AnimateHeight({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (content === null) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setHeight(content.offsetHeight);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="overflow-hidden transition-[height] duration-300 ease-out motion-reduce:transition-none"
      style={{ height: height ?? "auto" }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
