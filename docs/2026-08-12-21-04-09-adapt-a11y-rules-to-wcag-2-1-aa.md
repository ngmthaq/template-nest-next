# Title: Plan — Adapt A11y Rules and Client Components to WCAG 2.1 AA

- **Classification:** feature
- **Description:** Close the three-rule gap in the client's `jsx-a11y` config and fix the concrete WCAG 2.1 AA failures found in the client's CSS and components.

---

## Approach Summary / Goal

ESLint already carries most of the static a11y load here, so the lint half of this is deliberately small — 3 rules, at `error` to match the existing strict set. The substance is in the second half: reading the actual components turned up **four real AA failures** that no linter can see, plus one styling bug that causes an AA failure as a side effect.

**Goal:** the client's lint config covers every non-deprecated `jsx-a11y` rule, and the five existing component/CSS files conform to WCAG 2.1 **level AA** for the criteria that apply to them.

**Ordering:** every task here touches `apps/client`, and one of them edits `apps/client/eslint.config.mjs` — the same file the security cycle's client delegation modifies. This plan does not start until that work is reviewed and settled.

## Findings driving the plan

| #   | Finding                                                                                                                                                                                                                                                              | Criterion         | Severity                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------- |
| F1  | `app/(routes)/[locale]/error.tsx` (~line 29) and `app/global-error.tsx` render the digest as `text-zinc-400 dark:text-zinc-500` — light-grey-on-white in light mode. Inverted relative to every other pair in the codebase, and well under 4.5:1.                     | 1.4.3 Contrast    | **Real failure**                |
| F2  | Every button/link uses `bg-foreground text-background`, but `app/(shared)/_theme/globals.css` is only `@import 'tailwindcss'` — **`--color-foreground` and `--color-background` are never defined**, so those classes resolve to nothing.                              | 1.4.3, 1.4.11     | **Real failure + styling bug**  |
| F3  | `app/(shared)/_components/templates/AppStatusTemplate.tsx` (line 13) uses `px-16 py-32` — 128px of horizontal padding; on a 320px viewport that leaves 192px of content.                                                                                              | 1.4.10 Reflow     | **Real failure**                |
| F4  | No focus-visible styling anywhere; controls rely entirely on UA defaults, and the buttons are `rounded-full` with custom hover states.                                                                                                                                | 2.4.7, 1.4.11     | Weak                            |
| F5  | `app/(routes)/[locale]/layout.tsx` (line 30) sets `lang` but never `dir`.                                                                                                                                                                                            | 3.1.2             | Latent (both locales are LTR)   |
| F6  | `app/(routes)/[locale]/error.tsx` swaps content in place via the error boundary — no navigation, so nothing announces to a screen reader.                                                                                                                            | 4.1.3 Status Msgs | Real, but narrow — see note     |

> **Scope note on 4.1.3:** it applies only to `error.tsx` / `global-error.tsx`, where the boundary replaces content in place. `not-found.tsx` is reached by navigation, which is a change of context — 4.1.3 does not apply there and adding `aria-live` would be incorrect.

## Functional Requirements

1. `apps/client/eslint.config.mjs` enables `jsx-a11y/anchor-ambiguous-text`, `jsx-a11y/no-aria-hidden-on-focusable`, and `jsx-a11y/prefer-tag-over-role` at `error`. Deprecated rules (`accessible-emoji`, `no-onchange`) are **not** added.
2. `--color-foreground` / `--color-background` are defined in `globals.css` as Tailwind v4 `@theme` tokens, in both light and dark, at a verified ≥4.5:1 against their paired colour.
3. Digest text contrast is fixed in both error components to ≥4.5:1 in light **and** dark.
4. `AppStatusTemplate` padding is responsive and the layout reflows without horizontal scrolling at a 320px viewport width.
5. A `:focus-visible` style is defined that meets 1.4.11 (≥3:1 against adjacent colours) and is not removed by the custom button styling.
6. `layout.tsx` emits a `dir` attribute derived from the active locale.
7. `error.tsx` and `global-error.tsx` announce their status to assistive tech without misusing `aria-live` on statically-rendered content.
8. `pnpm client lint:check` and `pnpm client format:check` exit 0; `pnpm client build` succeeds.
9. Every contrast ratio claimed as fixed is **computed and reported**, not asserted.

## Non-Functional Requirements

- No new dependencies. No test runner, no axe.
- Tailwind-idiomatic: theme tokens via `@theme`, utilities over custom CSS, no inline styles.
- Visual design intent preserved — this is a conformance fix, not a redesign.
- No inline comments (project convention), except where a rule suppression needs a `--` justification.

## Files in Scope

**Modified**

