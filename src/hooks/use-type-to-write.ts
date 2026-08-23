import { useEffect } from "react";

import { isEditableTarget } from "@/lib/editable-target";

/**
 * Starts a message the moment you type, the way paste starts one the moment
 * you paste. Nothing on the pick step has any use for a bare letter, so a
 * keystroke that isn't a shortcut can only mean "I want to write something".
 *
 * The key that opened the writer is handed back rather than left to the
 * browser: the field it belongs in does not exist yet when the event fires,
 * so the caller seeds it.
 */
export function useTypeToWrite({
  onType,
  disabled,
}: {
  onType: (char: string) => void;
  disabled: boolean;
}): void {
  useEffect(() => {
    if (disabled) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      // Modifier combinations are shortcuts, and a multi-character key name
      // is navigation or editing. IME composition produces neither.
      if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) {
        return;
      }
      // Space is deliberately not a way in: it activates the focused drop
      // cell, and it would otherwise open the writer on an invisible
      // character.
      if (event.key.length !== 1 || event.key === " ") {
        return;
      }
      if (isEditableTarget(event.target)) {
        return;
      }
      // Single keys are browser shortcuts on some pages (quick find), and
      // the character is delivered through onType instead.
      event.preventDefault();
      onType(event.key);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onType, disabled]);
}
