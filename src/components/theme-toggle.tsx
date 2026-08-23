import { EclipseIcon } from "lucide-react";

import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

/**
 * One glyph, in both themes. A sun/moon pair names the theme you would get,
 * which is the one thing already impossible to miss — the whole page is
 * either light or dark. So the icon names the *control* instead and never
 * swaps; what changes across the switch is only its colour, which the muted
 * token does on its own. The accessible name still says what the click does.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="text-muted-foreground/64 hover:text-foreground"
      onClick={toggleTheme}
      size="icon-sm"
      variant="ghost"
    >
      <EclipseIcon aria-hidden="true" />
    </Button>
  );
}
