# Implementation Plans

Generated 2026-08-23, planned against commit `26537e0` (the lattice UI rebuild).
Execute in the order below unless dependencies say otherwise. Each executor:
read the plan fully before starting, honor its STOP conditions, and update your
row when done.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| 001 | Make the centre cell the drop target | P1 | S | — | TODO |
| 002 | Load pasted files and text without a button | P1 | M | 001 | TODO |
| 003 | Derive the mode; make the override contextual | P1 | M | 002 | TODO |
| 004 | Offer armored (text) output when encrypting | P2 | M | — | TODO |

## Dependency notes

- **002 depends on 001** only to avoid edit conflicts: both rewrite the pick
  step's centre content. 001 establishes the shape 002 adds to.
- **003 depends on 002** for the same reason — 002 settles what the pick step
  says, 003 changes when the mode override is shown and what it is called.
- **004 is independent** of the layout work and may be executed in parallel by
  a different executor. It touches the crypto layer and the done step only.

## The through-line

These four plans share one intent: **the app should work out what you want
instead of asking.** It already sniffs age headers to pick the mode (it never
looks at the file extension), but the UI still presents that as a choice and
still requires a click to reach the text flow. 001 removes a border that lies
about where you can drop, 002 makes paste work the way drop already does, 003
stops asking a question the app can already answer, and 004 closes the one
asymmetry in the crypto surface (armored in, but never armored out).

## Findings considered and rejected

- **Raising the scrypt work factor above the library default of 18**: not worth
  doing. `setScryptWorkFactor(logN)` is public API in `age-encryption`, and the
  factor is recorded in the file header so interop is unaffected. But it only
  helps weak passphrases, and each +1 doubles the ~1s cost for both the encryptor
  and whoever decrypts. Generated passphrases here are 10 BIP39 words (~110
  bits), where brute force is already infeasible; for a weak human passphrase,
  +1 or +2 does not close the gap either. The lever that matters is entropy, and
  the app already pulls it. 18 is also what the age CLI uses.
- **Extension-based mode detection**: already rejected in the implementation.
  `src/hooks/use-aged.ts:75,85` derives the mode from `isAgeFile(bytes)`, a
  content sniff of the first 256 bytes. The `.age` extension is used only for
  filename derivation and for the oversized-file notice, where the bytes are
  never read. Do not "improve" this into an extension check.
- **Recipient / identity (x25519, WebAuthn) modes**: out of scope for v1 by an
  explicit product decision — passphrase mode only. `age-encryption` ships the
  API for it, which is why it keeps surfacing in audits. It would also break the
  "compatible with the age CLI" promise, since WebAuthn recipients need a CLI
  plugin.
