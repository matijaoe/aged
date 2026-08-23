# aged — project instructions

Browser-only age encryption (passphrase mode), built on typage. No backend,
no runtime network. Two build targets: a hosted static bundle (`dist/`, with
a service worker) and a self-contained `dist-single/aged.html` that runs
from `file://`.

## Verification

Run these before considering any change done:

```sh
bun run typecheck   # tsc over src/ AND scripts/
bun run lint        # oxlint via vp, type-aware
bun run test        # vitest via `vp test run` — unit tests live next to modules
bun run build && bun run build:single
bun run verify:cli  # interop with the real age CLI; needs `age` + `expect` on PATH
```

## Invariants — do not violate

- **`src/lib/crypto/core.ts` stays environment-agnostic** (no DOM, no worker
  APIs): `scripts/verify-against-age-cli.ts` imports it under bun.
- **Never add a network request.** The build injects a CSP with
  `connect-src 'none'`; a `fetch` anywhere breaks the product's privacy
  promise even though dev mode would appear to work.
- **`?worker&inline` in `src/lib/crypto/client.ts` is load-bearing** — the
  single-file build only works from `file://` because the worker is inlined.
- **The scrypt work factor stays at the library default** (18) and is never
  exposed or configured.
- **Secrets never touch storage or the DOM's serialized form.** Only the
  theme preference may use localStorage. Passphrase inputs are deliberately
  uncontrolled (a controlled input mirrors the value into a DOM attribute),
  and secret-bearing fields carry the `secretFieldProps` opt-outs
  (spellcheck/translate/password managers). Reuse that constant for any new
  secret field.
- **`src/components/ui/**` is vendored COSS UI** — never restyle or "fix"
  it; add components with `bunx shadcn@latest add @coss/<name>`, only when
  actually used.
- **`src/lib/crypto/wordlist.ts` is generated** from the canonical BIP39
  English list (sha256-verified); never hand-edit it.
- **The page is exactly one viewport and never scrolls.** `src/components/lattice.tsx`
  owns the three bands — two fixed, one capped-flex — because "never scrolls"
  is an invariant a caller could otherwise break by passing its own height.
  A step that outgrows its band absorbs the overflow itself (`cell.stepBody`);
  it must never grow the page.
- **The mode is derived, never chosen from a filename.** `src/hooks/use-aged.ts`
  sets it from `isAgeFile(bytes)`, a content sniff of the first 256 bytes
  (`src/lib/crypto/detect.ts`). The `.age` extension is consulted only for
  output filenames and for the oversized-file notice, where the bytes are
  never read. Do not "improve" detection into an extension check.
- **The override is asymmetric on purpose.** It shows only when an age file
  was actually detected (`detectedAge`), because forcing decrypt on anything
  else can only ever produce "not an age file".
- **The step is stored, not derived, and a backward move destroys nothing the
  step it lands on needs.** `src/hooks/aged-state.ts` holds an explicit
  `step`; deriving it from which data happened to exist made "where you are"
  and "what you have" the same fact, so moving backwards meant destroying
  something. `{ type: "back" }` changes the step and drops only what the
  landing step contradicts — a result belongs to the passphrase that produced
  it, and returning to `pick` means choosing a different input. `start-over`
  is the only action that clears. The input is retained through the result
  step: that retention is what makes `done` a step you can walk back out of,
  and it is the reason a per-file cap exists. `backStepFrom()` is the single
  answer to where Back lands — don't let a component work it out again.
- **`draft` doubles as the record of where the input came from.** Only
  composing ever sets it, so a non-empty draft is what tells the passphrase
  step its way back is the writer; loading a file or a paste clears it.
  Setting or keeping `draft` anywhere else silently sends Back to the wrong
  step.
- **Nothing may replace a loaded input from inside the passphrase step.**
  Paste-to-load is scoped to the pick step (`src/hooks/use-paste.ts` and its
  `disabled`), and `src/App.tsx` routes drops by step. On the passphrase step
  a paste or a drop is a *passphrase*. The alternative silently swaps the
  passphrase in as the thing to encrypt, and nobody finds out until the
  original is gone.
