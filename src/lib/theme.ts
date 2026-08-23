import { useCallback, useSyncExternalStore } from "react";

/**
 * Light/dark theme, defaulting to the system preference. An explicit choice
 * is remembered in localStorage; the passphrase and file contents never
 * touch storage. The switch fades the colours rather than flashing, by
 * mounting a class for the length of the fade — see `.theme-switching` in
 * `index.css` for why this is not a view transition.
 */

const storageKey = "aged-theme";

/** Mounted on the root for the length of the fade; styled in `index.css`. */
const switchingClass = "theme-switching";
/** Must match the transition duration that class declares. */
const switchMs = 200;
let switchTimer: ReturnType<typeof setTimeout> | undefined;

type Theme = "light" | "dark";

const listeners = new Set<() => void>();
const media = matchMedia("(prefers-color-scheme: dark)");

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(storageKey);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function currentTheme(): Theme {
  return storedTheme() ?? (media.matches ? "dark" : "light");
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function notify(): void {
  applyTheme(currentTheme());
  for (const listener of listeners) {
    listener();
  }
}

media.addEventListener("change", notify);

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const theme = useSyncExternalStore(subscribe, currentTheme);
  const toggleTheme = useCallback(() => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Private browsing; the theme just won't persist.
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      notify();
      return;
    }
    const root = document.documentElement;
    root.classList.add(switchingClass);
    notify();
    // Cleared on a timer rather than `transitionend`, which fires once per
    // property per element and never at all for anything whose colour didn't
    // actually change. Restarted on every toggle so switching twice quickly
    // doesn't strip the class mid-fade.
    clearTimeout(switchTimer);
    switchTimer = setTimeout(() => root.classList.remove(switchingClass), switchMs + 20);
  }, []);
  return { theme, toggleTheme };
}
