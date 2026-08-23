/**
 * Props for any field that holds a secret.
 *
 * Marks the field as not-a-login so password managers don't offer to save or
 * fill it, and disables the browser services — spell check, autocorrect,
 * translation, Grammarly-class extensions — that transmit field contents to
 * vendor servers. That traffic originates in the browser itself, below the
 * page, so the app's `connect-src 'none'` CSP cannot see or stop it.
 *
 * This applies to read-only fields too: a generated passphrase sitting in a
 * textarea is exactly the shape a form scanner crawls.
 */
export const secretFieldProps = {
  autoCapitalize: "off",
  autoComplete: "off",
  autoCorrect: "off",
  spellCheck: false,
  translate: "no",
  "data-1p-ignore": true,
  "data-bwignore": true,
  "data-form-type": "other",
  "data-gramm": "false",
  "data-lpignore": "true",
} as const;