- `apps/client/eslint.config.mjs` — 3 rules
- `apps/client/app/(shared)/_theme/globals.css` — theme tokens, focus-visible, reduced-motion
- `apps/client/app/(shared)/_components/templates/AppStatusTemplate.tsx` — responsive padding
- `apps/client/app/(routes)/[locale]/layout.tsx` — `dir`
- `apps/client/app/(routes)/[locale]/error.tsx` — contrast + announcement
- `apps/client/app/global-error.tsx` — contrast + announcement
- Any further file the 3 new rules flag

**Created / Deleted:** none.

## Risks & Assumptions

- **F2 is a judgement call, on the record.** Defining `--color-foreground`/`--color-background` fixes a _styling bug_, not an a11y rule. Included because at AA you cannot certify 1.4.3 for a control whose colours don't resolve. User approved including it.
- **Assumption:** `dir` is derived from a locale→direction map (`en`/`zh` → `ltr`). Neither current locale is RTL, so this is forward-looking plumbing with no visible effect today.
- **`prefer-tag-over-role` and `anchor-ambiguous-text` are opinionated.** With only ~6 component files the blast radius is tiny, but they may flag code considered fine. The developer reports rather than suppresses.
- **What this plan does NOT deliver.** These AA criteria are not verifiable by lint or code reading and remain unaddressed: 1.4.12 Text Spacing, 1.4.13 Content on Hover, 2.5.x Pointer criteria, and full keyboard-traversal testing. Certifying those needs manual testing or additional tooling (declined). This plan gets the codebase _conformant as far as it can be verified_, not _certified_.
- **`global-not-found.tsx` and `global-error.tsx` hardcode `lang="en"`.** Next.js renders these outside the locale segment, so the locale isn't reliably available. Left as-is; flagged, not fixed.
- **No tests** — `Skip-Testing`, client has no runner. Verification is lint + format + build + computed contrast ratios.

## Open Questions / Blockers

- None blocking. The F2 inclusion was a flagged deviation and was approved.

## Status

- [x] Ready to execute — **gated on the security cycle completing first**
- [ ] Blocked
- [x] Completed 2026-08-13 — all 8 tasks DONE, Root Agent review accepted

## Task List

| #   | Status | Task                                                                                                                                                              | Responsible Role | Dependencies       | Acceptance Criteria                                                                                                                              | Skills       |
| --- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| 1   | DONE   | Add `anchor-ambiguous-text`, `no-aria-hidden-on-focusable`, `prefer-tag-over-role` at `error` to the existing `jsx-a11y` block in `apps/client/eslint.config.mjs` | developer        | security cycle done | All 3 present at `error`; no deprecated rules added; `pnpm client lint:check` resolves config without error                                       | `clean-code` |
| 2   | DONE   | Define `--color-foreground`/`--color-background` as `@theme` tokens in `globals.css` for light and dark, so `bg-foreground`/`text-background` resolve (F2)        | developer        | none               | Tokens defined; computed contrast of foreground↔background ≥4.5:1 both modes, ratio reported                                                      | `clean-code` |
| 3   | DONE   | Add `:focus-visible` styling and a `prefers-reduced-motion` block to `globals.css` (F4)                                                                            | developer        | task 2             | Focus indicator ≥3:1 against adjacent colours, ratio reported; not suppressed by button classes; `transition-colors` neutralised under reduced-motion | `clean-code` |
| 4   | DONE   | Make `AppStatusTemplate` padding responsive so it reflows at 320px (F3)                                                                                            | developer        | none               | No horizontal overflow at 320px width; desktop appearance unchanged at ≥768px                                                                    | `clean-code` |
| 5   | DONE   | Fix digest-text contrast in `error.tsx` and `global-error.tsx` (F1)                                                                                                | developer        | task 2             | ≥4.5:1 in both light and dark, both ratios computed and reported                                                                                  | `clean-code` |
| 6   | DONE   | Derive and emit `dir` from the active locale in `layout.tsx` (F5)                                                                                                  | developer        | none               | `<html>` carries a correct `dir`; map covers `en` and `zh`; adding an RTL locale needs only a map entry                                           | `clean-code` |
| 7   | DONE   | Give `error.tsx` and `global-error.tsx` an accessible status announcement + focus management; **do not** touch `not-found.tsx` (F6)                                | developer        | none               | Boundary content is announced on in-place replacement; no `aria-live` added to statically-rendered nav targets                                    | `clean-code` |
| 8   | DONE   | Run `pnpm client lint:check`, fix every violation the 3 new rules surface                                                                                          | developer        | tasks 1–7          | `lint:check`, `format:check`, `build` all exit 0; no blanket file-level disables; suppressions carry `--` justification                           | `clean-code` |

All 8 tasks are one developer's scope — they overlap heavily on the same handful of files, so splitting them across parallel sub-agents would cause edit conflicts. Single developer sub-agent, sequential.
