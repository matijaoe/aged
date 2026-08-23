/**
 * Whether a keyboard or clipboard event landed inside a field the user is
 * typing in. Those events belong to the field; everything else belongs to
 * the page, which loads input from a paste and starts a message from a
 * keystroke.
 *
 * The check is target-based rather than a list of known fields, so any input
 * added later is safe without being registered here.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (target === null) {
    return false;
  }
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return true;
  }
  if (target instanceof HTMLElement) {
    return target.isContentEditable;
  }
  return false;
}
