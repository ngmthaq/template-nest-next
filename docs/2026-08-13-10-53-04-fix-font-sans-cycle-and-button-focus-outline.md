# Title: Plan — Fix broken --font-sans cycle and cancelled Button focus outline

- Classification: bug
- Description: Wire the Geist font variables into Tailwind's --font-sans/--font-mono tokens
  and remove the `outline-none` that neutralizes the project's global focus indicator.

---

## Approach Summary / Goal

Two independent regressions introduced by the shadcn/next-themes integration, both confirmed
against the compiled production bundle (`.next/static/chunks/27af8mkw3-ksr.css`).

**Root cause 1 —** `globals.css:11` declares `--font-sans: var(--font-sans)` inside
`@theme inline`. A custom property that references itself forms a dependency cycle, so per
CSS Custom Properties §3.1 it computes to the guaranteed-invalid value. `html { font-family:
var(--font-sans) }` (globals.css:61) then has no fallback, is invalid at computed-value time,
and `font-family` resets to the initial browser value — the serif default. The intent was the
documented Tailwind v4 + `next/font` pattern, which requires pointing at the _font loader's_
variable: `font.ts` publishes `--font-geist-sans` / `--font-geist-mono`, which nothing reads.
Fix: map `--font-sans` → `var(--font-geist-sans)` and `--font-mono` → `var(--font-geist-mono)`.

**Root cause 2 —** `button.tsx:8` carries `outline-none` in its base class. Tailwind emits it
into `@layer utilities`, which always beats the `@layer base` rule at `globals.css:51`
(`:focus-visible { outline-2 outline-offset-2 outline-foreground }`) regardless of specificity.
Compiled output confirms `.outline-none{--tw-outline-style:none;outline-style:none}` against
`:focus-visible{outline-style:var(--tw-outline-style);…}` — the utility poisons the very
variable the base rule reads, on the same element. The only remaining indicator is
`ring-ring/50` ≈ `#d8d8d8`, ~1.2:1 against a white page — below SC 1.4.11's 3:1. This
regresses the conformance work committed in d5213b6. Fix: drop `outline-none` so the
project's global outline (~16:1) remains the single source of truth for focus.

Goal: Geist renders on every surface, and every Button shows the project-standard focus ring.

## Functional Requirements

- The compiled CSS bundle contains no self-referential custom property; `--font-sans`
  resolves to the `next/font` Geist Sans family.
- `html`/`body` and every `font-sans` consumer render in Geist Sans, not the browser default.
- `--font-mono` resolves to Geist Mono, so the already-loaded mono face is reachable.
- A keyboard-focused `Button` (all variants and sizes, light and dark) shows the global
  `outline-2 outline-offset-2 outline-foreground` indicator.
- Focus indicator contrast ≥ 3:1 against the page background in both themes (SC 1.4.11).

## Non-Functional Requirements

- No visual regression to the shadcn Button's non-focus states (hover, active, disabled,
  aria-invalid, all six variants, all eight sizes).
- `tsc --noEmit`, `eslint`, `prettier --check`, and `next build` all stay green.
- No new dependencies; no change to the public API of `Button` or `Typography`.
- Fixes stay token-level so future `shadcn add` runs are not fought unnecessarily.

## Files in Scope

- Modify: `apps/client/app/(shared)/_theme/globals.css` (lines 10–11: the `@theme inline` font block)
- Modify: `apps/client/app/(shared)/_components/shadcn/button.tsx` (line 8: base class string)

## Risks & Assumptions

- **Assumption:** `--font-heading: var(--font-sans)` is intended to follow the sans family.
  Once `--font-sans` is valid, `--font-heading` resolves correctly with no further change.
- **Risk:** `button.tsx` is a vendored shadcn file. Removing `outline-none` diverges from
  upstream, so a future `shadcn add button` will overwrite it. Mitigation: the developer adds
  a brief comment at the edit site recording why the class was removed.
- **Risk:** Removing `outline-none` makes the global outline coexist with
  `focus-visible:ring-3`. Both will render together — visually acceptable and strictly more
  visible, but it is a deliberate change to shadcn's look, not a neutral one.
- **Assumption:** No other component copied `outline-none`. Only `button.tsx` and
  `typography.tsx` exist under `_components/shadcn/` today, and `typography.tsx` does not.

## Open Questions / Blockers

- None. Both fixes and the scope (High findings only) were confirmed by the user.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status  | Task                                                                                                                                                                                  | Responsible Role | Dependencies | Acceptance Criteria                                                                                                                                                                                   | Skills                           |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| 1   | DONE    | In `globals.css` `@theme inline`, replace `--font-sans: var(--font-sans)` with `var(--font-geist-sans)` and add `--font-mono: var(--font-geist-mono)`, matching `_theme/font.ts`.       | developer        | none         | `next build` output CSS contains `--font-sans:var(--font-geist-sans)` and `--font-mono:var(--font-geist-mono)`; `grep -c -- '--font-sans:var(--font-sans)'` on the bundle returns 0.                    | `clean-code`, `security-scanner` |
| 2   | DONE    | Remove `outline-none` from the `buttonVariants` base class in `button.tsx`, leaving `focus-visible:border-ring` / `focus-visible:ring-3` intact. Add a one-line comment explaining why. | developer        | none         | `outline-none` absent from `button.tsx`; built CSS still emits `:focus-visible{outline-style:var(--tw-outline-style);…outline-color:var(--foreground)}` with no `.outline-none` applied to the button.  | `clean-code`                     |
| 3   | DONE    | Run and report `tsc --noEmit`, `eslint`, `prettier --check`, `next build`, and `scan-secrets.sh --diff`.                                                                               | developer        | tasks 1, 2   | All five checks pass; results recorded verbatim in the `Verification / Checks Run` table.                                                                                                              | `security-scanner`               |

### Post-review note on task 1's acceptance criterion

The criterion's literal grep for `--font-mono:var(--font-geist-mono)` in the built bundle does not
match, because Tailwind v4's `@theme inline` only emits a bare theme variable when a scanned
utility references it, and no source file currently uses a `font-mono` class. The criterion was
worded imprecisely at planning time. The underlying **functional** requirement is met: the build
emits `--default-mono-font-family:var(--font-geist-mono)`, which is what Tailwind's preflight
applies to `code`, `kbd`, `samp`, and `pre`. Verified by the Root Agent at Step 6; no code change
was required.
| —   | SKIPPED | Regression tests for both fixes.                                                                                                                                                       | tester           | —            | Justification: `PROJECT_OVERVIEW.md` sets Testing Workflow to `Skip-Testing`, and `apps/client` has no test runner installed. Verified instead by asserting on the compiled CSS bundle in task 3.      | —                                |
