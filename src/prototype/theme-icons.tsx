import {
  ApertureIcon,
  BlendIcon,
  CircleDashedIcon,
  ContrastIcon,
  EclipseIcon,
  type LucideIcon,
  MoonIcon,
  MoonStarIcon,
  OrbitIcon,
  SunIcon,
  SunMediumIcon,
  SunMoonIcon,
} from "lucide-react";

import { cell, Lattice, LatticeRow } from "@/components/lattice";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Candidate glyphs for the theme control, at the size and colour they would
 * actually be worn at, in the corner they would actually sit in — an icon
 * judged on a swatch page is judged at the wrong size against the wrong
 * background.
 *
 * The list is only what lucide has that could read as "theme" without naming
 * a state: `eclipse` is what is shipped today.
 */
const candidates: { icon: LucideIcon; name: string; note: string }[] = [
  { icon: EclipseIcon, name: "eclipse", note: "Shipped today — crescent over a disc" },
  { icon: ContrastIcon, name: "contrast", note: "Hatched half; mushes at 14px" },
  { icon: BlendIcon, name: "blend", note: "Two circles overlapping" },
  { icon: CircleDashedIcon, name: "circle-dashed", note: "Quietest of the lot" },
  { icon: SunMoonIcon, name: "sun-moon", note: "Both at once — busiest" },
  { icon: ApertureIcon, name: "aperture", note: "Reads as a lens, not a theme" },
  { icon: OrbitIcon, name: "orbit", note: "Reads as motion" },
  { icon: SunMediumIcon, name: "sun-medium", note: "Names a state" },
  { icon: SunIcon, name: "sun", note: "Names a state" },
  { icon: MoonIcon, name: "moon", note: "Names a state" },
  { icon: MoonStarIcon, name: "moon-star", note: "Names a state" },
];

/** The class the real toggle wears, so the weight is the real weight. */
const worn = "text-muted-foreground/64 hover:text-foreground";

export function ThemeIconLab() {
  return (
    <Lattice>
      <LatticeRow
        band="top"
        center={
          <header
            className={cn("flex w-full flex-col justify-end gap-4", cell.gutter, cell.sitsOnRule)}
          >
            <h2 className="font-semibold text-3xl tracking-tight">Theme icon</h2>
          </header>
        }
        left={
          <div className={cn("hidden w-full justify-end md:flex", cell.sitsOnRule)}>
            <Wordmark align="end" onHome={() => undefined} />
          </div>
        }
        right={
          // The corner it would live in, wearing whatever is shipped.
          <div className={cn("hidden w-full md:flex", cell.sitsOnRule)}>
            <ThemeToggle />
          </div>
        }
      />
      <LatticeRow
        band="body"
        center={
          <main className={cn("w-full", cell.gutter, cell.hangsFromRule)}>
            <ul className={cn(cell.stepBody, "gap-0")}>
              {candidates.map(({ icon: Icon, name, note }) => (
                <li className="flex items-center gap-3 py-1" key={name}>
                  <Button aria-label={name} className={worn} size="icon-sm" variant="ghost">
                    <Icon aria-hidden="true" />
                  </Button>
                  <span className="font-mono text-sm">{name}</span>
                  <span className="ml-auto text-muted-foreground/64 text-xs">{note}</span>
                </li>
              ))}
            </ul>
          </main>
        }
        rule
      />
      <LatticeRow
        band="bottom"
        center={
          <footer className={cn("flex w-full pb-4", cell.gutter, cell.hangsFromRule)}>
            <span className="text-muted-foreground/64 text-xs">
              Switch the theme from the corner above — the glyph never changes, only its colour.
            </span>
          </footer>
        }
        rule
      />
    </Lattice>
  );
}
