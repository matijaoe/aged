# Plan 003: Derive the mode; make the override contextual

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 26537e0..HEAD -- src/components/mode-statement.tsx src/App.tsx src/hooks/aged-state.ts src/components/pick-step.tsx`
> On a mismatch with the "Current state" excerpts, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED — touches the state machine's mode handling, which every step reads.
- **Depends on**: plans/002-paste-to-load.md (edit-conflict avoidance in `pick-step.tsx`)
- **Category**: direction
- **Planned at**: commit `26537e0`, 2026-08-23

## Why this matters

The app already decides the mode by sniffing content, not by trusting a
filename: `src/hooks/use-aged.ts:75,85` set the mode from `isAgeFile(bytes)`,
which matches the age v1 binary magic or the armor header in the first 256
bytes. Detection is correct and needs no change.

What is wrong is that the UI presents this as a standing choice. Two concrete
problems:

1. **Before anything is loaded there is nothing to derive from**, yet the top
   cell still offers "Decrypt instead". The app cannot be wrong yet, and the
   user cannot meaningfully answer. It is a question with no information behind
   it.
2. **One direction of the override can only ever fail.** If a non-age file is
   loaded and the user forces Decrypt, decryption raises `NotAgeFileError` and
   they get "This isn't an age-encrypted file". Offering a control whose only
   outcome is a guaranteed error is worse than not offering it.

The override that *is* meaningful is the other direction: an age file was
detected, but the user deliberately wants to encrypt it again (double
encryption). That case is explicitly supported and must be kept.

## Current state

- `src/components/mode-statement.tsx` — renders the mode word plus an
  unconditional override button:

```tsx
  const other: Mode = mode === "encrypt" ? "decrypt" : "encrypt";
  …
      <button … onClick={() => onModeChange(other)} type="button">
        <ArrowLeftRightIcon aria-hidden="true" className="size-3.5" />
        {labels[other]} instead
      </button>
