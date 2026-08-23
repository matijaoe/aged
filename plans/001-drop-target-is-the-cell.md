# Plan 001: Make the centre cell the drop target

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 26537e0..HEAD -- src/components/pick-step.tsx src/App.tsx src/components/lattice.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `26537e0`, 2026-08-23

## Why this matters

The pick step draws a dashed bordered box that says "Drop a file anywhere, or
browse". The box is not the drop target — `useDropzone` is attached to the page
root in `src/App.tsx`, so a file dropped *anywhere* is accepted. The border is
an affordance that contradicts the copy it contains and the behaviour it sits
in front of.

It also double-frames: the lattice already draws a rectangle around this
content with its four rules, so the dashed box is a second rectangle inside the
first, ~24px in. Removing it lets the cell itself be the target, which is both
truthful and a stronger drag-over signal — the whole cell responds instead of a
box inside it.

## Current state

- `src/components/pick-step.tsx` — the step's content. Lines 69–93 render the
  bordered button plus the "message instead" button.
- `src/App.tsx` — owns `useDropzone` (lines 31–36) with `noClick: true`, and
  renders the body band (lines 92–131). `isDragActive` is already threaded into
  `PickStep` and into `Lattice`/`LatticeRow` for the rule lighting.
- `src/components/lattice.tsx` — exports `cell` (lines 135–139) with the shared
  `gutter` / `sitsOnRule` / `hangsFromRule` class tokens.

Current markup to replace, `src/components/pick-step.tsx:69-93`:

```tsx
  return (
    <div className="flex min-h-0 w-full flex-col gap-5 overflow-y-auto overscroll-contain">
      <button
        className={cn(
          "flex w-full cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-dashed px-6 py-14 outline-2 outline-transparent transition-colors focus-visible:outline-ring",
          isDragActive ? "border-ring bg-accent/64" : "border-border hover:bg-accent/40",
        )}
        onClick={onBrowse}
        type="button"
      >
        <FileUpIcon aria-hidden="true" className="size-6 text-muted-foreground" />
        <span className="font-medium text-base">
          {isDragActive ? "Drop it here" : "Drop a file anywhere, or browse"}
        </span>
        <span className="text-muted-foreground text-sm">Up to {formatBytes(maxFileBytes)}</span>
      </button>

      {notice !== null && <NoticeAlert mode={mode} notice={notice} />}

      <Button className="self-center" onClick={() => setWriting(true)} variant="ghost">
        <PenLineIcon aria-hidden="true" />
        {mode === "encrypt" ? "Encrypt a message instead" : "Paste a message instead"}
      </Button>
    </div>
  );
```

Conventions to match:
- Components use COSS UI primitives from `src/components/ui/**` (vendored — never
  edit them) and `cn()` from `src/lib/utils.ts` for conditional classes. See
  `src/components/done-step.tsx` for the house style.
- House rule: control-flow statements always use braces, body on a new line.
- TypeScript is strict with `noUncheckedIndexedAccess`; no `any`.
- The lattice must never change height between steps and the page must never
  scroll. The body band is `flex-1 min-h-0 max-h-[30rem]` in `src/App.tsx:23`.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|------------------------|---------------------|
| Typecheck | `bun run typecheck`    | exit 0, no errors   |
| Lint      | `bun run lint`         | exit 0, no findings |
| Tests     | `bun run test`         | 45 passing          |
| Dev       | `bun run dev`          | serves on :5173/:5174 |
| Build     | `bun run build`        | exit 0              |

## Scope

**In scope**:
- `src/components/pick-step.tsx`
- `src/App.tsx` (only the body-band centre cell wrapper, if the fill needs it)

**Out of scope** (do NOT touch):
- `src/components/ui/**` — vendored COSS UI.
- `src/hooks/use-aged.ts`, `src/hooks/aged-state.ts` — the state machine is
  correct; this is a presentation change only.
- The `useDropzone` configuration in `src/App.tsx:31-36` — it is already
  page-wide and already correct. Do not attach a second dropzone to the cell.
