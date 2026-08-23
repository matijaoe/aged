import { useCallback, useSyncExternalStore } from "react";

/**
 * Light/dark theme, defaulting to the system preference. An explicit choice
 * is remembered in localStorage; the passphrase and file contents never
 * touch storage. The switch animates as a view-transition crossfade where
 * the browser supports it, so there is no flash.
 */

const storageKey = "aged-theme";

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
    const transition =
      "startViewTransition" in document ? document.startViewTransition.bind(document) : null;
    if (transition !== null && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      transition(notify);
    } else {
      notify();
    }
  }, []);
  return { theme, toggleTheme };
}