```

- `src/App.tsx:71-75` renders it with `mode={aged.mode}` and
  `onModeChange={aged.setMode}`, on every step.
- `src/hooks/aged-state.ts` — the reducer. `set-mode` (lines 70–79) resets to
  `initialState` when a result is showing; `set-input` (74–85) carries the
  sniffed mode. `initialState.mode` is `"encrypt"`.
- `src/hooks/use-aged.ts:75,85` — the sniff, quoted above.

Conventions: strict TS, `noUncheckedIndexedAccess`, braces on all control flow,
COSS primitives from `src/components/ui/**` (vendored, never edited).

## Commands you will need

| Purpose   | Command             | Expected on success |
|-----------|---------------------|---------------------|
| Typecheck | `bun run typecheck` | exit 0              |
| Lint      | `bun run lint`      | exit 0              |
| Tests     | `bun run test`      | all pass            |
| Dev       | `bun run dev`       | serves on :5173/:5174 |

## Scope

**In scope**:
- `src/hooks/aged-state.ts` (add a derived flag; see step 1)
- `src/hooks/aged-state.test.ts` (extend)
- `src/components/mode-statement.tsx`
- `src/App.tsx`

**Out of scope**:
- `src/lib/crypto/detect.ts` — detection is correct. Do NOT add an extension
  check; the `.age` suffix is deliberately not consulted for mode.
- `src/lib/crypto/filename.ts` — the `.age` suffix logic there is about output
  names and is unrelated.
- `src/components/ui/**`, `src/prototype/**`.

## Git workflow

- Branch: `advisor/003-automatic-mode`
- Conventional commits, e.g. `feat: derive the mode and scope its override`

## Steps

### Step 1: Record what was detected, separately from the chosen mode

The reducer currently keeps only `mode`. To know whether an override is
meaningful, it must also know what the sniff said.

In `src/hooks/aged-state.ts`:
- Add `detectedAge: boolean` to `AgedState`, defaulting to `false` in
  `initialState`.
- Add `detectedAge: boolean` to the `set-input` action, and set it in the
  reducer alongside `mode`.
- Leave `set-mode` free to change `mode` without touching `detectedAge` — that
  is exactly the override.
- `reset` returns to `initialState` (so `detectedAge` clears); `clear-input`
  must also clear it, since the input it described is gone.

In `src/hooks/use-aged.ts`, pass `detectedAge: isAgeFile(bytes)` (and the text
equivalent) in both `set-input` dispatches. Do not recompute the sniff — reuse
the value already being computed for `mode`.

**Verify**: `bun run typecheck` → exit 0. `bun run test` → still passing.

### Step 2: Show the override only when it is meaningful

In `src/components/mode-statement.tsx`, add a required prop
`overridable: boolean`. When `false`, render the mode word alone and omit the
button entirely (not a disabled button — omit it).

In `src/App.tsx`, pass `overridable={aged.detectedAge && aged.input !== null}`.

That yields:
- Nothing loaded → no override (nothing to be wrong about).
- Non-age input → no override (the only available flip is a guaranteed error).
- Age input detected → override shown, offering "Encrypt instead", which is the
  supported double-encryption case.

**Verify**: `bun run dev`, then:
- On the empty pick step, the top cell shows a mode word and **no** override.
- Drop a plain text file → still no override.
- Drop or paste an armored age block → the override appears and reads
  "Encrypt instead".

### Step 3: Say what the app does before it has anything to work with

With no input, the top-centre cell currently states a mode that is a default,
not a decision. Change the empty state to state the app's function rather than a
mode: render `"Encrypt or decrypt"` (plain, not a control) when
`aged.input === null`, and the concrete `labels[mode]` once there is input.

Implement this inside `mode-statement.tsx` via a new optional prop
`pending?: boolean` (true when nothing is loaded), keeping `App.tsx` declarative.
Preserve the existing `AnimatePresence` swap for the loaded-state word so the
detected mode still animates in.

**Verify**: `bun run dev`; the empty pick step reads "Encrypt or decrypt", and
loading input animates to the single detected word.

### Step 4: Keep the CLI hint honest in the pending state

`src/App.tsx:52-56` builds the command from `aged.mode`. With no input, the mode
is now presentational. Confirm the hint still shows a sensible default command
(`age -p -o file.age file`); it already does, because `cliCommand` falls back to
generic placeholders when `inputName` is null (`src/lib/cli.ts`). Change nothing
unless it reads wrong.

**Verify**: with nothing loaded, the bottom band reads
`$ age -p -o file.age file`.

## Test plan

Extend `src/hooks/aged-state.test.ts` (import from `"vite-plus/test"`, not
`"vitest"` — the lint rule enforces it). Add:

- `set-input` with `detectedAge: true` stores it, and `stepOf` is `passphrase`.
- `set-mode` after an age detection changes `mode` but leaves `detectedAge` true
  (the override does not rewrite what was detected).
- `clear-input` resets `detectedAge` to `false`.
- `reset` resets `detectedAge` to `false`.

Model structurally on the existing `describe("reduce", …)` block in that file.

**Verify**: `bun run test` → all pass, including 4 new tests.

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `bun run test` exits 0 with 4 new tests passing
- [ ] `bun run build` exits 0
- [ ] `bun run verify:cli` exits 0 ("All checks passed.") — proves the crypto
      path is untouched
- [ ] No override control is rendered when `input === null` or when the input
      was not detected as age (manual, per step 2)
- [ ] `grep -rn "endsWith(\".age\")" src/lib/crypto/detect.ts` → no matches
      (detection is still content-based)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Removing the pre-load override leaves any flow unreachable — in particular,
  confirm the "write a message" path can still produce an *encrypt* result when
  the user types plaintext, and a *decrypt* result when they paste armored text.
- You find a case where a user genuinely needs to force Decrypt on
  non-age input. (If so, the asymmetry premise is wrong and the plan needs
  revisiting.)
- Threading `detectedAge` requires changing `src/lib/crypto/**`.

## Maintenance notes

- If armored *output* lands (plan 004), an armored result is still an age file,
  so re-encrypting it stays the double-encryption case — no change needed here.
- Reviewer should check that `detectedAge` is never used to decide *how* to
  decrypt; it is a UI affordance only. The crypto path must keep sniffing at
  decrypt time (`src/lib/crypto/core.ts` handles armored vs binary itself).
- Deliberately deferred: remembering a user's manual override across inputs.
  Each new input re-derives, which is the safer default.