- `src/prototype/**` — throwaway, excluded from the build.

## Git workflow

- Branch: `advisor/001-drop-target-is-the-cell`
- Commit style is conventional commits; see `git log --oneline`. Example:
  `feat: make the centre cell the drop target`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Replace the bordered button with a filling target

In `src/components/pick-step.tsx`, replace the `<button>` at lines 71–84 with a
borderless target that fills the available height of the cell:

- The outer container becomes `flex min-h-0 w-full flex-1 flex-col gap-4`.
- The target is a `<button type="button">` with
  `flex min-h-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl outline-2 outline-transparent transition-colors focus-visible:outline-ring`
  plus, via `cn`, `isDragActive ? "bg-accent/64" : "hover:bg-accent/40"`.
  No `border`, no `border-dashed`.
- Keep `onClick={onBrowse}`, the `FileUpIcon`, and the size line.
- Copy: when `isDragActive`, "Drop it here"; otherwise "Drop a file, or browse".
  Drop the word "anywhere" — with no box, the whole cell reads as the target and
  the word is redundant.

**Verify**: `bun run typecheck` → exit 0. Then `bun run dev`, open the app, and
confirm with the browser console:
`getComputedStyle(document.querySelector('main button, [class*="flex-1"] button')).borderStyle`
→ `"none"` (no dashed border remains).

### Step 2: Keep the secondary actions pinned below the target

The "message instead" `Button` and the `NoticeAlert` must not be absorbed into
the flexing target. Give them `shrink-0` and keep them after the target in DOM
order, so the target takes the leftover height and they sit at the bottom of the
cell.

**Verify**: `bun run dev`, and in the console:
```js
const cellBox = document.querySelector('[class*="max-h-\\[30rem\\]"]').getBoundingClientRect();
const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Drop'));
JSON.stringify({ cellH: Math.round(cellBox.height), targetH: Math.round(btn.getBoundingClientRect().height) })
```
→ `targetH` is within ~120px of `cellH` (the target fills the cell minus the
secondary row), and no page scrollbar appears
(`document.documentElement.scrollHeight <= window.innerHeight + 1`).

### Step 3: Confirm the drag-over signal still reads

With the border gone, the drag-over feedback is the cell fill plus the lattice
rules lighting (already implemented in `src/components/lattice.tsx:40-41,70-71`).
Confirm the fill is visible against the background in both themes; if
`bg-accent/64` is too faint in light mode, raise it to `bg-accent` — do not
introduce a new colour token.

**Verify**: `bun run dev`, drag a file over the window, and confirm the centre
cell background changes and the four rules brighten. Toggle the theme and repeat.

## Test plan

No new unit tests: this is presentation only and the repo's tests
(`src/**/*.test.ts`) cover pure logic, not components — there is no component
testing setup and this plan must not add one.

- Regression check: `bun run test` → 45 passing, unchanged.
- Manual: drop a file, browse via click, and the "message instead" path all still
  reach their steps.

## Done criteria

ALL must hold:

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0 with no findings
- [ ] `bun run test` exits 0, 45 tests passing
- [ ] `bun run build` exits 0
- [ ] `grep -n "border-dashed" src/components/pick-step.tsx` returns no matches
- [ ] No page scrollbar on the pick step at 1512×852 and at 1100×620
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The excerpt in "Current state" does not match `src/components/pick-step.tsx`.
- Removing the border makes the drop affordance unreadable in light mode even at
  full `bg-accent` — that is a design decision, not an executor call.
- Making the target flex causes the page to scroll at any viewport height
  between 400px and 900px.
- You find yourself needing to attach a second `useDropzone` to the cell.

## Maintenance notes

- Plan 002 adds paste-to-load and will change the copy in this same block; land
  001 first so 002 edits a settled shape.
- Reviewer should check that the target's hit area genuinely covers the cell
  (click near the cell's corners, not just the centre).
- Deliberately deferred: an empty-state illustration or animated drop indicator.
  The rules lighting is the agreed signal.
