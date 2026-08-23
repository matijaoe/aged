/**
 * Whether a paste landing on this element should be treated as loading input
 * rather than as ordinary text entry. A paste into a field the user is typing
 * in belongs to that field.
 *
 * The check is target-based rather than a list of known fields, so any input
 * added later is safe without being registered here.
 */
export function shouldInterceptPaste(target: EventTarget | null): boolean {
  if (target === null) {
    return true;
  }
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return false;
  }
  if (target instanceof HTMLElement) {
    return !target.isContentEditable;
  }
  return true;
}
