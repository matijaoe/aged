import { useEffect, useRef } from "react";

import { isEditableTarget } from "@/lib/editable-target";

/**
 * A paste that landed on the page rather than in a field, handed to the
 * caller to make of what it will: on the pick step it is input to load, on
 * the passphrase step it is a passphrase. The rules that don't vary live
 * here — ignore fields, files win over text, claim the event.
 *
 * The app's most common errand is decrypting an armored block someone sent
 * you, which arrives on the clipboard — so paste should work wherever drop
 * works, without first navigating to a text field.
 */
export function usePaste({
  onFiles,
  onText,
  disabled,
}: {
  onFiles: (files: readonly File[]) => void;
  onText: (text: string) => void;
  disabled: boolean;
}): void {
  // Held in a ref so a caller passing inline handlers doesn't re-register the
  // listener on every render.
  const handlers = useRef({ onFiles, onText });
  handlers.current = { onFiles, onText };

  useEffect(() => {
    if (disabled) {
      return;
    }
    function handlePaste(event: ClipboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }
      const { clipboardData } = event;
      if (clipboardData === null) {
        return;
      }
      // Files win over text: copying a file also puts its name on the
      // clipboard, and the file is what was meant.
      if (clipboardData.files.length > 0) {
        handlers.current.onFiles([...clipboardData.files]);
        event.preventDefault();
        return;
      }
      const text = clipboardData.getData("text");
      if (text.trim() !== "") {
        handlers.current.onText(text);
        event.preventDefault();
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [disabled]);
}
