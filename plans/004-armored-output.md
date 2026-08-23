# Plan 004: Offer armored (text) output when encrypting

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 26537e0..HEAD -- src/lib/crypto src/hooks src/components/done-step.tsx scripts/verify-against-age-cli.ts`
> On a mismatch with the "Current state" excerpts, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED — touches the crypto core, which is the app's only job.
- **Depends on**: none (independent of the layout plans; can run in parallel)
- **Category**: direction
- **Planned at**: commit `26537e0`, 2026-08-23

## Why this matters

The app accepts ASCII-armored age files as input everywhere — `detect.ts` treats
`"armored"` as a first-class format, `core.ts` decodes it before decrypting, and
the UI offers a paste path for it. It can never *produce* one. `armor.encode` is
exported by the `age-encryption` package and the module is already imported;
only `decode` is called.

That asymmetry lands hardest on the flow most likely to be used for a quick
secret: "encrypt a message" takes text in and hands back a binary file the user
must attach somewhere. `age -a` exists precisely so the output can be pasted
into a chat or an email. Adding it closes the gap with one library call.

## Current state

- `src/lib/crypto/core.ts` — the environment-agnostic crypto core, imported both
  by the worker and by the bun verification script. It already imports armor:

```ts
import { armor, Decrypter, Encrypter } from "age-encryption";
…
export async function encryptWithPassphrase(
  plaintext: Uint8Array,
  passphrase: string,
): Promise<Uint8Array> {
  const encrypter = new Encrypter();
  encrypter.setPassphrase(passphrase);
  return encrypter.encrypt(plaintext);
}
```

  and in `decryptWithPassphrase` it calls
  `armor.decode(new TextDecoder().decode(ciphertext))` when
  `detectAgeFormat(ciphertext) === "armored"`.

- `node_modules/age-encryption/dist/armor.d.ts` — `encode(file: Uint8Array): string`
  returns the armored text **with a trailing newline**.
- `src/lib/crypto/protocol.ts` — the worker message contract:
  `CryptoRequest { id, op, data, passphrase }`.
- `src/lib/crypto/age.worker.ts` — validates the request shape and dispatches.
- `src/lib/crypto/client.ts` — `encrypt(plaintext, passphrase)` /
  `decrypt(ciphertext, passphrase)`.
- `src/hooks/use-aged.ts` — `runEncrypt` calls `encrypt(...)` and builds
  `AgedResult`. `AgedResult.textPreview` already exists and is populated on
  *decrypt* only.
- `src/lib/crypto/filename.ts` — `encryptedName()` appends `.age`.
- `scripts/verify-against-age-cli.ts` — 11 interop checks against the real `age`
  binary, including *CLI armored → library decrypt*. There is no
  library-armored → CLI-decrypt check because the feature does not exist.

Conventions:
- The crypto core must stay free of DOM and worker APIs — the bun script imports
  it directly. See the header comment in `core.ts`.
- The scrypt work factor stays at the library default; do not expose it.
- Braces on all control flow; strict TS; no `any`.

## Commands you will need

| Purpose      | Command               | Expected on success |
|--------------|-----------------------|---------------------|
| Typecheck    | `bun run typecheck`   | exit 0              |
| Lint         | `bun run lint`        | exit 0              |
| Tests        | `bun run test`        | all pass            |
| CLI interop  | `bun run verify:cli`  | "All checks passed." (needs `age` and `expect` on PATH) |
| Build        | `bun run build`       | exit 0              |

## Scope

**In scope**:
- `src/lib/crypto/core.ts`
- `src/lib/crypto/core.test.ts`
- `src/lib/crypto/protocol.ts`
- `src/lib/crypto/age.worker.ts`
- `src/lib/crypto/client.ts`
- `src/hooks/use-aged.ts`, `src/hooks/aged-state.ts`
- `src/components/done-step.tsx`
- `scripts/verify-against-age-cli.ts`

**Out of scope**:
- `src/lib/crypto/detect.ts` — already handles both formats correctly.
- `src/lib/crypto/wordlist.ts` — generated.
- `src/components/ui/**`, `src/prototype/**`.
- Any change to the scrypt work factor.
- Recipient/identity modes.

## Git workflow

- Branch: `advisor/004-armored-output`
- Conventional commits, e.g. `feat: offer armored output when encrypting`

## Steps

### Step 1: Add the option to the core

In `src/lib/crypto/core.ts`, extend the encrypt entry point:

```ts
export async function encryptWithPassphrase(
  plaintext: Uint8Array,
  passphrase: string,
  armored = false,
): Promise<Uint8Array>
```

When `armored` is true, wrap the result:
`new TextEncoder().encode(armor.encode(binary))`. Returning bytes (not a string)
keeps one return type through the worker and the download path.

Do not change `decryptWithPassphrase` — it already sniffs and decodes.

**Verify**: `bun run typecheck` → exit 0.

### Step 2: Carry the flag across the worker boundary

- `protocol.ts`: add `armored?: boolean` to `CryptoRequest`.
- `age.worker.ts`: the request validator currently rejects anything malformed.
  Accept `armored` when it is `undefined` or a boolean; reject other types with
  the existing `"malformed request"` response. Pass it to
  `encryptWithPassphrase`.
- `client.ts`: `encrypt(plaintext, passphrase, armored = false)`, forwarded in
  `postMessage`.

Keep the fail-closed behaviour in the worker's validator — do not loosen it.

**Verify**: `bun run typecheck` → exit 0; `bun run lint` → no findings.

### Step 3: Thread the choice through state

- `aged-state.ts`: add `armored: boolean` to `AgedState` (default `false`) and a
  `set-armored` action. Reset it in `reset` and on `set-input`.
- `use-aged.ts`: expose `setArmored`; pass `state.armored` into `runEncrypt`,
  which forwards it to `encrypt(...)`.
- In `runEncrypt`, when `armored` is true the output is text, so:
  - set `textPreview` to the decoded armored string (it is small — armored
    output is base64, ~33% larger than binary, and the existing 1 MB preview cap
    in `textPreviewOf` applies), and
  - keep `suggestedName` as `encryptedName(...)`. Armored age files conventionally
    still use `.age`; do NOT invent a new extension.

**Verify**: `bun run test` → existing tests still pass.

### Step 4: Offer it in the UI, on the passphrase step

The choice must be made *before* encrypting. Add a checkbox-style control to the
encrypt branch of `src/components/passphrase-step.tsx` labelled
**"Output as text"** with a short description: "ASCII-armored, safe to paste
into a message." Use a COSS primitive — the repo has no checkbox installed, so
either add one with `bunx shadcn@latest add @coss/checkbox` (allowed: it is
vendored registry code, not a hand-rolled control) or use the existing `Field` +
a `Switch` if you add that instead. Do not hand-roll a toggle.

Then in `done-step.tsx`, when `result.textPreview !== null` on an **encrypt**
result, show the armored text in the existing `InputGroup` + `InputGroupTextarea`
+ copy-action pattern already used for the decrypted preview, so the user can
copy it directly.

**Verify**: `bun run dev`; encrypt a message with "Output as text" checked; the
result shows a copyable armored block beginning
`-----BEGIN AGE ENCRYPTED FILE-----`, and Download still saves a `.age` file
whose contents are that same armored text.

### Step 5: Prove interop in both directions

In `scripts/verify-against-age-cli.ts`, add a check: encrypt with
`armored = true` via the library, write the bytes to a file, and decrypt it with
the real `age` CLI using the existing `ageDecrypt` helper. Assert the round trip
returns the original plaintext, and assert
`detectAgeFormat(bytes) === "armored"`.

The script drives `age` through `expect`, and values reach the Tcl script
**through environment variables only** — never string-interpolated. Follow the
existing `runExpect(script, env)` helper exactly.

**Verify**: `bun run verify:cli` → "All checks passed." with the new check
listed as PASS (12 checks total).

## Test plan

Extend `src/lib/crypto/core.test.ts` (imports come from `"vite-plus/test"`, not
`"vitest"`). Note the file's existing comment: scrypt at factor 18 costs ~1s per
operation, so keep the number of crypto operations small and keep the existing
30s timeout.

Add to the existing round-trip test, or one new test:
- `encryptWithPassphrase(plaintext, pass, true)` produces bytes for which
  `detectAgeFormat(...) === "armored"`.
- Those bytes decrypt back to the original plaintext through
  `decryptWithPassphrase`.
- The armored output decoded as UTF-8 starts with
  `"-----BEGIN AGE ENCRYPTED FILE-----"`.

**Verify**: `bun run test` → all pass.

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `bun run test` exits 0 with the new armored assertions passing
- [ ] `bun run verify:cli` prints "All checks passed." and includes a
      library-armored → CLI-decrypt check
- [ ] `bun run build` and `bun run build:single` both exit 0
- [ ] Binary output remains the default (encrypting without touching the new
      control produces bytes where `detectAgeFormat(...) === "binary"`)
- [ ] No change to the scrypt work factor:
      `grep -rn "setScryptWorkFactor" src/` → no matches
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The real `age` CLI fails to decrypt library-armored output — that is a
  correctness failure in the app's core promise, not something to work around.
- Adding a checkbox/switch requires modifying anything already in
  `src/components/ui/**` (adding a *new* vendored component file is fine;
  editing an existing one is not).
- Armored output pushes a realistic message past the 1 MB `textPreview` cap and
  the preview silently disappears — report rather than raising the cap.
- The worker's request validator has to be loosened to accept the new field.

## Maintenance notes

- Armoring is output-only. Decryption already auto-detects, so nothing on the
  read path needs to know about this setting.
- Armored output is ~33% larger than binary; if a file-size warning is ever
  added, account for it.
- Reviewer should confirm the default is still binary and that `.age` is still
  the extension in both cases.
- Deliberately deferred: remembering the armored preference across operations,
  and armoring file (rather than message) output by default — messages are the
  motivating case.
