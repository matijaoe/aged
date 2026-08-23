# aged

Encrypt and decrypt files with [age](https://age-encryption.org), entirely in
your browser. Passphrase mode only, compatible with the age CLI.

Drop a file anywhere, paste one (or paste armored age text), or write a
message. The mode is derived from the file's header rather than its name, so
there is nothing to choose. Output is binary by default, or ASCII-armored
text when you want something pasteable.

## Develop

```sh
bun install
bun run dev
```

## Check

```sh
bun run typecheck   # tsc over src/ and scripts/
bun run lint        # oxlint via Vite+
bun run test        # unit tests (vitest via `vp test`)
bun run check       # format + lint + type checks in one go
```

## Build

```sh
bun run build          # hosted bundle in dist/ (service worker, installable)
bun run build:single   # dist-single/aged.html — runs from file://, no network
bun run preview        # serve dist/ locally — the way to try the service
                       # worker and offline mode, which dev mode never runs
```

## Deploy

The hosted build targets Cloudflare Pages: deploy the `dist/` directory
(build command `bun run build`). `public/_headers` ships the response
headers a meta CSP can't express (frame-ancestors, caching). The bundle is
still a plain static directory — any static host works — and relative asset
paths (`base: "./"`) mean it can live at any path. Installability and
offline mode need an HTTPS origin. `dist-single/aged.html` needs no hosting
at all: it is a single self-contained file that runs from `file://`.

## Verify against the age CLI

Round-trips the crypto core against a real `age` binary (requires `age` and
`expect` on PATH):

```sh
bun run verify:cli
```

## Privacy

- A `Content-Security-Policy` with `connect-src 'none'` is injected at build
  time, blocking every background network request the page could make —
  fetch, XHR, WebSocket, beacons. Inline scripts are allowed by SHA-256
  hash only, and the build fails if the policy can't be injected.
- Secret-bearing fields opt out of browser spell check, autocorrect,
  translation, and password managers — services that would otherwise send
  field contents to vendor servers underneath the CSP.
- Inter and Geist Mono are vendored locally; there are no external requests.
- Passphrases and file contents stay in memory — no storage, no URL state,
  no logging. Only the theme preference touches localStorage.

## Layout

- `src/lib/crypto/` — typed crypto core (typage), isolated from the UI, run
  in a Web Worker behind a promise API (`client.ts`).
- `src/components/` — UI, built on [coss ui](https://coss.com/ui).
- `scripts/verify-against-age-cli.ts` — CLI interop checks.
