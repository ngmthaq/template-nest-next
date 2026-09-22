# Title: Plan — Safer coverage rules, a HealthReportFallback spec, and an `Async` naming rule for async Server Components

- Classification: feature
- Description:
  - Change coverage to an allowlist.
  - Add a spec for `HealthReportFallback`.
  - Rename `HealthReport` to `HealthReportAsync`, and leave every `*Async` component folder out of coverage with one glob.

---

## Approach Summary / Goal

- Recommendation 1: `coverage.include` becomes an allowlist: `src/shared/**`, `_`-prefixed route folders, and `src/proxy.ts`.
- **(changed)** Recommendation 2:
  - We don't test async Server Components. Instead, they follow a naming rule: the folder and the component end with `Async` (e.g. `HealthReportAsync/index.tsx`).
  - One glob, `**/*Async/**`, leaves them all out of coverage.
  - `HealthReportFallback` gets a spec.
- Goal: coverage follows the layout rules by itself, with no hand-kept file list.

## Functional Requirements

- FR1: `coverage.include` is `['src/shared/**/*.{ts,tsx}', 'src/app/**/_*/**/*.{ts,tsx}', 'src/proxy.ts']`.
- FR2 **(changed)**: `coverage.exclude` keeps only `**/*.spec.*`, `**/*.stories.*`, `**/_constants/**`, and **`**/*Async/**`**. All App Router file-name entries, `src/libs/**`, and the `global-*` entries are removed.
- FR3 **(changed)**: The coverage report lists the same files as before, minus `HealthReport`.
- ~~FR4: `HealthReport` spec~~ **(removed)**
- FR5: `HealthReportFallback/index.spec.tsx` checks for two `[data-slot="skeleton"]` elements. **Done.**
- FR6 **(changed)**: The docs (`CODING_CONVENTIONS.md`, and `PROJECT_OVERVIEW.md` if it states the same fact):
  - Coverage counts only `src/shared/**`, `_`-prefixed route folders (except `_constants` and `*Async`), and `src/proxy.ts`.
  - New naming rule: an async Server Component uses a folder and component name ending in `Async` (e.g. `HealthReportAsync`). It gets no spec and no story, and coverage skips it. Keep it thin: it only loads data and passes it to a tested component.
  - Add a row to the Naming table.
- **FR7 (new):** `git mv health/_components/HealthReport` → `health/_components/HealthReportAsync`, and rename the export to `HealthReportAsync`. Update `health/page.tsx` (import and JSX) and the JSDoc in `HealthReportFallback/index.tsx` that names `HealthReport`.

## Non-Functional Requirements

- No behavior change. `/health` still streams (`◐`).
- `pnpm client lint:check`, `typecheck`, `test`, `test:cov`, and `build` pass.

## Files in Scope

- Modify: `apps/client/vitest.config.ts`, `.claude/references/CODING_CONVENTIONS.md`, (maybe) `.claude/references/PROJECT_OVERVIEW.md`, `health/page.tsx`, `health/_components/HealthReportFallback/index.tsx` (JSDoc only)
- Move: `health/_components/HealthReport/index.tsx` → `health/_components/HealthReportAsync/index.tsx`
- Created: `health/_components/HealthReportFallback/index.spec.tsx` (done)

## Risks & Assumptions

- Assumption: the `Async` suffix is only for async Server Components. Other components must not end in `Async`, or coverage will skip them. The docs will say so.
- Risk: the glob `**/*Async/**` must be checked in the real `test:cov` output.

## Open Questions / Blockers

- None.

## Status

- [x] Ready to execute

## Task List

| # | Status | Task | Responsible Role | Dependencies | Acceptance Criteria | Skills |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | DONE | Coverage allowlist in `vitest.config.ts` (FR1). Coverage line in the docs (FR6, first part). | developer | none | FR1 is met. The `test:cov` file list is the same as before (before and after lists pasted). | `clean-code` |
| 2 | DONE | ~~Add `HealthReport` spec~~ and add the `HealthReportFallback` spec (FR5). | tester | none | The Fallback spec passes with 100% coverage. | `aaa-testing` |
| 3 | DONE | Rename `HealthReport` → `HealthReportAsync` (FR7). Add `**/*Async/**` to `coverage.exclude` (FR2). Add the `Async` naming rule to the docs (FR6). | developer | 1 | FR2, FR3, FR6, and FR7 are met. `grep -rn "HealthReport\b" src` finds no old name. `test:cov` no longer lists `HealthReport`/`HealthReportAsync`. `pnpm client build` passes, and `/health` is `◐`. | `clean-code` |

Task 3 edits the same files as task 1 (`vitest.config.ts` and the docs), so it starts when task 1 finishes.