- **A passphrase may arrive as a file, and eligibility is decided by content,
  never by extension** (`src/lib/passphrase-file.ts`) — the same doctrine as
  the derived mode above. The checks are ordered by what is most true about
  the file (not-text before too-big, so a PNG is never called "too big"). A
  file-supplied passphrase skips confirmation — the file is the record,
  nothing was typed — and never enters the DOM.
- **Armoring is a property of the result, not of the encrypt call.**
  Encryption always produces binary; `src/lib/crypto/armor.ts` re-encodes a
  finished ciphertext, and the choice lives on the done step where changing
  it costs nothing instead of a second of scrypt. `armor.ts` is kept apart
  from `core.ts` because importing the core from a component would pull
  typage's cipher graph into the main bundle alongside the inlined worker's
  copy. The worker protocol carries no `armored` flag.

## Toolchain rules

- Package manager is **bun**; the toolchain is **Vite+** (`vp` wraps vite,
  oxlint, oxfmt, vitest). Never add eslint, prettier, or a separate vitest —
  use `vp lint`, `vp fmt`, `vp test`.
- Tests import from `"vite-plus/test"`, not `"vitest"` (lint enforces this).
- Bumping vite-plus means updating **three sites in package.json together**:
  `devDependencies.vite` (the `@voidzero-dev/vite-plus-core` alias),
  `devDependencies.vite-plus`, and `overrides.vite`.
- `age-encryption` is pinned exactly. `core.ts` classifies errors by typage's
  message strings; `src/lib/crypto/core.test.ts` pins that coupling — any
  bump must keep it green.
- The verify script drives `age` through `expect`; values reach the Tcl
  script via environment variables only — never interpolate them into the
  script text.

## Module map

- `src/lib/crypto/` — typed crypto core (typage) + worker; `client.ts` is
  the promise API the UI uses; `protocol.ts` is the worker message contract;
  `armor.ts` is the result-side re-encoding, the one piece of the crypto
  layer a component calls directly.
- `src/hooks/aged-state.ts` — the pure state machine (unit-tested): the step,
  the input, the draft, and `backStepFrom()`; `use-aged.ts` is the React hook
  around it. `use-paste.ts` loads pasted files and text the same way a drop
  does, on the pick step only; `use-type-to-write.ts` opens the writer on the
  first keystroke. Both defer to `src/lib/editable-target.ts`, which says
  whether the event landed in a field someone is typing in.
- `src/lib/passphrase-file.ts` — a passphrase brought as a file instead of
  typed.
- `src/components/lattice.tsx` — the page shell: rules, bands, margin cells,
  and the shared `cell` spacing tokens.
- `src/components/message-writer.tsx` — the compose step.
- `src/components/` — app components; `src/components/ui/` — vendored COSS.
- `vite.config.ts` — CSP injection (hash-based, build fails if it can't
  inject) and service-worker generation from `scripts/sw.template.js`.

## Settled decisions — don't re-litigate

- Passphrase mode only in v1; no recipient/identity modes.
- Single file per operation; 256 MB cap with the CLI as the escape hatch.
  The cap is deliberately not advertised on the home screen — it is stated
  only in the too-big notice, at the moment it bites.
- Passphrase generation: 10 BIP39 words, space-separated (differs from the
  CLI's `-` by design); word count/separator/wordlist stay parameters.
- The `verify:cli` script is intentionally serialized and expect-driven. It
  is a **test harness only** — the app never shells out to `age`; typage does
  all crypto in the browser. The script exists to prove byte-level interop
  rather than assert it.
- Binary output is the default; armored (`-a`) output is opt-in per result,
  chosen on the done step rather than before encrypting.
- The UI is the lattice described above. Don't restyle proactively, don't
  layer extra borders or rings on COSS primitives, and don't reintroduce a
  bordered drop box — the whole page is the drop target, so a box inside it
  misstates where you can drop.
