import { useLayoutEffect, useRef } from "react";

import { secretFieldProps } from "@/lib/secret-fields";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

interface MessageWriterProps {
  /** Held by the state machine, so stepping away and back keeps the text. */
  draft: string;
  onDraftChange: (draft: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

/**
 * Composing input rather than bringing a file. The field is never labelled
 * for a mode: the writer only opens while nothing is loaded, so the mode is
 * whatever the last run left behind rather than anything derived — and what
 * is typed here gets sniffed on the way in like any other input, so armored
 * text pasted into it still decrypts.
 *
 * Mounted fresh each time it opens, which is what places the caret after
 * whatever text is already there — the keystroke that opened it, or a draft
 * being stepped back into.
 */
export function MessageWriter({ draft, onDraftChange, onSubmit, onBack }: MessageWriterProps) {
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  // Before paint, not after: every keystroke in the gap is one the
  // field never receives.
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (field === null) {
      return;
    }
    // Not `autoFocus`: focusing a field that already holds the keystroke
    // that opened it leaves the caret in front, so the rest of the word
    // would be typed backwards. The same puts the caret after restored
    // text when stepping back into a draft.
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }, []);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
      <Field className="flex min-h-0 w-full flex-1 flex-col gap-2.5">
        <FieldLabel>Message</FieldLabel>
        {/* Plaintext about to be encrypted, so it carries the same opt-outs
            as any other secret field. */}
        <Textarea
          {...secretFieldProps}
          className="min-h-0 w-full flex-1 font-mono [&_textarea]:h-full [&_textarea]:min-h-0 [&_textarea]:resize-none [&_textarea]:field-sizing-fixed"
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Write something to encrypt…"
          ref={fieldRef}
          size="lg"
          value={draft}
        />
      </Field>
      <div className="flex w-full shrink-0 gap-2">
        <Button className="flex-1" disabled={draft.trim() === ""} onClick={onSubmit} size="lg">
          Continue
        </Button>
        {/* At md and up this is offered from the left margin instead, where
            it sits outside the work rather than beside the way forward. */}
        <Button className="md:hidden" onClick={onBack} size="lg" variant="ghost">
          Back
        </Button>
      </div>
    </div>
  );
}
