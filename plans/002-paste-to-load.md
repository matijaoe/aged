# Plan 002: Load pasted files and text without a button

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 26537e0..HEAD -- src/App.tsx src/hooks/use-aged.ts src/components/pick-step.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-drop-target-is-the-cell.md (edit-conflict avoidance
  only — both rewrite the pick step's centre content)
- **Category**: direction
- **Planned at**: commit `26537e0`, 2026-08-23

## Why this matters

Dropping a file works from anywhere on the page. Pasting does nothing. That is
backwards for this app's most common real errand: someone sends you an armored
age blob in a chat, you copy it, and you want it decrypted. Today that requires
clicking "Paste a message instead", landing in a textarea, and *then* pasting.

The button also mislabels the intent. "Paste" names an input method, not what
the user wants — they want to decrypt (or encrypt) a message. Once paste works
globally, the button stops being about pasting at all and becomes "write a
message", which is the only thing it is actually still needed for.

Both paste paths already have a home in the state machine: `loadFiles(File[])`
and `loadText(string)` are exported from `useAged` and already do header
sniffing to pick the mode (`src/hooks/use-aged.ts:75,85`).

## Current state

- `src/App.tsx` — the shell. `useAged()` at line 28 exposes `loadFiles` and
  `loadText`. `useDropzone` at lines 31–36 handles drops only; react-dropzone
  has no paste support.
- `src/hooks/use-aged.ts:45-88` — `loadFiles` enforces the single-file rule, the
  100 MB cap, and read failures, then sniffs the header:

```ts
      dispatch({
        type: "set-input",
        input: { kind: "file", name: file.name, bytes },
        // The header decides the mode; the user can still override it.
        mode: isAgeFile(bytes) ? "decrypt" : "encrypt",
      });
```

  `loadText` (lines 79–87) does the same for a string.
- `src/components/pick-step.tsx` — holds the `writing` local state and the
  button labelled `"Encrypt a message instead"` / `"Paste a message instead"`
  (line 90 at time of writing; 001 may have moved it).

Conventions to match:
- Effects and listeners: see `src/lib/theme.ts:41` for the module-scope listener
  pattern, and `src/components/done-step.tsx:41-47` for cleanup-on-unmount.
- House rule: control-flow statements always use braces, body on a new line.
- Strict TypeScript, `noUncheckedIndexedAccess`, no `any`.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|------------------------|---------------------|
| Typecheck | `bun run typecheck`    | exit 0, no errors   |
| Lint      | `bun run lint`         | exit 0, no findings |
| Tests     | `bun run test`         | 45 passing (more after step 4) |
| Dev       | `bun run dev`          | serves on :5173/:5174 |

## Scope

**In scope**:
- `src/hooks/use-paste.ts` (create)
- `src/App.tsx` (wire the hook)
- `src/components/pick-step.tsx` (relabel the button)
- `src/lib/paste.ts` (create) and `src/lib/paste.test.ts` (create)

**Out of scope** (do NOT touch):
- `src/hooks/use-aged.ts` / `src/hooks/aged-state.ts` — `loadFiles` and
  `loadText` already do everything needed, including the size cap and the mode
  sniff. Do not duplicate those rules in the paste path.
- `src/components/ui/**` — vendored.
- The `useDropzone` config — unchanged.
- `src/prototype/**`.

## Git workflow

- Branch: `advisor/002-paste-to-load`
- Conventional commits, e.g. `feat: load pasted files and text`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Write the pure "should this paste be handled?" helper

Create `src/lib/paste.ts` with one exported pure function so the tricky part is
testable without a DOM:

```ts
/**
 * Whether a paste landing on this element should be treated as loading input
 * rather than as ordinary text entry. Pastes into a field the user is typing
 * in belong to that field.
 */
export function shouldInterceptPaste(target: EventTarget | null): boolean
```

Return `false` when the target is an `HTMLInputElement`, `HTMLTextAreaElement`,
or any element with `isContentEditable === true`; `true` otherwise. Guard the
`instanceof` checks so a non-Element target (or `null`) returns `true`.

Do not read clipboard contents in this function — it takes only the target.

**Verify**: `bun run typecheck` → exit 0.

### Step 2: Write the paste hook

Create `src/hooks/use-paste.ts`:

```ts
export function usePaste({
  onFiles,
  onText,
  disabled,
}: {
  onFiles: (files: readonly File[]) => void;
  onText: (text: string) => void;
  disabled: boolean;
}): void
```

Behaviour, in one `useEffect` with a `window` `"paste"` listener and a cleanup
that removes it:

1. If `disabled`, do nothing (the app is mid-encrypt).
2. If `!shouldInterceptPaste(event.target)`, return — let the field handle it.
3. Read `event.clipboardData`. If it is null, return.
4. If `clipboardData.files.length > 0`, call `onFiles([...clipboardData.files])`
   and `event.preventDefault()`. Files take precedence over text, because a file
   copied from Finder also exposes its *name* as text and the file is what the
   user meant.
5. Otherwise read `clipboardData.getData("text")`. If it is non-empty after
   trimming, call `onText(text)` and `event.preventDefault()`.

Keep the listener registered on `window`, not `document`, and pass the deps
correctly so the effect does not re-register on every render.

**Verify**: `bun run typecheck` → exit 0, and `bun run lint` → no findings
(the lint config is type-aware and will flag a missing dep or a floating
promise).

### Step 3: Wire it into the shell

In `src/App.tsx`, call the hook after `useAged()`:

```tsx
  usePaste({
    onFiles: aged.loadFiles,
    onText: aged.loadText,
    disabled: aged.working,
  });
```

Do not gate it on the current step: pasting an age file while sitting on the
done step should start a new operation, exactly as dropping one does today
(`set-input` already resets `result`, `notice`, `submitError` — see
`src/hooks/aged-state.ts:74-85`).

**Verify**: `bun run dev`, then in the app:
- Copy some plain text and press ⌘V anywhere on the page → the passphrase step
  appears with a `message` input summary and the mode reads **Encrypt**.
- Copy an armored age block (starts `-----BEGIN AGE ENCRYPTED FILE-----`) and
  press ⌘V → the passphrase step appears and the mode reads **Decrypt**.
- Copy a file in Finder and press ⌘V → the file loads with its name and size.
- Focus the passphrase field, paste text → the text lands *in the field* and the
  app does not start a new operation.

### Step 4: Relabel the button and drop "paste" from the vocabulary

In `src/components/pick-step.tsx`, the secondary button now only covers typing,
so:
- Label it `"Write a message"` in encrypt mode and `"Paste a message"` →
  **no**: use `"Write a message"` in both modes. In decrypt mode the user is
  going to paste, and paste now works globally — the button is for people who
  want the textarea explicitly.
- Remove the `mode === "encrypt" ? … : …` ternary on that label entirely.

Also update the textarea placeholder in the writing branch: keep
`"Write something to encrypt…"` for encrypt, and change the decrypt placeholder
from `"Paste an armored age file…"` to `"Armored age text…"`.

**Verify**: `grep -rn "instead\"" src/components/pick-step.tsx` → no matches
for the old label; `grep -rni "paste a message" src/` → no matches outside
`src/prototype/`.

### Step 5: Handle the oversized-paste case honestly

`loadFiles` already rejects >100 MB with a notice, so a pasted oversized file is
handled. A pasted *string* has no size check. `loadText` encodes it to UTF-8 in
`inputBytes` at encrypt time. Add nothing new: confirm by pasting a very large
clipboard string (≥1 MB) that the app still responds and the passphrase step
appears. If it visibly hangs, STOP and report — do not invent a limit here;
that is a product decision.

**Verify**: paste a ≥1 MB string; the UI reaches the passphrase step in under a
second.

## Test plan

New file `src/lib/paste.test.ts`, modelled structurally on
`src/lib/cli.test.ts` (same import style: `import { describe, expect, test } from "vite-plus/test"`
— **not** `"vitest"`; the lint rule `vite-plus/prefer-vite-plus-imports` enforces this).

Cases for `shouldInterceptPaste`:
- returns `false` for an `HTMLInputElement`
- returns `false` for an `HTMLTextAreaElement`
- returns `false` for an element with `isContentEditable === true`
- returns `true` for a plain `div`
- returns `true` for `null`

`vp test` runs in a node pool by default with no DOM. Either construct the
elements via `document` under a DOM environment, or — preferred, and simpler —
have the test pass plain object stubs and make `shouldInterceptPaste` robust to
them by checking `tagName`/`isContentEditable` defensively rather than relying
solely on `instanceof`. If you take the stub approach, keep the `instanceof`
checks as the primary path and the property checks as the fallback, and say so
in a comment.

**Verify**: `bun run test` → all pass, including 5 new tests.

## Done criteria

ALL must hold:

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0 with no findings
- [ ] `bun run test` exits 0 with 50 tests passing (45 existing + 5 new)
- [ ] `bun run build` exits 0
- [ ] `grep -rni "paste a message" src/ --include=*.tsx | grep -v prototype` → no matches
- [ ] Pasting text, an armored block, and a file each load correctly (manual, per step 3)
- [ ] Pasting into the passphrase field does NOT start a new operation
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- `clipboardData.files` is empty for a file copied in Finder on the target
  browser — the capability differs by platform and that changes the plan's
  premise.
- Intercepting paste breaks pasting into any existing field (passphrase,
  confirm, message textarea, "Save as" filename).
- You conclude the size cap needs duplicating into the paste path — it does not;
  `loadFiles` owns it.
- A ≥1 MB pasted string visibly hangs the UI.

## Maintenance notes

- Any new text input added to the app is automatically safe, because the guard
  is target-based rather than a list of known fields. Keep it that way.
- If a future change adds a second `paste` listener anywhere, check for
  double-handling — this one calls `preventDefault()` only when it consumes the
  event.
- Reviewer should scrutinise the precedence rule (files before text) and the
  `disabled` gate during the ~1s scrypt run.
- Deliberately deferred: a visible "paste" affordance in the UI. Paste is a
  system gesture; discoverability can be revisited with the empty-state copy.
