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
  is the only action that clears. `backStepFrom()` is the single answer to
  where Back lands — don't let a component work it out again.
- **A finished result has no way back.** `backStepFrom` returns null for
  `done`: there is nothing behind it to change, only the choice to do it
  again, which the step offers itself. Because nothing will ask for the input
  again, `finished` calls `releaseInput` — the name survives, for the CLI hint
  and the output's name, and the payload does not. That is what keeps a
  full-size input from sitting alongside a full-size output, and it is why the
  cap can be what it is. Giving `done` a way back means paying for it again.
- **`draft` doubles as the record of where the input came from.** Only
  composing ever sets it, so a non-empty draft is what tells the passphrase
  step its way back is the writer; loading a file or a paste clears it.
  Setting or keeping `draft` anywhere else silently sends Back to the wrong
  step.
- **Nothing may replace a loaded input from inside the passphrase step.** A
  paste or a drop there is a *passphrase*, never new input — the alternative
  silently swaps the passphrase in as the thing to encrypt, and nobody finds
  out until the original is gone. Everywhere else what arrives is taken as
  input: `src/App.tsx` routes drops by step and `src/hooks/use-paste.ts` is
  disabled only on the passphrase and working steps. The result step takes it
  too but asks first (`src/components/replace-result-dialog.tsx`), because it
  is the one screen holding something that cannot be got back.
- **A passphrase may arrive as a file, and eligibility is decided by content,
  never by extension** (`src/lib/passphrase-file.ts`) — the same doctrine as
  the derived mode above. The checks are ordered by what is most true about
  the file (not-text before too-big, so a PNG is never called "too big"). A
  file-supplied passphrase skips confirmation — the file is the record,
  nothing was typed — and never enters the DOM.
- **Armoring is a property of the result, not of the encrypt call.**
  Encryption always produces binary; `src/lib/crypto/armor.ts` re-encodes a
  finished ciphertext. There is no armored *mode* — the done step's menu
  offers two one-shot actions, and each armors on the click that asks for it,
  because at the size cap doing it eagerly is a third of a second of frozen
  tab to draw a label. `armor.ts` is kept apart from `core.ts` because
  importing the core from a component would pull typage's cipher graph into
  the main bundle alongside the inlined worker's copy. The worker protocol
  carries no `armored` flag.
- **The armor encoder is ours; the decoder is typage's.** `armorBytes` writes
  base64 straight into a buffer sized up front, which at the 256 MB cap is
  ~350 ms against typage's ~1.1 s and 5.6 million intermediate strings. A
  wrong encode is silent — it still decodes for us and fails only on someone
  else's machine — so `src/lib/crypto/armor.test.ts` pins it byte-for-byte
  against `armor.encode` across every base64 remainder and line boundary,
  empty input included, and `verify:cli` feeds the result to the real binary.
  Any change here keeps both green.
- **A file cannot be put on the clipboard, and this is not worth revisiting.**
  A page may write only `text/plain`, `text/html` and `image/png`;
  `ClipboardItem.supports("application/octet-stream")` is false, and the
  `web `-prefixed custom format is a private channel no file manager reads.
  A file on a clipboard is a *path reference* anyway, and the result never
  touches disk. This is precisely what armoring is for: it is the only form
  of the ciphertext a clipboard will carry.
- **The dot field answers the file, not the cursor.**
  `src/components/dot-field.tsx` has exactly two responses, one per thing that
  happens on the pick step: hovering (about to click to browse) only brightens
  the dots, because hover happens on every visit; dragging a file lights the
  dots under it and leans the field its way, because that is rare and is the
  one moment where showing where the drop lands is worth something. A cursor
  effect on the idle page is decoration and was deliberately cut. The position
  comes from `dragover` on the **window** — a dragged file sends no
  `pointermove`, and the whole page is the drop target — and brightness comes
  from `--dots`/`--pool`, set by the button in `pick-step.tsx` so hover stays
  a CSS concern that Tailwind gates away from touch. The edge fade is a mask
  on a **wrapper**, never `mask-composite` on the layers: nesting composes
  everywhere, and `mask-composite`'s fallback is an unmasked block of
  foreground.

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
  `armor.ts` is the result-side re-encoding — our own encoder, and the one
  piece of the crypto layer a component calls directly.
- `src/hooks/aged-state.ts` — the pure state machine (unit-tested): the step,
  the input, the draft, and `backStepFrom()`; `use-aged.ts` is the React hook
  around it. `use-paste.ts` hands a page-level paste to its caller the same
  way a drop arrives — what it means is the caller's to decide;
  `use-type-to-write.ts` opens the writer on the first keystroke. Both defer to `src/lib/editable-target.ts`, which says
  whether the event landed in a field someone is typing in.
- `src/lib/passphrase-file.ts` — a passphrase brought as a file instead of
  typed.
- `src/components/lattice.tsx` — the page shell: rules, bands, margin cells,
  and the shared `cell` spacing tokens.
- `src/components/message-writer.tsx` — the compose step;
  `replace-result-dialog.tsx` is the one confirmation in the app.
- `src/components/dot-field.tsx` — the pick step's surface; `prototype.html`
  → `src/prototype/` is the lab it was tuned in, and where to try variants
  before touching the real thing.
- `src/components/` — app components; `src/components/ui/` — vendored COSS.
- `vite.config.ts` — CSP injection (hash-based, build fails if it can't
  inject) and service-worker generation from `scripts/sw.template.js`.

## Settled decisions — don't re-litigate

- Passphrase mode only in v1; no recipient/identity modes.
- Single file per operation; 1 GB cap with the CLI as the escape hatch. The
  cap is deliberately not advertised on the home screen — it is stated only
  in the too-big notice, at the moment it bites. What binds at that size is
  time, not memory: encrypting 1 GB takes about half a minute behind a
  spinner that cannot report progress, because typage exposes none.
- Passphrase generation: 10 BIP39 words, space-separated (differs from the
  CLI's `-` by design); word count/separator/wordlist stay parameters.
- The `verify:cli` script is intentionally serialized and expect-driven. It
  is a **test harness only** — the app never shells out to `age`; typage does
  all crypto in the browser. The script exists to prove byte-level interop
  rather than assert it.
- Binary output is the default and the primary action; the armored form is
  offered beside it, per result, as two actions rather than a mode.
- The UI is the lattice described above. Don't restyle proactively, don't
  layer extra borders or rings on COSS primitives, and don't reintroduce a
  bordered drop box — the whole page is the drop target, so a box inside it
  misstates where you can drop.
