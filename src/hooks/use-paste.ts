import { useEffect } from "react";

import { shouldInterceptPaste } from "@/lib/paste";

/**
 * Loads pasted files and text the same way a drop does.
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
  useEffect(() => {
    if (disabled) {
      return;
    }
    function handlePaste(event: ClipboardEvent) {
      if (!shouldInterceptPaste(event.target)) {
        return;
      }
      const { clipboardData } = event;
      if (clipboardData === null) {
        return;
      }
      // Files win over text: copying a file also puts its name on the
      // clipboard, and the file is what was meant.
      if (clipboardData.files.length > 0) {
        onFiles([...clipboardData.files]);
        event.preventDefault();
        return;
      }
      const text = clipboardData.getData("text");
      if (text.trim() !== "") {
        onText(text);
        event.preventDefault();
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onFiles, onText, disabled]);
}
