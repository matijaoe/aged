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
  the promise API the UI uses; `protocol.ts` is the worker message contract.
- `src/hooks/aged-state.ts` — the pure state machine (unit-tested);
  `use-aged.ts` is the React hook around it.
- `src/components/` — app components; `src/components/ui/` — vendored COSS.
- `vite.config.ts` — CSP injection (hash-based, build fails if it can't
  inject) and service-worker generation from `scripts/sw.template.js`.

## Settled decisions — don't re-litigate

- Passphrase mode only in v1; no recipient/identity modes.
- Single file per operation; 100 MB cap with the CLI as the escape hatch.
- Passphrase generation: 10 BIP39 words, space-separated (differs from the
  CLI's `-` by design); word count/separator/wordlist stay parameters.
- The `verify:cli` script is intentionally serialized and expect-driven.
- A UI design pass is planned and owned by the maintainer — don't restyle
  proactively, and never layer extra borders/rings on COSS primitives.
