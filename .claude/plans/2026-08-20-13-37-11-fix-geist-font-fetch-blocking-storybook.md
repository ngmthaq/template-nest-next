# Title: Plan — Fix Geist font fetch failure blocking Storybook

- Classification: bug
- Description: Replace `next/font/google` with Vercel's `geist` package so Geist is loaded from bundled local woff2 files instead of a network fetch.

---

## Approach Summary / Goal

- **Root cause** (not the symptom): `app/(shared)/_theme/font.ts` calls `Geist()` / `Geist_Mono()` from `next/font/google`, which resolves fonts by fetching `fonts.googleapis.com` **at build/transform time**. Next's fetcher uses a short (~3s) timeout; measured round-trip through the user's TLS-inspecting proxy is **11.3s**, so every attempt aborts. Storybook's `vite-plugin-storybook-nextjs` re-runs that resolution with no `.next/cache` to fall back on, so it fails deterministically where `next build` failed only intermittently.
- The symptom-level fix would be to stop importing `font.ts` in `preview.tsx`. That is wrong: it hides the exposure while leaving `next build` fragile on a cold cache. The real fix is to remove the network dependency from the font source itself.
- `geist@1.7.2` is Vercel's official package and is a `next/font/local` wrapper with the woff2 files shipped inside it. It exposes the same `--font-geist-sans` / `--font-geist-mono` CSS variables, so `globals.css` (`--font-sans: var(--font-geist-sans)`) and `[locale]/layout.tsx` (`fontGeistSans.variable`) need **no change at all**.
- **Goal:** `pnpm client storybook` starts with zero network access, and `next build` stops depending on Google Fonts.

## Functional Requirements

1. `pnpm client storybook` starts and renders stories with no Google Fonts request.
2. `pnpm client build-storybook` exits 0 with the network unavailable or slow.
3. `pnpm client build` exits 0 with a cleared `.next/cache`.
4. `font.ts` keeps exporting `fontGeistSans` and `fontGeistMono` with `.variable` resolving to `--font-geist-sans` / `--font-geist-mono` — no change required in `globals.css`, `layout.tsx`, or `preview.tsx`.
5. Rendered typography is unchanged from before the bug (same Geist family, not a substitute stack).

## Non-Functional Requirements

- No font binaries committed to the repo — they come from the package.
- No change to the 35 story files or `.storybook/main.ts`.

## Files in Scope

- **Modify:** `apps/client/app/(shared)/_theme/font.ts`, `apps/client/package.json` (add `geist`), `pnpm-lock.yaml` (install side effect)
- **Unchanged (must be verified as still working):** `app/(shared)/_theme/globals.css`, `app/(routes)/[locale]/layout.tsx`, `.storybook/preview.tsx`

## Risks & Assumptions

1. **Key assumption to verify first:** that `geist/font/sans` and `geist/font/mono` expose `variable` as exactly `--font-geist-sans` / `--font-geist-mono`. If they differ, `globals.css`'s `--font-sans` mapping silently breaks and text falls back to a default stack. The fix is then to keep the names aligned rather than edit `globals.css`. **This must be checked in the installed package, not assumed.**
2. `geist` ships variable woff2; if the app relied on a specific weight axis behaviour from the Google build there could be a subtle rendering difference. Low risk — both are the same typeface.
3. Installing behind the same proxy could itself be slow; npm registry access is separate from Google Fonts and has been working.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute
- [ ] Blocked

## Task List

| #   | Status | Task                                                                                                                                                      | Responsible Role | Dependencies | Acceptance Criteria                                                                                        | Skills       |
| --- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------ | ---------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | DONE   | Add `geist@^1.7.2` to `apps/client` dependencies and install                                                                                                | developer        | none         | `pnpm install` completes; package resolves                                                                  | `clean-code` |
| 2   | DONE   | Verify in the installed package that `GeistSans.variable` / `GeistMono.variable` are `--font-geist-sans` / `--font-geist-mono`; report the actual values     | developer        | 1            | Actual variable names stated in the result, read from `node_modules`, not assumed                           | `clean-code` |
| 3   | DONE   | Rewrite `font.ts` to re-export `GeistSans`/`GeistMono` as `fontGeistSans`/`fontGeistMono`, dropping the `next/font/google` imports                          | developer        | 2            | No `next/font/google` import remains; existing export names preserved                                       | `clean-code` |
| 4   | DONE   | Prove the network dependency is gone: clear `.next/cache`, then run `build`, `build-storybook`, `lint:check`, `tsc --noEmit`                                | developer        | 3            | All exit 0; no `fonts.googleapis.com` reference in `storybook-static` output; 35 stories still discovered   | `clean-code` |

> **Deviation from the party-mode bug rule, stated explicitly:** the skill mandates a tester task adding a regression test that fails on the buggy code. `PROJECT_OVERVIEW.md` sets `Testing Workflow: Skip-Testing` and the repo has no client test runner, so no tester sub-agent is spawned. Task 4 substitutes a **cold-cache build check** as the regression proof — it fails on the old code and passes on the fix. The user was offered a test runner instead and chose to keep the fix contained.
